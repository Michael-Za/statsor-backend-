const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database.js');
const redisService = require('../services/redis.js');
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

// Validation schemas
const analyticsQuerySchema = Joi.object({
  query: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().min(Joi.ref('startDate')).optional(),
    teamId: Joi.string().uuid().optional(),
    playerId: Joi.string().uuid().optional(),
    position: Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward').optional(),
    competition: Joi.string().valid('league', 'cup', 'friendly', 'tournament').optional(),
    season: Joi.string().pattern(/^\d{4}-\d{4}$/).optional(),
    metric: Joi.string().valid('goals', 'assists', 'rating', 'minutes', 'passes', 'shots').optional(),
    groupBy: Joi.string().valid('player', 'team', 'position', 'month', 'competition').optional()
  })
});

const customReportSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    filters: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
      teamIds: Joi.array().items(Joi.string().uuid()).optional(),
      playerIds: Joi.array().items(Joi.string().uuid()).optional(),
      positions: Joi.array().items(Joi.string().valid('goalkeeper', 'defender', 'midfielder', 'forward')).optional(),
      competitions: Joi.array().items(Joi.string()).optional()
    }).required(),
    metrics: Joi.array().items(Joi.string().valid(
      'goals', 'assists', 'rating', 'minutes', 'passes', 'passes_completed',
      'shots', 'shots_on_target', 'saves', 'tackles', 'yellow_cards', 'red_cards'
    )).min(1).required(),
    groupBy: Joi.string().valid('player', 'team', 'position', 'month', 'competition').required(),
    chartType: Joi.string().valid('bar', 'line', 'pie', 'scatter', 'table').required()
  })
});

