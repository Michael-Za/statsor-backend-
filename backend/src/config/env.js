const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Environment validation
const requiredEnvVars = [
  'NODE_ENV',
  'PORT',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.warn('Missing required environment variables:', missingEnvVars);
  console.warn('Server will continue with default values where possible.');
  // Only exit in production if critical variables are missing
  if (process.env.NODE_ENV === 'production') {
    console.warn('Consider setting these variables for production use.');
  }
}

// Environment configuration
const config = {
  // Application
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 3001,
  API_VERSION: process.env.API_VERSION || 'v1',
  APP_NAME: process.env.APP_NAME || 'StatSor Backend',
  APP_URL: process.env.APP_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3006',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3006', 'http://localhost:3001'],

  // Database - Supabase
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  
  // Database - PostgreSQL (if using direct connection)
  DATABASE_URL: process.env.DATABASE_URL,
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT) || 5432,
  DB_NAME: process.env.DB_NAME || 'statsor',
  DB_USER: process.env.DB_USER || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_SSL: process.env.DB_SSL === 'true',
  DB_POOL_MIN: parseInt(process.env.DB_POOL_MIN) || 2,
  DB_POOL_MAX: parseInt(process.env.DB_POOL_MAX) || 10,
  DB_POOL_IDLE_TIMEOUT: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
  DB_POOL_ACQUIRE_TIMEOUT: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT) || 60000,

  // Redis
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : undefined,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_DB: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : undefined,
  REDIS_URL: process.env.REDIS_URL,
  
  // Upstash Redis
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  JWT_ISSUER: process.env.JWT_ISSUER || 'statsor-backend',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'statsor-app',

  // Google OAuth
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3003/api/v1/auth/google/callback',

  // Email Service (SendGrid, Nodemailer, etc.)
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'sendgrid', // 'sendgrid', 'smtp', 'ses'
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@statsor.com',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'StatSor',
  
  // SendGrid
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  
  // SMTP
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  
  // AWS SES
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_SES_REGION: process.env.AWS_SES_REGION || 'us-east-1',

  // File Upload (AWS S3, Cloudinary, etc.)
  UPLOAD_SERVICE: process.env.UPLOAD_SERVICE || 's3', // 's3', 'cloudinary', 'local'
  UPLOAD_MAX_SIZE: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760, // 10MB
  UPLOAD_ALLOWED_TYPES: process.env.UPLOAD_ALLOWED_TYPES ? process.env.UPLOAD_ALLOWED_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  
  // AWS S3
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_S3_REGION: process.env.AWS_S3_REGION || 'us-east-1',
  AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID,
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY,
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  // Payment Processing
  // Stripe
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PRICE_BASIC: process.env.STRIPE_PRICE_BASIC,
  STRIPE_PRICE_PRO: process.env.STRIPE_PRICE_PRO,
  STRIPE_PRICE_ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
  
  // PayPal
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
  PAYPAL_MODE: process.env.PAYPAL_MODE || 'sandbox', // 'sandbox' or 'live'
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID,

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS: process.env.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS === 'true',
  RATE_LIMIT_SKIP_FAILED_REQUESTS: process.env.RATE_LIMIT_SKIP_FAILED_REQUESTS === 'false',

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  HELMET_CSP: process.env.HELMET_CSP === 'true',
  TRUST_PROXY: process.env.TRUST_PROXY === 'true',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  LOG_FILE: process.env.LOG_FILE || 'logs/app.log',
  LOG_ERROR_FILE: process.env.LOG_ERROR_FILE || 'logs/error.log',
  LOG_MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
  LOG_MAX_FILES: process.env.LOG_MAX_FILES || '14d',

  // Monitoring & Analytics
  SENTRY_DSN: process.env.SENTRY_DSN,
  GOOGLE_ANALYTICS_ID: process.env.GOOGLE_ANALYTICS_ID,
  MIXPANEL_TOKEN: process.env.MIXPANEL_TOKEN,

  // External APIs
  FOOTBALL_API_KEY: process.env.FOOTBALL_API_KEY,
  WEATHER_API_KEY: process.env.WEATHER_API_KEY,
  MAPS_API_KEY: process.env.MAPS_API_KEY,
  
  // AI Assistant Backend
  AI_ASSISTANT_BACKEND_URL: process.env.AI_ASSISTANT_BACKEND_URL || 'http://localhost:5000',

  // WebSocket
  SOCKET_IO_CORS_ORIGIN: process.env.SOCKET_IO_CORS_ORIGIN || 'http://localhost:3000',
  SOCKET_IO_TRANSPORTS: process.env.SOCKET_IO_TRANSPORTS ? process.env.SOCKET_IO_TRANSPORTS.split(',') : ['websocket', 'polling'],

  // Cache
  CACHE_TTL_SHORT: parseInt(process.env.CACHE_TTL_SHORT) || 300, // 5 minutes
  CACHE_TTL_MEDIUM: parseInt(process.env.CACHE_TTL_MEDIUM) || 1800, // 30 minutes
  CACHE_TTL_LONG: parseInt(process.env.CACHE_TTL_LONG) || 3600, // 1 hour

  // Feature Flags
  ENABLE_REGISTRATION: process.env.ENABLE_REGISTRATION !== 'false',
  ENABLE_EMAIL_VERIFICATION: process.env.ENABLE_EMAIL_VERIFICATION === 'true',
  ENABLE_PASSWORD_RESET: process.env.ENABLE_PASSWORD_RESET !== 'false',
  ENABLE_SOCIAL_LOGIN: process.env.ENABLE_SOCIAL_LOGIN === 'true',
  ENABLE_SUBSCRIPTIONS: process.env.ENABLE_SUBSCRIPTIONS === 'true',
  ENABLE_CHAT: process.env.ENABLE_CHAT === 'true',
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_FILE_UPLOAD: process.env.ENABLE_FILE_UPLOAD === 'true',

  // Development
  DEBUG: process.env.DEBUG === 'true',
  MOCK_EXTERNAL_APIS: process.env.MOCK_EXTERNAL_APIS === 'true',
  SEED_DATABASE: process.env.SEED_DATABASE === 'true',

  // Health Check
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 30000, // 30 seconds
  HEALTH_CHECK_TIMEOUT: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000, // 5 seconds

  // API Documentation
  SWAGGER_ENABLED: process.env.SWAGGER_ENABLED !== 'false',
  SWAGGER_PATH: process.env.SWAGGER_PATH || '/api-docs',

  // Backup
  BACKUP_ENABLED: process.env.BACKUP_ENABLED === 'true',
  BACKUP_INTERVAL: process.env.BACKUP_INTERVAL || '0 2 * * *', // Daily at 2 AM
  BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,

  // Maintenance
  MAINTENANCE_MODE: process.env.MAINTENANCE_MODE === 'true',
  MAINTENANCE_MESSAGE: process.env.MAINTENANCE_MESSAGE || 'System is under maintenance. Please try again later.',

  // Performance
  CLUSTER_WORKERS: parseInt(process.env.CLUSTER_WORKERS) || 0, // 0 = auto (number of CPUs)
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 30000, // 30 seconds
  KEEP_ALIVE_TIMEOUT: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 5000, // 5 seconds

  // Validation
  VALIDATION_ABORT_EARLY: process.env.VALIDATION_ABORT_EARLY !== 'false',
  VALIDATION_ALLOW_UNKNOWN: process.env.VALIDATION_ALLOW_UNKNOWN === 'true',
  VALIDATION_STRIP_UNKNOWN: process.env.VALIDATION_STRIP_UNKNOWN === 'true'
};

