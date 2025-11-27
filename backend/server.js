import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Socket.io
import { Server as SocketIOServer } from 'socket.io';

// Import configuration and services
import { config } from './config/env.js';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import SocketService from './services/socket.js';

// Simple logger to avoid circular dependency
const logger = {
  info: (msg) => console.log(`[SERVER INFO] ${msg}`),
  warn: (msg) => console.warn(`[SERVER WARN] ${msg}`),
  error: (msg) => console.error(`[SERVER ERROR] ${msg}`)
};

import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import teamsRoutes from './routes/teams.js';
import playersRoutes from './routes/players.js';
import matchesRoutes from './routes/matches.js';
import analyticsRoutes from './routes/analytics.js';
import trainingRoutes from './routes/training.js';
import chatRoutes from './routes/chat.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import reportsRoutes from './routes/reports.js';
import aiChatRoutes from './routes/aiChat.js';
import aiChatProxyRoutes from './src/routes/aiChatProxy.js';
import aiAssistantRoutes from './src/routes/aiAssistant.js';

// Import security middleware (silent background protection)
import { securityCheck, inputSanitization, sqlInjectionProtection } from './middleware/security.js';
// Initialize background security monitor (completely invisible)
import './services/backgroundSecurity.js';

class Server {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = config.PORT;
    this.socketService = null;
    
