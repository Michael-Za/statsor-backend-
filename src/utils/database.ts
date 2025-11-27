// Database optimization utilities for TeamPlaymate platform

import Redis from 'ioredis';
import { Pool } from 'pg';

// Redis client configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
});

// PostgreSQL connection pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
  max: 20, // maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Query caching service
export class QueryCacheService {
  private redis: Redis;
  private defaultTTL: number;

  constructor(redisClient: Redis = redis, defaultTTL: number = 300) {
    this.redis = redisClient;
    this.defaultTTL = defaultTTL;
  }

  /**
   * Cache a query result with automatic key generation
   */
  async cacheQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    try {
      // Try to get from cache first
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }

      // Execute query if not in cache
      const result = await queryFn();
      
      // Store in cache
      await this.redis.setex(key, ttl, JSON.stringify(result));
      
      return result;
    } catch (error) {
      console.error('Cache operation failed:', error);
      // Fallback to direct query execution
      return await queryFn();
    }
  }

  /**
   * Generate cache key for player-related queries
   */
  generatePlayerKey(playerId: string, queryType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `player:${playerId}:${queryType}:${this.hashParams(paramString)}`;
  }

  /**
   * Generate cache key for team-related queries
   */
  generateTeamKey(teamId: string, queryType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `team:${teamId}:${queryType}:${this.hashParams(paramString)}`;
  }

  /**
   * Generate cache key for match-related queries
   */
  generateMatchKey(matchId: string, queryType: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `match:${matchId}:${queryType}:${this.hashParams(paramString)}`;
  }

  /**
   * Invalidate cache entries by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidation failed:', error);
    }
  }

  /**
   * Invalidate all player-related cache entries
   */
  async invalidatePlayerCache(playerId: string): Promise<void> {
    await this.invalidatePattern(`player:${playerId}:*`);
  }

  /**
   * Invalidate all team-related cache entries
   */
  async invalidateTeamCache(teamId: string): Promise<void> {
    await this.invalidatePattern(`team:${teamId}:*`);
  }

  private hashParams(params: string): string {
    // Simple hash function for cache key generation
    let hash = 0;
    for (let i = 0; i < params.length; i++) {
      const char = params.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

// Database connection pool manager
export class DatabasePool {
  private pool: Pool;

  constructor(poolInstance: Pool = pool) {
    this.pool = poolInstance;
  }

  /**
   * Execute a query with automatic connection management
   */
  async query<T = any>(text: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Execute a transaction with automatic rollback on error
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats() {
    return {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount,
    };
  }

  /**
   * Close all connections
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Query optimization utilities
export class QueryOptimizer {
  private cacheService: QueryCacheService;
  private dbPool: DatabasePool;

  constructor(
    cacheService: QueryCacheService = new QueryCacheService(),
    dbPool: DatabasePool = new DatabasePool()
  ) {
    this.cacheService = cacheService;
    this.dbPool = dbPool;
  }

  /**
   * Get player statistics with caching
   */
  async getPlayerStats(playerId: string, seasonId?: string): Promise<any> {
    const cacheKey = this.cacheService.generatePlayerKey(playerId, 'stats', { seasonId });
    
    return this.cacheService.cacheQuery(
      cacheKey,
      async () => {
        const query = `
          SELECT 
            p.id,
            p.name,
            p.position,
            COUNT(pe.id) as total_events,
            COUNT(CASE WHEN pe.event_type = 'goal' THEN 1 END) as goals,
            COUNT(CASE WHEN pe.event_type = 'assist' THEN 1 END) as assists,
            AVG(ps.rating) as avg_rating,
            SUM(ps.minutes_played) as total_minutes
          FROM players p
          LEFT JOIN player_events pe ON p.id = pe.player_id
          LEFT JOIN player_stats ps ON p.id = ps.player_id
          LEFT JOIN matches m ON pe.match_id = m.id
          WHERE p.id = $1
          ${seasonId ? 'AND m.season_id = $2' : ''}
          GROUP BY p.id, p.name, p.position
        `;
        
        const params = seasonId ? [playerId, seasonId] : [playerId];
        return this.dbPool.query(query, params);
      },
      600 // 10 minutes TTL
    );
  }

  /**
   * Get team performance metrics with caching
   */
  async getTeamPerformance(teamId: string, dateRange?: { start: Date; end: Date }): Promise<any> {
    const cacheKey = this.cacheService.generateTeamKey(teamId, 'performance', dateRange);
    
    return this.cacheService.cacheQuery(
      cacheKey,
      async () => {
        const query = `
          SELECT 
            t.id,
            t.name,
            COUNT(m.id) as matches_played,
            COUNT(CASE WHEN m.home_team_id = t.id AND m.home_score > m.away_score THEN 1
                      WHEN m.away_team_id = t.id AND m.away_score > m.home_score THEN 1 END) as wins,
            COUNT(CASE WHEN m.home_score = m.away_score THEN 1 END) as draws,
            COUNT(CASE WHEN m.home_team_id = t.id AND m.home_score < m.away_score THEN 1
                      WHEN m.away_team_id = t.id AND m.away_score < m.home_score THEN 1 END) as losses,
            SUM(CASE WHEN m.home_team_id = t.id THEN m.home_score
                    WHEN m.away_team_id = t.id THEN m.away_score END) as goals_for,
            SUM(CASE WHEN m.home_team_id = t.id THEN m.away_score
                    WHEN m.away_team_id = t.id THEN m.home_score END) as goals_against
          FROM teams t
          LEFT JOIN matches m ON (t.id = m.home_team_id OR t.id = m.away_team_id)
          WHERE t.id = $1
          ${dateRange ? 'AND m.match_date BETWEEN $2 AND $3' : ''}
          GROUP BY t.id, t.name
        `;
        
        const params = dateRange 
          ? [teamId, dateRange.start, dateRange.end]
          : [teamId];
        
        return this.dbPool.query(query, params);
      },
      300 // 5 minutes TTL
    );
  }

  /**
   * Get recent matches with caching
   */
  async getRecentMatches(teamId: string, limit: number = 10): Promise<any> {
    const cacheKey = this.cacheService.generateTeamKey(teamId, 'recent_matches', { limit });
    
    return this.cacheService.cacheQuery(
      cacheKey,
      async () => {
        const query = `
          SELECT 
            m.*,
            ht.name as home_team_name,
            at.name as away_team_name
          FROM matches m
          JOIN teams ht ON m.home_team_id = ht.id
          JOIN teams at ON m.away_team_id = at.id
          WHERE m.home_team_id = $1 OR m.away_team_id = $1
          ORDER BY m.match_date DESC
          LIMIT $2
        `;
        
        return this.dbPool.query(query, [teamId, limit]);
      },
      180 // 3 minutes TTL
    );
  }

  /**
   * Invalidate related caches when data changes
   */
  async invalidateRelatedCaches(entityType: 'player' | 'team' | 'match', entityId: string): Promise<void> {
    switch (entityType) {
      case 'player':
        await this.cacheService.invalidatePlayerCache(entityId);
        break;
      case 'team':
        await this.cacheService.invalidateTeamCache(entityId);
        break;
      case 'match':
        // Invalidate caches for both teams in the match
        const matchData = await this.dbPool.query(
          'SELECT home_team_id, away_team_id FROM matches WHERE id = $1',
          [entityId]
        );
        if (matchData.length > 0) {
          await this.cacheService.invalidateTeamCache(matchData[0].home_team_id);
          await this.cacheService.invalidateTeamCache(matchData[0].away_team_id);
        }
        break;
    }
  }
}

// Database indexing recommendations
export const DATABASE_INDEXES = {
  // Critical indexes for performance
  RECOMMENDED_INDEXES: [
    {
      name: 'idx_player_match_date',
      table: 'player_events',
      columns: ['player_id', 'match_id', 'event_time'],
      type: 'btree',
      description: 'Optimizes player event queries by match and time'
    },
    {
      name: 'idx_team_season',
      table: 'matches',
      columns: ['home_team_id', 'away_team_id', 'season_id'],
      type: 'btree',
      description: 'Optimizes team match queries by season'
    },
    {
      name: 'idx_match_date',
      table: 'matches',
      columns: ['match_date'],
      type: 'btree',
      description: 'Optimizes date-based match queries'
    },
    {
      name: 'idx_player_stats_composite',
      table: 'player_stats',
      columns: ['player_id', 'match_id', 'rating'],
      type: 'btree',
      description: 'Optimizes player statistics aggregation queries'
    },
    {
      name: 'idx_event_type_time',
      table: 'player_events',
      columns: ['event_type', 'event_time'],
      type: 'btree',
      description: 'Optimizes event-based analysis queries'
    }
  ],

  // Generate SQL for creating indexes
  generateIndexSQL(): string[] {
    return this.RECOMMENDED_INDEXES.map(index => {
      const columns = index.columns.join(', ');
      return `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table} USING ${index.type} (${columns});`;
    });
  },

  // Generate SQL for analyzing query performance
  generateAnalysisSQL(): string[] {
    return [
      'ANALYZE;', // Update table statistics
      `SELECT schemaname, tablename, attname, n_distinct, correlation 
       FROM pg_stats 
       WHERE schemaname = 'public' 
       ORDER BY tablename, attname;`,
      `SELECT query, calls, total_time, mean_time, rows 
       FROM pg_stat_statements 
       WHERE query LIKE '%player%' OR query LIKE '%match%' OR query LIKE '%team%'
       ORDER BY total_time DESC 
       LIMIT 20;`
    ];
  }
};

// Export singleton instances
export const queryCacheService = new QueryCacheService();
export const databasePool = new DatabasePool();
export const queryOptimizer = new QueryOptimizer();

// Cleanup function for graceful shutdown
export const cleanup = async (): Promise<void> => {
  await redis.quit();
  await databasePool.close();
};