// Helper functions
const buildAnalyticsQuery = (filters, metrics, groupBy) => {
  let selectClause = '';
  let fromClause = `
    FROM player_match_stats pms
    JOIN players p ON pms.player_id = p.id
    JOIN matches m ON pms.match_id = m.id
    JOIN teams t ON p.team_id = t.id
  `;
  let whereClause = 'WHERE 1=1';
  let groupByClause = '';
  let orderByClause = '';
  const params = [];
  let paramCount = 0;

  // Build SELECT clause based on groupBy and metrics
  switch (groupBy) {
    case 'player':
      selectClause = `
        p.id as player_id,
        p.first_name,
        p.last_name,
        p.position,
        t.name as team_name,
        COUNT(pms.id) as matches_played
      `;
      groupByClause = 'GROUP BY p.id, p.first_name, p.last_name, p.position, t.name';
      orderByClause = 'ORDER BY matches_played DESC';
      break;
    case 'team':
      selectClause = `
        t.id as team_id,
        t.name as team_name,
        COUNT(DISTINCT pms.player_id) as players_count,
        COUNT(pms.id) as total_appearances
      `;
      groupByClause = 'GROUP BY t.id, t.name';
      orderByClause = 'ORDER BY total_appearances DESC';
      break;
    case 'position':
      selectClause = `
        p.position,
        COUNT(DISTINCT p.id) as players_count,
        COUNT(pms.id) as total_appearances
      `;
      groupByClause = 'GROUP BY p.position';
      orderByClause = 'ORDER BY total_appearances DESC';
      break;
    case 'month':
      selectClause = `
        DATE_TRUNC('month', m.date) as month,
        COUNT(pms.id) as matches_played
      `;
      groupByClause = 'GROUP BY DATE_TRUNC(\'month\', m.date)';
      orderByClause = 'ORDER BY month ASC';
      break;
    case 'competition':
      selectClause = `
        m.competition,
        COUNT(pms.id) as matches_played,
        COUNT(DISTINCT p.id) as unique_players
      `;
      groupByClause = 'GROUP BY m.competition';
      orderByClause = 'ORDER BY matches_played DESC';
      break;
  }

  // Add metric aggregations
  metrics.forEach(metric => {
    switch (metric) {
      case 'goals':
        selectClause += ', SUM(pms.goals) as total_goals, AVG(pms.goals) as avg_goals';
        break;
      case 'assists':
        selectClause += ', SUM(pms.assists) as total_assists, AVG(pms.assists) as avg_assists';
        break;
      case 'rating':
        selectClause += ', AVG(pms.rating) as avg_rating, MAX(pms.rating) as max_rating';
        break;
      case 'minutes':
        selectClause += ', SUM(pms.minutes_played) as total_minutes, AVG(pms.minutes_played) as avg_minutes';
        break;
      case 'passes':
        selectClause += ', SUM(pms.passes) as total_passes, AVG(pms.passes) as avg_passes';
        break;
      case 'passes_completed':
        selectClause += ', SUM(pms.passes_completed) as total_passes_completed, AVG(pms.passes_completed) as avg_passes_completed';
        break;
      case 'shots':
        selectClause += ', SUM(pms.shots) as total_shots, AVG(pms.shots) as avg_shots';
        break;
      case 'shots_on_target':
        selectClause += ', SUM(pms.shots_on_target) as total_shots_on_target, AVG(pms.shots_on_target) as avg_shots_on_target';
        break;
      case 'saves':
        selectClause += ', SUM(pms.saves) as total_saves, AVG(pms.saves) as avg_saves';
        break;
      case 'tackles':
        selectClause += ', SUM(pms.tackles) as total_tackles, AVG(pms.tackles) as avg_tackles';
        break;
      case 'yellow_cards':
        selectClause += ', SUM(pms.yellow_cards) as total_yellow_cards';
        break;
      case 'red_cards':
        selectClause += ', SUM(pms.red_cards) as total_red_cards';
        break;
    }
  });

  // Build WHERE clause based on filters
  if (filters.startDate) {
    whereClause += ` AND m.date >= $${++paramCount}`;
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClause += ` AND m.date <= $${++paramCount}`;
    params.push(filters.endDate);
  }

  if (filters.teamIds && filters.teamIds.length > 0) {
    whereClause += ` AND t.id = ANY($${++paramCount})`;
    params.push(filters.teamIds);
  }

  if (filters.playerIds && filters.playerIds.length > 0) {
    whereClause += ` AND p.id = ANY($${++paramCount})`;
    params.push(filters.playerIds);
  }

  if (filters.positions && filters.positions.length > 0) {
    whereClause += ` AND p.position = ANY($${++paramCount})`;
    params.push(filters.positions);
  }

  if (filters.competitions && filters.competitions.length > 0) {
    whereClause += ` AND m.competition = ANY($${++paramCount})`;
    params.push(filters.competitions);
  }

  if (filters.season) {
    whereClause += ` AND m.season = $${++paramCount}`;
    params.push(filters.season);
  }

  const query = `SELECT ${selectClause} ${fromClause} ${whereClause} ${groupByClause} ${orderByClause}`;
  
  return { query, params };
};

