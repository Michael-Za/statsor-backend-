const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database.js');
const redisService = require('../services/redis.js');
const socketService = require('../services/socket.js');
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
const socket = socketService;

// Validation schemas
const createTrainingSessionSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().min('now').required(),
    duration: Joi.number().integer().min(15).max(300).required(), // minutes
    location: Joi.string().max(200).optional(),
    type: Joi.string().valid('fitness', 'technical', 'tactical', 'recovery', 'match_preparation').required(),
    intensity: Joi.string().valid('low', 'medium', 'high', 'very_high').required(),
    team_id: Joi.string().uuid().required(),
    coach_id: Joi.string().uuid().optional(),
    max_participants: Joi.number().integer().min(1).max(50).optional(),
    equipment_needed: Joi.array().items(Joi.string()).optional(),
    weather_dependent: Joi.boolean().default(false),
    notes: Joi.string().max(1000).optional()
  })
});

const updateTrainingSessionSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().min(3).max(100).optional(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().optional(),
    duration: Joi.number().integer().min(15).max(300).optional(),
    location: Joi.string().max(200).optional(),
    type: Joi.string().valid('fitness', 'technical', 'tactical', 'recovery', 'match_preparation').optional(),
    intensity: Joi.string().valid('low', 'medium', 'high', 'very_high').optional(),
    status: Joi.string().valid('scheduled', 'in_progress', 'completed', 'cancelled').optional(),
    max_participants: Joi.number().integer().min(1).max(50).optional(),
    equipment_needed: Joi.array().items(Joi.string()).optional(),
    weather_dependent: Joi.boolean().optional(),
    notes: Joi.string().max(1000).optional()
  })
});

const createDrillSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(1000).required(),
    category: Joi.string().valid('passing', 'shooting', 'dribbling', 'defending', 'fitness', 'goalkeeping', 'set_pieces').required(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required(),
    duration: Joi.number().integer().min(5).max(60).required(), // minutes
    min_players: Joi.number().integer().min(1).max(22).required(),
    max_players: Joi.number().integer().min(Joi.ref('min_players')).max(22).required(),
    equipment: Joi.array().items(Joi.string()).required(),
    setup_instructions: Joi.string().max(2000).required(),
    execution_steps: Joi.array().items(Joi.string().max(500)).min(1).required(),
    coaching_points: Joi.array().items(Joi.string().max(300)).optional(),
    variations: Joi.array().items(Joi.string().max(500)).optional(),
    objectives: Joi.array().items(Joi.string().max(200)).required(),
    age_group: Joi.string().valid('u12', 'u14', 'u16', 'u18', 'senior', 'all').default('all'),
    video_url: Joi.string().uri().optional(),
    diagram_url: Joi.string().uri().optional(),
    tags: Joi.array().items(Joi.string().max(50)).optional()
  })
});

const attendanceSchema = Joi.object({
  body: Joi.object({
    player_id: Joi.string().uuid().required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    arrival_time: Joi.date().optional(),
    notes: Joi.string().max(300).optional()
  })
});

const performanceRatingSchema = Joi.object({
  body: Joi.object({
    player_id: Joi.string().uuid().required(),
    technical_rating: Joi.number().min(1).max(10).required(),
    physical_rating: Joi.number().min(1).max(10).required(),
    tactical_rating: Joi.number().min(1).max(10).required(),
    mental_rating: Joi.number().min(1).max(10).required(),
    overall_rating: Joi.number().min(1).max(10).required(),
    strengths: Joi.array().items(Joi.string().max(100)).optional(),
    areas_for_improvement: Joi.array().items(Joi.string().max(100)).optional(),
    notes: Joi.string().max(500).optional(),
    goals_achieved: Joi.array().items(Joi.string().max(200)).optional(),
    next_session_focus: Joi.array().items(Joi.string().max(200)).optional()
  })
});

// Helper functions
const calculateTrainingLoad = (intensity, duration) => {
  const intensityMultipliers = {
    'low': 1,
    'medium': 1.5,
    'high': 2,
    'very_high': 2.5
  };
  
  return Math.round(duration * intensityMultipliers[intensity]);
};

