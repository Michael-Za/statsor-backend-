const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const databaseService = require('../services/database');
const redisService = require('../services/redis');
const SecurityService = require('../services/securityService');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} = require('../middleware/errorHandler.js');
const { 
  authenticateToken, 
  requireRole, 
  requirePermission,
  checkTeamOwnership 
} = require('../middleware/auth.js');

const router = express.Router();
const db = databaseService;
const redis = redisService;

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/players/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `player-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new ValidationError('Only image files are allowed'));
    }
  }
});

// Validation schemas
const createPlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').required(),
    jerseyNumber: Joi.number().integer().min(1).max(99).required(),
    dateOfBirth: Joi.date().max('now').required(),
    nationality: Joi.string().max(50).required(),
    height: Joi.number().positive().max(250).optional(),
    weight: Joi.number().positive().max(200).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      relationship: Joi.string().required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    }).optional(),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(Joi.string()).optional(),
      medications: Joi.array().items(Joi.string()).optional(),
      injuries: Joi.array().items(Joi.string()).optional(),
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional()
    }).optional()
  })
});

const updatePlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').optional(),
    jerseyNumber: Joi.number().integer().min(1).max(99).optional(),
    height: Joi.number().positive().max(250).optional(),
    weight: Joi.number().positive().max(200).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    status: Joi.string().valid('active', 'injured', 'suspended', 'inactive').optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      relationship: Joi.string().required(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required()
    }).optional(),
    medicalInfo: Joi.object({
      allergies: Joi.array().items(Joi.string()).optional(),
      medications: Joi.array().items(Joi.string()).optional(),
      injuries: Joi.array().items(Joi.string()).optional(),
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional()
    }).optional()
  })
});

const playerStatsSchema = Joi.object({
  body: Joi.object({
    matchId: Joi.string().uuid().required(),
    minutesPlayed: Joi.number().integer().min(0).max(120).required(),
    goals: Joi.number().integer().min(0).default(0),
    assists: Joi.number().integer().min(0).default(0),
    yellowCards: Joi.number().integer().min(0).max(2).default(0),
    redCards: Joi.number().integer().min(0).max(1).default(0),
    saves: Joi.number().integer().min(0).default(0),
    tackles: Joi.number().integer().min(0).default(0),
    passes: Joi.number().integer().min(0).default(0),
    passesCompleted: Joi.number().integer().min(0).default(0),
    shots: Joi.number().integer().min(0).default(0),
    shotsOnTarget: Joi.number().integer().min(0).default(0),
    fouls: Joi.number().integer().min(0).default(0),
    offsides: Joi.number().integer().min(0).default(0),
    corners: Joi.number().integer().min(0).default(0),
    crosses: Joi.number().integer().min(0).default(0),
    interceptions: Joi.number().integer().min(0).default(0),
    clearances: Joi.number().integer().min(0).default(0),
    rating: Joi.number().min(1).max(10).precision(1).optional()
  })
});

// Helper functions
const calculatePlayerStats = async (playerId) => {
  try {
    const stats = await db.query(`
      SELECT 
        COUNT(*) as matches_played,
        SUM(goals) as total_goals,
        SUM(assists) as total_assists,
        SUM(yellow_cards) as total_yellow_cards,
        SUM(red_cards) as total_red_cards,
        SUM(minutes_played) as total_minutes,
        AVG(rating) as average_rating,
        SUM(saves) as total_saves,
        SUM(tackles) as total_tackles,
        SUM(passes) as total_passes,
        SUM(passes_completed) as total_passes_completed,
        SUM(shots) as total_shots,
        SUM(shots_on_target) as total_shots_on_target
      FROM player_match_stats 
      WHERE player_id = $1
    `, [playerId]);

    return stats && stats.length > 0 ? stats[0] : {};
  } catch (error) {
    logger.error('Error calculating player stats:', error);
    return {};
  }
};

const getPlayerRanking = async (teamId, position) => {
  try {
    const rankings = await db.query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        COUNT(pms.id) as matches_played,
        SUM(pms.goals) as total_goals,
        SUM(pms.assists) as total_assists,
        AVG(pms.rating) as average_rating
      FROM players p
      LEFT JOIN player_match_stats pms ON p.id = pms.player_id
      WHERE p.team_id = $1 AND p.position = $2 AND p.status = 'active'
      GROUP BY p.id, p.first_name, p.last_name
      ORDER BY average_rating DESC, total_goals DESC, total_assists DESC
    `, [teamId, position]);

    return rankings || [];
  } catch (error) {
    logger.error('Error getting player rankings:', error);
    return [];
  }
};

