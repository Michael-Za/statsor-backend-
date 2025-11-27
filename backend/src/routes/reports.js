const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database');
const SecurityService = require('../services/securityService');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { MatchReportService } = require('../services/matchReportService.js');
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
const matchReportService = require('../services/matchReportService');

// Validation schemas
const sendMatchReportSchema = Joi.object({
  body: Joi.object({
    matchId: Joi.string().uuid().required()
  })
});

const bulkReportSchema = Joi.object({
  body: Joi.object({
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().optional(),
    teamId: Joi.string().uuid().optional(),
    status: Joi.string().valid('finished').default('finished')
  })
});

// @route   POST /api/reports/match
// @desc    Send match report for a specific match
// @access  Private (Manager/Admin)
router.post('/match',
  authenticateToken,
  requireRole(['manager', 'admin']),
  validateRequest(sendMatchReportSchema),
  asyncHandler(async (req, res) => {
    const { matchId } = req.body;

    // Verify match exists and is finished
    const match = await db.findById('matches', matchId);
    if (!match) {
      throw new NotFoundError('Match not found');
    }

    if (match.status !== 'finished') {
      throw new ValidationError('Can only send reports for finished matches');
    }

    try {
      const result = await matchReportService.sendMatchReports(matchId);
      
      res.json({
        message: 'Match reports sent successfully',
        matchId,
        emailsSent: result.emailsSent,
        details: result.details
      });
    } catch (error) {
      console.error('Failed to send match reports:', error);
      res.status(500).json({
        message: 'Failed to send match reports',
        error: error.message
      });
    }
  })
);

// @route   POST /api/reports/bulk
// @desc    Send match reports for multiple matches
// @access  Private (Admin)
router.post('/bulk',
  authenticateToken,
  requireRole(['admin']),
  validateRequest(bulkReportSchema),
  asyncHandler(async (req, res) => {
    const { dateFrom, dateTo, teamId, status } = req.body;

    let whereClause = 'WHERE m.status = $1';
    let params = [status];
    let paramCount = 1;

    if (dateFrom) {
      whereClause += ` AND m.date >= $${++paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND m.date <= $${++paramCount}`;
      params.push(dateTo);
    }

    if (teamId) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(teamId);
    }

    const matches = await db.query(`
      SELECT m.id, m.date, ht.name as home_team, at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${whereClause}
      ORDER BY m.date DESC
    `, params);

    if (matches.length === 0) {
      return res.json({
        message: 'No matches found matching the criteria',
        matchesProcessed: 0
      });
    }

    const results = [];
    let totalEmailsSent = 0;

    for (const match of matches) {
      try {
        const result = await matchReportService.sendMatchReports(match.id);
        results.push({
          matchId: match.id,
          matchInfo: `${match.home_team} vs ${match.away_team}`,
          date: match.date,
          success: true,
          emailsSent: result.emailsSent
        });
        totalEmailsSent += result.emailsSent;
      } catch (error) {
        console.error(`Failed to send reports for match ${match.id}:`, error);
        results.push({
          matchId: match.id,
          matchInfo: `${match.home_team} vs ${match.away_team}`,
          date: match.date,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      message: 'Bulk match report processing completed',
      matchesProcessed: matches.length,
      totalEmailsSent,
      results
    });
  })
);

// @route   GET /api/reports/stats
// @desc    Get match report statistics
// @access  Private (Manager/Admin)
router.get('/stats',
  authenticateToken,
  requireRole(['manager', 'admin']),
  asyncHandler(async (req, res) => {
    const { teamId, dateFrom, dateTo } = req.query;

    let whereClause = 'WHERE m.status = \'finished\'';
    let params = [];
    let paramCount = 0;

    if (teamId) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(teamId);
    }

    if (dateFrom) {
      whereClause += ` AND m.date >= $${++paramCount}`;
      params.push(dateFrom);
    }

    if (dateTo) {
      whereClause += ` AND m.date <= $${++paramCount}`;
      params.push(dateTo);
    }

    // Role-based filtering
    if (req.user.role === 'coach' && req.user.team_id) {
      whereClause += ` AND (m.home_team_id = $${++paramCount} OR m.away_team_id = $${paramCount})`;
      params.push(req.user.team_id);
    }

    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_finished_matches,
        COUNT(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as matches_last_7_days,
        COUNT(CASE WHEN m.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as matches_last_30_days,
        AVG(m.home_score + m.away_score) as avg_total_goals
      FROM matches m
      ${whereClause}
    `, params);

    const recentMatches = await db.query(`
      SELECT 
        m.id,
        m.date,
        m.home_score,
        m.away_score,
        ht.name as home_team,
        at.name as away_team
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      ${whereClause}
      ORDER BY m.date DESC
      LIMIT 10
    `, params);

    res.json({
      statistics: stats[0],
      recentMatches
    });
  })
);

// @route   GET /api/reports/test-email
// @desc    Test email service configuration
// @access  Private (Admin)
router.get('/test-email',
  authenticateToken,
  requireRole(['admin']),
  asyncHandler(async (req, res) => {
    try {
      const testResult = await matchReportService.testEmailService();
      res.json({
        message: 'Email service test completed',
        result: testResult
      });
    } catch (error) {
      console.error('Email service test failed:', error);
      res.status(500).json({
        message: 'Email service test failed',
        error: error.message
      });
    }
  })
);

module.exports = router;