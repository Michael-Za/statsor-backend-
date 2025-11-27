const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database.js');
const redisService = require('../services/redis.js');
const socketService = require('../services/socket.js');
const matchReportService = require('../services/matchReportService.js');
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
  checkTeamOwnership 
} = require('../middleware/auth.js');

const router = express.Router();
const db = databaseService;
const redis = redisService;
// matchReportService is already imported as an instance above

// Validation schemas
const createMatchSchema = Joi.object({
  body: Joi.object({
    homeTeamId: Joi.string().uuid().required(),
    awayTeamId: Joi.string().uuid().required(),
    date: Joi.date().min('now').required(),
    venue: Joi.string().min(2).max(100).required(),
    competition: Joi.string().valid('league', 'cup', 'friendly', 'tournament').required(),
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).required(),
    matchday: Joi.number().integer().min(1).optional(),
    referee: Joi.string().max(100).optional(),
    weather: Joi.object({
      temperature: Joi.number().optional(),
      condition: Joi.string().valid('sunny', 'cloudy', 'rainy', 'snowy', 'windy').optional(),
      humidity: Joi.number().min(0).max(100).optional()
    }).optional(),
    ticketPrice: Joi.number().min(0).optional(),
    maxCapacity: Joi.number().integer().min(1).optional()
  })
});

const updateMatchSchema = Joi.object({
  body: Joi.object({
    date: Joi.date().optional(),
    venue: Joi.string().min(2).max(100).optional(),
    status: Joi.string().valid('scheduled', 'live', 'halftime', 'finished', 'postponed', 'cancelled').optional(),
    homeScore: Joi.number().integer().min(0).optional(),
    awayScore: Joi.number().integer().min(0).optional(),
    referee: Joi.string().max(100).optional(),
    weather: Joi.object({
      temperature: Joi.number().optional(),
      condition: Joi.string().valid('sunny', 'cloudy', 'rainy', 'snowy', 'windy').optional(),
      humidity: Joi.number().min(0).max(100).optional()
    }).optional(),
    notes: Joi.string().max(500).optional()
  })
});

