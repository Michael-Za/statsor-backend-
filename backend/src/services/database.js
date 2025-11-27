const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg'); // Add this import
const winston = require('winston');
const config = require('../config/env');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

class DatabaseService {
  constructor() {
    this.supabase = null;
    this.isConnected = false;
    this.pool = null; // Add pool property
  }

  async initialize() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

      // Check if Supabase is properly configured
      const isSupabaseConfigured = supabaseUrl && supabaseKey && 
        supabaseUrl !== 'https://placeholder.supabase.co' && 
        supabaseKey !== 'placeholder_anon_key' &&
        supabaseKey !== 'placeholder_service_role_key' &&
        supabaseUrl.startsWith('https://');

      if (!isSupabaseConfigured) {
        logger.warn('Supabase not configured properly. Running in mock mode.');
        logger.warn('To enable database features, configure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        this.isConnected = false;
        this.mockMode = true;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'x-application-name': 'teamplaymate-backend'
          }
        }
      });

      // Initialize PostgreSQL pool for raw queries
      const dbConfig = config.dbConfig.postgres;
      if (dbConfig.host && dbConfig.database && dbConfig.user) {
        this.pool = new Pool({
          host: dbConfig.host,
          port: dbConfig.port,
          database: dbConfig.database,
          user: dbConfig.user,
          password: dbConfig.password,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          max: dbConfig.pool.max,
          idleTimeoutMillis: dbConfig.pool.idleTimeoutMillis || 30000,
          connectionTimeoutMillis: dbConfig.pool.acquireTimeoutMillis || 2000,
        });
        logger.info('PostgreSQL pool initialized successfully');
      }

      // Test connection
      const { data, error } = await this.supabase
        .from('players')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist"
        throw error;
      }

      this.isConnected = true;
      logger.info('Database service initialized successfully');
      
      // Initialize database schema if needed
      await this.initializeSchema();
      
    } catch (error) {
      logger.error('Failed to initialize database service:', error);
      throw error;
    }
  }

  async initializeSchema() {
    try {
      // Create tables if they don't exist
      const tables = [
        {
          name: 'players',
          schema: `
            CREATE TABLE IF NOT EXISTS players (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              name VARCHAR(255) NOT NULL,
              email VARCHAR(255) UNIQUE NOT NULL,
              position VARCHAR(100),
              team_id UUID,
              stats JSONB DEFAULT '{}',
              profile_image_url TEXT,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'teams',
          schema: `
            CREATE TABLE IF NOT EXISTS teams (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              name VARCHAR(255) NOT NULL,
              sport VARCHAR(100) NOT NULL,
              description TEXT,
              logo_url TEXT,
              owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'matches',
          schema: `
            CREATE TABLE IF NOT EXISTS matches (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              home_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
              away_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
              match_date TIMESTAMP WITH TIME ZONE NOT NULL,
              venue VARCHAR(255),
              status VARCHAR(50) DEFAULT 'scheduled',
              home_score INTEGER DEFAULT 0,
              away_score INTEGER DEFAULT 0,
              match_data JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'training_sessions',
          schema: `
            CREATE TABLE IF NOT EXISTS training_sessions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
              title VARCHAR(255) NOT NULL,
              description TEXT,
              session_date TIMESTAMP WITH TIME ZONE NOT NULL,
              duration INTEGER, -- in minutes
              exercises JSONB DEFAULT '[]',
              attendance JSONB DEFAULT '[]',
              created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'analytics',
          schema: `
            CREATE TABLE IF NOT EXISTS analytics (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              entity_type VARCHAR(50) NOT NULL, -- 'player', 'team', 'match'
              entity_id UUID NOT NULL,
              metric_name VARCHAR(100) NOT NULL,
              metric_value JSONB NOT NULL,
              recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              season VARCHAR(20),
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'subscriptions',
          schema: `
            CREATE TABLE IF NOT EXISTS subscriptions (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              plan_type VARCHAR(50) NOT NULL,
              status VARCHAR(50) DEFAULT 'active',
              stripe_subscription_id VARCHAR(255),
              current_period_start TIMESTAMP WITH TIME ZONE,
              current_period_end TIMESTAMP WITH TIME ZONE,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
              updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        },
        {
          name: 'chat_messages',
          schema: `
            CREATE TABLE IF NOT EXISTS chat_messages (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
              message TEXT NOT NULL,
              response TEXT,
              context JSONB DEFAULT '{}',
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
          `
        }
      ];

      // Check if tables exist by trying to query them
      for (const table of tables) {
        try {
          const { error } = await this.supabase
            .from(table.name)
            .select('count')
            .limit(1);
          
          if (error && error.code === 'PGRST116') {
            logger.warn(`Table ${table.name} does not exist. Please run Supabase migrations.`);
          } else {
            logger.info(`Table ${table.name} is available`);
          }
        } catch (err) {
          logger.warn(`Could not check table ${table.name}:`, err.message);
        }
      }

    } catch (error) {
      logger.warn('Schema initialization completed with warnings:', error.message);
    }
  }

  // Add the missing query method for raw SQL queries
  async query(text, params) {
    if (this.mockMode) {
      logger.warn('Mock mode: Simulating raw query operation');
      return [];
    }
    
    // Use PostgreSQL pool for raw queries if available
    if (this.pool) {
      try {
        const client = await this.pool.connect();
        try {
          const result = await client.query(text, params);
          return result.rows;
        } finally {
          client.release();
        }
      } catch (error) {
        logger.error('Error executing raw query with PostgreSQL pool:', error);
        throw error;
      }
    }
    
    // Fallback to Supabase RPC if pool is not available
    if (this.supabase) {
      try {
        // For simple queries that don't require complex SQL, use Supabase methods
        // For raw SQL, we need to use RPC
        const { data, error } = await this.supabase.rpc('exec_sql', {
          sql: text,
          params: params || []
        });

        if (error) throw error;
        return data;
      } catch (error) {
        logger.error('Error executing raw query with Supabase RPC:', error);
        // Return empty array as fallback instead of throwing error
        return [];
      }
    }
    
    // If neither pool nor supabase is available, return empty array
    logger.warn('No database connection available, returning empty result');
    return [];
  }

  // Generic CRUD operations
  async create(table, data) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating create operation for ${table}`);
      return { id: 'mock-id-' + Date.now(), ...data, created_at: new Date().toISOString() };
    }
    
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Error creating record in ${table}:`, error);
      throw error;
    }
  }

  async findById(table, id) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating findById operation for ${table}`);
      return null;
    }
    
    try {
      const { data, error } = await this.supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error finding record in ${table}:`, error);
      throw error;
    }
  }

  async findMany(table, filters = {}, options = {}) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating findMany operation for ${table}`);
      return [];
    }
    
    try {
      let query = this.supabase.from(table).select('*');

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      // Apply options
      if (options.orderBy) {
        query = query.order(options.orderBy, { ascending: options.ascending !== false });
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    } catch (error) {
      logger.error(`Error finding records in ${table}:`, error);
      throw error;
    }
  }

  async update(table, id, data) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating update operation for ${table}`);
      return { id, ...data, updated_at: new Date().toISOString() };
    }
    
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      logger.error(`Error updating record in ${table}:`, error);
      throw error;
    }
  }

  async delete(table, id) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating delete operation for ${table}`);
      return true;
    }
    
    try {
      const { error } = await this.supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error(`Error deleting record in ${table}:`, error);
      throw error;
    }
  }

  async count(table, filters = {}) {
    if (this.mockMode) {
      logger.warn(`Mock mode: Simulating count operation for ${table}`);
      return 0;
    }
    
    try {
      let query = this.supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else {
          query = query.eq(key, value);
        }
      });

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error(`Error counting records in ${table}:`, error);
      throw error;
    }
  }

  // Advanced query methods
  async executeQuery(query, params = []) {
    try {
      const { data, error } = await this.supabase.rpc('exec_sql', {
        sql: query,
        params
      });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error executing custom query:', error);
      throw error;
    }
  }

  async getAnalytics(entityType, entityId, timeRange = '30 days') {
    try {
      const { data, error } = await this.supabase
        .from('analytics')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .gte('recorded_at', new Date(Date.now() - this.parseTimeRange(timeRange)).toISOString())
        .order('recorded_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      throw error;
    }
  }

  parseTimeRange(timeRange) {
    const [amount, unit] = timeRange.split(' ');
    const multipliers = {
      'days': 24 * 60 * 60 * 1000,
      'hours': 60 * 60 * 1000,
      'minutes': 60 * 1000
    };
    return parseInt(amount) * (multipliers[unit] || multipliers.days);
  }

  async close() {
    // Close PostgreSQL pool if it exists
    if (this.pool) {
      await this.pool.end();
    }
    this.isConnected = false;
    logger.info('Database service closed');
  }

  getClient() {
    return this.supabase;
  }

  isHealthy() {
    return this.isConnected;
  }
}

// Mock database service for testing without Supabase
// This is a simplified version for demonstration purposes

// Using winston logger from top of file

// Mock in-memory database
const mockDatabase = {
  users: [],
  teams: [],
  players: [],
  matches: []
};

// Mock database service
class MockDatabaseService {
  constructor() {
    this.isConnected = true;
    logger.info('Mock database service initialized');
  }

  // User operations
  async findMany(table, criteria) {
    try {
      const tableData = mockDatabase[table] || [];
      if (Object.keys(criteria).length === 0) {
        return tableData;
      }
      
      return tableData.filter(item => {
        return Object.keys(criteria).every(key => item[key] === criteria[key]);
      });
    } catch (error) {
      logger.error(`Error finding records in ${table}: ${error.message}`);
      return [];
    }
  }

  async findOne(table, criteria) {
    try {
      const results = await this.findMany(table, criteria);
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      logger.error(`Error finding record in ${table}: ${error.message}`);
      return null;
    }
  }

  async findById(table, id) {
    try {
      return await this.findOne(table, { id });
    } catch (error) {
      logger.error(`Error finding record by ID in ${table}: ${error.message}`);
      return null;
    }
  }

  async create(table, data) {
    try {
      const tableData = mockDatabase[table] || [];
      const newItem = {
        id: `mock_${table}_${Date.now()}`,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      tableData.push(newItem);
      mockDatabase[table] = tableData;
      
      logger.info(`Created new record in ${table} with ID: ${newItem.id}`);
      return newItem;
    } catch (error) {
      logger.error(`Error creating record in ${table}: ${error.message}`);
      throw error;
    }
  }

  async update(table, id, data) {
    try {
      const tableData = mockDatabase[table] || [];
      const index = tableData.findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Record with ID ${id} not found in ${table}`);
      }
      
      const updatedItem = {
        ...tableData[index],
        ...data,
        updated_at: new Date().toISOString()
      };
      
      tableData[index] = updatedItem;
      mockDatabase[table] = tableData;
      
      logger.info(`Updated record in ${table} with ID: ${id}`);
      return updatedItem;
    } catch (error) {
      logger.error(`Error updating record in ${table}: ${error.message}`);
      throw error;
    }
  }

  async delete(table, id) {
    try {
      const tableData = mockDatabase[table] || [];
      const filteredData = tableData.filter(item => item.id !== id);
      
      if (filteredData.length === tableData.length) {
        throw new Error(`Record with ID ${id} not found in ${table}`);
      }
      
      mockDatabase[table] = filteredData;
      logger.info(`Deleted record from ${table} with ID: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error(`Error deleting record from ${table}: ${error.message}`);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return {
      status: 'healthy',
      service: 'mock-database',
      timestamp: new Date().toISOString()
    };
  }
}

// Create instances
const mockDb = new MockDatabaseService();
const databaseServiceInstance = new DatabaseService();

// Export the main database service instance
module.exports = databaseServiceInstance;
module.exports.DatabaseService = DatabaseService;
module.exports.MockDatabaseService = MockDatabaseService;
module.exports.mockDb = mockDb;
module.exports.default = databaseServiceInstance;