// Environment-specific configurations
const isDevelopment = config.NODE_ENV === 'development';
const isProduction = config.NODE_ENV === 'production';
const isTest = config.NODE_ENV === 'test';

// Database configuration object
const dbConfig = {
  supabase: {
    url: config.SUPABASE_URL,
    anonKey: config.SUPABASE_ANON_KEY,
    serviceRoleKey: config.SUPABASE_SERVICE_ROLE_KEY
  },
  postgres: {
    host: config.DB_HOST,
    port: config.DB_PORT,
    database: config.DB_NAME,
    user: config.DB_USER,
    password: config.DB_PASSWORD,
    ssl: config.DB_SSL,
    pool: {
      min: config.DB_POOL_MIN,
      max: config.DB_POOL_MAX,
      idleTimeoutMillis: config.DB_POOL_IDLE_TIMEOUT,
      acquireTimeoutMillis: config.DB_POOL_ACQUIRE_TIMEOUT
    }
  }
};

// Redis configuration object
const redisConfig = {
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  url: config.REDIS_URL,
  upstash: {
    restUrl: config.UPSTASH_REDIS_REST_URL,
    restToken: config.UPSTASH_REDIS_REST_TOKEN
  }
};

// JWT configuration object
const jwtConfig = {
  secret: config.JWT_SECRET,
  refreshSecret: config.JWT_REFRESH_SECRET,
  expiresIn: config.JWT_EXPIRES_IN,
  refreshExpiresIn: config.JWT_REFRESH_EXPIRES_IN,
  issuer: config.JWT_ISSUER,
  audience: config.JWT_AUDIENCE
};