const calculateTeamStats = async (teamId, startDate, endDate) => {
  const cacheKey = `team_stats:${teamId}:${startDate}:${endDate}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }

  const stats = await db.query(`
    SELECT 
      COUNT(DISTINCT m.id) as matches_played,
      SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) OR 
                    (m.away_team_id = $1 AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins,
      SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as draws,
      SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) OR 
                    (m.away_team_id = $1 AND m.away_score < m.home_score) THEN 1 ELSE 0 END) as losses,
      SUM(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as goals_for,
      SUM(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END) as goals_against,
      AVG(CASE WHEN m.home_team_id = $1 THEN m.home_score ELSE m.away_score END) as avg_goals_for,
      AVG(CASE WHEN m.home_team_id = $1 THEN m.away_score ELSE m.home_score END) as avg_goals_against
    FROM matches m
    WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
      AND m.status = 'finished'
      AND m.date >= $2
      AND m.date <= $3
  `, [teamId, startDate, endDate]);

  const result = stats[0] || {};
  result.goal_difference = (result.goals_for || 0) - (result.goals_against || 0);
  result.win_percentage = result.matches_played > 0 ? (result.wins / result.matches_played * 100).toFixed(2) : 0;

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(result));
  
  return result;
};

const getPlayerPerformanceTrend = async (playerId, metric, days = 30) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));

  const trend = await db.query(`
    SELECT 
      DATE(m.date) as match_date,
      pms.${metric},
      pms.rating,
      m.home_team_id,
      m.away_team_id,
      ht.name as home_team_name,
      at.name as away_team_name
    FROM player_match_stats pms
    JOIN matches m ON pms.match_id = m.id
    JOIN teams ht ON m.home_team_id = ht.id
    JOIN teams at ON m.away_team_id = at.id
    WHERE pms.player_id = $1
      AND m.date >= $2
      AND m.date <= $3
      AND m.status = 'finished'
    ORDER BY m.date ASC
  `, [playerId, startDate, endDate]);

  return trend;
};

// Routes

// @route   GET /api/analytics/overview
// @desc    Get analytics overview
// @access  Private
router.get('/overview',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { teamId, startDate, endDate } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // Role-based filtering
    let targetTeamId = teamId;
    if (req.user.role === 'player' || req.user.role === 'coach') {
      targetTeamId = req.user.team_id;
    }

    const overview = {
      period: { start, end },
      team_id: targetTeamId
    };

    if (targetTeamId) {
      // Team-specific overview
      const [teamStats, topPlayers, recentMatches] = await Promise.all([
        calculateTeamStats(targetTeamId, start, end),
        db.query(`
          SELECT 
            p.id,
            p.first_name,
            p.last_name,
            p.position,
            COUNT(pms.id) as matches_played,
            SUM(pms.goals) as total_goals,
            SUM(pms.assists) as total_assists,
            AVG(pms.rating) as avg_rating
          FROM players p
          LEFT JOIN player_match_stats pms ON p.id = pms.player_id
          LEFT JOIN matches m ON pms.match_id = m.id
          WHERE p.team_id = $1
            AND p.status = 'active'
            AND (m.date IS NULL OR (m.date >= $2 AND m.date <= $3))
          GROUP BY p.id, p.first_name, p.last_name, p.position
          ORDER BY avg_rating DESC NULLS LAST
          LIMIT 10
        `, [targetTeamId, start, end]),
        db.query(`
          SELECT 
            m.*,
            ht.name as home_team_name,
            at.name as away_team_name
          FROM matches m
          JOIN teams ht ON m.home_team_id = ht.id
          JOIN teams at ON m.away_team_id = at.id
          WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
            AND m.date >= $2
            AND m.date <= $3
            AND m.status = 'finished'
          ORDER BY m.date DESC
          LIMIT 5
        `, [targetTeamId, start, end])
      ]);

      overview.team_stats = teamStats;
      overview.top_players = topPlayers;
      overview.recent_matches = recentMatches;
    } else {
      // Global overview (admin only)
      if (req.user.role !== 'admin') {
        throw new AuthorizationError('Access denied');
      }

      const [globalStats, topTeams, topPlayers] = await Promise.all([
        db.query(`
          SELECT 
            COUNT(DISTINCT m.id) as total_matches,
            COUNT(DISTINCT p.id) as total_players,
            COUNT(DISTINCT t.id) as total_teams,
            SUM(pms.goals) as total_goals,
            AVG(pms.rating) as avg_rating
          FROM matches m
          LEFT JOIN player_match_stats pms ON m.id = pms.match_id
          LEFT JOIN players p ON pms.player_id = p.id
          LEFT JOIN teams t ON p.team_id = t.id
          WHERE m.date >= $1 AND m.date <= $2 AND m.status = 'finished'
        `, [start, end]),
        db.query(`
          SELECT 
            t.id,
            t.name,
            COUNT(DISTINCT m.id) as matches_played,
            SUM(CASE WHEN (m.home_team_id = t.id AND m.home_score > m.away_score) OR 
                          (m.away_team_id = t.id AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins
          FROM teams t
          LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
          WHERE m.date >= $1 AND m.date <= $2 AND m.status = 'finished'
          GROUP BY t.id, t.name
          ORDER BY wins DESC, matches_played DESC
          LIMIT 10
        `, [start, end]),
        db.query(`
          SELECT 
            p.id,
            p.first_name,
            p.last_name,
            p.position,
            t.name as team_name,
            SUM(pms.goals) as total_goals,
            AVG(pms.rating) as avg_rating
          FROM players p
          JOIN teams t ON p.team_id = t.id
          LEFT JOIN player_match_stats pms ON p.id = pms.player_id
          LEFT JOIN matches m ON pms.match_id = m.id
          WHERE m.date >= $1 AND m.date <= $2 AND m.status = 'finished'
          GROUP BY p.id, p.first_name, p.last_name, p.position, t.name
          ORDER BY total_goals DESC, avg_rating DESC
          LIMIT 10
        `, [start, end])
      ]);

      overview.global_stats = globalStats[0];
      overview.top_teams = topTeams;
      overview.top_players = topPlayers;
    }

    res.json(overview);
  })
);

// @route   GET /api/analytics/query
// @desc    Execute custom analytics query
// @access  Private
router.get('/query',
  authenticateToken,
  validateRequest(analyticsQuerySchema),
  asyncHandler(async (req, res) => {
    const {
      startDate,
      endDate,
      teamId,
      playerId,
      position,
      competition,
      season,
      metric = 'goals',
      groupBy = 'player'
    } = req.query;

    // Role-based access control
    const filters = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date(),
      competition,
      season
    };

    if (req.user.role === 'player') {
      filters.playerIds = [req.user.id];
      filters.teamIds = [req.user.team_id];
    } else if (req.user.role === 'coach') {
      filters.teamIds = [req.user.team_id];
    } else {
      if (teamId) filters.teamIds = [teamId];
      if (playerId) filters.playerIds = [playerId];
    }

    if (position) filters.positions = [position];

    const metrics = [metric];
    const { query, params } = buildAnalyticsQuery(filters, metrics, groupBy);
    
    const results = await db.query(query, params);

    res.json({
      filters,
      metrics,
      group_by: groupBy,
      results
    });
  })
);

// @route   GET /api/analytics/player/:id/performance
// @desc    Get player performance analytics
// @access  Private
router.get('/player/:id/performance',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { metric = 'rating', days = 30 } = req.query;

    const player = await db.findById('players', id);
    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check access permissions
    if (req.user.role === 'player' && req.user.id !== id) {
      throw new AuthorizationError('Access denied');
    }
    if (req.user.role === 'coach' && req.user.team_id !== player.team_id) {
      throw new AuthorizationError('Access denied');
    }

    const [trend, summary] = await Promise.all([
      getPlayerPerformanceTrend(id, metric, parseInt(days)),
      db.query(`
        SELECT 
          COUNT(pms.id) as matches_played,
          SUM(pms.goals) as total_goals,
          SUM(pms.assists) as total_assists,
          AVG(pms.rating) as avg_rating,
          SUM(pms.minutes_played) as total_minutes,
          MAX(pms.rating) as best_rating,
          MIN(pms.rating) as worst_rating,
          SUM(pms.yellow_cards) as total_yellow_cards,
          SUM(pms.red_cards) as total_red_cards
        FROM player_match_stats pms
        JOIN matches m ON pms.match_id = m.id
        WHERE pms.player_id = $1
          AND m.date >= $2
          AND m.status = 'finished'
      `, [id, new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000)])
    ]);

    res.json({
      player_id: id,
      metric,
      period_days: parseInt(days),
      trend,
      summary: summary[0] || {}
    });
  })
);

// @route   GET /api/analytics/team/:id/stats
// @desc    Get team analytics
// @access  Private
router.get('/team/:id/stats',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate, competition } = req.query;

    // Check access permissions
    if (req.user.role === 'coach' && req.user.team_id !== id) {
      throw new AuthorizationError('Access denied');
    }
    if (req.user.role === 'player' && req.user.team_id !== id) {
      throw new AuthorizationError('Access denied');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let competitionFilter = '';
    const params = [id, start, end];
    if (competition) {
      competitionFilter = 'AND m.competition = $4';
      params.push(competition);
    }

    const [teamStats, playerStats, matchStats] = await Promise.all([
      calculateTeamStats(id, start, end),
      db.query(`
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.position,
          COUNT(pms.id) as matches_played,
          SUM(pms.goals) as total_goals,
          SUM(pms.assists) as total_assists,
          AVG(pms.rating) as avg_rating,
          SUM(pms.minutes_played) as total_minutes
        FROM players p
        LEFT JOIN player_match_stats pms ON p.id = pms.player_id
        LEFT JOIN matches m ON pms.match_id = m.id
        WHERE p.team_id = $1
          AND p.status = 'active'
          AND (m.date IS NULL OR (m.date >= $2 AND m.date <= $3 ${competitionFilter}))
        GROUP BY p.id, p.first_name, p.last_name, p.position
        ORDER BY matches_played DESC, avg_rating DESC NULLS LAST
      `, params),
      db.query(`
        SELECT 
          DATE_TRUNC('month', m.date) as month,
          COUNT(m.id) as matches_played,
          SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score > m.away_score) OR 
                        (m.away_team_id = $1 AND m.away_score > m.home_score) THEN 1 ELSE 0 END) as wins,
          SUM(CASE WHEN m.home_score = m.away_score THEN 1 ELSE 0 END) as draws,
          SUM(CASE WHEN (m.home_team_id = $1 AND m.home_score < m.away_score) OR 
                        (m.away_team_id = $1 AND m.away_score < m.home_score) THEN 1 ELSE 0 END) as losses
        FROM matches m
        WHERE (m.home_team_id = $1 OR m.away_team_id = $1)
          AND m.status = 'finished'
          AND m.date >= $2
          AND m.date <= $3
          ${competitionFilter}
        GROUP BY DATE_TRUNC('month', m.date)
        ORDER BY month ASC
      `, params)
    ]);

    res.json({
      team_id: id,
      period: { start, end },
      competition,
      team_stats: teamStats,
      player_stats: playerStats,
      monthly_performance: matchStats
    });
  })
);

// @route   POST /api/analytics/reports
// @desc    Create custom report
// @access  Private (Coach/Manager/Admin)
router.post('/reports',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(customReportSchema),
  asyncHandler(async (req, res) => {
    const { name, description, filters, metrics, groupBy, chartType } = req.body;

    // Role-based filter restrictions
    if (req.user.role === 'coach' && req.user.team_id) {
      filters.teamIds = [req.user.team_id];
    }

    const report = await db.create('custom_reports', {
      name,
      description,
      filters,
      metrics,
      group_by: groupBy,
      chart_type: chartType,
      created_by: req.user.id,
      team_id: req.user.team_id,
      created_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      message: 'Custom report created successfully',
      report
    });
  })
);

// @route   GET /api/analytics/reports
// @desc    Get user's custom reports
// @access  Private
router.get('/reports',
  authenticateToken,
  asyncHandler(async (req, res) => {
    let whereClause = 'WHERE created_by = $1';
    const params = [req.user.id];

    // Coaches can see team reports
    if (req.user.role === 'coach' && req.user.team_id) {
      whereClause += ' OR team_id = $2';
      params.push(req.user.team_id);
    }

    const reports = await db.query(`
      SELECT 
        cr.*,
        u.first_name as created_by_name,
        u.last_name as created_by_surname
      FROM custom_reports cr
      JOIN users u ON cr.created_by = u.id
      ${whereClause}
      ORDER BY cr.created_at DESC
    `, params);

    res.json({ reports });
  })
);

// @route   GET /api/analytics/reports/:id/execute
// @desc    Execute custom report
// @access  Private
router.get('/reports/:id/execute',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const report = await db.findById('custom_reports', id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Check access permissions
    const canAccess = report.created_by === req.user.id ||
                     (req.user.role === 'coach' && report.team_id === req.user.team_id) ||
                     req.user.role === 'admin';

    if (!canAccess) {
      throw new AuthorizationError('Access denied');
    }

    const { query, params } = buildAnalyticsQuery(report.filters, report.metrics, report.group_by);
    const results = await db.query(query, params);

    res.json({
      report: {
        id: report.id,
        name: report.name,
        description: report.description,
        chart_type: report.chart_type,
        created_at: report.created_at
      },
      results
    });
  })
);

// @route   GET /api/analytics/leaderboard
// @desc    Get leaderboard for specific metric
// @access  Private
router.get('/leaderboard',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const {
      metric = 'goals',
      position,
      teamId,
      limit = 20,
      startDate,
      endDate
    } = req.query;

    let whereClause = 'WHERE p.status = \'active\' AND m.status = \'finished\'';
    const params = [];
    let paramCount = 0;

    if (position) {
      whereClause += ` AND p.position = $${++paramCount}`;
      params.push(position);
    }

    if (teamId) {
      whereClause += ` AND p.team_id = $${++paramCount}`;
      params.push(teamId);
    }

    if (startDate) {
      whereClause += ` AND m.date >= $${++paramCount}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      whereClause += ` AND m.date <= $${++paramCount}`;
      params.push(new Date(endDate));
    }

    // Role-based filtering
    if (req.user.role === 'player' && req.user.team_id) {
      whereClause += ` AND p.team_id = $${++paramCount}`;
      params.push(req.user.team_id);
    } else if (req.user.role === 'coach' && req.user.team_id) {
      whereClause += ` AND p.team_id = $${++paramCount}`;
      params.push(req.user.team_id);
    }

    let orderByClause = '';
    let selectMetric = '';

    switch (metric) {
      case 'goals':
        selectMetric = 'SUM(pms.goals) as total_goals';
        orderByClause = 'ORDER BY total_goals DESC';
        break;
      case 'assists':
        selectMetric = 'SUM(pms.assists) as total_assists';
        orderByClause = 'ORDER BY total_assists DESC';
        break;
      case 'rating':
        selectMetric = 'AVG(pms.rating) as avg_rating';
        orderByClause = 'ORDER BY avg_rating DESC';
        break;
      case 'minutes':
        selectMetric = 'SUM(pms.minutes_played) as total_minutes';
        orderByClause = 'ORDER BY total_minutes DESC';
        break;
      default:
        selectMetric = 'SUM(pms.goals) as total_goals';
        orderByClause = 'ORDER BY total_goals DESC';
    }

    const leaderboard = await db.query(`
      SELECT 
        p.id,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number,
        t.name as team_name,
        t.logo_url as team_logo,
        COUNT(pms.id) as matches_played,
        ${selectMetric}
      FROM players p
      JOIN teams t ON p.team_id = t.id
      LEFT JOIN player_match_stats pms ON p.id = pms.player_id
      LEFT JOIN matches m ON pms.match_id = m.id
      ${whereClause}
      GROUP BY p.id, p.first_name, p.last_name, p.position, p.jersey_number, t.name, t.logo_url
      HAVING COUNT(pms.id) > 0
      ${orderByClause}
      LIMIT $${++paramCount}
    `, [...params, limit]);

    res.json({
      metric,
      position,
      team_id: teamId,
      leaderboard
    });
  })
);