const matchEventSchema = Joi.object({
  body: Joi.object({
    type: Joi.string().valid('goal', 'assist', 'yellow_card', 'red_card', 'substitution', 'penalty', 'own_goal').required(),
    playerId: Joi.string().uuid().required(),
    minute: Joi.number().integer().min(0).max(120).required(),
    description: Joi.string().max(200).optional(),
    assistPlayerId: Joi.string().uuid().optional(),
    substitutedPlayerId: Joi.string().uuid().when('type', {
      is: 'substitution',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
  })
});

const liveUpdateSchema = Joi.object({
  body: Joi.object({
    minute: Joi.number().integer().min(0).max(120).required(),
    homeScore: Joi.number().integer().min(0).optional(),
    awayScore: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('live', 'halftime', 'finished').optional(),
    events: Joi.array().items(Joi.object({
      type: Joi.string().valid('goal', 'yellow_card', 'red_card', 'substitution').required(),
      playerId: Joi.string().uuid().required(),
      minute: Joi.number().integer().min(0).max(120).required(),
      description: Joi.string().max(200).optional()
    })).optional()
  })
});

// Helper functions
const calculateMatchStats = async (matchId) => {
  const stats = await db.query(`
    SELECT 
      COUNT(CASE WHEN type = 'goal' THEN 1 END) as total_goals,
      COUNT(CASE WHEN type = 'yellow_card' THEN 1 END) as total_yellow_cards,
      COUNT(CASE WHEN type = 'red_card' THEN 1 END) as total_red_cards,
      COUNT(CASE WHEN type = 'substitution' THEN 1 END) as total_substitutions
    FROM match_events 
    WHERE match_id = $1
  `, [matchId]);

  return stats[0] || {};
};

const getTeamForm = async (teamId, limit = 5) => {
  const matches = await db.query(`
    SELECT 
      m.id,
      m.date,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score,
      m.status,
      CASE 
        WHEN m.home_team_id = $1 AND m.home_score > m.away_score THEN 'W'
        WHEN m.away_team_id = $1 AND m.away_score > m.home_score THEN 'W'
        WHEN m.home_score = m.away_score THEN 'D'
        ELSE 'L'
      END as result
    FROM matches m
    WHERE (m.home_team_id = $1 OR m.away_team_id = $1) 
      AND m.status = 'finished'
    ORDER BY m.date DESC
    LIMIT $2
  `, [teamId, limit]);

  return matches;
};

const getHeadToHead = async (team1Id, team2Id, limit = 5) => {
  const matches = await db.query(`
    SELECT 
      m.*,
      ht.name as home_team_name,
      at.name as away_team_name
    FROM matches m
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE ((m.home_team_id = $1 AND m.away_team_id = $2) 
           OR (m.home_team_id = $2 AND m.away_team_id = $1))
      AND m.status = 'finished'
    ORDER BY m.date DESC
    LIMIT $3
  `, [team1Id, team2Id, limit]);

  return matches;
};

// Routes

// @route   GET /api/matches
// @desc    Get all matches (with filtering and pagination)
// @access  Private
router.get('/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      status,
      teamId,
      competition,
      season,
      dateFrom,
      dateTo,
      venue,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Apply filters
    if (status) {
      whereClause += ` AND m.status = $${++paramCount}`;
      params.push(status);
    }

    if (teamId) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(teamId);
    }

    if (competition) {
      whereClause += ` AND m.competition = $${++paramCount}`;
      params.push(competition);
    }

    if (season) {
      whereClause += ` AND m.season = $${++paramCount}`;
      params.push(season);
    }

    if (dateFrom) {
      whereClause += ` AND m.date >= $${++paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND m.date <= $${++paramCount}`;
      params.push(dateTo);
    }

    if (venue) {
      whereClause += ` AND m.venue ILIKE $${++paramCount}`;
      params.push(`%${venue}%`);
    }

    // Role-based filtering
    if (req.user.role === 'player' && req.user.team_id) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(req.user.team_id);
    } else if (req.user.role === 'coach' && req.user.team_id) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(req.user.team_id);
    }

    const query = `
      SELECT 
        m.*,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.logo_url as away_team_logo,
        COUNT(me.id) as total_events
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN match_events me ON m.id = me.match_id
      ${whereClause}
      GROUP BY m.id, ht.name, ht.logo_url, at.name, at.logo_url
      ORDER BY m.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    params.push(limit, offset);

    const countQuery = `
      SELECT COUNT(DISTINCT m.id) as total
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${whereClause}
    `;

    const [matches, countResult] = await Promise.all([
      db.query(query, params),
      db.query(countQuery, params.slice(0, -2))
    ]);

    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      matches,
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

// @route   GET /api/matches/:id
// @desc    Get match by ID
// @access  Private
router.get('/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const match = await db.query(`
      SELECT 
        m.*,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        ht.code as home_team_code,
        at.name as away_team_name,
        at.logo_url as away_team_logo,
        at.code as away_team_code
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);

    if (!match.length) {
      throw new NotFoundError('Match not found');
    }

    const matchData = match[0];

    // Get match events
    const events = await db.query(`
      SELECT 
        me.*,
        p.first_name,
        p.last_name,
        p.jersey_number,
        t.name as team_name,
        ap.first_name as assist_first_name,
        ap.last_name as assist_last_name
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN players ap ON me.assist_player_id = ap.id
      WHERE me.match_id = $1
      ORDER BY me.minute ASC, me.created_at ASC
    `, [id]);

    matchData.events = events;

    // Get match statistics
    const stats = await calculateMatchStats(id);
    matchData.statistics = stats;

    // Get lineups if match is live or finished
    if (['live', 'halftime', 'finished'].includes(matchData.status)) {
      const lineups = await db.query(`
        SELECT 
          ml.*,
          p.first_name,
          p.last_name,
          p.jersey_number,
          p.position,
          t.name as team_name
        FROM match_lineups ml
        JOIN players p ON ml.player_id = p.id
        JOIN teams t ON p.team_id = t.id
        WHERE ml.match_id = $1
        ORDER BY t.id, ml.position_order
      `, [id]);

      const homeLineup = lineups.filter(p => p.team_name === matchData.home_team_name);
      const awayLineup = lineups.filter(p => p.team_name === matchData.away_team_name);

      matchData.lineups = {
        home: homeLineup,
        away: awayLineup
      };
    }

    res.json({ match: matchData });
  })
);