// Email configuration object
const emailConfig = {
  service: config.EMAIL_SERVICE,
  from: config.EMAIL_FROM,
  fromName: config.EMAIL_FROM_NAME,
  sendgrid: {
    apiKey: config.SENDGRID_API_KEY
  },
  smtp: {
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASS
    }
  },
  ses: {
    region: config.AWS_SES_REGION,
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY
  }
};

// Upload configuration object
const uploadConfig = {
  service: config.UPLOAD_SERVICE,
  maxSize: config.UPLOAD_MAX_SIZE,
  allowedTypes: config.UPLOAD_ALLOWED_TYPES,
  s3: {
    bucket: config.AWS_S3_BUCKET,
    region: config.AWS_S3_REGION,
    accessKeyId: config.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_S3_SECRET_ACCESS_KEY
  },
  cloudinary: {
    cloudName: config.CLOUDINARY_CLOUD_NAME,
    apiKey: config.CLOUDINARY_API_KEY,
    apiSecret: config.CLOUDINARY_API_SECRET
  }
};

// Payment configuration object
const paymentConfig = {
  stripe: {
    publishableKey: config.STRIPE_PUBLISHABLE_KEY,
    secretKey: config.STRIPE_SECRET_KEY,
    webhookSecret: config.STRIPE_WEBHOOK_SECRET,
    prices: {
      basic: config.STRIPE_PRICE_BASIC,
      pro: config.STRIPE_PRICE_PRO,
      enterprise: config.STRIPE_PRICE_ENTERPRISE
    }
  },
  paypal: {
    clientId: config.PAYPAL_CLIENT_ID,
    clientSecret: config.PAYPAL_CLIENT_SECRET,
    mode: config.PAYPAL_MODE,
    webhookId: config.PAYPAL_WEBHOOK_ID
  }
};

// OAuth configuration object
const oauthConfig = {
  google: {
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    callbackURL: config.GOOGLE_CALLBACK_URL
  }
};

// Rate limiting configuration object
const rateLimitConfig = {
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  skipSuccessfulRequests: config.RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS,
  skipFailedRequests: config.RATE_LIMIT_SKIP_FAILED_REQUESTS
};

// Logging configuration object
const loggingConfig = {
  level: config.LOG_LEVEL,
  format: config.LOG_FORMAT,
  file: config.LOG_FILE,
  errorFile: config.LOG_ERROR_FILE,
  maxSize: config.LOG_MAX_SIZE,
  maxFiles: config.LOG_MAX_FILES
};