// Routes

// @route   GET /api/players
// @desc    Get all players (with filtering and pagination)
// @access  Private
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      position,
      status = 'active',
      teamId,
      search,
      sortBy: sortByParam = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    // Validate sortBy parameter to prevent SQL injection
    let sortBy = sortByParam;
    const allowedSortColumns = [
      'id', 'first_name', 'last_name', 'email', 'position', 
      'jersey_number', 'date_of_birth', 'nationality', 'height', 
      'weight', 'phone_number', 'team_id', 'status', 'created_at', 
      'updated_at', 'matches_played', 'total_goals', 'total_assists', 
      'average_rating'
    ];
    
    if (!allowedSortColumns.includes(sortBy)) {
      // Default to created_at if invalid sortBy provided
      sortBy = 'created_at';
    }

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (position) {
      whereClause += ` AND position = $${++paramCount}`;
      params.push(position);
    }

    if (status) {
      whereClause += ` AND status = $${++paramCount}`;
      params.push(status);
    }

    if (teamId) {
      whereClause += ` AND team_id = $${++paramCount}`;
      params.push(teamId);
    }

    if (search) {
      whereClause += ` AND (first_name ILIKE $${++paramCount} OR last_name ILIKE $${++paramCount} OR email ILIKE $${++paramCount})`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramCount += 2;
    }

    // Role-based filtering
    if (req.user.role === 'player') {
      whereClause += ` AND (team_id = $${++paramCount} OR id = $${++paramCount})`;
      params.push(req.user.team_id, req.user.id);
      paramCount++;
    } else if (req.user.role === 'coach' && req.user.team_id) {
      whereClause += ` AND team_id = $${++paramCount}`;
      params.push(req.user.team_id);
    }

    const query = `
      SELECT 
        p.*,
        t.name as team_name,
        t.code as team_code,
        COUNT(pms.id) as matches_played,
        SUM(pms.goals) as total_goals,
        SUM(pms.assists) as total_assists,
        AVG(pms.rating) as average_rating
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_match_stats pms ON p.id = pms.player_id
      ${whereClause}
      GROUP BY p.id, t.name, t.code
      ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      ${whereClause}
    `;

    const [players, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2))
    ]);

    // Handle empty results gracefully
    const playersData = Array.isArray(players) ? players : [];
    const countData = Array.isArray(countResult) && countResult.length > 0 ? countResult : [{ total: 0 }];

    const total = parseInt(countData[0].total) || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      players: playersData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  })
);

