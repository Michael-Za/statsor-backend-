const { SecurityService } = require('../services/securityService');
const logger = require('../utils/logger');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

class SecurityMiddleware {
  constructor() {
    this.securityService = new SecurityService();
    this.setupAdvancedRateLimiting();
  }

  // Advanced rate limiting with different tiers
  setupAdvancedRateLimiting() {
    // Strict rate limiting for authentication endpoints
    this.authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 5, // 5 attempts per window
      message: {
        error: 'Too many authentication attempts',
        message: 'Please try again later',
        retryAfter: 900
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: (req) => {
        return this.securityService.getClientIP(req);
      },
      handler: async (req, res, next, options) => {
        const ip = this.securityService.getClientIP(req);
        await this.securityService.logSecurityEvent('RATE_LIMIT_EXCEEDED', {
          ip,
          endpoint: req.originalUrl,
          severity: 'MEDIUM'
        });
        res.status(options.statusCode).json(options.message);
      }
    });

    // General API rate limiting
    this.apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      limit: 100, // 100 requests per window
      message: {
        error: 'Too many requests',
        message: 'Please slow down your requests'
      },
      keyGenerator: (req) => {
        return this.securityService.getClientIP(req);
      }
    });

    // Progressive delay for suspicious activity
    this.speedLimiter = slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per window at full speed
      delayMs: (used, req) => {
        const delayAfter = 50;
        return used > delayAfter ? Math.min((used - delayAfter) * 500, 20000) : 0;
      },
      keyGenerator: (req) => {
        return this.securityService.getClientIP(req);
      }
    });
  }

  // Main security middleware
  securityCheck() {
    return async (req, res, next) => {
      try {
        await this.securityService.threatDetectionMiddleware(req, res, next);
      } catch (error) {
        logger.error('Security check error:', error);
        next();
      }
    };
  }

  // Brute force protection
  bruteForceProtection() {
    return async (req, res, next) => {
      try {
        await this.securityService.bruteForceProtection(req, res, next);
      } catch (error) {
        logger.error('Brute force protection error:', error);
        next();
      }
    };
  }

  // Input sanitization middleware
  inputSanitization() {
    return (req, res, next) => {
      try {
        // Sanitize request body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitize query parameters
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitize URL parameters
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        logger.error('Input sanitization error:', error);
        next();
      }
    };
  }

  // Sanitize object recursively
  sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);
      sanitized[sanitizedKey] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  // Sanitize string values
  sanitizeString(value) {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove potentially dangerous characters
    return value
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .replace(/[<>"']/g, '') // Remove HTML characters
      .trim();
  }

  // SQL injection protection
  sqlInjectionProtection() {
    return (req, res, next) => {
      try {
        const sqlPatterns = [
          /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
          /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
          /(script|javascript|vbscript|onload|onerror|onclick)/i
        ];

        const checkForSQLInjection = (obj, path = '') => {
          if (typeof obj === 'string') {
            for (const pattern of sqlPatterns) {
              if (pattern.test(obj)) {
                const ip = this.securityService.getClientIP(req);
                this.securityService.logSecurityEvent('SQL_INJECTION_ATTEMPT', {
                  ip,
                  path,
                  value: obj,
                  url: req.originalUrl,
                  severity: 'HIGH'
                });
                return true;
              }
            }
          } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
              if (checkForSQLInjection(value, `${path}.${key}`)) {
                return true;
              }
            }
          }
          return false;
        };

        // Check body, query, and params
        const hasInjection = [
          checkForSQLInjection(req.body, 'body'),
          checkForSQLInjection(req.query, 'query'),
          checkForSQLInjection(req.params, 'params')
        ].some(Boolean);

        if (hasInjection) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Invalid request format'
          });
        }

        next();
      } catch (error) {
        logger.error('SQL injection protection error:', error);
        next();
      }
    };
  }

  // XSS protection middleware
  xssProtection() {
    return (req, res, next) => {
      try {
        const xssPatterns = [
          /<script[^>]*>.*?<\/script>/gi,
          /javascript:/gi,
          /on\w+\s*=/gi,
          /<iframe[^>]*>.*?<\/iframe>/gi,
          /<object[^>]*>.*?<\/object>/gi,
          /<embed[^>]*>.*?<\/embed>/gi
        ];

        const checkForXSS = (obj, path = '') => {
          if (typeof obj === 'string') {
            for (const pattern of xssPatterns) {
              if (pattern.test(obj)) {
                const ip = this.securityService.getClientIP(req);
                this.securityService.logSecurityEvent('XSS_ATTEMPT', {
                  ip,
                  path,
                  value: obj,
                  url: req.originalUrl,
                  severity: 'HIGH'
                });
                return true;
              }
            }
          } else if (typeof obj === 'object' && obj !== null) {
            for (const [key, value] of Object.entries(obj)) {
              if (checkForXSS(value, `${path}.${key}`)) {
                return true;
              }
            }
          }
          return false;
        };

        // Check body, query, and params
        const hasXSS = [
          checkForXSS(req.body, 'body'),
          checkForXSS(req.query, 'query'),
          checkForXSS(req.params, 'params')
        ].some(Boolean);

        if (hasXSS) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Invalid request format'
          });
        }

        next();
      } catch (error) {
        logger.error('XSS protection error:', error);
        next();
      }
    };
  }

  // File upload security
  fileUploadSecurity() {
    return (req, res, next) => {
      try {
        if (!req.files && !req.file) {
          return next();
        }

        const files = req.files || [req.file];
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'application/json'
        ];
        const maxSize = 10 * 1024 * 1024; // 10MB
        const dangerousExtensions = [
          '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs',
          '.js', '.jar', '.php', '.asp', '.aspx', '.jsp'
        ];

        for (const file of files) {
          // Check file type
          if (!allowedTypes.includes(file.mimetype)) {
            const ip = this.securityService.getClientIP(req);
            this.securityService.logSecurityEvent('MALICIOUS_FILE_UPLOAD', {
              ip,
              filename: file.originalname,
              mimetype: file.mimetype,
              severity: 'HIGH'
            });
            return res.status(400).json({
              error: 'Upload failed',
              message: 'File format not supported'
            });
          }

          // Check file size
          if (file.size > maxSize) {
            return res.status(400).json({
              error: 'File too large',
              message: 'File size exceeds maximum allowed'
            });
          }

          // Check for dangerous extensions
          const extension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
          if (dangerousExtensions.includes(extension)) {
            const ip = this.securityService.getClientIP(req);
            this.securityService.logSecurityEvent('DANGEROUS_FILE_EXTENSION', {
              ip,
              filename: file.originalname,
              extension,
              severity: 'HIGH'
            });
            return res.status(400).json({
              error: 'Upload failed',
              message: 'File format not supported'
            });
          }
        }

        next();
      } catch (error) {
        logger.error('File upload security error:', error);
        next();
      }
    };
  }

  // Request logging for security analysis
  securityLogging() {
    return (req, res, next) => {
      try {
        const startTime = Date.now();
        const ip = this.securityService.getClientIP(req);
        
        // Log request details
        const requestLog = {
          ip,
          method: req.method,
          url: req.originalUrl,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
          timestamp: new Date().toISOString(),
          userId: req.user?.id || null
        };

        // Override res.end to capture response details
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
          const responseTime = Date.now() - startTime;
          const responseLog = {
            ...requestLog,
            statusCode: res.statusCode,
            responseTime,
            contentLength: res.get('Content-Length') || 0
          };

          // Log suspicious responses
          if (res.statusCode >= 400 || responseTime > 5000) {
            logger.warn('Suspicious response', responseLog);
          }

          originalEnd.call(this, chunk, encoding);
        };

        next();
      } catch (error) {
        logger.error('Security logging error:', error);
        next();
      }
    };
  }

  // Enhanced CORS with security checks
  enhancedCORS() {
    return (req, res, next) => {
      try {
        const origin = req.get('Origin');
        const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
        
        // Check for suspicious origins
        if (origin && !allowedOrigins.includes(origin)) {
          const ip = this.securityService.getClientIP(req);
          this.securityService.logSecurityEvent('SUSPICIOUS_ORIGIN', {
            ip,
            origin,
            url: req.originalUrl,
            severity: 'MEDIUM'
          });
        }

        // Set minimal security headers (invisible to users)
        res.set({
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        });
        
        // Remove server information (stay invisible)
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');
        res.removeHeader('X-Security-System'); // Remove any security indicators

        next();
      } catch (error) {
        logger.error('Enhanced CORS error:', error);
        next();
      }
    };
  }

  // Get rate limiters
  getAuthLimiter() {
    return this.authLimiter;
  }

  getApiLimiter() {
    return this.apiLimiter;
  }

  getSpeedLimiter() {
    return this.speedLimiter;
  }
}

// Export singleton instance
const securityMiddleware = new SecurityMiddleware();

module.exports = {
  SecurityMiddleware,
  securityMiddleware,
  // Export individual middleware functions
  securityCheck: securityMiddleware.securityCheck(),
  bruteForceProtection: securityMiddleware.bruteForceProtection(),
  inputSanitization: securityMiddleware.inputSanitization(),
  sqlInjectionProtection: securityMiddleware.sqlInjectionProtection(),
  xssProtection: securityMiddleware.xssProtection(),
  fileUploadSecurity: securityMiddleware.fileUploadSecurity(),
  securityLogging: securityMiddleware.securityLogging(),
  enhancedCORS: securityMiddleware.enhancedCORS(),
  authLimiter: securityMiddleware.getAuthLimiter(),
  apiLimiter: securityMiddleware.getApiLimiter(),
  speedLimiter: securityMiddleware.getSpeedLimiter()
};