// @route   POST /api/matches
// @desc    Create new match
// @access  Private (Manager/Admin)
router.post('/',
  authenticateToken,
  requireRole(['manager', 'admin']),
  validateRequest(createMatchSchema),
  asyncHandler(async (req, res) => {
    const {
      homeTeamId,
      awayTeamId,
      date,
      venue,
      competition,
      season,
      matchday,
      referee,
      weather,
      ticketPrice,
      maxCapacity
    } = req.body;

    // Validate teams exist
    const [homeTeam, awayTeam] = await Promise.all([
      db.findById('teams', homeTeamId),
      db.findById('teams', awayTeamId)
    ]);

    if (!homeTeam || !awayTeam) {
      throw new ValidationError('One or both teams not found');
    }

    if (homeTeamId === awayTeamId) {
      throw new ValidationError('Home and away teams cannot be the same');
    }

    // Check for scheduling conflicts
    const conflictingMatches = await db.query(`
      SELECT id FROM matches 
      WHERE (home_team_id = $1 OR away_team_id = $1 OR home_team_id = $2 OR away_team_id = $2)
        AND date BETWEEN $3 AND $4
        AND status NOT IN ('finished', 'cancelled')
    `, [homeTeamId, awayTeamId, 
        new Date(new Date(date).getTime() - 2 * 60 * 60 * 1000), // 2 hours before
        new Date(new Date(date).getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
    ]);

    if (conflictingMatches.length > 0) {
      throw new ValidationError('Teams have conflicting matches scheduled');
    }

    const match = await db.create('matches', {
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      date: new Date(date),
      venue,
      competition,
      season,
      matchday,
      referee,
      weather,
      ticket_price: ticketPrice,
      max_capacity: maxCapacity,
      status: 'scheduled',
      home_score: 0,
      away_score: 0,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Notify teams about new match
    socketService.notifyTeam(homeTeamId, 'match_scheduled', {
      matchId: match.id,
      opponent: awayTeam.name,
      date: match.date,
      venue: match.venue,
      isHome: true
    });

    socketService.notifyTeam(awayTeamId, 'match_scheduled', {
      matchId: match.id,
      opponent: homeTeam.name,
      date: match.date,
      venue: match.venue,
      isHome: false
    });

    res.status(201).json({
      message: 'Match created successfully',
      match
    });
  })
);

// @route   PUT /api/matches/:id
// @desc    Update match
// @access  Private (Manager/Admin)
router.put('/:id',
  authenticateToken,
  requireRole(['manager', 'admin']),
  validateRequest(updateMatchSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const match = await db.findById('matches', id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    // Check if match can be updated
    if (match.status === 'finished') {
      throw new ValidationError('Cannot update finished match');
    }

    const updateData = { ...req.body, updated_at: new Date() };
    
    // Convert camelCase to snake_case for database
    const dbUpdateData = {};
    Object.keys(updateData).forEach(key => {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      dbUpdateData[dbKey] = updateData[key];
    });

    const updatedMatch = await db.update('matches', id, dbUpdateData);

    // Check if match was just finished and send reports
    if (req.body.status === 'finished' && match.status !== 'finished') {
      try {
        console.log(`Match ${id} finished. Sending match reports...`);
        await matchReportService.sendMatchReports(id);
        console.log(`Match reports sent successfully for match ${id}`);
      } catch (error) {
        console.error(`Failed to send match reports for match ${id}:`, error);
        // Don't fail the match update if email sending fails
      }
    }

    // Notify about match updates
    if (req.body.status || req.body.homeScore !== undefined || req.body.awayScore !== undefined) {
      socketService.broadcastMatchUpdate(id, {
        status: updatedMatch.status,
        homeScore: updatedMatch.home_score,
        awayScore: updatedMatch.away_score,
        updatedAt: updatedMatch.updated_at
      });
    }

    res.json({
      message: 'Match updated successfully',
      match: updatedMatch
    });
  })
);

// @route   DELETE /api/matches/:id
// @desc    Cancel match
// @access  Private (Manager/Admin)
router.delete('/:id',
  authenticateToken,
  requireRole(['manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const match = await db.findById('matches', id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.status === 'finished') {
      throw new ValidationError('Cannot cancel finished match');
    }

    await db.update('matches', id, {
      status: 'cancelled',
      updated_at: new Date()
    });

    // Notify teams about cancellation
    socketService.notifyTeam(match.home_team_id, 'match_cancelled', { matchId: id });
    socketService.notifyTeam(match.away_team_id, 'match_cancelled', { matchId: id });

    res.json({ message: 'Match cancelled successfully' });
  })
);

// @route   POST /api/matches/:id/events
// @desc    Add match event
// @access  Private (Manager/Admin)
router.post('/:id/events',
  authenticateToken,
  requireRole(['manager', 'admin']),
  validateRequest(matchEventSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, playerId, minute, description, assistPlayerId, substitutedPlayerId } = req.body;

    const match = await db.findById('matches', id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (!['live', 'halftime'].includes(match.status)) {
      throw new ValidationError('Can only add events to live matches');
    }

    // Validate player belongs to one of the teams
    const player = await db.findById('players', playerId);
    if (!player || (player.team_id !== match.home_team_id && player.team_id !== match.away_team_id)) {
      throw new ValidationError('Player not found or not in either team');
    }

    const event = await db.create('match_events', {
      match_id: id,
      type,
      player_id: playerId,
      minute,
      description,
      assist_player_id: assistPlayerId,
      substituted_player_id: substitutedPlayerId,
      created_at: new Date()
    });

    // Update match score if goal
    if (type === 'goal' || type === 'own_goal') {
      const isHomeTeam = player.team_id === match.home_team_id;
      const scoreField = (type === 'goal' && isHomeTeam) || (type === 'own_goal' && !isHomeTeam) 
        ? 'home_score' 
        : 'away_score';
      
      await db.query(`
        UPDATE matches 
        SET ${scoreField} = ${scoreField} + 1, updated_at = NOW()
        WHERE id = $1
      `, [id]);
    }

    // Broadcast event to live viewers
    socketService.broadcastMatchEvent(id, {
      ...event,
      player_name: `${player.first_name} ${player.last_name}`,
      team_id: player.team_id
    });

    res.status(201).json({
      message: 'Match event added successfully',
      event
    });
  })
);

// @route   POST /api/matches/:id/lineup
// @desc    Set match lineup
// @access  Private (Coach/Manager/Admin)
router.post('/:id/lineup',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { players } = req.body; // Array of {playerId, position, isStarter}

    const match = await db.findById('matches', id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.status !== 'scheduled') {
      throw new ValidationError('Can only set lineup for scheduled matches');
    }

    // Validate user can set lineup for this match
    const userTeamId = req.user.team_id;
    if (req.user.role === 'coach' && userTeamId !== match.home_team_id && userTeamId !== match.away_team_id) {
      throw new AuthorizationError('Can only set lineup for your own team');
    }

    // Validate all players belong to the correct team
    const playerIds = players.map(p => p.playerId);
    const teamPlayers = await db.query(`
      SELECT id FROM players 
      WHERE id = ANY($1) AND team_id = $2 AND status = 'active'
    `, [playerIds, userTeamId]);

    if (teamPlayers.length !== playerIds.length) {
      throw new ValidationError('Some players not found or not in your team');
    }

    // Clear existing lineup for this team
    await db.query(`
      DELETE FROM match_lineups 
      WHERE match_id = $1 AND player_id IN (
        SELECT id FROM players WHERE team_id = $2
      )
    `, [id, userTeamId]);

    // Insert new lineup
    const lineupData = players.map((player, index) => ({
      match_id: id,
      player_id: player.playerId,
      position: player.position,
      is_starter: player.isStarter,
      position_order: index + 1,
      created_at: new Date()
    }));

    await db.createMany('match_lineups', lineupData);

    res.json({ message: 'Lineup set successfully' });
  })
);

