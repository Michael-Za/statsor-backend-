const express = require('express');
const Joi = require('joi');
const multer = require('multer');
const path = require('path');
const rateLimit = require('express-rate-limit');
const { APIService } = require('../services/apiService');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  ConflictError
} = require('../middleware/errorHandler');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const apiService = new APIService();

// Rate limiting for different operations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: { error: 'Too many upload requests, please try again later' }
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 search requests per minute
  message: { error: 'Too many search requests, please try again later' }
});

const batchLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 batch operations per hour
  message: { error: 'Too many batch operations, please try again later' }
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/players/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `player-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images and documents are allowed.'));
    }
  }
});

// Validation schemas
const createPlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().optional(),
    position: Joi.string().valid(
      'goalkeeper', 'right-back', 'left-back', 'center-back', 'sweeper',
      'defensive-midfielder', 'central-midfielder', 'attacking-midfielder',
      'right-midfielder', 'left-midfielder', 'striker', 'center-forward',
      'right-winger', 'left-winger'
    ).required(),
    teamId: Joi.string().uuid().optional(),
    dateOfBirth: Joi.date().max('now').optional(),
    nationality: Joi.string().max(50).optional(),
    height: Joi.number().integer().min(140).max(220).optional(),
    weight: Joi.number().integer().min(40).max(150).optional(),
    preferredFoot: Joi.string().valid('left', 'right', 'both').optional(),
    jerseyNumber: Joi.number().integer().min(1).max(99).optional(),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional(),
      relationship: Joi.string().max(50).optional(),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional()
    }).optional(),
    medicalInfo: Joi.object({
      bloodType: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
      allergies: Joi.array().items(Joi.string().max(100)).optional(),
      medications: Joi.array().items(Joi.string().max(100)).optional(),
      injuries: Joi.array().items(Joi.string().max(200)).optional()
    }).optional(),
    contractInfo: Joi.object({
      startDate: Joi.date().optional(),
      endDate: Joi.date().min(Joi.ref('startDate')).optional(),
      salary: Joi.number().min(0).optional(),
      bonuses: Joi.object().optional()
    }).optional(),
    status: Joi.string().valid('active', 'injured', 'suspended', 'inactive').default('active')
  })
});

const updatePlayerSchema = Joi.object({
  body: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    email: Joi.string().email().optional(),
    position: Joi.string().valid(
      'goalkeeper', 'right-back', 'left-back', 'center-back', 'sweeper',
      'defensive-midfielder', 'central-midfielder', 'attacking-midfielder',
      'right-midfielder', 'left-midfielder', 'striker', 'center-forward',
      'right-winger', 'left-winger'
    ).optional(),
    teamId: Joi.string().uuid().optional().allow(null),
    dateOfBirth: Joi.date().max('now').optional(),
    nationality: Joi.string().max(50).optional(),
    height: Joi.number().integer().min(140).max(220).optional(),
    weight: Joi.number().integer().min(40).max(150).optional(),
    preferredFoot: Joi.string().valid('left', 'right', 'both').optional(),
    jerseyNumber: Joi.number().integer().min(1).max(99).optional().allow(null),
    phoneNumber: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    emergencyContact: Joi.object().optional(),
    medicalInfo: Joi.object().optional(),
    contractInfo: Joi.object().optional(),
    status: Joi.string().valid('active', 'injured', 'suspended', 'inactive').optional()
  })
});

const batchCreateSchema = Joi.object({
  body: Joi.object({
    players: Joi.array().items(Joi.object({
      firstName: Joi.string().min(2).max(50).required(),
      lastName: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().optional(),
      position: Joi.string().required(),
      dateOfBirth: Joi.date().max('now').optional(),
      nationality: Joi.string().max(50).optional(),
      height: Joi.number().integer().min(140).max(220).optional(),
      weight: Joi.number().integer().min(40).max(150).optional(),
      preferredFoot: Joi.string().valid('left', 'right', 'both').optional(),
      jerseyNumber: Joi.number().integer().min(1).max(99).optional()
    })).min(1).max(50).required(),
    teamId: Joi.string().uuid().required(),
    validateEmails: Joi.boolean().default(true),
    validateJerseyNumbers: Joi.boolean().default(true)
  })
});

const advancedSearchSchema = Joi.object({
  body: Joi.object({
    query: Joi.string().min(1).max(100).optional(),
    filters: Joi.object({
      teams: Joi.array().items(Joi.string().uuid()).optional(),
      positions: Joi.array().items(Joi.string()).optional(),
      nationalities: Joi.array().items(Joi.string()).optional(),
      status: Joi.array().items(Joi.string().valid('active', 'injured', 'suspended', 'inactive')).optional(),
      ageRange: Joi.object({
        min: Joi.number().integer().min(16).max(50).optional(),
        max: Joi.number().integer().min(16).max(50).optional()
      }).optional(),
      heightRange: Joi.object({
        min: Joi.number().integer().min(140).max(220).optional(),
        max: Joi.number().integer().min(140).max(220).optional()
      }).optional(),
      weightRange: Joi.object({
        min: Joi.number().integer().min(40).max(150).optional(),
        max: Joi.number().integer().min(40).max(150).optional()
      }).optional(),
      ratingRange: Joi.object({
        min: Joi.number().min(0).max(10).optional(),
        max: Joi.number().min(0).max(10).optional()
      }).optional(),
      contractStatus: Joi.string().valid('active', 'expiring', 'expired').optional(),
      preferredFoot: Joi.array().items(Joi.string().valid('left', 'right', 'both')).optional()
    }).optional(),
    sorting: Joi.object({
      field: Joi.string().valid('firstName', 'lastName', 'position', 'created_at', 'rating', 'goals', 'age').default('created_at'),
      direction: Joi.string().valid('ASC', 'DESC').default('DESC')
    }).optional(),
    pagination: Joi.object({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20)
    }).optional(),
    facets: Joi.array().items(
      Joi.string().valid('positions', 'teams', 'nationalities', 'status', 'ageGroups')
    ).optional()
  })
});

// =====================================
// PLAYER ROUTES
// =====================================

// @route   GET /api/v1/players
// @desc    Get players with advanced filtering and pagination
// @access  Private
router.get('/',
  authenticateToken,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const {
      page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC',
      teamId, position, status, nationality, search,
      minAge, maxAge, minRating, maxRating
    } = req.query;

    const filters = {
      teamId,
      position,
      status,
      nationality,
      search,
      minAge: minAge ? parseInt(minAge) : undefined,
      maxAge: maxAge ? parseInt(maxAge) : undefined,
      minRating: minRating ? parseFloat(minRating) : undefined,
      maxRating: maxRating ? parseFloat(maxRating) : undefined
    };

    const pagination = {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await apiService.getPlayers(filters, pagination);

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

// @route   POST /api/v1/players/search
// @desc    Advanced player search with facets
// @access  Private
router.post('/search',
  authenticateToken,
  searchLimiter,
  validateRequest(advancedSearchSchema),
  asyncHandler(async (req, res) => {
    const searchCriteria = req.body;

    const result = await apiService.advancedPlayerSearch(searchCriteria);

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

// @route   POST /api/v1/players
// @desc    Create new player
// @access  Private (Admin/Coach only)
router.post('/',
  authenticateToken,
  requireRole(['admin', 'coach', 'manager']),
  generalLimiter,
  validateRequest(createPlayerSchema),
  asyncHandler(async (req, res) => {
    const playerData = req.body;
    const createdBy = req.user.id;

    const result = await apiService.createPlayer({ ...playerData, createdBy });

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_EXISTS' ? 409 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    // Invalidate related caches
    await apiService.invalidateCache([
      `players:*`,
      `analytics:*`,
      `teams:${playerData.teamId}:*`
    ]);

    res.status(201).json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   POST /api/v1/players/batch
// @desc    Batch create players
// @access  Private (Admin/Coach only)
router.post('/batch',
  authenticateToken,
  requireRole(['admin', 'coach', 'manager']),
  batchLimiter,
  validateRequest(batchCreateSchema),
  asyncHandler(async (req, res) => {
    const { players, teamId, validateEmails, validateJerseyNumbers } = req.body;
    const createdBy = req.user.id;

    const result = await apiService.batchCreatePlayers(players, teamId, {
      createdBy,
      validateEmails,
      validateJerseyNumbers
    });

    if (!result.success && result.data?.errors?.length === players.length) {
      return res.status(400).json({
        success: false,
        error: 'All players failed to create',
        code: result.code,
        details: result.data.errors
      });
    }

    // Invalidate related caches
    await apiService.invalidateCache([
      `players:*`,
      `analytics:*`,
      `teams:${teamId}:*`
    ]);

    const statusCode = result.success ? 201 : 207; // 207 = Multi-Status
    res.status(statusCode).json({
      success: result.success,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/players/:id
// @desc    Get single player with detailed information
// @access  Private
router.get('/:id',
  authenticateToken,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeStats = true, includeHistory = false } = req.query;

    const result = await apiService.getPlayerById(id, {
      includeStats: includeStats === 'true',
      includeHistory: includeHistory === 'true'
    });

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
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

// @route   PUT /api/v1/players/:id
// @desc    Update player information
// @access  Private (Admin/Coach/Self)
router.put('/:id',
  authenticateToken,
  generalLimiter,
  validateRequest(updatePlayerSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Check authorization
    if (!['admin', 'coach', 'manager'].includes(userRole)) {
      // Players can only update their own profile and limited fields
      const player = await apiService.getPlayerById(id);
      if (!player.success || player.data.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          code: 'FORBIDDEN'
        });
      }

      // Restrict fields for self-update
      const allowedFields = ['phoneNumber', 'emergencyContact', 'medicalInfo'];
      const restrictedUpdate = {};
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          restrictedUpdate[field] = updateData[field];
        }
      });
      
      updateData = restrictedUpdate;
    }

    const result = await apiService.updatePlayer(id, updateData, userId);

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    // Invalidate related caches
    await apiService.invalidateCache([
      `players:${id}:*`,
      `players:*`,
      `analytics:*`
    ]);

    res.json({
      success: true,
      data: result.data,
      message: result.message
    });
  })
);

// @route   DELETE /api/v1/players/:id
// @desc    Delete (soft delete) a player
// @access  Private (Admin only)
router.delete('/:id',
  authenticateToken,
  requireRole(['admin']),
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const deletedBy = req.user.id;

    const result = await apiService.deletePlayer(id, {
      permanent: permanent === 'true',
      deletedBy
    });

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
        success: false,
        error: result.error,
        code: result.code
      });
    }

    // Invalidate related caches
    await apiService.invalidateCache([
      `players:${id}:*`,
      `players:*`,
      `analytics:*`
    ]);

    res.json({
      success: true,
      message: result.message
    });
  })
);

// @route   POST /api/v1/players/:id/upload
// @desc    Upload files for a player (photos, documents)
// @access  Private (Admin/Coach/Self)
router.post('/:id/upload',
  authenticateToken,
  uploadLimiter,
  upload.array('files', 5),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { fileType = 'document' } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!req.files || req.files.length === 0) {
      throw new ValidationError('No files uploaded');
    }

    // Check authorization
    if (!['admin', 'coach', 'manager'].includes(userRole)) {
      const player = await apiService.getPlayerById(id);
      if (!player.success || player.data.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions to upload files for this player',
          code: 'FORBIDDEN'
        });
      }
    }

    const result = await apiService.uploadPlayerFiles(id, req.files, {
      fileType,
      uploadedBy: userId
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

// @route   GET /api/v1/players/:id/statistics
// @desc    Get player performance statistics
// @access  Private
router.get('/:id/statistics',
  authenticateToken,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      season, 
      dateRange = '30d', 
      includeComparisons = false,
      groupBy = 'month' 
    } = req.query;

    const result = await apiService.getPlayerStatistics(id, {
      season,
      dateRange,
      includeComparisons: includeComparisons === 'true',
      groupBy
    });

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
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

// @route   POST /api/v1/players/compare
// @desc    Compare multiple players
// @access  Private
router.post('/compare',
  authenticateToken,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { playerIds, metrics, dateRange, normalize = false } = req.body;

    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
      throw new ValidationError('At least 2 player IDs are required for comparison');
    }

    if (playerIds.length > 10) {
      throw new ValidationError('Maximum 10 players can be compared at once');
    }

    const result = await apiService.comparePlayersPerformance({
      playerIds,
      metrics: metrics || ['goals', 'assists', 'rating', 'matches_played'],
      dateRange: dateRange || '30d',
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

// @route   PUT /api/v1/players/batch
// @desc    Batch update players
// @access  Private (Admin/Coach only)
router.put('/batch',
  authenticateToken,
  requireRole(['admin', 'coach', 'manager']),
  batchLimiter,
  asyncHandler(async (req, res) => {
    const { updates } = req.body;
    const userId = req.user.id;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw new ValidationError('Updates array is required');
    }

    if (updates.length > 50) {
      throw new ValidationError('Maximum 50 players can be updated in one batch');
    }

    const result = await apiService.batchUpdatePlayers(updates, userId);

    // Invalidate related caches
    await apiService.invalidateCache([
      `players:*`,
      `analytics:*`
    ]);

    const statusCode = result.success ? 200 : 207; // 207 = Multi-Status
    res.status(statusCode).json({
      success: result.success,
      data: result.data,
      message: result.message
    });
  })
);

// @route   GET /api/v1/players/:id/matches
// @desc    Get player's match history
// @access  Private
router.get('/:id/matches',
  authenticateToken,
  generalLimiter,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      season, 
      competition, 
      includeStats = true 
    } = req.query;

    const result = await apiService.getPlayerMatches(id, {
      page: parseInt(page),
      limit: parseInt(limit),
      season,
      competition,
      includeStats: includeStats === 'true'
    });

    if (!result.success) {
      const statusCode = result.code === 'PLAYER_NOT_FOUND' ? 404 : 400;
      return res.status(statusCode).json({
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