const getPlayerTrainingStats = async (playerId, startDate, endDate) => {
  const stats = await db.query(`
    SELECT 
      COUNT(ta.id) as sessions_attended,
      COUNT(CASE WHEN ta.status = 'present' THEN 1 END) as sessions_present,
      COUNT(CASE WHEN ta.status = 'late' THEN 1 END) as sessions_late,
      COUNT(CASE WHEN ta.status = 'absent' THEN 1 END) as sessions_absent,
      AVG(tpr.overall_rating) as avg_rating,
      SUM(ts.training_load) as total_training_load,
      AVG(ts.training_load) as avg_training_load
    FROM training_sessions ts
    LEFT JOIN training_attendance ta ON ts.id = ta.session_id AND ta.player_id = $1
    LEFT JOIN training_performance_ratings tpr ON ts.id = tpr.session_id AND tpr.player_id = $1
    WHERE ts.date >= $2 AND ts.date <= $3 AND ts.status = 'completed'
  `, [playerId, startDate, endDate]);

  return stats[0] || {};
};

const getTeamTrainingOverview = async (teamId, startDate, endDate) => {
  const overview = await db.query(`
    SELECT 
      COUNT(ts.id) as total_sessions,
      COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_sessions,
      COUNT(CASE WHEN ts.status = 'cancelled' THEN 1 END) as cancelled_sessions,
      AVG(ts.duration) as avg_duration,
      AVG(ts.training_load) as avg_training_load,
      COUNT(CASE WHEN ts.type = 'fitness' THEN 1 END) as fitness_sessions,
      COUNT(CASE WHEN ts.type = 'technical' THEN 1 END) as technical_sessions,
      COUNT(CASE WHEN ts.type = 'tactical' THEN 1 END) as tactical_sessions,
      COUNT(CASE WHEN ts.type = 'recovery' THEN 1 END) as recovery_sessions,
      COUNT(CASE WHEN ts.type = 'match_preparation' THEN 1 END) as match_prep_sessions
    FROM training_sessions ts
    WHERE ts.team_id = $1 AND ts.date >= $2 AND ts.date <= $3
  `, [teamId, startDate, endDate]);

  return overview[0] || {};
};

// Routes

