const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database');
const logger = require('../utils/logger');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError 
} = require('../middleware/errorHandler.js');
const { 
  authenticateToken, 
  requireRole 
} = require('../middleware/auth.js');

const router = express.Router();
const db = databaseService;

// Validation schemas
const createTeamSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    sport: Joi.string().min(2).max(50).required(),
    description: Joi.string().max(500).optional(),
    logo_url: Joi.string().uri().optional()
  })
});

const updateTeamSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    sport: Joi.string().min(2).max(50).optional(),
    description: Joi.string().max(500).optional(),
    logo_url: Joi.string().uri().optional()
  })
});

// @route   GET /api/v1/teams
// @desc    Get all teams
// @access  Private
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      sport,
      search,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Add filters
    if (sport) {
      paramCount++;
      whereClause += ` AND sport ILIKE $${paramCount}`;
      params.push(`%${sport}%`);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Validate sort parameters
    const allowedSortFields = ['name', 'sport', 'created_at', 'updated_at'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM teams ${whereClause}`;
    const totalResult = await db.query(countQuery, params);
    const total = parseInt(totalResult[0].count);

    // Get teams
    paramCount++;
    const limitParam = paramCount;
    paramCount++;
    const offsetParam = paramCount;
    
    const query = `
      SELECT 
        id,
        name,
        sport,
        description,
        logo_url,
        created_at,
        updated_at,
        (
          SELECT COUNT(*) 
          FROM players 
          WHERE team_id = teams.id AND status = 'active'
        ) as player_count
      FROM teams 
      ${whereClause}
      ORDER BY ${sortField} ${order}
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    params.push(limit, offset);
    const teams = await db.query(query, params);

    res.json({
      teams,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   GET /api/v1/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const query = `
      SELECT 
        t.*,
        (
          SELECT COUNT(*) 
          FROM players 
          WHERE team_id = t.id AND status = 'active'
        ) as player_count,
        (
          SELECT json_agg(
            json_build_object(
              'id', p.id,
              'first_name', p.first_name,
              'last_name', p.last_name,
              'position', p.position,
              'jersey_number', p.jersey_number,
              'status', p.status
            )
          )
          FROM players p
          WHERE p.team_id = t.id AND p.status = 'active'
          ORDER BY p.jersey_number
        ) as players
      FROM teams t
      WHERE t.id = $1
    `;

    const result = await db.query(query, [id]);
    
    if (result.length === 0) {
      throw new NotFoundError('Team not found');
    }

    const team = result[0];
    team.players = team.players || [];

    res.json({ team });
  })
);

// @route   POST /api/v1/teams
// @desc    Create new team
// @access  Private (Admin/Manager only)
router.post('/',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateRequest(createTeamSchema),
  asyncHandler(async (req, res) => {
    const { name, sport, description, logo_url } = req.body;

    // Check if team name already exists
    const existingTeam = await db.query(
      'SELECT id FROM teams WHERE name = $1',
      [name]
    );

    if (existingTeam.length > 0) {
      throw new ValidationError('Team name already exists');
    }

    const query = `
      INSERT INTO teams (name, sport, description, logo_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(query, [name, sport, description, logo_url]);
    const team = result[0];

    logger.info(`Team created: ${team.name} (ID: ${team.id})`, {
      teamId: team.id,
      userId: req.user.id,
      action: 'create_team'
    });

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  })
);

// @route   PUT /api/v1/teams/:id
// @desc    Update team
// @access  Private (Admin/Manager only)
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'manager']),
  validateRequest(updateTeamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    // Check if team exists
    const existingTeam = await db.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (existingTeam.length === 0) {
      throw new NotFoundError('Team not found');
    }

    // Check if new name conflicts with existing team (if name is being updated)
    if (updates.name && updates.name !== existingTeam[0].name) {
      const nameConflict = await db.query(
        'SELECT id FROM teams WHERE name = $1 AND id != $2',
        [updates.name, id]
      );

      if (nameConflict.length > 0) {
        throw new ValidationError('Team name already exists');
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const params = [];
    let paramCount = 0;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        paramCount++;
        updateFields.push(`${key} = $${paramCount}`);
        params.push(updates[key]);
      }
    });

    if (updateFields.length === 0) {
      throw new ValidationError('No valid fields to update');
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    params.push(new Date());

    paramCount++;
    params.push(id);

    const query = `
      UPDATE teams 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await db.query(query, params);
    const team = result[0];

    logger.info(`Team updated: ${team.name} (ID: ${team.id})`, {
      teamId: team.id,
      userId: req.user.id,
      action: 'update_team',
      updates: Object.keys(updates)
    });

    res.json({
      message: 'Team updated successfully',
      team
    });
  })
);

// @route   DELETE /api/v1/teams/:id
// @desc    Delete team
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if team exists
    const existingTeam = await db.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    if (existingTeam.length === 0) {
      throw new NotFoundError('Team not found');
    }

    // Check if team has active players
    const activePlayers = await db.query(
      'SELECT COUNT(*) FROM players WHERE team_id = $1 AND status = $2',
      [id, 'active']
    );

    if (parseInt(activePlayers[0].count) > 0) {
      throw new ValidationError('Cannot delete team with active players. Please transfer or deactivate players first.');
    }

    // Delete team
    await db.query('DELETE FROM teams WHERE id = $1', [id]);

    logger.info(`Team deleted: ${existingTeam[0].name} (ID: ${id})`, {
      teamId: id,
      userId: req.user.id,
      action: 'delete_team'
    });

    res.json({
      message: 'Team deleted successfully'
    });
  })
);

