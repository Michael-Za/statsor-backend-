const winston = require('winston');
const config = require('../config/env');

const logger = {
  info: (msg) => console.log(`[REDIS INFO] ${msg}`),
  warn: (msg) => console.warn(`[REDIS WARN] ${msg}`),
  error: (msg) => console.error(`[REDIS ERROR] ${msg}`)
};

// Mock in-memory store for Redis-like functionality
const mockRedisStore = new Map();
const mockRefreshTokens = new Map();

class MockRedisService {
  constructor() {
    this.connected = true;
    logger.info('Mock Redis service initialized');
  }

  // Basic key-value operations
  async set(key, value, expiry = null) {
    try {
      const data = {
        value: typeof value === 'object' ? JSON.stringify(value) : value,
        expiry: expiry ? Date.now() + (expiry * 1000) : null
      };
      
      mockRedisStore.set(key, data);
      logger.info(`Set key: ${key}`);
      return 'OK';
    } catch (error) {
      logger.error(`Error setting key ${key}: ${error.message}`);
      throw error;
    }
  }

  async get(key) {
    try {
      const data = mockRedisStore.get(key);
      
      if (!data) {
        return null;
      }
      
      // Check if expired
      if (data.expiry && Date.now() > data.expiry) {
        mockRedisStore.delete(key);
        return null;
      }
      
      try {
        return JSON.parse(data.value);
      } catch {
        return data.value;
      }
    } catch (error) {
      logger.error(`Error getting key ${key}: ${error.message}`);
      return null;
    }
  }

  async del(key) {
    try {
      const result = mockRedisStore.delete(key) ? 1 : 0;
      logger.info(`Deleted key: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting key ${key}: ${error.message}`);
      return 0;
    }
  }

  // Refresh token operations
  async setRefreshToken(userId, refreshToken) {
    try {
      const tokens = mockRefreshTokens.get(userId) || [];
      tokens.push(refreshToken);
      mockRefreshTokens.set(userId, tokens);
      logger.info(`Set refresh token for user: ${userId}`);
      return 'OK';
    } catch (error) {
      logger.error(`Error setting refresh token for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getRefreshToken(userId) {
    try {
      const tokens = mockRefreshTokens.get(userId) || [];
      return tokens.length > 0 ? tokens[tokens.length - 1] : null;
    } catch (error) {
      logger.error(`Error getting refresh token for user ${userId}: ${error.message}`);
      return null;
    }
  }

  async deleteRefreshToken(userId, refreshToken) {
    try {
      const tokens = mockRefreshTokens.get(userId) || [];
      const filteredTokens = tokens.filter(token => token !== refreshToken);
      mockRefreshTokens.set(userId, filteredTokens);
      logger.info(`Deleted refresh token for user: ${userId}`);
      return 'OK';
    } catch (error) {
      logger.error(`Error deleting refresh token for user ${userId}: ${error.message}`);
      return null;
    }
  }

  async deleteAllRefreshTokens(userId) {
    try {
      mockRefreshTokens.delete(userId);
      logger.info(`Deleted all refresh tokens for user: ${userId}`);
      return 'OK';
    } catch (error) {
      logger.error(`Error deleting all refresh tokens for user ${userId}: ${error.message}`);
      throw error;
    }
  }

  // Blacklist operations
  async blacklistToken(token) {
    try {
      const expiry = 3600; // 1 hour
      await this.set(`blacklist:${token}`, 'true', expiry);
      logger.info(`Blacklisted token`);
      return 'OK';
    } catch (error) {
      logger.error(`Error blacklisting token: ${error.message}`);
      throw error;
    }
  }

  async isTokenBlacklisted(token) {
    try {
      const result = await this.get(`blacklist:${token}`);
      return result === 'true';
    } catch (error) {
      logger.error(`Error checking if token is blacklisted: ${error.message}`);
      return false;
    }
  }

  // Pattern matching operations
  async keys(pattern) {
    try {
      const allKeys = Array.from(mockRedisStore.keys());
      
      if (pattern === '*') {
        return allKeys;
      }
      
      // Convert Redis pattern to regex
      const regexPattern = pattern
        .replace(/\*/g, '.*')
        .replace(/\?/g, '.')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');
      
      const regex = new RegExp(`^${regexPattern}$`);
      const matchingKeys = allKeys.filter(key => regex.test(key));
      
      logger.info(`Found ${matchingKeys.length} keys matching pattern: ${pattern}`);
      return matchingKeys;
    } catch (error) {
      logger.error(`Error getting keys with pattern ${pattern}: ${error.message}`);
      return [];
    }
  }

  async incr(key) {
    try {
      const current = await this.get(key) || '0';
      const newValue = parseInt(current) + 1;
      await this.set(key, newValue.toString());
      logger.info(`Incremented key ${key} to ${newValue}`);
      return newValue;
    } catch (error) {
      logger.error(`Error incrementing key ${key}: ${error.message}`);
      throw error;
    }
  }

  async expire(key, seconds) {
    try {
      const data = mockRedisStore.get(key);
      if (data) {
        data.expiry = Date.now() + (seconds * 1000);
        mockRedisStore.set(key, data);
        logger.info(`Set expiry for key ${key}: ${seconds} seconds`);
        return 1;
      }
      return 0;
    } catch (error) {
      logger.error(`Error setting expiry for key ${key}: ${error.message}`);
      return 0;
    }
  }

  // Health check
  async ping() {
    return 'PONG';
  }

  // Connection management
  async disconnect() {
    logger.info('Mock Redis connection closed');
    return 'OK';
  }

  async quit() {
    logger.info('Mock Redis connection quit');
    return 'OK';
  }
}

// Export mock Redis service
const redis = new MockRedisService();

module.exports = redis;