// @route   GET /api/training/sessions
// @desc    Get training sessions
// @access  Private
router.get('/sessions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { 
      teamId, 
      startDate, 
      endDate, 
      status, 
      type, 
      page = 1, 
      limit = 20 
    } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Role-based filtering
    if (req.user.role === 'player' || req.user.role === 'coach') {
      whereClause += ` AND ts.team_id = $${++paramCount}`;
      params.push(req.user.team_id);
    } else if (teamId) {
      whereClause += ` AND ts.team_id = $${++paramCount}`;
      params.push(teamId);
    }

    if (startDate) {
      whereClause += ` AND ts.date >= $${++paramCount}`;
      params.push(new Date(startDate));
    }

    if (endDate) {
      whereClause += ` AND ts.date <= $${++paramCount}`;
      params.push(new Date(endDate));
    }

    if (status) {
      whereClause += ` AND ts.status = $${++paramCount}`;
      params.push(status);
    }

    if (type) {
      whereClause += ` AND ts.type = $${++paramCount}`;
      params.push(type);
    }

    const offset = (page - 1) * limit;
    whereClause += ` ORDER BY ts.date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const sessions = await db.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        u.first_name as coach_first_name,
        u.last_name as coach_last_name,
        COUNT(ta.id) as registered_participants,
        COUNT(CASE WHEN ta.status = 'present' THEN 1 END) as present_count
      FROM training_sessions ts
      JOIN teams t ON ts.team_id = t.id
      LEFT JOIN users u ON ts.coach_id = u.id
      LEFT JOIN training_attendance ta ON ts.id = ta.session_id
      ${whereClause}
      GROUP BY ts.id, t.name, u.first_name, u.last_name
    `, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT ts.id) as total
      FROM training_sessions ts
      JOIN teams t ON ts.team_id = t.id
      ${whereClause.replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '')}
    `;
    const totalResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(totalResult[0]?.total || 0);

    res.json({
      sessions,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   POST /api/training/sessions
// @desc    Create training session
// @access  Private (Coach/Manager/Admin)
router.post('/sessions',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(createTrainingSessionSchema),
  asyncHandler(async (req, res) => {
    const {
      title,
      description,
      date,
      duration,
      location,
      type,
      intensity,
      team_id,
      coach_id,
      max_participants,
      equipment_needed,
      weather_dependent,
      notes
    } = req.body;

    // Check team ownership for coaches
    if (req.user.role === 'coach' && req.user.team_id !== team_id) {
      throw new AuthorizationError('Access denied');
    }

    const training_load = calculateTrainingLoad(intensity, duration);

    const session = await db.create('training_sessions', {
      title,
      description,
      date: new Date(date),
      duration,
      location,
      type,
      intensity,
      team_id,
      coach_id: coach_id || req.user.id,
      max_participants,
      equipment_needed,
      weather_dependent,
      notes,
      training_load,
      status: 'scheduled',
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Notify team members
    socket.emitToTeam(team_id, 'training_session_created', {
      session_id: session.id,
      title,
      date,
      type,
      coach_name: `${req.user.first_name} ${req.user.last_name}`
    });

    res.status(201).json({
      message: 'Training session created successfully',
      session
    });
  })
);

// @route   GET /api/training/sessions/:id
// @desc    Get training session details
// @access  Private
router.get('/sessions/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const session = await db.query(`
      SELECT 
        ts.*,
        t.name as team_name,
        u.first_name as coach_first_name,
        u.last_name as coach_last_name,
        u.email as coach_email
      FROM training_sessions ts
      JOIN teams t ON ts.team_id = t.id
      LEFT JOIN users u ON ts.coach_id = u.id
      WHERE ts.id = $1
    `, [id]);

    if (!session.length) {
      throw new NotFoundError('Training session not found');
    }

    const sessionData = session[0];

    // Check access permissions
    if (req.user.role === 'player' && req.user.team_id !== sessionData.team_id) {
      throw new AuthorizationError('Access denied');
    }
    if (req.user.role === 'coach' && req.user.team_id !== sessionData.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Get attendance data
    const attendance = await db.query(`
      SELECT 
        ta.*,
        p.first_name,
        p.last_name,
        p.position,
        p.jersey_number
      FROM training_attendance ta
      JOIN players p ON ta.player_id = p.id
      WHERE ta.session_id = $1
      ORDER BY p.jersey_number, p.last_name
    `, [id]);

    // Get drills for this session
    const drills = await db.query(`
      SELECT 
        tsd.*,
        d.name as drill_name,
        d.category,
        d.difficulty,
        d.duration as drill_duration
      FROM training_session_drills tsd
      JOIN drills d ON tsd.drill_id = d.id
      WHERE tsd.session_id = $1
      ORDER BY tsd.order_index
    `, [id]);

    // Get performance ratings if session is completed
    let performance_ratings = [];
    if (sessionData.status === 'completed') {
      performance_ratings = await db.query(`
        SELECT 
          tpr.*,
          p.first_name,
          p.last_name,
          p.position
        FROM training_performance_ratings tpr
        JOIN players p ON tpr.player_id = p.id
        WHERE tpr.session_id = $1
        ORDER BY tpr.overall_rating DESC
      `, [id]);
    }

    res.json({
      session: sessionData,
      attendance,
      drills,
      performance_ratings
    });
  })
);

// @route   PUT /api/training/sessions/:id
// @desc    Update training session
// @access  Private (Coach/Manager/Admin)
router.put('/sessions/:id',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(updateTrainingSessionSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const session = await db.findById('training_sessions', id);
    if (!session) {
      throw new NotFoundError('Training session not found');
    }

    // Check permissions
    if (req.user.role === 'coach' && req.user.team_id !== session.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Recalculate training load if intensity or duration changed
    if (updates.intensity || updates.duration) {
      const intensity = updates.intensity || session.intensity;
      const duration = updates.duration || session.duration;
      updates.training_load = calculateTrainingLoad(intensity, duration);
    }

    updates.updated_at = new Date();

    const updatedSession = await db.update('training_sessions', id, updates);

    // Notify team if significant changes
    if (updates.date || updates.location || updates.status) {
      socket.emitToTeam(session.team_id, 'training_session_updated', {
        session_id: id,
        changes: Object.keys(updates),
        status: updates.status || session.status
      });
    }

    res.json({
      message: 'Training session updated successfully',
      session: updatedSession
    });
  })
);

// @route   DELETE /api/training/sessions/:id
// @desc    Delete training session
// @access  Private (Coach/Manager/Admin)
router.delete('/sessions/:id',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const session = await db.findById('training_sessions', id);
    if (!session) {
      throw new NotFoundError('Training session not found');
    }

    // Check permissions
    if (req.user.role === 'coach' && req.user.team_id !== session.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Don't allow deletion of completed sessions with data
    if (session.status === 'completed') {
      const hasData = await db.query(`
        SELECT COUNT(*) as count FROM (
          SELECT 1 FROM training_attendance WHERE session_id = $1
          UNION ALL
          SELECT 1 FROM training_performance_ratings WHERE session_id = $1
        ) as combined
      `, [id]);

      if (parseInt(hasData[0].count) > 0) {
        throw new ValidationError('Cannot delete completed session with attendance or performance data');
      }
    }

    await db.delete('training_sessions', id);

    // Notify team
    socket.emitToTeam(session.team_id, 'training_session_deleted', {
      session_id: id,
      title: session.title,
      date: session.date
    });

    res.json({ message: 'Training session deleted successfully' });
  })
);

// @route   POST /api/training/sessions/:id/attendance
// @desc    Record attendance for training session
// @access  Private (Coach/Manager/Admin)
router.post('/sessions/:id/attendance',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(attendanceSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { player_id, status, arrival_time, notes } = req.body;

    const session = await db.findById('training_sessions', id);
    if (!session) {
      throw new NotFoundError('Training session not found');
    }

    // Check permissions
    if (req.user.role === 'coach' && req.user.team_id !== session.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Verify player belongs to the team
    const player = await db.findById('players', player_id);
    if (!player || player.team_id !== session.team_id) {
      throw new ValidationError('Player not found or not in session team');
    }

    // Check if attendance already recorded
    const existingAttendance = await db.query(`
      SELECT id FROM training_attendance 
      WHERE session_id = $1 AND player_id = $2
    `, [id, player_id]);

    let attendance;
    if (existingAttendance.length > 0) {
      // Update existing attendance
      attendance = await db.update('training_attendance', existingAttendance[0].id, {
        status,
        arrival_time: arrival_time ? new Date(arrival_time) : null,
        notes,
        updated_at: new Date()
      });
    } else {
      // Create new attendance record
      attendance = await db.create('training_attendance', {
        session_id: id,
        player_id,
        status,
        arrival_time: arrival_time ? new Date(arrival_time) : null,
        notes,
        recorded_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json({
      message: 'Attendance recorded successfully',
      attendance
    });
  })
);

// @route   POST /api/training/sessions/:id/performance
// @desc    Record performance rating for training session
// @access  Private (Coach/Manager/Admin)
router.post('/sessions/:id/performance',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(performanceRatingSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
      player_id,
      technical_rating,
      physical_rating,
      tactical_rating,
      mental_rating,
      overall_rating,
      strengths,
      areas_for_improvement,
      notes,
      goals_achieved,
      next_session_focus
    } = req.body;

    const session = await db.findById('training_sessions', id);
    if (!session) {
      throw new NotFoundError('Training session not found');
    }

    // Check permissions
    if (req.user.role === 'coach' && req.user.team_id !== session.team_id) {
      throw new AuthorizationError('Access denied');
    }

    // Verify player belongs to the team and attended the session
    const attendance = await db.query(`
      SELECT ta.*, p.team_id
      FROM training_attendance ta
      JOIN players p ON ta.player_id = p.id
      WHERE ta.session_id = $1 AND ta.player_id = $2
    `, [id, player_id]);

    if (!attendance.length) {
      throw new ValidationError('Player attendance not recorded for this session');
    }

    if (attendance[0].team_id !== session.team_id) {
      throw new ValidationError('Player not in session team');
    }

    // Check if performance rating already exists
    const existingRating = await db.query(`
      SELECT id FROM training_performance_ratings 
      WHERE session_id = $1 AND player_id = $2
    `, [id, player_id]);

    let rating;
    if (existingRating.length > 0) {
      // Update existing rating
      rating = await db.update('training_performance_ratings', existingRating[0].id, {
        technical_rating,
        physical_rating,
        tactical_rating,
        mental_rating,
        overall_rating,
        strengths,
        areas_for_improvement,
        notes,
        goals_achieved,
        next_session_focus,
        updated_at: new Date()
      });
    } else {
      // Create new rating
      rating = await db.create('training_performance_ratings', {
        session_id: id,
        player_id,
        technical_rating,
        physical_rating,
        tactical_rating,
        mental_rating,
        overall_rating,
        strengths,
        areas_for_improvement,
        notes,
        goals_achieved,
        next_session_focus,
        rated_by: req.user.id,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json({
      message: 'Performance rating recorded successfully',
      rating
    });
  })
);

// @route   GET /api/training/drills
// @desc    Get training drills
// @access  Private
router.get('/drills',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { 
      category, 
      difficulty, 
      age_group, 
      min_players, 
      max_players, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    let whereClause = 'WHERE d.status = \'active\'';
    const params = [];
    let paramCount = 0;

    if (category) {
      whereClause += ` AND d.category = $${++paramCount}`;
      params.push(category);
    }

    if (difficulty) {
      whereClause += ` AND d.difficulty = $${++paramCount}`;
      params.push(difficulty);
    }

    if (age_group && age_group !== 'all') {
      whereClause += ` AND (d.age_group = $${++paramCount} OR d.age_group = 'all')`;
      params.push(age_group);
    }

    if (min_players) {
      whereClause += ` AND d.max_players >= $${++paramCount}`;
      params.push(parseInt(min_players));
    }

    if (max_players) {
      whereClause += ` AND d.min_players <= $${++paramCount}`;
      params.push(parseInt(max_players));
    }

    if (search) {
      whereClause += ` AND (d.name ILIKE $${++paramCount} OR d.description ILIKE $${++paramCount})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount++; // Account for the second parameter
    }

    const offset = (page - 1) * limit;
    whereClause += ` ORDER BY d.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    const drills = await db.query(`
      SELECT 
        d.*,
        u.first_name as created_by_name,
        u.last_name as created_by_surname,
        COUNT(tsd.id) as usage_count
      FROM drills d
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN training_session_drills tsd ON d.id = tsd.drill_id
      ${whereClause}
      GROUP BY d.id, u.first_name, u.last_name
    `, params);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT d.id) as total
      FROM drills d
      ${whereClause.replace(/ORDER BY.*$/, '').replace(/LIMIT.*$/, '')}
    `;
    const totalResult = await db.query(countQuery, params.slice(0, -2));
    const total = parseInt(totalResult[0]?.total || 0);

    res.json({
      drills,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  })
);