    // Remove initialization from constructor - will be done in initialize() method
  }

  async initialize() {
    try {
      // Initialize external services
      logger.info('Step 1: Initializing services...');
      await this.initializeServices();
      
      // Configure middleware
      logger.info('Step 2: Configuring middleware...');
      this.configureMiddleware();
      
      // Setup routes
      logger.info('Step 3: Setting up routes...');
      this.setupRoutes();
      
      // Setup error handling
      logger.info('Step 4: Setting up error handling...');
      this.setupErrorHandling();
      
      // Initialize Socket.io
      logger.info('Step 5: Initializing Socket.io...');
      this.initializeSocket();
      
      logger.info('Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize server:', error.message);
      throw error;
    }
  }

  async initializeServices() {
    // Initialize database (optional)
    logger.info('Initializing database connection...');
    try {
      await initializeDatabase();
      logger.info('Database connected successfully');
    } catch (dbError) {
      logger.warn('Database connection failed, continuing without database:', dbError.message);
    }

    // Initialize Redis (optional)
    logger.info('Initializing Redis connection...');
    try {
      const redisResult = await initializeRedis();
      if (redisResult && redisResult.connected) {
        logger.info('Redis connected successfully');
      } else {
        logger.warn('Redis initialization completed but not connected - running without Redis');
      }
    } catch (redisError) {
      logger.warn('Redis connection failed, continuing without Redis:', redisError.message);
    }
  }

  configureMiddleware() {
    try {
      // Security middleware
      this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "ws:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration - allow common development ports
    const defaultOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3006',
      'http://localhost:3008',
      'http://localhost:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3006',
      'http://127.0.0.1:3008',
      'http://127.0.0.1:5173'
    ];
    
    const corsOptions = {
      origin: config.CORS_ORIGIN === '*' 
        ? true 
        : (config.CORS_ORIGIN 
          ? config.CORS_ORIGIN.split(',').map(o => o.trim())
          : defaultOrigins),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
      exposedHeaders: ['X-Total-Count', 'X-Page-Count']
    };
    this.app.use(cors(corsOptions));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: config.UPLOAD_MAX_SIZE }));
    this.app.use(express.urlencoded({ extended: true, limit: config.UPLOAD_MAX_SIZE }));

    // Security middleware (integrated threat detection)
    this.app.use(inputSanitization);
    this.app.use(sqlInjectionProtection);
    this.app.use(securityCheck);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.RATE_LIMIT_WINDOW_MS,
      max: config.RATE_LIMIT_MAX_REQUESTS,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(config.RATE_LIMIT_WINDOW_MS / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
          method: req.method,
          url: req.originalUrl,
          status: res.statusCode,
          duration,
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      });
      next();
    });

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
      });
    });
    } catch (error) {
      logger.error('Error configuring middleware:', error.message);
      logger.error('Stack trace:', error.stack);
      console.error('Full error object:', error);
      throw error;
    }
  }

  setupRoutes() {
    try {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // Database health check
    this.app.get('/health/db', async (req, res) => {
      try {
        const { supabase } = await import('./config/database.js');
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (error) throw error;
        
        res.json({ status: 'OK', database: 'connected' });
      } catch (error) {
        logger.error('Database health check failed:', error);
        res.status(503).json({ status: 'ERROR', database: 'disconnected', error: error.message });
      }
    });

    // Redis health check
    this.app.get('/health/redis', async (req, res) => {
      try {
        const RedisService = await import('./services/redis.js');
        await RedisService.default.ping();
        res.json({ status: 'OK', redis: 'connected' });
      } catch (error) {
        logger.error('Redis health check failed:', error);
        res.status(503).json({ status: 'ERROR', redis: 'disconnected', error: error.message });
      }
    });

    // API routes
    const apiRouter = express.Router();
    
    // Health check endpoint for Railway
    apiRouter.get('/health', (req, res) => {
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0'
      });
    });
    
    // Mount route modules
    apiRouter.use('/auth', authRoutes);
    apiRouter.use('/teams', teamsRoutes);
    apiRouter.use('/players', playersRoutes);
    apiRouter.use('/players-enhanced', require('./routes/playersEnhanced.js')); // Enhanced player routes
    apiRouter.use('/matches', matchesRoutes);
    apiRouter.use('/analytics', analyticsRoutes);
    apiRouter.use('/analytics-enhanced', require('./routes/analyticsEnhanced.js')); // Enhanced analytics routes
    apiRouter.use('/training', trainingRoutes);
    apiRouter.use('/chat', chatRoutes);
    apiRouter.use('/subscriptions', subscriptionsRoutes);
    apiRouter.use('/reports', reportsRoutes);
    apiRouter.use('/aichat', aiChatRoutes);
    apiRouter.use('/ai-proxy', aiChatProxyRoutes);
    apiRouter.use('/ai-assistant', aiAssistantRoutes);

    // Mount API router
    this.app.use('/api/v1', apiRouter);

    // API documentation route
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'StatSor API Documentation',
        version: '1.0.0',
        description: 'Football Management Platform API',
        baseUrl: `/api/v1`,
        endpoints: {
          authentication: {
            'POST /auth/register': 'User registration',
            'POST /auth/login': 'User login',
            'POST /auth/refresh': 'Refresh JWT token',
            'POST /auth/logout': 'User logout',
            'POST /auth/forgot-password': 'Password reset request',
            'POST /auth/reset-password': 'Password reset confirmation',
            'GET /auth/google': 'Google OAuth login',
            'GET /auth/google/callback': 'Google OAuth callback'
          },
          teams: {
            'GET /teams': 'List teams with filtering and pagination',
            'POST /teams': 'Create new team',
            'GET /teams/:id': 'Get team details with players',
            'PUT /teams/:id': 'Update team information',
            'DELETE /teams/:id': 'Delete team (if no active players)',
            'GET /teams/:id/statistics': 'Get team performance statistics'
          },
          players: {
            'GET /players': 'List players with advanced filtering',
            'POST /players': 'Create player',
            'GET /players/:id': 'Get player details',
            'PUT /players/:id': 'Update player',
            'DELETE /players/:id': 'Delete player',
            'POST /players/search': 'Advanced player search with facets',
            'POST /players/batch': 'Batch create players',
            'PUT /players/batch': 'Batch update players',
            'POST /players/compare': 'Compare multiple players',
            'POST /players/:id/upload': 'Upload player files',
            'GET /players/:id/statistics': 'Get player performance statistics',
            'GET /players/:id/matches': 'Get player match history'
          },
          matches: {
            'GET /matches': 'List matches',
            'POST /matches': 'Create match',
            'GET /matches/:id': 'Get match details',
            'PUT /matches/:id': 'Update match',
            'POST /matches/:id/events': 'Add match event'
          },
          analytics: {
            'GET /analytics/overview': 'Dashboard analytics',
            'GET /analytics/players/:id': 'Player performance',
            'GET /analytics/teams/:id': 'Team statistics',
            'GET /analytics/dashboard': 'Comprehensive dashboard analytics',
            'GET /analytics/real-time/:teamId': 'Real-time analytics stream (SSE)',
            'POST /analytics/custom-report': 'Generate custom analytics report',
            'GET /analytics/reports': 'Get user custom reports',
            'GET /analytics/reports/:reportId': 'Get specific report data',
            'DELETE /analytics/reports/:reportId': 'Delete custom report',
            'GET /analytics/performance-trends': 'Get performance trends analysis',
            'GET /analytics/heatmaps/:matchId': 'Get match heatmap data',
            'POST /analytics/compare-players': 'Compare multiple players performance',
            'GET /analytics/predictive/:type': 'Get predictive analytics'
          },
          training: {
            'GET /training': 'List training sessions',
            'POST /training': 'Create training session',
            'PUT /training/:id': 'Update training session'
          },
          chat: {
            'GET /chat/channels': 'List chat channels',
            'POST /chat/channels': 'Create chat channel',
            'GET /chat/messages/:channelId': 'Get messages',
            'POST /chat/messages': 'Send message'
          },
          subscriptions: {
            'GET /subscriptions/plans': 'List subscription plans',
            'POST /subscriptions': 'Create subscription',
            'PUT /subscriptions/:id': 'Update subscription'
          },
          reports: {
            'POST /reports/match': 'Send match report for specific match',
            'POST /reports/bulk': 'Send match reports for multiple matches',
            'GET /reports/stats': 'Get match report statistics',
            'GET /reports/test-email': 'Test email service configuration'
          }
        }
      });
    });

    // Catch-all route for undefined endpoints
    this.app.use('*', (req, res) => {
      res.status(404).json({
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.method} ${req.originalUrl} was not found.`,
        availableEndpoints: '/api/docs'
      });
    });
    } catch (error) {
      logger.error('Error setting up routes:', error.message);
      logger.error('Stack trace:', error.stack);
      console.error('Full error object:', error);
      throw error;
    }
  }

  setupErrorHandling() {
    try {
      // Global error handler
      this.app.use(errorHandler);

      // Unhandled promise rejections
      process.on('unhandledRejection', (reason, promise) => {
        logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        // Close server gracefully
        this.gracefulShutdown('UNHANDLED_REJECTION');
      });

      // Uncaught exceptions
      process.on('uncaughtException', (error) => {
        logger.error('Uncaught Exception:', error);
        // Close server gracefully
        this.gracefulShutdown('UNCAUGHT_EXCEPTION');
      });

      // Graceful shutdown signals
      process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
      
      logger.info('Error handling setup completed successfully');
    } catch (error) {
      logger.error('Error setting up error handling:', error.message);
      logger.error('Stack trace:', error.stack);
      console.error('Full error object:', error);
      throw error;
    }
  }

  initializeSocket() {
    try {
      console.log('[DEBUG] Starting Socket.io initialization...');
      console.log('[DEBUG] Creating SocketIOServer instance...');
      
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: config.CORS_ORIGIN === '*' ? true : (config.CORS_ORIGIN ? config.CORS_ORIGIN.split(',') : ['http://localhost:3006']),
          credentials: true
        }
      });
      
      console.log('[DEBUG] SocketIOServer created successfully');
      console.log('[DEBUG] Using SocketService instance...');
      
      this.socketService = SocketService;
      
      console.log('[DEBUG] SocketService instance obtained, initializing...');
      this.socketService.initialize(this.io);
      
      console.log('[DEBUG] Socket.io initialization completed');
      logger.info('Socket.io initialized successfully');
    } catch (error) {
      console.error('[DEBUG] Socket.io initialization error:', error);
      console.error('[DEBUG] Error name:', error.name);
      console.error('[DEBUG] Error message:', error.message);
      console.error('[DEBUG] Error stack:', error.stack);
      console.error('[DEBUG] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      logger.error('Error initializing Socket.io:', error.message || 'Unknown error');
      logger.error('Stack trace:', error.stack || 'No stack trace available');
      throw error;
    }
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    this.server.close(async () => {
      logger.info('HTTP server closed');
      
      try {
        // Close Socket.io connections
        if (this.socketService) {
          await this.socketService.close();
          logger.info('Socket.io connections closed');
        }

        // Close Redis connections
        const RedisService = await import('./services/redis.js');
        await RedisService.default.disconnect();
        logger.info('Redis connections closed');

        // Close database connections
        const { closeDatabase } = await import('./config/database.js');
        await closeDatabase();
        logger.info('Database connections closed');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after timeout
    setTimeout(() => {
      logger.error('Graceful shutdown timeout. Forcing exit...');
      process.exit(1);
    }, 30000); // 30 seconds timeout
  }

  async start() {
    try {
      await this.initialize();
      
      this.server.listen(this.port, () => {
        logger.info(`🚀 Server running on port ${this.port}`);
        logger.info(`📚 API Documentation: http://localhost:${this.port}/api/docs`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
        logger.info(`🌍 Environment: ${config.NODE_ENV}`);
        
        if (config.NODE_ENV === 'development') {
          logger.info(`🔧 Development mode - Hot reload enabled`);
        }
      });
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }
}

// Start the server
// Create and start server
const server = new Server();

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  server.start().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}

export default server;