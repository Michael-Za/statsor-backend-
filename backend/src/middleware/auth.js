const jwt = require('jsonwebtoken');
const { DatabaseService } = require('../services/database');
const { RedisService } = require('../services/redis');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

// Main authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No authentication token provided'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await RedisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Token has been revoked'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists and is active
    const user = await DatabaseService.findById('players', decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found'
      });
    }

    // Check if user account is active
    if (user.status === 'suspended' || user.status === 'banned') {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Account has been suspended'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      userId: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role || 'user',
      teamId: user.team_id,
      permissions: user.permissions || []
    };

    // Update last activity
    await RedisService.set(
      `user_activity:${user.id}`,
      {
        lastActive: new Date().toISOString(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      },
      3600 // 1 hour
    );

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid authentication token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication token has expired'
      });
    }

    logger.error('Authentication middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : req.cookies?.token;

    if (!token) {
      req.user = null;
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await RedisService.get(`blacklist:${token}`);
    if (isBlacklisted) {
      req.user = null;
      return next();
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user info
    const user = await DatabaseService.findById('players', decoded.userId);
    if (user && user.status !== 'suspended' && user.status !== 'banned') {
      req.user = {
        id: user.id,
        userId: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role || 'user',
        teamId: user.team_id,
        permissions: user.permissions || []
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // If there's an error, just continue without authentication
    req.user = null;
    next();
  }
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Permission-based authorization middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const userPermissions = req.user.permissions || [];
    
    if (!userPermissions.includes(permission) && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access forbidden',
        message: `Permission '${permission}' required`
      });
    }

    next();
  };
};

// Team ownership middleware
const requireTeamOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Authentication required'
      });
    }

    const teamId = req.params.teamId || req.body.teamId;
    
    if (!teamId) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Team ID required'
      });
    }

    // Check if user owns the team or is admin
    if (req.user.role === 'admin') {
      return next();
    }

    const team = await DatabaseService.findById('teams', teamId);
    
    if (!team) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Team not found'
      });
    }

    if (team.owner_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Access forbidden',
        message: 'Team ownership required'
      });
    }

    req.team = team;
    next();
  } catch (error) {
    logger.error('Team ownership middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Authorization failed'
    });
  }
};

// Rate limiting middleware
const rateLimitMiddleware = (windowMs = 60000, maxRequests = 100) => {
  return async (req, res, next) => {
    try {
      const identifier = req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
      const key = `rate_limit:${identifier}`;
      
      const result = await RedisService.incrementRateLimit(
        key,
        Math.floor(windowMs / 1000),
        maxRequests
      );

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      logger.error('Rate limit middleware error:', error);
      // Continue without rate limiting if Redis is down
      next();
    }
  };
};

// API key middleware for external integrations
const apiKeyMiddleware = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'API key required'
      });
    }

    // Check API key in database
    const keyData = await DatabaseService.findMany('api_keys', { key: apiKey, active: true });
    
    if (!keyData || keyData.length === 0) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'Invalid API key'
      });
    }

    const apiKeyRecord = keyData[0];
    
    // Check if API key is expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'API key has expired'
      });
    }

    // Add API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      name: apiKeyRecord.name,
      permissions: apiKeyRecord.permissions || [],
      userId: apiKeyRecord.user_id
    };

    // Update last used timestamp
    await DatabaseService.update('api_keys', apiKeyRecord.id, {
      last_used_at: new Date().toISOString(),
      usage_count: (apiKeyRecord.usage_count || 0) + 1
    });

    next();
  } catch (error) {
    logger.error('API key middleware error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'API key validation failed'
    });
  }
};

// Subscription middleware
const requireSubscription = (requiredPlan = 'basic') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Access denied',
          message: 'Authentication required'
        });
      }

      // Admin users bypass subscription checks
      if (req.user.role === 'admin') {
        return next();
      }

      // Get user's subscription
      const subscriptions = await DatabaseService.findMany('subscriptions', {
        user_id: req.user.userId,
        status: 'active'
      });

      if (!subscriptions || subscriptions.length === 0) {
        return res.status(403).json({
          error: 'Subscription required',
          message: 'Active subscription required to access this feature'
        });
      }

      const subscription = subscriptions[0];
      
      // Check if subscription is expired
      if (subscription.current_period_end && new Date(subscription.current_period_end) < new Date()) {
        return res.status(403).json({
          error: 'Subscription expired',
          message: 'Your subscription has expired. Please renew to continue.'
        });
      }

      // Check plan level
      const planHierarchy = ['free', 'basic', 'premium', 'enterprise'];
      const userPlanLevel = planHierarchy.indexOf(subscription.plan_type);
      const requiredPlanLevel = planHierarchy.indexOf(requiredPlan);

      if (userPlanLevel < requiredPlanLevel) {
        return res.status(403).json({
          error: 'Upgrade required',
          message: `${requiredPlan} subscription or higher required for this feature`
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      logger.error('Subscription middleware error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Subscription validation failed'
      });
    }
  };
};

// JWT token generation helper
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role || 'user'
  };

  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m'
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });

  return { accessToken, refreshToken };
};

// Token blacklisting helper
const blacklistToken = async (token) => {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await RedisService.set(`blacklist:${token}`, true, ttl);
      }
    }
    return true;
  } catch (error) {
    logger.error('Error blacklisting token:', error);
    return false;
  }
};

// For compatibility with the auth routes that expect authenticateToken
const authenticateToken = authMiddleware;

module.exports = {
  authMiddleware,
  authenticateToken,
  optionalAuthMiddleware,
  requireRole,
  requirePermission,
  requireTeamOwnership,
  rateLimitMiddleware,
  apiKeyMiddleware,
  requireSubscription,
  generateTokens,
  blacklistToken
};

module.exports.default = module.exports;