// @route   POST /api/training/drills
// @desc    Create training drill
// @access  Private (Coach/Manager/Admin)
router.post('/drills',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  validateRequest(createDrillSchema),
  asyncHandler(async (req, res) => {
    const drillData = {
      ...req.body,
      created_by: req.user.id,
      team_id: req.user.team_id, // Optional: associate with team
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    const drill = await db.create('drills', drillData);

    res.status(201).json({
      message: 'Training drill created successfully',
      drill
    });
  })
);

// @route   GET /api/training/analytics/player/:id
// @desc    Get player training analytics
// @access  Private
router.get('/analytics/player/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

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

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [stats, recentRatings, trainingLoad] = await Promise.all([
      getPlayerTrainingStats(id, start, end),
      db.query(`
        SELECT 
          tpr.*,
          ts.date,
          ts.title,
          ts.type,
          ts.intensity
        FROM training_performance_ratings tpr
        JOIN training_sessions ts ON tpr.session_id = ts.id
        WHERE tpr.player_id = $1
          AND ts.date >= $2
          AND ts.date <= $3
        ORDER BY ts.date DESC
        LIMIT 10
      `, [id, start, end]),
      db.query(`
        SELECT 
          DATE_TRUNC('week', ts.date) as week,
          SUM(ts.training_load) as weekly_load,
          COUNT(ta.id) as sessions_attended
        FROM training_sessions ts
        LEFT JOIN training_attendance ta ON ts.id = ta.session_id AND ta.player_id = $1 AND ta.status = 'present'
        WHERE ts.team_id = $2
          AND ts.date >= $3
          AND ts.date <= $4
          AND ts.status = 'completed'
        GROUP BY DATE_TRUNC('week', ts.date)
        ORDER BY week ASC
      `, [id, player.team_id, start, end])
    ]);

    res.json({
      player_id: id,
      period: { start, end },
      stats,
      recent_ratings: recentRatings,
      training_load_trend: trainingLoad
    });
  })
);