// @route   POST /api/matches/:id/live-update
// @desc    Send live match update
// @access  Private (Manager/Admin)
router.post('/:id/live-update',
  authenticateToken,
  requireRole(['manager', 'admin']),
  validateRequest(liveUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { minute, homeScore, awayScore, status, events } = req.body;

    const match = await db.findById('matches', id);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (!['live', 'halftime'].includes(match.status)) {
      throw new ValidationError('Match is not live');
    }

    // Update match if scores or status provided
    const updateData = { updated_at: new Date() };
    if (homeScore !== undefined) updateData.home_score = homeScore;
    if (awayScore !== undefined) updateData.away_score = awayScore;
    if (status) updateData.status = status;

    if (Object.keys(updateData).length > 1) {
      await db.update('matches', id, updateData);
    }

    // Add events if provided
    if (events && events.length > 0) {
      const eventData = events.map(event => ({
        match_id: id,
        type: event.type,
        player_id: event.playerId,
        minute: event.minute,
        description: event.description,
        created_at: new Date()
      }));

      await db.createMany('match_events', eventData);
    }

    // Broadcast live update
    socketService.broadcastMatchUpdate(id, {
      minute,
      homeScore,
      awayScore,
      status,
      events,
      timestamp: new Date()
    });

    res.json({ message: 'Live update sent successfully' });
  })
);

