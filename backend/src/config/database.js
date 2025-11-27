const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
const config = require('./env');

// Simple logger to avoid circular dependency
const dbLogger = {
  info: (msg, meta) => console.log(`[INFO]: ${msg}`, meta || ''),
  warn: (msg, meta) => console.warn(`[WARN]: ${msg}`, meta || ''),
  error: (msg, meta) => console.error(`[ERROR]: ${msg}`, meta || '')
};

// Supabase configuration from config
const supabaseUrl = config.dbConfig.supabase.url;
const supabaseKey = config.dbConfig.supabase.anonKey;
const supabaseServiceKey = config.dbConfig.supabase.serviceRoleKey;

// Create Supabase clients or use mock if not configured
let supabase = null;
let supabaseAdmin = null;

if (supabaseUrl && supabaseKey && !supabaseUrl.includes('demo-project') && !supabaseUrl.includes('your-')) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    }
    dbLogger.info('Supabase client initialized successfully');
  } catch (error) {
    dbLogger.warn('Failed to initialize Supabase client, using mock database', { error: error.message });
  }
} else {
  dbLogger.warn('Supabase not configured, using mock database service');
}

// PostgreSQL direct connection pool (for complex queries)
let pool = null;

if (config.dbConfig.postgres.host && config.dbConfig.postgres.host !== 'localhost') {
  try {
    const poolConfig = {
      host: config.dbConfig.postgres.host,
      port: config.dbConfig.postgres.port,
      database: config.dbConfig.postgres.database,
      user: config.dbConfig.postgres.user,
      password: config.dbConfig.postgres.password,
      ssl: config.dbConfig.postgres.ssl ? { rejectUnauthorized: false } : false,
      max: config.dbConfig.postgres.pool.max,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    
    pool = new Pool(poolConfig);
    dbLogger.info('PostgreSQL pool initialized successfully');
  } catch (error) {
    dbLogger.warn('Failed to initialize PostgreSQL pool, using mock database', { error: error.message });
  }
} else {
  dbLogger.warn('PostgreSQL not configured, using mock database service');
}

// Database connection health check
const checkDatabaseConnection = async () => {
  const health = {
    supabase: { status: 'unknown', error: null },
    postgresql: { status: 'unknown', error: null }
  };

  try {
    // Test Supabase connection
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
          health.supabase.status = 'unhealthy';
          health.supabase.error = error.message;
        } else {
          health.supabase.status = 'healthy';
        }
      } catch (error) {
        health.supabase.status = 'unhealthy';
        health.supabase.error = error.message;
      }
    } else {
      health.supabase.status = 'not_configured';
    }

    // Test PostgreSQL pool connection
    if (pool) {
      try {
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        health.postgresql.status = 'healthy';
      } catch (error) {
        health.postgresql.status = 'unhealthy';
        health.postgresql.error = error.message;
      }
    } else {
      health.postgresql.status = 'not_configured';
    }

    dbLogger.info('Database connection check completed', health);
    return health;
  } catch (error) {
    dbLogger.error('Database connection check failed', { error: error.message });
    if (health.supabase.status === 'unknown') {
      health.supabase.status = 'unhealthy';
      health.supabase.error = error.message;
    }
    if (health.postgresql.status === 'unknown') {
      health.postgresql.status = 'unhealthy';
      health.postgresql.error = error.message;
    }
    return health;
  }
};

// Export services
module.exports = {
  supabase,
  supabaseAdmin,
  pool,
  checkDatabaseConnection
};