// @route   GET /api/analytics/comparison
// @desc    Compare players or teams
// @access  Private
router.get('/comparison',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { type, ids, metrics, startDate, endDate } = req.query;

    if (!type || !ids || !metrics) {
      throw new ValidationError('Type, IDs, and metrics are required');
    }

    const entityIds = ids.split(',');
    const metricList = metrics.split(',');
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let results = [];

    if (type === 'players') {
      // Check access permissions for players
      if (req.user.role === 'player') {
        const allowedIds = entityIds.filter(id => id === req.user.id);
        if (allowedIds.length !== entityIds.length) {
          throw new AuthorizationError('Access denied');
        }
      }

      results = await db.query(`
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.position,
          t.name as team_name,
          COUNT(pms.id) as matches_played,
          SUM(pms.goals) as total_goals,
          SUM(pms.assists) as total_assists,
          AVG(pms.rating) as avg_rating,
          SUM(pms.minutes_played) as total_minutes,
          SUM(pms.passes) as total_passes,
          SUM(pms.passes_completed) as total_passes_completed
        FROM players p
        JOIN teams t ON p.team_id = t.id
        LEFT JOIN player_match_stats pms ON p.id = pms.player_id
        LEFT JOIN matches m ON pms.match_id = m.id
        WHERE p.id = ANY($1)
          AND (m.date IS NULL OR (m.date >= $2 AND m.date <= $3 AND m.status = 'finished'))
        GROUP BY p.id, p.first_name, p.last_name, p.position, t.name
        ORDER BY p.first_name, p.last_name
      `, [entityIds, start, end]);
    } else if (type === 'teams') {
      results = await Promise.all(
        entityIds.map(async (teamId) => {
          const stats = await calculateTeamStats(teamId, start, end);
          const team = await db.findById('teams', teamId);
          return {
            ...team,
            ...stats
          };
        })
      );
    }

    res.json({
      type,
      period: { start, end },
      metrics: metricList,
      comparison: results
    });
  })
);

module.exports = router;
module.exports.default = module.exports;