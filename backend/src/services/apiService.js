const databaseService = require('./database');
const redisService = require('./redis');
const emailService = require('./emailService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class APIService {
  constructor() {
    this.db = databaseService;
    this.redis = redisService;
    this.email = emailService;
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
    this.JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';
    this.REFRESH_TOKEN_EXPIRE = process.env.REFRESH_TOKEN_EXPIRE || '7d';
  }

  // =====================================
  // AUTHENTICATION SERVICES
  // =====================================

  async registerUser(userData) {
    try {
      const { email, password, firstName, lastName, role = 'player', ...additionalData } = userData;

      // Check if user already exists
      const existingUser = await this.db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.length > 0) {
        throw new Error('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');

      // Create user record
      const userRecord = {
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        verification_token: verificationToken,
        email_verified: false,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        ...additionalData
      };

      const newUser = await this.db.create('users', userRecord);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(newUser);

      // Store refresh token
      await this.redis.set(`refresh_token:${newUser.id}`, refreshToken, 7 * 24 * 60 * 60); // 7 days

      // Send verification email (async)
      this.sendVerificationEmail(newUser, verificationToken).catch(console.error);

      // Return sanitized user data
      const sanitizedUser = this.sanitizeUser(newUser);

      return {
        success: true,
        data: {
          user: sanitizedUser,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60 // 24 hours in seconds
          }
        },
        message: 'Registration successful. Please check your email for verification.'
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message || 'Registration failed',
        code: 'REGISTRATION_FAILED'
      };
    }
  }

  async loginUser(credentials) {
    try {
      const { email, password, rememberMe = false } = credentials;

      // Find user by email
      const users = await this.db.query(
        'SELECT * FROM users WHERE email = $1 AND status = $2',
        [email, 'active']
      );

      if (users.length === 0) {
        throw new Error('Invalid email or password');
      }

      const user = users[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Update last login
      await this.db.update('users', user.id, {
        last_login: new Date(),
        updated_at: new Date()
      });

      // Generate tokens
      const tokenExpiry = rememberMe ? '30d' : '24h';
      const { accessToken, refreshToken } = this.generateTokens(user, tokenExpiry);

      // Store refresh token
      const refreshExpiry = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
      await this.redis.set(`refresh_token:${user.id}`, refreshToken, refreshExpiry);

      // Return sanitized user data
      const sanitizedUser = this.sanitizeUser(user);

      return {
        success: true,
        data: {
          user: sanitizedUser,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60
          }
        },
        message: 'Login successful'
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.message || 'Login failed',
        code: 'LOGIN_FAILED'
      };
    }
  }

  async googleAuth(profile) {
    try {
      // Check if user exists by Google ID
      let users = await this.db.query(
        'SELECT * FROM users WHERE google_id = $1',
        [profile.id]
      );

      let user;
      let isNewUser = false;

      if (users.length > 0) {
        user = users[0];
      } else {
        // Check if user exists by email
        users = await this.db.query(
          'SELECT * FROM users WHERE email = $1',
          [profile.emails[0].value]
        );

        if (users.length > 0) {
          // Link Google account to existing user
          user = users[0];
          await this.db.update('users', user.id, {
            google_id: profile.id,
            avatar_url: profile.photos[0]?.value,
            email_verified: true,
            updated_at: new Date()
          });
        } else {
          // Create new user
          isNewUser = true;
          const userRecord = {
            google_id: profile.id,
            email: profile.emails[0].value,
            first_name: profile.name.givenName,
            last_name: profile.name.familyName,
            avatar_url: profile.photos[0]?.value,
            email_verified: true,
            role: 'player',
            status: 'active',
            created_at: new Date(),
            updated_at: new Date()
          };

          user = await this.db.create('users', userRecord);
        }
      }

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user);

      // Store refresh token
      await this.redis.set(`refresh_token:${user.id}`, refreshToken, 7 * 24 * 60 * 60);

      // Return sanitized user data
      const sanitizedUser = this.sanitizeUser(user);

      return {
        success: true,
        data: {
          user: sanitizedUser,
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: 24 * 60 * 60
          },
          isNewUser
        },
        message: isNewUser ? 'Account created successfully with Google' : 'Login successful'
      };

    } catch (error) {
      console.error('Google auth error:', error);
      return {
        success: false,
        error: error.message || 'Google authentication failed',
        code: 'GOOGLE_AUTH_FAILED'
      };
    }
  }

  // =====================================
  // PLAYER MANAGEMENT SERVICES
  // =====================================

  async getPlayers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'created_at', sortOrder = 'DESC' } = pagination;
      const { teamId, position, status, search } = filters;

      let whereClause = 'WHERE p.deleted_at IS NULL';
      const params = [];
      let paramIndex = 1;

      if (teamId) {
        whereClause += ` AND p.team_id = $${paramIndex}`;
        params.push(teamId);
        paramIndex++;
      }

      if (position) {
        whereClause += ` AND p.position = $${paramIndex}`;
        params.push(position);
        paramIndex++;
      }

      if (status) {
        whereClause += ` AND p.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (search) {
        whereClause += ` AND (p.first_name ILIKE $${paramIndex} OR p.last_name ILIKE $${paramIndex} OR p.email ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const offset = (page - 1) * limit;

      const query = `
        SELECT 
          p.*,
          t.name as team_name,
          COALESCE(ps.goals, 0) as goals,
          COALESCE(ps.assists, 0) as assists,
          COALESCE(ps.matches_played, 0) as matches_played,
          COALESCE(ps.rating, 0) as rating
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN player_statistics ps ON p.id = ps.player_id
        ${whereClause}
        ORDER BY p.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      params.push(limit, offset);

      const players = await this.db.query(query, params);

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total
        FROM players p
        ${whereClause}
      `;
      
      const countResult = await this.db.query(countQuery, params.slice(0, -2));
      const total = parseInt(countResult[0].total);

      return {
        success: true,
        data: {
          players,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        },
        message: `Retrieved ${players.length} players`
      };

    } catch (error) {
      console.error('Get players error:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve players',
        code: 'GET_PLAYERS_FAILED'
      };
    }
  }

  async createPlayer(playerData) {
    try {
      const {
        firstName,
        lastName,
        email,
        position,
        teamId,
        dateOfBirth,
        nationality,
        height,
        weight,
        preferredFoot,
        jerseyNumber,
        ...additionalData
      } = playerData;

      // Check for duplicate email
      if (email) {
        const existingPlayer = await this.db.query(
          'SELECT id FROM players WHERE email = $1 AND deleted_at IS NULL',
          [email]
        );

        if (existingPlayer.length > 0) {
          throw new Error('Player with this email already exists');
        }
      }

      // Check for duplicate jersey number in team
      if (jerseyNumber && teamId) {
        const existingJersey = await this.db.query(
          'SELECT id FROM players WHERE team_id = $1 AND jersey_number = $2 AND deleted_at IS NULL',
          [teamId, jerseyNumber]
        );

        if (existingJersey.length > 0) {
          throw new Error('Jersey number already taken in this team');
        }
      }

      const playerRecord = {
        first_name: firstName,
        last_name: lastName,
        email,
        position,
        team_id: teamId,
        date_of_birth: dateOfBirth,
        nationality,
        height,
        weight,
        preferred_foot: preferredFoot,
        jersey_number: jerseyNumber,
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        ...additionalData
      };

      const newPlayer = await this.db.create('players', playerRecord);

      // Initialize player statistics
      await this.db.create('player_statistics', {
        player_id: newPlayer.id,
        goals: 0,
        assists: 0,
        matches_played: 0,
        minutes_played: 0,
        yellow_cards: 0,
        red_cards: 0,
        rating: 0,
        created_at: new Date(),
        updated_at: new Date()
      });

      return {
        success: true,
        data: { player: newPlayer },
        message: 'Player created successfully'
      };

    } catch (error) {
      console.error('Create player error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create player',
        code: 'CREATE_PLAYER_FAILED'
      };
    }
  }

  // =====================================
  // ANALYTICS SERVICES
  // =====================================

  async getDashboardAnalytics(userId, filters = {}) {
    try {
      const { teamId, dateRange = '30d' } = filters;
      const cacheKey = `analytics:dashboard:${userId}:${teamId || 'all'}:${dateRange}`;
      
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate date range
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      // Parallel queries for better performance
      const [
        playerStats,
        matchStats,
        teamPerformance,
        recentMatches,
        topScorers,
        injuryReport
      ] = await Promise.all([
        this.getPlayerStatsOverview(teamId, startDate),
        this.getMatchStatsOverview(teamId, startDate),
        this.getTeamPerformanceMetrics(teamId, startDate),
        this.getRecentMatches(teamId, 5),
        this.getTopScorers(teamId, 10),
        this.getInjuryReport(teamId)
      ]);

      const result = {
        success: true,
        data: {
          overview: {
            dateRange,
            startDate,
            endDate: now
          },
          playerStats: playerStats.data,
          matchStats: matchStats.data,
          teamPerformance: teamPerformance.data,
          recentMatches: recentMatches.data,
          topScorers: topScorers.data,
          injuryReport: injuryReport.data
        },
        message: 'Analytics data retrieved successfully'
      };

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(result));
      
      return result;

    } catch (error) {
      console.error('Dashboard analytics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve analytics',
        code: 'ANALYTICS_FAILED'
      };
    }
  }

  async getPlayerStatsOverview(teamId, startDate) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_players,
          COUNT(*) FILTER (WHERE status = 'active') as active_players,
          COUNT(*) FILTER (WHERE status = 'injured') as injured_players,
          AVG(EXTRACT(YEAR FROM AGE(date_of_birth))) as avg_age,
          COUNT(DISTINCT position) as positions_covered
        FROM players 
        WHERE deleted_at IS NULL
      `;
      
      const params = [];
      if (teamId) {
        query += ` AND team_id = $1`;
        params.push(teamId);
      }

      const result = await this.db.query(query, params);

      return {
        success: true,
        data: result[0] || {}
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: {}
      };
    }
  }

  // =====================================
  // UTILITY FUNCTIONS
  // =====================================

  generateTokens(user, expiry = '24h') {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: expiry,
      issuer: 'statsor-api',
      audience: 'statsor-frontend'
    });

    const refreshToken = jwt.sign(payload, this.JWT_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRE,
      issuer: 'statsor-api',
      audience: 'statsor-frontend'
    });

    return { accessToken, refreshToken };
  }

  sanitizeUser(user) {
    const {
      password_hash,
      verification_token,
      reset_token,
      reset_token_expires,
      ...sanitizedUser
    } = user;
    
    return sanitizedUser;
  }

  async sendVerificationEmail(user, token) {
    try {
      await this.email.sendVerificationEmail(user.email, {
        firstName: user.first_name,
        verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${token}`,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@statsor.com'
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
    }
  }

  // =====================================
  // BATCH OPERATIONS
  // =====================================

  async batchCreatePlayers(playersData, teamId) {
    try {
      const results = [];
      const errors = [];

      for (let i = 0; i < playersData.length; i++) {
        try {
          const playerData = { ...playersData[i], teamId };
          const result = await this.createPlayer(playerData);
          
          if (result.success) {
            results.push({ index: i, player: result.data.player });
          } else {
            errors.push({ index: i, error: result.error });
          }
        } catch (error) {
          errors.push({ index: i, error: error.message });
        }
      }

      return {
        success: errors.length === 0,
        data: {
          created: results,
          errors: errors,
          summary: {
            total: playersData.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Batch operation completed: ${results.length}/${playersData.length} players created`
      };

    } catch (error) {
      console.error('Batch create players error:', error);
      return {
        success: false,
        error: error.message || 'Batch operation failed',
        code: 'BATCH_CREATE_FAILED'
      };
    }
  }

  async batchUpdatePlayers(updates) {
    try {
      const results = [];
      const errors = [];

      for (const update of updates) {
        try {
          const { id, data } = update;
          const result = await this.updatePlayer(id, data);
          
          if (result.success) {
            results.push({ id, player: result.data.player });
          } else {
            errors.push({ id, error: result.error });
          }
        } catch (error) {
          errors.push({ id: update.id, error: error.message });
        }
      }

      return {
        success: errors.length === 0,
        data: {
          updated: results,
          errors: errors,
          summary: {
            total: updates.length,
            successful: results.length,
            failed: errors.length
          }
        },
        message: `Batch update completed: ${results.length}/${updates.length} players updated`
      };

    } catch (error) {
      console.error('Batch update players error:', error);
      return {
        success: false,
        error: error.message || 'Batch update failed',
        code: 'BATCH_UPDATE_FAILED'
      };
    }
  }

  // =====================================
  // ADVANCED SEARCH & FILTERING
  // =====================================

  async advancedPlayerSearch(searchCriteria) {
    try {
      const {
        query,
        filters = {},
        sorting = { field: 'created_at', direction: 'DESC' },
        pagination = { page: 1, limit: 20 },
        facets = []
      } = searchCriteria;

      let baseQuery = `
        SELECT p.*, t.name as team_name, 
               ps.goals, ps.assists, ps.matches_played, ps.rating,
               COUNT(*) OVER() as total_count
        FROM players p
        LEFT JOIN teams t ON p.team_id = t.id
        LEFT JOIN player_statistics ps ON p.id = ps.player_id
        WHERE p.deleted_at IS NULL
      `;
      
      const params = [];
      let paramIndex = 1;

      // Full-text search
      if (query) {
        baseQuery += ` AND (
          p.first_name ILIKE $${paramIndex} OR 
          p.last_name ILIKE $${paramIndex} OR 
          p.email ILIKE $${paramIndex} OR
          CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex}
        )`;
        params.push(`%${query}%`);
        paramIndex++;
      }

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          switch (key) {
            case 'position':
              if (Array.isArray(value)) {
                baseQuery += ` AND p.position = ANY($${paramIndex})`;
                params.push(value);
              } else {
                baseQuery += ` AND p.position = $${paramIndex}`;
                params.push(value);
              }
              paramIndex++;
              break;
            case 'ageRange':
              if (value.min) {
                baseQuery += ` AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) >= $${paramIndex}`;
                params.push(value.min);
                paramIndex++;
              }
              if (value.max) {
                baseQuery += ` AND EXTRACT(YEAR FROM AGE(p.date_of_birth)) <= $${paramIndex}`;
                params.push(value.max);
                paramIndex++;
              }
              break;
            case 'ratingRange':
              if (value.min) {
                baseQuery += ` AND ps.rating >= $${paramIndex}`;
                params.push(value.min);
                paramIndex++;
              }
              if (value.max) {
                baseQuery += ` AND ps.rating <= $${paramIndex}`;
                params.push(value.max);
                paramIndex++;
              }
              break;
            default:
              baseQuery += ` AND p.${key} = $${paramIndex}`;
              params.push(value);
              paramIndex++;
          }
        }
      });

      // Sorting
      const validSortFields = ['first_name', 'last_name', 'position', 'created_at', 'rating', 'goals'];
      const sortField = validSortFields.includes(sorting.field) ? sorting.field : 'created_at';
      const sortDirection = ['ASC', 'DESC'].includes(sorting.direction) ? sorting.direction : 'DESC';
      
      baseQuery += ` ORDER BY ${sortField} ${sortDirection}`;

      // Pagination
      const offset = (pagination.page - 1) * pagination.limit;
      baseQuery += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pagination.limit, offset);

      const players = await this.db.query(baseQuery, params);
      const total = players.length > 0 ? parseInt(players[0].total_count) : 0;

      // Get facets if requested
      const facetData = {};
      if (facets.length > 0) {
        for (const facet of facets) {
          facetData[facet] = await this.getPlayerFacets(facet, filters);
        }
      }

      return {
        success: true,
        data: {
          players: players.map(p => {
            const { total_count, ...player } = p;
            return player;
          }),
          pagination: {
            page: pagination.page,
            limit: pagination.limit,
            total,
            totalPages: Math.ceil(total / pagination.limit),
            hasNext: pagination.page * pagination.limit < total,
            hasPrev: pagination.page > 1
          },
          facets: facetData,
          meta: {
            query,
            filters,
            sorting,
            searchTime: Date.now()
          }
        },
        message: `Found ${total} players matching criteria`
      };

    } catch (error) {
      console.error('Advanced player search error:', error);
      return {
        success: false,
        error: error.message || 'Search failed',
        code: 'SEARCH_FAILED'
      };
    }
  }

  async getPlayerFacets(facetType, currentFilters = {}) {
    try {
      let query;
      let params = [];
      
      switch (facetType) {
        case 'positions':
          query = `
            SELECT position as value, COUNT(*) as count
            FROM players 
            WHERE deleted_at IS NULL AND position IS NOT NULL
            GROUP BY position 
            ORDER BY count DESC
          `;
          break;
        case 'teams':
          query = `
            SELECT t.id as value, t.name as label, COUNT(p.id) as count
            FROM teams t
            LEFT JOIN players p ON t.id = p.team_id AND p.deleted_at IS NULL
            GROUP BY t.id, t.name
            HAVING COUNT(p.id) > 0
            ORDER BY count DESC
          `;
          break;
        case 'nationalities':
          query = `
            SELECT nationality as value, COUNT(*) as count
            FROM players 
            WHERE deleted_at IS NULL AND nationality IS NOT NULL
            GROUP BY nationality 
            ORDER BY count DESC
          `;
          break;
        default:
          return [];
      }

      const results = await this.db.query(query, params);
      return results;

    } catch (error) {
      console.error('Get player facets error:', error);
      return [];
    }
  }

  // =====================================
  // REAL-TIME ANALYTICS
  // =====================================

  async getRealTimeAnalytics(teamId) {
    try {
      const cacheKey = `realtime:analytics:${teamId}`;
      
      // Check if data exists in cache
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const [liveMatches, recentGoals, playerActivities] = await Promise.all([
        this.getLiveMatches(teamId),
        this.getRecentGoals(teamId, 10),
        this.getRecentPlayerActivities(teamId, 20)
      ]);

      const result = {
        success: true,
        data: {
          timestamp: new Date(),
          liveMatches: liveMatches.data || [],
          recentGoals: recentGoals.data || [],
          playerActivities: playerActivities.data || [],
          stats: {
            activePlayers: await this.getActivePlayersCount(teamId),
            todayTrainingSessions: await this.getTodayTrainingSessions(teamId),
            weeklyGoals: await this.getWeeklyGoalsCount(teamId)
          }
        },
        message: 'Real-time analytics retrieved successfully'
      };

      // Cache for 30 seconds
      await this.redis.setex(cacheKey, 30, JSON.stringify(result));
      
      return result;

    } catch (error) {
      console.error('Real-time analytics error:', error);
      return {
        success: false,
        error: error.message || 'Failed to retrieve real-time analytics',
        code: 'REALTIME_ANALYTICS_FAILED'
      };
    }
  }

  // =====================================
  // CACHING UTILITIES
  // =====================================

  async invalidateCache(patterns) {
    try {
      if (typeof patterns === 'string') {
        patterns = [patterns];
      }

      for (const pattern of patterns) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }

      return {
        success: true,
        message: 'Cache invalidated successfully'
      };

    } catch (error) {
      console.error('Cache invalidation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Rate limiting check
  async checkRateLimit(key, limit, windowMs) {
    try {
      const current = await this.redis.get(key);
      if (current && parseInt(current) >= limit) {
        return false;
      }
      
      await this.redis.incr(key);
      await this.redis.expire(key, Math.ceil(windowMs / 1000));
      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow on error
    }
  }
}

module.exports = { APIService };