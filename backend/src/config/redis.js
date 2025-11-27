const Redis = require('ioredis');
const config = require('./env');

// Simple logger to avoid circular dependency
const redisLogger = {
  info: (msg) => console.log(`[REDIS INFO] ${msg}`),
  warn: (msg) => console.warn(`[REDIS WARN] ${msg}`),
  error: (msg) => console.error(`[REDIS ERROR] ${msg}`)
};

// Redis configuration from config
const redisConfig = {
  host: config.redisConfig.host,
  port: config.redisConfig.port,
  password: config.redisConfig.password || undefined,
  db: config.redisConfig.db,
  retryDelayOnFailover: 100,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  enableOfflineQueue: false
};

// Create Redis instances
let redis = null;
let redisPub = null;
let redisSub = null;

// Check if we have Upstash Redis configuration
if (config.redisConfig.upstash.restUrl && config.redisConfig.upstash.restToken) {
  // Use Upstash Redis with REST API
  const upstashConfig = {
    host: config.redisConfig.upstash.restUrl.replace('https://', ''),
    port: 443,
    password: config.redisConfig.upstash.restToken,
    tls: {},
    retryDelayOnFailover: 100,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    retryDelayOnClusterDown: 300,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false
  };
  
  redis = new Redis(upstashConfig);
  redisPub = new Redis(upstashConfig); // For publishing
  redisSub = new Redis(upstashConfig); // For subscribing
  
  redisLogger.info('Upstash Redis configured successfully');
} else if (config.redisConfig.host) {
  redis = new Redis(redisConfig);
  redisPub = new Redis(redisConfig); // For publishing
  redisSub = new Redis(redisConfig); // For subscribing
} else {
  redisLogger.warn('Redis not configured, some features may not work properly');
}

// Redis connection event handlers
if (redis) {
  redis.on('connect', () => {
    redisLogger.info('Redis connected successfully');
  });

  redis.on('ready', () => {
    redisLogger.info('Redis is ready to receive commands');
  });

    redis.on('error', (error) => {
      redisLogger.error('Redis connection error', { error: error.message });
    });

    redis.on('close', () => {
      redisLogger.warn('Redis connection closed');
    });

    redis.on('reconnecting', (delay) => {
      redisLogger.info('Redis reconnecting', { delay });
    });

    redis.on('end', () => {
      redisLogger.warn('Redis connection ended');
    });

    // Pub/Sub event handlers
    if (redisPub) {
      redisPub.on('connect', () => {
        redisLogger.info('Redis publisher connected');
      });
    }

    if (redisSub) {
      redisSub.on('connect', () => {
        redisLogger.info('Redis subscriber connected');
      });

      redisSub.on('message', (channel, message) => {
        redisLogger.debug('Message received', { channel, message });
      });

      redisSub.on('subscribe', (channel, count) => {
        redisLogger.info('Subscribed to channel', { channel, count });
      });

      redisSub.on('unsubscribe', (channel, count) => {
        redisLogger.info('Unsubscribed from channel', { channel, count });
      });
    }
}

// Redis health check
const checkRedisConnection = async () => {
  try {
    if (!redis) {
      return { status: 'not_configured', error: null };
    }
    
    const result = await redis.ping();
    if (result === 'PONG') {
      redisLogger.info('Redis connection is healthy');
      return { status: 'healthy', error: null };
    } else {
      return { status: 'unhealthy', error: 'Invalid ping response' };
    }
  } catch (error) {
    redisLogger.error('Redis health check failed', { error: error.message });
    return { status: 'unhealthy', error: error.message };
  }
};

// Initialize Redis connections
const initializeRedis = async () => {
  try {
    if (!redis) {
      redisLogger.warn('Redis not configured, skipping initialization');
      return;
    }
    
    redisLogger.info('Initializing Redis connections...');
    
    // Test connection
    await redis.ping();
    
    redisLogger.info('Redis initialization completed');
  } catch (error) {
    redisLogger.error('Redis initialization failed:', error);
    throw error;
  }
};

// Close Redis connections
const closeRedis = async () => {
  try {
    redisLogger.info('Closing Redis connections...');
    
    if (redis) {
      await redis.quit();
      redisLogger.info('Redis main connection closed');
    }
    
    if (redisPub) {
      await redisPub.quit();
      redisLogger.info('Redis publisher connection closed');
    }
    
    if (redisSub) {
      await redisSub.quit();
      redisLogger.info('Redis subscriber connection closed');
    }
    
    redisLogger.info('Redis connections closed successfully');
  } catch (error) {
    redisLogger.error('Error closing Redis connections:', error);
    throw error;
  }
};

