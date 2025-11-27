const { SecurityService } = require('./securityService');
const logger = require('../utils/logger');

/**
 * Background Security Monitor
 * Runs silently in the background without any user-facing components
 * Provides invisible protection against threats and attacks
 */
class BackgroundSecurityMonitor {
  constructor() {
    this.securityService = new SecurityService();
    this.isRunning = false;
    this.monitoringInterval = null;
    this.cleanupInterval = null;
  }

  /**
   * Start the background security monitoring
   */
  async start() {
    if (this.isRunning) {
      return;
    }

    try {
      this.isRunning = true;
      
      // Start periodic monitoring (every 5 minutes)
      this.monitoringInterval = setInterval(async () => {
        await this.performSecurityCheck();
      }, 5 * 60 * 1000);

      // Start cleanup process (every hour)
      this.cleanupInterval = setInterval(async () => {
        await this.performCleanup();
      }, 60 * 60 * 1000);

      // Perform initial security check
      await this.performSecurityCheck();
      
      // Silent startup - no logs visible to users
      if (process.env.NODE_ENV === 'development') {
        logger.info('[SYSTEM] Background security monitor started');
      }
    } catch (error) {
      logger.error('[SYSTEM] Failed to start security monitor:', error);
      this.isRunning = false;
    }
  }

  /**
   * Stop the background security monitoring
   */
  async stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    if (process.env.NODE_ENV === 'development') {
      logger.info('[SYSTEM] Background security monitor stopped');
    }
  }

  /**
   * Perform silent security health check
   */
  async performSecurityCheck() {
    try {
      const status = await this.securityService.getSystemSecurityStatus();
      
      // Only log if there are critical issues
      if (!status.isHealthy && status.threatLevel === 'CRITICAL') {
        logger.error('[SYSTEM] Critical security threats detected', {
          threatLevel: status.threatLevel,
          activeProtections: status.activeProtections
        });
      }

      // Auto-cleanup expired blacklists
      await this.cleanupExpiredBlacklists();
      
      // Auto-reset failed attempts for IPs that have been clean
      await this.cleanupOldFailedAttempts();
      
    } catch (error) {
      logger.error('[SYSTEM] Security check failed:', error);
    }
  }

  /**
   * Clean up expired security data
   */
  async performCleanup() {
    try {
      const redis = this.securityService.redis;
      
      // Clean up old security events (keep last 1000)
      await redis.ltrim('_sys_security_events', 0, 999);
      
      // Clean up old rate limit counters
      const rateLimitKeys = await redis.keys('req_count:*');
      const now = Date.now();
      
      for (const key of rateLimitKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
        }
      }
      
      // Clean up old lockout entries
      const lockoutKeys = await redis.keys('lockout:*');
      for (const key of lockoutKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
        }
      }
      
    } catch (error) {
      logger.error('[SYSTEM] Cleanup failed:', error);
    }
  }

  /**
   * Clean up expired IP blacklists
   */
  async cleanupExpiredBlacklists() {
    try {
      const redis = this.securityService.redis;
      const blacklistKeys = await redis.keys('blacklist:*');
      
      for (const key of blacklistKeys) {
        const ttl = await redis.ttl(key);
        if (ttl <= 0) {
          await redis.del(key);
        }
      }
    } catch (error) {
      logger.error('[SYSTEM] Blacklist cleanup failed:', error);
    }
  }

  /**
   * Clean up old failed login attempts
   */
  async cleanupOldFailedAttempts() {
    try {
      const redis = this.securityService.redis;
      const failedAttemptKeys = await redis.keys('failed_attempts:*');
      const now = Date.now();
      const cleanupThreshold = 24 * 60 * 60 * 1000; // 24 hours
      
      for (const key of failedAttemptKeys) {
        const data = await redis.get(key);
        if (data) {
          try {
            const attempts = JSON.parse(data);
            const lastAttempt = Math.max(...attempts.map(a => new Date(a.timestamp).getTime()));
            
            // If last attempt was more than 24 hours ago, clean it up
            if (now - lastAttempt > cleanupThreshold) {
              await redis.del(key);
            }
          } catch (parseError) {
            // If data is corrupted, remove it
            await redis.del(key);
          }
        }
      }
    } catch (error) {
      logger.error('[SYSTEM] Failed attempts cleanup failed:', error);
    }
  }

  /**
   * Get current security status (internal use only)
   */
  async getStatus() {
    if (!this.isRunning) {
      return {
        active: false,
        message: 'Security monitor not running'
      };
    }

    try {
      const systemStatus = await this.securityService.getSystemSecurityStatus();
      return {
        active: true,
        healthy: systemStatus.isHealthy,
        threatLevel: systemStatus.threatLevel,
        lastCheck: systemStatus.lastCheck
      };
    } catch (error) {
      return {
        active: true,
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Emergency shutdown (in case of critical system issues)
   */
  async emergencyShutdown() {
    logger.error('[SYSTEM] Emergency security shutdown initiated');
    await this.stop();
  }
}

// Create singleton instance
const backgroundSecurityMonitor = new BackgroundSecurityMonitor();

// Auto-start when module is loaded (silent)
process.nextTick(async () => {
  try {
    await backgroundSecurityMonitor.start();
  } catch (error) {
    logger.error('[SYSTEM] Failed to auto-start security monitor:', error);
  }
});

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await backgroundSecurityMonitor.stop();
});

process.on('SIGINT', async () => {
  await backgroundSecurityMonitor.stop();
});

module.exports = backgroundSecurityMonitor;