// @route   GET /api/training/analytics/team/:id
// @desc    Get team training analytics
// @access  Private (Coach/Manager/Admin)
router.get('/analytics/team/:id',
  authenticateToken,
  requireRole(['coach', 'manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Check permissions
    if (req.user.role === 'coach' && req.user.team_id !== id) {
      throw new AuthorizationError('Access denied');
    }

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [overview, attendanceStats, performanceStats] = await Promise.all([
      getTeamTrainingOverview(id, start, end),
      db.query(`
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.position,
          COUNT(ta.id) as sessions_registered,
          COUNT(CASE WHEN ta.status = 'present' THEN 1 END) as sessions_attended,
          COUNT(CASE WHEN ta.status = 'late' THEN 1 END) as sessions_late,
          COUNT(CASE WHEN ta.status = 'absent' THEN 1 END) as sessions_missed,
          ROUND(
            (COUNT(CASE WHEN ta.status = 'present' THEN 1 END)::float / 
             NULLIF(COUNT(ta.id), 0) * 100), 2
          ) as attendance_percentage
        FROM players p
        LEFT JOIN training_attendance ta ON p.id = ta.player_id
        LEFT JOIN training_sessions ts ON ta.session_id = ts.id
        WHERE p.team_id = $1
          AND p.status = 'active'
          AND (ts.date IS NULL OR (ts.date >= $2 AND ts.date <= $3))
        GROUP BY p.id, p.first_name, p.last_name, p.position
        ORDER BY attendance_percentage DESC NULLS LAST
      `, [id, start, end]),
      db.query(`
        SELECT 
          p.id,
          p.first_name,
          p.last_name,
          p.position,
          COUNT(tpr.id) as ratings_count,
          AVG(tpr.overall_rating) as avg_overall_rating,
          AVG(tpr.technical_rating) as avg_technical_rating,
          AVG(tpr.physical_rating) as avg_physical_rating,
          AVG(tpr.tactical_rating) as avg_tactical_rating,
          AVG(tpr.mental_rating) as avg_mental_rating
        FROM players p
        LEFT JOIN training_performance_ratings tpr ON p.id = tpr.player_id
        LEFT JOIN training_sessions ts ON tpr.session_id = ts.id
        WHERE p.team_id = $1
          AND p.status = 'active'
          AND (ts.date IS NULL OR (ts.date >= $2 AND ts.date <= $3))
        GROUP BY p.id, p.first_name, p.last_name, p.position
        HAVING COUNT(tpr.id) > 0
        ORDER BY avg_overall_rating DESC
      `, [id, start, end])
    ]);

    res.json({
      team_id: id,
      period: { start, end },
      overview,
      attendance_stats: attendanceStats,
      performance_stats: performanceStats
    });
  })
);

module.exports = router;
module.exports.default = module.exports;