// Cache key generators
const cacheKeys = {
  user: (userId) => `user:${userId}`,
  userSession: (userId) => `session:${userId}`,
  team: (teamId) => `team:${teamId}`,
  teamPlayers: (teamId) => `team:${teamId}:players`,
  teamMatches: (teamId) => `team:${teamId}:matches`,
  match: (matchId) => `match:${matchId}`,
  matchLive: (matchId) => `match:${matchId}:live`,
  playerStats: (playerId) => `player:${playerId}:stats`,
  teamStats: (teamId) => `team:${teamId}:stats`,
  subscription: (subscriptionId) => `subscription:${subscriptionId}`,
  subscriptionUsage: (subscriptionId) => `subscription:${subscriptionId}:usage`,
  rateLimit: (identifier) => `ratelimit:${identifier}`,
  chatChannel: (channelId) => `chat:channel:${channelId}`,
  chatUnread: (userId) => `chat:unread:${userId}`,
  analytics: (type, id) => `analytics:${type}:${id}`,
  training: (sessionId) => `training:${sessionId}`,
  apiKey: (keyId) => `apikey:${keyId}`,
  passwordReset: (token) => `password_reset:${token}`,
  emailVerification: (token) => `email_verification:${token}`,
  loginAttempts: (identifier) => `login_attempts:${identifier}`,
  blacklistedToken: (tokenId) => `blacklisted_token:${tokenId}`
};

// Cache TTL constants (in seconds)
const cacheTTL = {
  short: 300, // 5 minutes
  medium: 1800, // 30 minutes
  long: 3600, // 1 hour
  day: 86400, // 24 hours
  week: 604800, // 7 days
  month: 2592000, // 30 days
  session: 7200, // 2 hours
  rateLimit: 3600, // 1 hour
  passwordReset: 1800, // 30 minutes
  emailVerification: 86400, // 24 hours
  loginAttempts: 900 // 15 minutes
};