// @route   GET /api/v1/teams/:id/stats
// @desc    Get team statistics
// @access  Private
router.get('/:id/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { season, startDate, endDate } = req.query;

    // Check if team exists
    const team = await db.query('SELECT * FROM teams WHERE id = $1', [id]);
    if (team.length === 0) {
      throw new NotFoundError('Team not found');
    }

    let dateFilter = '';
    const params = [id];
    let paramCount = 1;

    if (startDate && endDate) {
      paramCount++;
      dateFilter += ` AND m.match_date >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
      dateFilter += ` AND m.match_date <= $${paramCount}`;
      params.push(endDate);
    }

    const statsQuery = `
      SELECT 
        COUNT(DISTINCT m.id) as total_matches,
        COUNT(DISTINCT CASE WHEN m.home_team_id = $1 THEN m.id END) as home_matches,
        COUNT(DISTINCT CASE WHEN m.away_team_id = $1 THEN m.id END) as away_matches,
        COUNT(DISTINCT CASE 
          WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) 
            OR (m.away_team_id = $1 AND m.away_score > m.home_score) 
          THEN m.id 
        END) as wins,
        COUNT(DISTINCT CASE 
          WHEN m.home_score = m.away_score AND m.status = 'completed'
          THEN m.id 
        END) as draws,
        COUNT(DISTINCT CASE 
          WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) 
            OR (m.away_team_id = $1 AND m.away_score < m.home_score) 
          THEN m.id 
        END) as losses,
        SUM(CASE 
          WHEN m.home_team_id = $1 THEN m.home_score 
          WHEN m.away_team_id = $1 THEN m.away_score 
          ELSE 0 
        END) as goals_for,
        SUM(CASE 
          WHEN m.home_team_id = $1 THEN m.away_score 
          WHEN m.away_team_id = $1 THEN m.home_score 
          ELSE 0 
        END) as goals_against
      FROM matches m
      WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
        AND m.status = 'completed'
        ${dateFilter}
    `;

    const statsResult = await db.query(statsQuery, params);
    const stats = statsResult[0];

    // Calculate additional metrics
    const totalMatches = parseInt(stats.total_matches) || 0;
    const wins = parseInt(stats.wins) || 0;
    const draws = parseInt(stats.draws) || 0;
    const losses = parseInt(stats.losses) || 0;
    const goalsFor = parseInt(stats.goals_for) || 0;
    const goalsAgainst = parseInt(stats.goals_against) || 0;

    const points = (wins * 3) + (draws * 1);
    const winPercentage = totalMatches > 0 ? ((wins / totalMatches) * 100).toFixed(1) : 0;
    const goalDifference = goalsFor - goalsAgainst;
    const avgGoalsFor = totalMatches > 0 ? (goalsFor / totalMatches).toFixed(2) : 0;
    const avgGoalsAgainst = totalMatches > 0 ? (goalsAgainst / totalMatches).toFixed(2) : 0;

    res.json({
      team: team[0],
      stats: {
        matches: {
          total: totalMatches,
          home: parseInt(stats.home_matches) || 0,
          away: parseInt(stats.away_matches) || 0
        },
        results: {
          wins,
          draws,
          losses,
          winPercentage: parseFloat(winPercentage)
        },
        goals: {
          for: goalsFor,
          against: goalsAgainst,
          difference: goalDifference,
          avgFor: parseFloat(avgGoalsFor),
          avgAgainst: parseFloat(avgGoalsAgainst)
        },
        points
      }
    });
  })
);

module.exports = router;