// @route   GET /api/matches/:id/live
// @desc    Get live match data
// @access  Public
router.get('/:id/live',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const match = await db.query(`
      SELECT 
        m.*,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.logo_url as away_team_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      WHERE m.id = $1
    `, [id]);

    if (!match.length) {
      throw new NotFoundError('Match not found');
    }

    const matchData = match[0];

    // Get recent events (last 10)
    const recentEvents = await db.query(`
      SELECT 
        me.*,
        p.first_name,
        p.last_name,
        p.jersey_number,
        t.name as team_name
      FROM match_events me
      JOIN players p ON me.player_id = p.id
      JOIN teams t ON p.team_id = t.id
      WHERE me.match_id = $1
      ORDER BY me.minute DESC, me.created_at DESC
      LIMIT 10
    `, [id]);

    matchData.recent_events = recentEvents;

    // Get live statistics from cache if available
    const liveStats = await redis.get(`match:${id}:live_stats`);
    if (liveStats) {
      matchData.live_stats = JSON.parse(liveStats);
    }

    res.json({ match: matchData });
  })
);

// @route   GET /api/matches/team/:teamId/form
// @desc    Get team form (recent results)
// @access  Private
router.get('/team/:teamId/form',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { limit = 5 } = req.query;

    const form = await getTeamForm(teamId, parseInt(limit));
    
    const formString = form.map(match => match.result).join('');
    const stats = {
      wins: form.filter(m => m.result === 'W').length,
      draws: form.filter(m => m.result === 'D').length,
      losses: form.filter(m => m.result === 'L').length
    };

    res.json({
      team_id: teamId,
      form: formString,
      stats,
      matches: form
    });
  })
);

// @route   GET /api/matches/head-to-head/:team1Id/:team2Id
// @desc    Get head-to-head record between two teams
// @access  Private
router.get('/head-to-head/:team1Id/:team2Id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { team1Id, team2Id } = req.params;
    const { limit = 5 } = req.query;

    const matches = await getHeadToHead(team1Id, team2Id, parseInt(limit));
    
    const stats = {
      team1_wins: matches.filter(m => 
        (m.home_team_id === team1Id && m.home_score > m.away_score) ||
        (m.away_team_id === team1Id && m.away_score > m.home_score)
      ).length,
      team2_wins: matches.filter(m => 
        (m.home_team_id === team2Id && m.home_score > m.away_score) ||
        (m.away_team_id === team2Id && m.away_score > m.home_score)
      ).length,
      draws: matches.filter(m => m.home_score === m.away_score).length
    };

    res.json({
      team1_id: team1Id,
      team2_id: team2Id,
      stats,
      matches
    });
  })
);

// @route   GET /api/matches/upcoming
// @desc    Get upcoming matches
// @access  Public
router.get('/upcoming',
  asyncHandler(async (req, res) => {
    const { limit = 10, teamId } = req.query;
    
    let whereClause = 'WHERE m.date > NOW() AND m.status = \'scheduled\'';
    const params = [];
    let paramCount = 0;

    if (teamId) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(teamId);
    }

    const matches = await db.query(`
      SELECT 
        m.*,
        ht.name as home_team_name,
        ht.logo_url as home_team_logo,
        at.name as away_team_name,
        at.logo_url as away_team_logo
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${whereClause}
      ORDER BY m.date ASC
      LIMIT $${++paramCount}
    `, [...params, limit]);

    res.json({ matches });
  })
);

module.exports = router;
module.exports.default = module.exports;