// @route   GET /api/players/:id
// @desc    Get player by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const player = await db.query(`
      SELECT 
        p.*,
        t.name as team_name,
        t.code as team_code,
        t.logo_url as team_logo
      FROM players p
      LEFT JOIN teams t ON p.team_id = t.id
      WHERE p.id = $1
    `, [id]);

    if (!player || !Array.isArray(player) || player.length === 0) {
      throw new NotFoundError('Player not found');
    }

    const playerData = player[0];

    // Check access permissions
    if (req.user.role === 'player' && req.user.id !== id && req.user.team_id !== playerData.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Get player statistics
    const stats = await calculatePlayerStats(id);
    playerData.statistics = stats;

    // Get recent matches
    const recentMatches = await db.query(`
      SELECT 
        m.id,
        m.date,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score,
        pms.goals,
        pms.assists,
        pms.minutes_played,
        pms.rating
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      JOIN player_match_stats pms ON m.id = pms.match_id
      WHERE pms.player_id = $1
      ORDER BY m.date DESC
      LIMIT 10
    `, [id]);

    playerData.recent_matches = recentMatches;

    res.json({ player: playerData });
  })
);

// @route   POST /api/players
// @desc    Create new player
// @access  Private (Coach/Manager/Admin)
router.post('/',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(createPlayerSchema),
  asyncHandler(async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      position,
      jerseyNumber,
      dateOfBirth,
      nationality,
      height,
      weight,
      phoneNumber,
      emergencyContact,
      medicalInfo
    } = req.body;

    // Check if email already exists
    const existingPlayer = await db.findOne('players', { email });
    if (existingPlayer) {
      throw new ValidationError('Player with this email already exists');
    }

    // Check if jersey number is taken in the team
    const teamId = req.user.team_id;
    if (teamId) {
      const existingJersey = await db.findOne('players', {
        team_id: teamId,
        jersey_number: jerseyNumber,
        status: 'active'
      });
      if (existingJersey) {
        throw new ValidationError('Jersey number is already taken');
      }
    }

    const player = await db.create('players', {
      first_name: firstName,
      last_name: lastName,
      email,
      position,
      jersey_number: jerseyNumber,
      date_of_birth: dateOfBirth,
      nationality,
      height,
      weight,
      phone_number: phoneNumber,
      team_id: teamId,
      emergency_contact: emergencyContact,
      medical_info: medicalInfo,
      status: 'active',
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      message: 'Player created successfully',
      player
    });
  })
);

// @route   PUT /api/players/:id
// @desc    Update player
// @access  Private (Coach/Manager/Admin or own profile)
router.put('/:id',
  authenticateToken,
  validateRequest(updatePlayerSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check permissions
    const canEdit = req.user.role === 'admin' ||
                   (req.user.role === 'manager') ||
                   (req.user.role === 'coach' && req.user.team_id === player.team_id) ||
                   (req.user.role === 'player' && req.user.id === id);

    if (!canEdit) {
      throw new AuthorizationError('Access denied');
    }

    // Check jersey number availability if being updated
    if (req.body.jerseyNumber && req.body.jerseyNumber !== player.jersey_number) {
      const existingJersey = await db.findOne('players', {
        team_id: player.team_id,
        jersey_number: req.body.jerseyNumber,
        status: 'active',
        id: { $ne: id }
      });
      if (existingJersey) {
        throw new ValidationError('Jersey number is already taken');
      }
    }

    const updateData = { ...req.body, updated_at: new Date() };
    
    // Convert camelCase to snake_case for database
    const dbUpdateData = {};
    Object.keys(updateData).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      dbUpdateData[dbKey] = updateData[key];
    });

    const updatedPlayer = await db.update('players', id, dbUpdateData);

    res.json({
      message: 'Player updated successfully',
      player: updatedPlayer
    });
  })
);

// @route   DELETE /api/players/:id
// @desc    Delete player (soft delete)
// @access  Private (Manager/Admin)
router.delete('/:id',
  authenticateToken,
  requireRole(['manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check team ownership for managers
    if (req.user.role === 'manager') {
      await checkTeamOwnership(req.user.id, player.team_id);
    }

    // Soft delete
    await db.update('players', id, {
      status: 'inactive',
      deleted_at: new Date(),
      updated_at: new Date()
    });

    res.json({ message: 'Player deleted successfully' });
  })
);

// @route   POST /api/players/:id/avatar
// @desc    Upload player avatar
// @access  Private (Player themselves or Coach/Manager/Admin)
router.post('/:id/avatar',
  authenticateToken,
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check permissions
    const canUpload = req.user.role === 'admin' ||
                     (req.user.role === 'manager') ||
                     (req.user.role === 'coach' && req.user.team_id === player.team_id) ||
                     (req.user.role === 'player' && req.user.id === id);

    if (!canUpload) {
      throw new AuthorizationError('Access denied');
    }

    const avatarUrl = `/uploads/players/${req.file.filename}`;

    await db.update('players', id, {
      avatar_url: avatarUrl,
      updated_at: new Date()
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatar_url: avatarUrl
    });
  })
);

// @route   POST /api/players/:id/stats
// @desc    Add match statistics for player
// @access  Private (Coach/Manager/Admin)
router.post('/:id/stats',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(playerStatsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const statsData = req.body;

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check team ownership for coaches
    if (req.user.role === 'coach' && req.user.team_id !== player.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Verify match exists
    const match = await db.findById('matches', statsData.matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Check if stats already exist for this player and match
    const existingStats = await db.findOne('player_match_stats', {
      player_id: id,
      match_id: statsData.matchId
    });

    if (existingStats) {
      throw new ValidationError('Statistics already exist for this player and match');
    }

    const stats = await db.create('player_match_stats', {
      player_id: id,
      match_id: statsData.matchId,
      minutes_played: statsData.minutesPlayed,
      goals: statsData.goals,
      assists: statsData.assists,
      yellow_cards: statsData.yellowCards,
      red_cards: statsData.redCards,
      saves: statsData.saves,
      tackles: statsData.tackles,
      passes: statsData.passes,
      passes_completed: statsData.passesCompleted,
      shots: statsData.shots,
      shots_on_target: statsData.shotsOnTarget,
      fouls: statsData.fouls,
      offsides: statsData.offsides,
      corners: statsData.corners,
      crosses: statsData.crosses,
      interceptions: statsData.interceptions,
      clearances: statsData.clearances,
      rating: statsData.rating,
      created_at: new Date()
    });

    res.status(201).json({
      message: 'Player statistics added successfully',
      stats
    });
  })
);

// @route   GET /api/players/:id/stats
// @desc    Get player statistics
// @access  Private
router.get('/:id/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { season, matchId, limit = 10 } = req.query;

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check access permissions
    if (req.user.role === 'player' && req.user.id !== id && req.user.team_id !== player.team_id) {
      throw new AuthorizationError('Access denied');
    }

    let whereClause = 'WHERE pms.player_id = $1';
    const params = [id];
    let paramCount = 1;

    if (season) {
      whereClause += ` AND EXTRACT(YEAR FROM m.date) = $${++paramCount}`;
      params.push(season);
    }

    if (matchId) {
      whereClause += ` AND pms.match_id = $${++paramCount}`;
      params.push(matchId);
    }

    const query = `
      SELECT 
        pms.*,
        m.date as match_date,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        at.name as away_team_name,
        m.home_score,
        m.away_score
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${whereClause}
      ORDER BY m.date DESC
      LIMIT $${++paramCount}
    `;
    params.push(limit);

    const stats = await db.query(query, params);

    // Get aggregated statistics
    const aggregatedStats = await calculatePlayerStats(id);

    res.json({
      player_id: id,
      aggregated_stats: aggregatedStats,
      match_stats: stats
    });
  })
);

// @route   GET /api/players/team/:teamId/rankings
// @desc    Get team player rankings by position
// @access  Private
router.get('/team/:teamId/rankings',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { position } = req.query;

    // Check team access
    if (req.user.role === 'player' && req.user.team_id !== teamId) {
      throw new AuthorizationError('Access denied');
    }

    const positions = position ? [position] : ['goalkeeper', 'defender', 'midfielder', 'forward'];
    const rankings = {};

    for (const pos of positions) {
      rankings[pos] = await getPlayerRanking(teamId, pos);
    }

    res.json({ rankings });
  })
);

// @route   GET /api/players/:id/performance
// @desc    Get player performance analytics
// @access  Private
router.get('/:id/performance',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { period = '30' } = req.query; // days

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check access permissions
    if (req.user.role === 'player' && req.user.id !== id && req.user.team_id !== player.team_id) {
      throw new AuthorizationError('Access denied');
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (period * 24 * 60 * 60 * 1000));

    // Get performance data
    const performance = await db.query(`
      SELECT 
        DATE(m.date) as match_date,
        pms.goals,
        pms.assists,
        pms.rating,
        pms.minutes_played,
        pms.passes_completed::float / NULLIF(pms.passes, 0) * 100 as pass_accuracy,
        pms.shots_on_target::float / NULLIF(pms.shots, 0) * 100 as shot_accuracy
      FROM player_match_stats pms
      JOIN matches m ON pms.match_id = m.id
      WHERE pms.player_id = $1 
        AND m.date >= $2 
        AND m.date <= $3
      ORDER BY m.date ASC
    `, [id, startDate, endDate]);

    // Calculate trends
    const trends = {
      goals: performance.reduce((sum, match) => sum + (match.goals || 0), 0),
      assists: performance.reduce((sum, match) => sum + (match.assists || 0), 0),
      average_rating: performance.length > 0 
        ? performance.reduce((sum, match) => sum + (match.rating || 0), 0) / performance.length 
        : 0,
      matches_played: performance.length,
      average_pass_accuracy: performance.length > 0
        ? performance.reduce((sum, match) => sum + (match.pass_accuracy || 0), 0) / performance.length
        : 0
    };

    res.json({
      player_id: id,
      period_days: period,
      performance_data: performance,
      trends
    });
  })
);

module.exports = router;
module.exports.default = module.exports;