// Cache utility functions
const cacheUtils = {
  // Set cache with TTL
  async set(key, value, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache set skipped', { key });
        return false;
      }
      const serializedValue = JSON.stringify(value);
      await redis.setex(key, ttl, serializedValue);
      redisLogger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      redisLogger.error('Cache set failed', { key, error: error.message });
      return false;
    }
  },

  // Get cache
  async get(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache get skipped', { key });
        return null;
      }
      const value = await redis.get(key);
      if (value) {
        redisLogger.debug('Cache hit', { key });
        return JSON.parse(value);
      }
      redisLogger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      redisLogger.error('Cache get failed', { key, error: error.message });
      return null;
    }
  },

  // Delete cache
  async del(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache delete skipped', { key });
        return 0;
      }
      const result = await redis.del(key);
      redisLogger.debug('Cache deleted', { key, deleted: result });
      return result;
    } catch (error) {
      redisLogger.error('Cache delete failed', { key, error: error.message });
      throw error;
    }
  },

  // Check if key exists
  async exists(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache exists check skipped', { key });
        return false;
      }
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      redisLogger.error('Cache exists check failed', { key, error: error.message });
      return false;
    }
  },

  // Set TTL for existing key
  async expire(key, ttl) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache expire skipped', { key });
        return false;
      }
      const result = await redis.expire(key, ttl);
      redisLogger.debug('Cache TTL set', { key, ttl, success: result === 1 });
      return result === 1;
    } catch (error) {
      redisLogger.error('Cache expire failed', { key, error: error.message });
      return false;
    }
  },

  // Get TTL for key
  async ttl(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache TTL check skipped', { key });
        return -1;
      }
      const ttl = await redis.ttl(key);
      return ttl;
    } catch (error) {
      redisLogger.error('Cache TTL check failed', { key, error: error.message });
      return -1;
    }
  },

  // Increment counter
  async incr(key, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache increment skipped', { key });
        return 0;
      }
      const result = await redis.incr(key);
      if (result === 1) {
        await redis.expire(key, ttl);
      }
      return result;
    } catch (error) {
      redisLogger.error('Cache increment failed', { key, error: error.message });
      throw error;
    }
  },

  // Decrement counter
  async decr(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache decrement skipped', { key });
        return 0;
      }
      const result = await redis.decr(key);
      return result;
    } catch (error) {
      redisLogger.error('Cache decrement failed', { key, error: error.message });
      throw error;
    }
  },

  // Hash operations
  async hset(key, field, value, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache hset skipped', { key, field });
        return 0;
      }
      const serializedValue = JSON.stringify(value);
      const result = await redis.hset(key, field, serializedValue);
      await redis.expire(key, ttl);
      return result;
    } catch (error) {
      redisLogger.error('Cache hset failed', { key, field, error: error.message });
      throw error;
    }
  },

  async hget(key, field) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache hget skipped', { key, field });
        return null;
      }
      const value = await redis.hget(key, field);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      redisLogger.error('Cache hget failed', { key, field, error: error.message });
      return null;
    }
  },

  async hgetall(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache hgetall skipped', { key });
        return {};
      }
      const hash = await redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      redisLogger.error('Cache hgetall failed', { key, error: error.message });
      return {};
    }
  },

  async hdel(key, field) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache hdel skipped', { key, field });
        return 0;
      }
      const result = await redis.hdel(key, field);
      return result;
    } catch (error) {
      redisLogger.error('Cache hdel failed', { key, field, error: error.message });
      throw error;
    }
  },

  // List operations
  async lpush(key, value, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache lpush skipped', { key });
        return 0;
      }
      const serializedValue = JSON.stringify(value);
      const result = await redis.lpush(key, serializedValue);
      await redis.expire(key, ttl);
      return result;
    } catch (error) {
      redisLogger.error('Cache lpush failed', { key, error: error.message });
      throw error;
    }
  },

  async rpush(key, value, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache rpush skipped', { key });
        return 0;
      }
      const serializedValue = JSON.stringify(value);
      const result = await redis.rpush(key, serializedValue);
      await redis.expire(key, ttl);
      return result;
    } catch (error) {
      redisLogger.error('Cache rpush failed', { key, error: error.message });
      throw error;
    }
  },

  async lrange(key, start = 0, stop = -1) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache lrange skipped', { key });
        return [];
      }
      const values = await redis.lrange(key, start, stop);
      return values.map(value => {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      });
    } catch (error) {
      redisLogger.error('Cache lrange failed', { key, error: error.message });
      return [];
    }
  },

  async ltrim(key, start, stop) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache ltrim skipped', { key });
        return 'OK';
      }
      const result = await redis.ltrim(key, start, stop);
      return result;
    } catch (error) {
      redisLogger.error('Cache ltrim failed', { key, error: error.message });
      throw error;
    }
  },

  // Set operations
  async sadd(key, member, ttl = cacheTTL.medium) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache sadd skipped', { key });
        return 0;
      }
      const serializedMember = JSON.stringify(member);
      const result = await redis.sadd(key, serializedMember);
      await redis.expire(key, ttl);
      return result;
    } catch (error) {
      redisLogger.error('Cache sadd failed', { key, error: error.message });
      throw error;
    }
  },

  async smembers(key) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache smembers skipped', { key });
        return [];
      }
      const members = await redis.smembers(key);
      return members.map(member => {
        try {
          return JSON.parse(member);
        } catch {
          return member;
        }
      });
    } catch (error) {
      redisLogger.error('Cache smembers failed', { key, error: error.message });
      return [];
    }
  },

  async srem(key, member) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache srem skipped', { key });
        return 0;
      }
      const serializedMember = JSON.stringify(member);
      const result = await redis.srem(key, serializedMember);
      return result;
    } catch (error) {
      redisLogger.error('Cache srem failed', { key, error: error.message });
      throw error;
    }
  },

  // Pattern-based operations
  async keys(pattern) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache keys skipped', { pattern });
        return [];
      }
      const keys = await redis.keys(pattern);
      return keys;
    } catch (error) {
      redisLogger.error('Cache keys failed', { pattern, error: error.message });
      return [];
    }
  },

  async deletePattern(pattern) {
    try {
      if (!redis) {
        redisLogger.warn('Redis not available, cache pattern delete skipped', { pattern });
        return 0;
      }
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        const result = await redis.del(...keys);
        redisLogger.info('Cache pattern deleted', { pattern, deleted: result });
        return result;
      }
      return 0;
    } catch (error) {
      redisLogger.error('Cache pattern delete failed', { pattern, error: error.message });
      throw error;
    }
  }
};

