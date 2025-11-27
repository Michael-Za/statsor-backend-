const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add stack trace for errors
    if (stack) {
      log += `\n${stack}`;
    }
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports = [];

// Console transport (always enabled in development)
if (config.NODE_ENV === 'development' || true) {
  transports.push(
    new winston.transports.Console({
      level: config.LOG_LEVEL,
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );
}

// File transports
if (config.LOG_FILE && config.LOG_FILE !== 'false') {
  // Combined log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'app-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: config.LOG_LEVEL,
      format: fileFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // Error log file with rotation
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.LOG_MAX_SIZE,
      maxFiles: config.LOG_MAX_FILES,
      level: 'error',
      format: fileFormat,
      handleExceptions: true,
      handleRejections: true
    })
  );

  // HTTP access log for production
  if (config.NODE_ENV === 'production') {
    transports.push(
      new DailyRotateFile({
        filename: path.join(logsDir, 'access-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: config.LOG_MAX_SIZE,
        maxFiles: config.LOG_MAX_FILES,
        level: 'http',
        format: fileFormat
      })
    );
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: fileFormat,
  defaultMeta: { 
    service: config.APP_NAME || 'StatSor Backend',
    environment: config.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  },
  transports,
  exitOnError: false
});

// Add custom log levels for HTTP requests
winston.addColors({
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  verbose: 'white',
  debug: 'green',
  silly: 'rainbow'
});

// Helper methods for structured logging
logger.logRequest = (req, res, responseTime) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: `${responseTime}ms`,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    teamId: req.user?.teamId
  };

  if (res.statusCode >= 400) {
    logger.warn('HTTP Request', logData);
  } else {
    logger.http('HTTP Request', logData);
  }
};

logger.logError = (error, context = {}) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    code: error.code,
    ...context
  });
};

logger.logAuth = (action, userId, details = {}) => {
  logger.info(`Auth: ${action}`, {
    userId,
    action,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.logDatabase = (operation, table, details = {}) => {
  logger.debug(`Database: ${operation}`, {
    operation,
    table,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.logPayment = (action, userId, amount, details = {}) => {
  logger.info(`Payment: ${action}`, {
    userId,
    action,
    amount,
    timestamp: new Date().toISOString(),
    ...details
  });
};

logger.logSecurity = (event, details = {}) => {
  logger.warn(`Security: ${event}`, {
    event,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Performance monitoring
logger.logPerformance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString(),
    ...details
  });
};

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Graceful shutdown
logger.close = () => {
  return new Promise((resolve) => {
    logger.end(() => {
      resolve();
    });
  });
};

// Handle uncaught exceptions and unhandled rejections
if (config.config.NODE_ENV === 'production') {
  logger.exceptions.handle(
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.loggingConfig.maxSize,
      maxFiles: config.loggingConfig.maxFiles,
      format: fileFormat
    })
  );

  logger.rejections.handle(
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: config.loggingConfig.maxSize,
      maxFiles: config.loggingConfig.maxFiles,
      format: fileFormat
    })
  );
}

// Log startup information
logger.info('Logger initialized', {
  service: config.APP_NAME || 'StatSor Backend',
  environment: config.NODE_ENV,
  version: process.env.npm_package_version || '1.0.0',
  fileLogging: !!config.LOG_FILE,
  consoleLogging: true
});

module.exports = logger;