const crypto = require('crypto');
const redisService = require('./redis');
const databaseService = require('./database');
const logger = require('../utils/logger');
const geoip = require('geoip-lite');
const useragent = require('useragent');

class SecurityService {
  constructor() {
    this.redis = redisService;
    this.db = databaseService;
    this.threatPatterns = {
      sqlInjection: /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i,
      xss: /(<script[^>]*>.*?<\/script>|javascript:|on\w+\s*=)/i,
      pathTraversal: /(\.\.[\/\\]|\.\.%2f|\.\.%5c)/i,
      commandInjection: /(;|\||&|`|\$\(|\${)/i,
      bruteForce: /password|login|auth/i
    };
    this.suspiciousUserAgents = [
      'sqlmap', 'nikto', 'nmap', 'masscan', 'zap', 'burp',
      'wget', 'curl', 'python-requests', 'bot', 'crawler'
    ];
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 900; // 15 minutes
    this.threatScoreThreshold = 100;
  }

  // Real-time threat detection middleware
  async threatDetectionMiddleware(req, res, next) {
    try {
      const clientIP = this.getClientIP(req);
      const userAgent = req.get('User-Agent') || '';
      const requestData = {
        ip: clientIP,
        userAgent,
        url: req.originalUrl,
        method: req.method,
        headers: req.headers,
        body: req.body,
        query: req.query,
        timestamp: new Date().toISOString()
      };

      // Check if IP is blacklisted
      const isBlacklisted = await this.isIPBlacklisted(clientIP);
      if (isBlacklisted) {
        await this.logSecurityEvent('BLOCKED_REQUEST', {
          ...requestData,
          reason: 'IP_BLACKLISTED',
          severity: 'HIGH'
        });
        return res.status(403).json({
          error: 'Access denied',
          message: 'Your IP has been blocked due to suspicious activity'
        });
      }

      // Calculate threat score
      const threatScore = await this.calculateThreatScore(requestData);
      
      if (threatScore >= this.threatScoreThreshold) {
        await this.handleHighThreatRequest(requestData, threatScore);
        return res.status(403).json({
          error: 'Security violation detected',
          message: 'Request blocked by security system'
        });
      }

      // Log suspicious activity
      if (threatScore > 50) {
        await this.logSecurityEvent('SUSPICIOUS_REQUEST', {
          ...requestData,
          threatScore,
          severity: 'MEDIUM'
        });
      }

      // Add security headers to response
      res.set({
        'X-Threat-Score': threatScore.toString(),
        'X-Security-Check': 'PASSED'
      });

      next();
    } catch (error) {
      logger.error('Security middleware error:', error);
      next(); // Continue on error to avoid breaking the application
    }
  }

  // Calculate threat score based on multiple factors
  async calculateThreatScore(requestData) {
    let score = 0;
    const { ip, userAgent, url, method, headers, body, query } = requestData;

    // Check for malicious patterns in URL
    Object.entries(this.threatPatterns).forEach(([type, pattern]) => {
      if (pattern.test(url)) {
        score += 30;
        logger.warn(`Threat pattern detected in URL: ${type}`, { ip, url });
      }
    });

    // Check request body for malicious content
    if (body && typeof body === 'object') {
      const bodyString = JSON.stringify(body);
      Object.entries(this.threatPatterns).forEach(([type, pattern]) => {
        if (pattern.test(bodyString)) {
          score += 25;
          logger.warn(`Threat pattern detected in body: ${type}`, { ip, url });
        }
      });
    }

    // Check query parameters
    if (query && typeof query === 'object') {
      const queryString = JSON.stringify(query);
      Object.entries(this.threatPatterns).forEach(([type, pattern]) => {
        if (pattern.test(queryString)) {
          score += 20;
          logger.warn(`Threat pattern detected in query: ${type}`, { ip, url });
        }
      });
    }

    // Check for suspicious user agents
    const isSuspiciousUA = this.suspiciousUserAgents.some(suspicious => 
      userAgent.toLowerCase().includes(suspicious.toLowerCase())
    );
    if (isSuspiciousUA) {
      score += 40;
      logger.warn('Suspicious user agent detected', { ip, userAgent });
    }

    // Check for unusual request frequency
    const requestCount = await this.getRequestCount(ip);
    if (requestCount > 100) { // More than 100 requests per minute
      score += 30;
      logger.warn('High request frequency detected', { ip, requestCount });
    }

    // Check for geographic anomalies
    const geoScore = await this.checkGeographicAnomaly(ip);
    score += geoScore;

    // Check for failed authentication attempts
    const failedAttempts = await this.getFailedAttempts(ip);
    if (failedAttempts > 3) {
      score += failedAttempts * 10;
    }

    return Math.min(score, 200); // Cap at 200
  }

  // Handle high threat requests
  async handleHighThreatRequest(requestData, threatScore) {
    const { ip } = requestData;
    
    // Temporarily block IP
    await this.temporaryBlockIP(ip, 300); // 5 minutes
    
    // Log security event
    await this.logSecurityEvent('HIGH_THREAT_BLOCKED', {
      ...requestData,
      threatScore,
      severity: 'CRITICAL',
      action: 'IP_TEMPORARILY_BLOCKED'
    });

    // Send alert to administrators
    await this.sendSecurityAlert({
      type: 'HIGH_THREAT_DETECTED',
      ip,
      threatScore,
      timestamp: new Date().toISOString(),
      details: requestData
    });

    logger.error('High threat request blocked', { ip, threatScore, url: requestData.url });
  }

  // Brute force protection
  async bruteForceProtection(req, res, next) {
    try {
      const clientIP = this.getClientIP(req);
      const isAuthEndpoint = /\/(login|auth|signin|register)/.test(req.originalUrl);
      
      if (!isAuthEndpoint) {
        return next();
      }

      const failedAttempts = await this.getFailedAttempts(clientIP);
      
      if (failedAttempts >= this.maxFailedAttempts) {
        const lockoutTime = await this.redis.get(`lockout:${clientIP}`);
        if (lockoutTime) {
          await this.logSecurityEvent('BRUTE_FORCE_BLOCKED', {
            ip: clientIP,
            failedAttempts,
            severity: 'HIGH'
          });
          return res.status(429).json({
            error: 'Account temporarily locked',
            message: `Too many failed attempts. Try again in ${Math.ceil(this.lockoutDuration / 60)} minutes.`,
            retryAfter: this.lockoutDuration
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Brute force protection error:', error);
      next();
    }
  }

  // Record failed authentication attempt
  async recordFailedAttempt(ip, email = null) {
    try {
      const key = `failed_attempts:${ip}`;
      const attempts = await this.redis.incr(key);
      await this.redis.expire(key, 3600); // 1 hour expiry

      if (attempts >= this.maxFailedAttempts) {
        await this.redis.setex(`lockout:${ip}`, this.lockoutDuration, Date.now());
        await this.logSecurityEvent('BRUTE_FORCE_LOCKOUT', {
          ip,
          email,
          attempts,
          severity: 'HIGH'
        });
      }

      return attempts;
    } catch (error) {
      logger.error('Error recording failed attempt:', error);
      return 0;
    }
  }

  // Clear failed attempts on successful login
  async clearFailedAttempts(ip) {
    try {
      await this.redis.del(`failed_attempts:${ip}`);
      await this.redis.del(`lockout:${ip}`);
    } catch (error) {
      logger.error('Error clearing failed attempts:', error);
    }
  }

  // IP blacklist management
  async blacklistIP(ip, reason, duration = 86400) { // 24 hours default
    try {
      await this.redis.setex(`blacklist:${ip}`, duration, JSON.stringify({
        reason,
        timestamp: new Date().toISOString(),
        duration
      }));
      
      await this.logSecurityEvent('IP_BLACKLISTED', {
        ip,
        reason,
        duration,
        severity: 'CRITICAL'
      });
      
      logger.warn(`IP blacklisted: ${ip}`, { reason, duration });
    } catch (error) {
      logger.error('Error blacklisting IP:', error);
    }
  }

  async isIPBlacklisted(ip) {
    try {
      const blacklistData = await this.redis.get(`blacklist:${ip}`);
      return !!blacklistData;
    } catch (error) {
      logger.error('Error checking IP blacklist:', error);
      return false;
    }
  }

  async temporaryBlockIP(ip, duration) {
    try {
      await this.redis.setex(`temp_block:${ip}`, duration, Date.now());
    } catch (error) {
      logger.error('Error temporarily blocking IP:', error);
    }
  }

  // Geographic anomaly detection
  async checkGeographicAnomaly(ip) {
    try {
      const geo = geoip.lookup(ip);
      if (!geo) return 0;

      // Check if this is a known VPN/Proxy IP range
      const isVPN = await this.isVPNIP(ip);
      if (isVPN) return 20;

      // Check for rapid geographic changes
      const lastGeo = await this.redis.get(`geo:${ip}`);
      if (lastGeo) {
        const lastLocation = JSON.parse(lastGeo);
        const distance = this.calculateDistance(
          geo.ll[0], geo.ll[1],
          lastLocation.ll[0], lastLocation.ll[1]
        );
        
        // If location changed by more than 1000km in less than 1 hour
        if (distance > 1000 && (Date.now() - lastLocation.timestamp) < 3600000) {
          return 30;
        }
      }

      // Store current location
      await this.redis.setex(`geo:${ip}`, 3600, JSON.stringify({
        ...geo,
        timestamp: Date.now()
      }));

      return 0;
    } catch (error) {
      logger.error('Error checking geographic anomaly:', error);
      return 0;
    }
  }

  // Request frequency monitoring
  async getRequestCount(ip) {
    try {
      const key = `req_count:${ip}`;
      const count = await this.redis.get(key) || 0;
      await this.redis.incr(key);
      await this.redis.expire(key, 60); // 1 minute window
      return parseInt(count);
    } catch (error) {
      logger.error('Error getting request count:', error);
      return 0;
    }
  }

  async getFailedAttempts(ip) {
    try {
      const attempts = await this.redis.get(`failed_attempts:${ip}`);
      return parseInt(attempts) || 0;
    } catch (error) {
      logger.error('Error getting failed attempts:', error);
      return 0;
    }
  }

  // Security event logging
  async logSecurityEvent(eventType, data) {
    try {
      const event = {
        id: crypto.randomUUID(),
        type: eventType,
        timestamp: new Date().toISOString(),
        ...data
      };

      // Store in Redis for real-time monitoring
      await this.redis.lpush('security_events', JSON.stringify(event));
      await this.redis.ltrim('security_events', 0, 999); // Keep last 1000 events

      // Store in database for long-term analysis
      await this.db.create('security_events', event);

      logger.info(`Security event logged: ${eventType}`, event);
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }

  // Send security alerts (silent mode - no user-facing alerts)
  async sendSecurityAlert(alertData) {
    try {
      // Store alert in hidden system logs only
      await this.redis.lpush('_sys_security_events', JSON.stringify({
        ...alertData,
        id: crypto.randomUUID(),
        read: false,
        silent: true
      }));
      await this.redis.ltrim('_sys_security_events', 0, 99); // Keep last 100 for analysis

      // Only log critical threats to system logs (not user-visible)
      if (alertData.type === 'HIGH_THREAT_DETECTED') {
        logger.error('[SYSTEM] Security threat detected', { 
          ip: alertData.ip, 
          threatScore: alertData.threatScore,
          timestamp: alertData.timestamp 
        });
      }
    } catch (error) {
      logger.error('Error processing security event:', error);
    }
  }

  // Utility functions
  getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  async isVPNIP(ip) {
    // Simple VPN detection - in production, use a proper VPN detection service
    const vpnRanges = [
      '10.0.0.0/8',
      '172.16.0.0/12',
      '192.168.0.0/16'
    ];
    // This is a simplified check - implement proper CIDR matching
    return false;
  }

  // Internal system monitoring (no dashboard exposure)
  async getSystemSecurityStatus() {
    try {
      const stats = await this.getSecurityStats();
      
      // Return minimal status for internal health checks only
      return {
        isHealthy: stats.threatsLastHour < 5,
        threatLevel: stats.threatsLastHour > 10 ? 'HIGH' : 'NORMAL',
        activeProtections: stats.blockedIPs,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting system security status:', error);
      return { 
        isHealthy: false, 
        threatLevel: 'UNKNOWN', 
        activeProtections: 0,
        lastCheck: new Date().toISOString()
      };
    }
  }

  async getSecurityStats() {
    try {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 3600000);
      const dayAgo = new Date(now.getTime() - 86400000);

      // Get stats from database
      const [hourlyThreats, dailyThreats, blockedIPs] = await Promise.all([
        this.db.count('security_events', { 
          timestamp: { $gte: hourAgo.toISOString() },
          severity: { $in: ['HIGH', 'CRITICAL'] }
        }),
        this.db.count('security_events', { 
          timestamp: { $gte: dayAgo.toISOString() }
        }),
        this.redis.keys('blacklist:*')
      ]);

      return {
        threatsLastHour: hourlyThreats,
        threatsLast24Hours: dailyThreats,
        blockedIPs: blockedIPs.length,
        systemStatus: 'ACTIVE'
      };
    } catch (error) {
      logger.error('Error getting security stats:', error);
      return {
        threatsLastHour: 0,
        threatsLast24Hours: 0,
        blockedIPs: 0,
        systemStatus: 'ERROR'
      };
    }
  }
}

module.exports = { SecurityService };