// Pub/Sub utilities
const pubSubUtils = {
  async publish(channel, message) {
    try {
      if (!redisPub) {
        redisLogger.warn('Redis publisher not available, publish skipped', { channel });
        return 0;
      }
      const serializedMessage = JSON.stringify(message);
      const result = await redisPub.publish(channel, serializedMessage);
      redisLogger.debug('Message published', { channel, subscribers: result });
      return result;
    } catch (error) {
      redisLogger.error('Publish failed', { channel, error: error.message });
      throw error;
    }
  },

  async subscribe(channel, callback) {
    try {
      await redisSub.subscribe(channel);
      redisSub.on('message', (receivedChannel, message) => {
        if (receivedChannel === channel) {
          try {
            const parsedMessage = JSON.parse(message);
            callback(parsedMessage);
          } catch {
            callback(message);
          }
        }
      });
      redisLogger.info('Subscribed to channel', { channel });
    } catch (error) {
      redisLogger.error('Subscribe failed', { channel, error: error.message });
      throw error;
    }
  },

  async unsubscribe(channel) {
    try {
      await redisSub.unsubscribe(channel);
      redisLogger.info('Unsubscribed from channel', { channel });
    } catch (error) {
      redisLogger.error('Unsubscribe failed', { channel, error: error.message });
      throw error;
    }
  }
};

// Rate limiting utilities
const rateLimitUtils = {
  async checkRateLimit(identifier, limit, windowSeconds) {
    try {
      const key = cacheKeys.rateLimit(identifier);
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      
      const ttl = await redis.ttl(key);
      
      return {
        allowed: current <= limit,
        count: current,
        remaining: Math.max(0, limit - current),
        resetTime: Date.now() + (ttl * 1000)
      };
    } catch (error) {
      redisLogger.error('Rate limit check failed', { identifier, error: error.message });
      // Allow request if Redis fails
      return {
        allowed: true,
        count: 0,
        remaining: limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  },

  async resetRateLimit(identifier) {
    try {
      const key = cacheKeys.rateLimit(identifier);
      await redis.del(key);
      redisLogger.debug('Rate limit reset', { identifier });
    } catch (error) {
      redisLogger.error('Rate limit reset failed', { identifier, error: error.message });
    }
  }
};

// Session utilities
const sessionUtils = {
  async createSession(userId, sessionData, ttl = cacheTTL.session) {
    try {
      const key = cacheKeys.userSession(userId);
      await cacheUtils.set(key, sessionData, ttl);
      redisLogger.debug('Session created', { userId, ttl });
    } catch (error) {
      redisLogger.error('Session creation failed', { userId, error: error.message });
      throw error;
    }
  },

  async getSession(userId) {
    try {
      const key = cacheKeys.userSession(userId);
      const session = await cacheUtils.get(key);
      if (session) {
        redisLogger.debug('Session retrieved', { userId });
      }
      return session;
    } catch (error) {
      redisLogger.error('Session retrieval failed', { userId, error: error.message });
      return null;
    }
  },

  async updateSession(userId, sessionData, ttl = cacheTTL.session) {
    try {
      const key = cacheKeys.userSession(userId);
      await cacheUtils.set(key, sessionData, ttl);
      redisLogger.debug('Session updated', { userId });
    } catch (error) {
      redisLogger.error('Session update failed', { userId, error: error.message });
      throw error;
    }
  },

  async destroySession(userId) {
    try {
      const key = cacheKeys.userSession(userId);
      await cacheUtils.del(key);
      redisLogger.debug('Session destroyed', { userId });
    } catch (error) {
      redisLogger.error('Session destruction failed', { userId, error: error.message });
      throw error;
    }
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  redisLogger.info('Closing Redis connections...');
  redis.disconnect();
  redisPub.disconnect();
  redisSub.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  redisLogger.info('Closing Redis connections...');
  redis.disconnect();
  redisPub.disconnect();
  redisSub.disconnect();
  process.exit(0);
});

module.exports = {
  redis,
  redisPub,
  redisSub,
  checkRedisConnection,
  initializeRedis,
  closeRedis,
  cacheKeys,
  cacheTTL,
  cacheUtils,
  pubSubUtils,
  rateLimitUtils,
  sessionUtils,
  redisLogger
};