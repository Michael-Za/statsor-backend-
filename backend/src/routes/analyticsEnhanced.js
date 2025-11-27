const express = require('express');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const { APIService } = require('../services/apiService');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError
} = require('../middleware/errorHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const apiService = new APIService();

// Rate limiting
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window for analytics
  message: { error: 'Too many analytics requests, please try again later' }
});

const realTimeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for real-time data
  message: { error: 'Too many real-time requests, please try again later' }
});

// Validation schemas
const dashboardAnalyticsSchema = Joi.object({
  query: Joi.object({
    teamId: Joi.string().uuid().optional(),
    dateRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
    includeComparisons: Joi.boolean().default(false),
    metrics: Joi.array().items(
      Joi.string().valid('players', 'matches', 'performance', 'injuries', 'training')
    ).optional()
  })
});

const playerAnalyticsSchema = Joi.object({
  params: Joi.object({
    playerId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    dateRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
    includeComparisons: Joi.boolean().default(false),
    compareWith: Joi.array().items(Joi.string().uuid()).optional()
  })
});

const teamAnalyticsSchema = Joi.object({
  params: Joi.object({
    teamId: Joi.string().uuid().required()
  }),
  query: Joi.object({
    dateRange: Joi.string().valid('7d', '30d', '90d', '1y').default('30d'),
    metrics: Joi.array().items(
      Joi.string().valid('performance', 'tactical', 'physical', 'mental')
    ).default(['performance'])
  })
});

const customReportSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    description: Joi.string().max(500).optional(),
    filters: Joi.object({
      teams: Joi.array().items(Joi.string().uuid()).optional(),
      players: Joi.array().items(Joi.string().uuid()).optional(),
      positions: Joi.array().items(Joi.string()).optional(),
      dateRange: Joi.object({
        start: Joi.date().required(),
        end: Joi.date().min(Joi.ref('start')).required()
      }).required(),
      metrics: Joi.array().items(Joi.string()).required()
    }).required(),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json'),
    schedule: Joi.object({
      frequency: Joi.string().valid('once', 'daily', 'weekly', 'monthly').default('once'),
      email: Joi.string().email().optional()
    }).optional()
  })
});

// =====================================
// ANALYTICS ROUTES
// =====================================

// @route   GET /api/v1/analytics/dashboard
// @desc    Get comprehensive dashboard analytics
// @access  Private
router.get('/dashboard',
  authenticateToken,
  analyticsLimiter,
  validateRequest(dashboardAnalyticsSchema),
  asyncHandler(async (req, res) => {
    const { teamId, dateRange, includeComparisons, metrics } = req.query;
    const userId = req.user.id;

    const result = await apiService.getDashboardAnalytics(userId, {
      teamId,
      dateRange,
      includeComparisons,
      metrics
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message,
      cached: result.cached || false
    });
  })
);