// Validation helper
const validateConfig = () => {
  const errors = [];

  // Check required environment variables
  if (missingEnvVars.length > 0) {
    errors.push(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  }

  // Validate JWT secrets
  if (config.JWT_SECRET && config.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET should be at least 32 characters long');
  }

  if (config.JWT_REFRESH_SECRET && config.JWT_REFRESH_SECRET.length < 32) {
    errors.push('JWT_REFRESH_SECRET should be at least 32 characters long');
  }

  // Validate database configuration
  if (!config.SUPABASE_URL && !config.DATABASE_URL && !config.DB_HOST) {
    errors.push('Either SUPABASE_URL, DATABASE_URL, or DB_HOST must be provided');
  }

  // Validate email configuration
  if (config.EMAIL_SERVICE === 'sendgrid' && !config.SENDGRID_API_KEY) {
    errors.push('SENDGRID_API_KEY is required when using SendGrid email service');
  }

  if (config.EMAIL_SERVICE === 'smtp' && (!config.SMTP_HOST || !config.SMTP_USER || !config.SMTP_PASS)) {
    errors.push('SMTP_HOST, SMTP_USER, and SMTP_PASS are required when using SMTP email service');
  }

  // Validate upload configuration
  if (config.UPLOAD_SERVICE === 's3' && (!config.AWS_S3_BUCKET || !config.AWS_S3_ACCESS_KEY_ID || !config.AWS_S3_SECRET_ACCESS_KEY)) {
    errors.push('AWS S3 configuration is incomplete');
  }

  if (config.UPLOAD_SERVICE === 'cloudinary' && (!config.CLOUDINARY_CLOUD_NAME || !config.CLOUDINARY_API_KEY || !config.CLOUDINARY_API_SECRET)) {
    errors.push('Cloudinary configuration is incomplete');
  }

  // Validate payment configuration
  if (config.ENABLE_SUBSCRIPTIONS) {
    if (!config.STRIPE_SECRET_KEY && !config.PAYPAL_CLIENT_SECRET) {
      errors.push('At least one payment provider (Stripe or PayPal) must be configured when subscriptions are enabled');
    }
  }

  // Validate OAuth configuration
  if (config.ENABLE_SOCIAL_LOGIN && (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET)) {
    errors.push('Google OAuth configuration is incomplete when social login is enabled');
  }

  return errors;
};

// Configuration summary for debugging
const getConfigSummary = () => {
  return {
    environment: config.NODE_ENV,
    port: config.PORT,
    database: config.SUPABASE_URL ? 'Supabase' : (config.DATABASE_URL ? 'PostgreSQL (URL)' : 'PostgreSQL (Host)'),
    redis: config.REDIS_URL ? 'Redis (URL)' : `Redis (${config.REDIS_HOST}:${config.REDIS_PORT})`,
    emailService: config.EMAIL_SERVICE,
    uploadService: config.UPLOAD_SERVICE,
    paymentProviders: [
      config.STRIPE_SECRET_KEY ? 'Stripe' : null,
      config.PAYPAL_CLIENT_SECRET ? 'PayPal' : null
    ].filter(Boolean),
    features: {
      registration: config.ENABLE_REGISTRATION,
      emailVerification: config.ENABLE_EMAIL_VERIFICATION,
      socialLogin: config.ENABLE_SOCIAL_LOGIN,
      subscriptions: config.ENABLE_SUBSCRIPTIONS,
      chat: config.ENABLE_CHAT,
      analytics: config.ENABLE_ANALYTICS,
      fileUpload: config.ENABLE_FILE_UPLOAD
    },
    debug: config.DEBUG,
    maintenanceMode: config.MAINTENANCE_MODE
  };
};

module.exports = {
  config,
  isDevelopment,
  isProduction,
  isTest,
  dbConfig,
  redisConfig,
  jwtConfig,
  emailConfig,
  uploadConfig,
  paymentConfig,
  oauthConfig,
  rateLimitConfig,
  loggingConfig,
  validateConfig,
  getConfigSummary
};

module.exports.default = config;