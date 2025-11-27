const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');
const GroqService = require('../services/groqService');

const router = express.Router();
const groqService = new GroqService();

// @route   POST /api/v1/ai-assistant/chat
// @desc    Send message to AI assistant
// @access  Public (for now - add authenticateToken later)
router.post('/chat', asyncHandler(async (req, res) => {
  const { message, context } = req.body;
  const userId = req.user?.id || 'anonymous';

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  try {
    // Generate response using Groq
    const response = await groqService.generateChatResponse(message, context);

    res.json({
      success: true,
      data: {
        response: response,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate response',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/ai-assistant/analyze-team
// @desc    Analyze team performance
// @access  Private
router.post('/analyze-team', authenticateToken, asyncHandler(async (req, res) => {
  const { teamData } = req.body;

  try {
    const analysis = await groqService.analyzeTeam(teamData);

    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Team analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze team',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/ai-assistant/predict-match
// @desc    Predict match outcome
// @access  Private
router.post('/predict-match', authenticateToken, asyncHandler(async (req, res) => {
  const { matchData } = req.body;

  try {
    const prediction = await groqService.predictMatch(matchData);

    res.json({
      success: true,
      data: prediction
    });
  } catch (error) {
    console.error('Match prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to predict match',
      details: error.message
    });
  }
}));

// @route   POST /api/v1/ai-assistant/training-plan
// @desc    Generate training plan
// @access  Private
router.post('/training-plan', authenticateToken, asyncHandler(async (req, res) => {
  const { teamData, goals } = req.body;

  try {
    const trainingPlan = await groqService.generateTrainingPlan(teamData, goals);

    res.json({
      success: true,
      data: trainingPlan
    });
  } catch (error) {
    console.error('Training plan error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate training plan',
      details: error.message
    });
  }
}));

// @route   GET /api/v1/ai-assistant/status
// @desc    Check AI assistant status
// @access  Public
router.get('/status', asyncHandler(async (req, res) => {
  try {
    const status = await groqService.checkStatus();

    res.json({
      success: true,
      data: {
        status: 'online',
        provider: 'Groq',
        model: status.model,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'AI assistant is offline',
      details: error.message
    });
  }
}));

module.exports = router;