// @route   GET /api/v1/analytics/players/:playerId
// @desc    Get detailed player analytics
// @access  Private
router.get('/players/:playerId',
  authenticateToken,
  analyticsLimiter,
  validateRequest(playerAnalyticsSchema),
  asyncHandler(async (req, res) => {
    const { playerId } = req.params;
    const { dateRange, includeComparisons, compareWith } = req.query;

    const result = await apiService.getPlayerAnalytics(playerId, {
      dateRange,
      includeComparisons,
      compareWith
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/teams/:teamId
// @desc    Get comprehensive team analytics
// @access  Private
router.get('/teams/:teamId',
  authenticateToken,
  analyticsLimiter,
  validateRequest(teamAnalyticsSchema),
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;
    const { dateRange, metrics } = req.query;

    const result = await apiService.getTeamAnalytics(teamId, {
      dateRange,
      metrics
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/real-time/:teamId
// @desc    Get real-time analytics with Server-Sent Events
// @access  Private
router.get('/real-time/:teamId',
  authenticateToken,
  realTimeLimiter,
  asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    // Set headers for Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial data
    const initialData = await apiService.getRealTimeAnalytics(teamId);
    res.write(`data: ${JSON.stringify(initialData)}\n\n`);

    // Set up interval for updates
    const intervalId = setInterval(async () => {
      try {
        const data = await apiService.getRealTimeAnalytics(teamId);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (error) {
        console.error('Real-time analytics error:', error);
        res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
      }
    }, 5000); // Update every 5 seconds

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(intervalId);
      console.log(`Real-time analytics connection closed for team ${teamId}`);
    });

    req.on('error', (error) => {
      console.error('Real-time analytics connection error:', error);
      clearInterval(intervalId);
    });
  })
);

// @route   POST /api/v1/analytics/custom-report
// @desc    Generate custom analytics report
// @access  Private
router.post('/custom-report',
  authenticateToken,
  analyticsLimiter,
  validateRequest(customReportSchema),
  asyncHandler(async (req, res) => {
    const { name, description, filters, format, schedule } = req.body;
    const userId = req.user.id;

    const result = await apiService.generateCustomReport({
      userId,
      name,
      description,
      filters,
      format,
      schedule
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/reports
// @desc    Get user's custom reports
// @access  Private
router.get('/reports',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;

    const result = await apiService.getUserReports(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      status
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/reports/:reportId
// @desc    Get specific report data
// @access  Private
router.get('/reports/:reportId',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.id;

    const result = await apiService.getReportData(reportId, userId);

    if (!result.success) {
      const statusCode = result.code === 'REPORT_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    // If report format is not JSON, handle file download
    if (result.data.format !== 'json') {
      res.setHeader('Content-Disposition', `attachment; filename="${result.data.filename}"`);
      res.setHeader('Content-Type', result.data.mimeType);
      return res.send(result.data.content);
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   DELETE /api/v1/analytics/reports/:reportId
// @desc    Delete a custom report
// @access  Private
router.delete('/reports/:reportId',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { reportId } = req.params;
    const userId = req.user.id;

    const result = await apiService.deleteReport(reportId, userId);

    if (!result.success) {
      const statusCode = result.code === 'REPORT_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/performance-trends
// @desc    Get performance trends analysis
// @access  Private
router.get('/performance-trends',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { teamId, playerId, timeframe = '30d', metric = 'rating' } = req.query;

    const result = await apiService.getPerformanceTrends({
      teamId,
      playerId,
      timeframe,
      metric
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/heatmaps/:matchId
// @desc    Get match heatmap data
// @access  Private
router.get('/heatmaps/:matchId',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { matchId } = req.params;
    const { playerId, heatmapType = 'position' } = req.query;

    const result = await apiService.getMatchHeatmap(matchId, {
      playerId,
      heatmapType
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   POST /api/v1/analytics/compare-players
// @desc    Compare multiple players' performance
// @access  Private
router.post('/compare-players',
  authenticateToken,
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { playerIds, metrics, dateRange, normalize = false } = req.body;

    if (!playerIds || playerIds.length < 2) {
      throw new ValidationError('At least 2 players required for comparison');
    }

    if (playerIds.length > 10) {
      throw new ValidationError('Maximum 10 players can be compared at once');
    }

    const result = await apiService.comparePlayersPerformance({
      playerIds,
      metrics,
      dateRange,
      normalize
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/analytics/predictive/:type
// @desc    Get predictive analytics
// @access  Private (Admin/Coach only)
router.get('/predictive/:type',
  authenticateToken,
  requireRole(['admin', 'coach', 'manager']),
  analyticsLimiter,
  asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { teamId, playerId, timeframe = '30d' } = req.query;

    const validTypes = ['injury_risk', 'performance_decline', 'match_outcome', 'player_rating'];
    
    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid prediction type. Valid types: ${validTypes.join(', ')}`);
    }

    const result = await apiService.getPredictiveAnalytics(type, {
      teamId,
      playerId,
      timeframe
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

module.exports = router;