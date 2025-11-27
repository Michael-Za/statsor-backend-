const winston = require('winston');
const jwt = require('jsonwebtoken');
const redisService = require('./redis');
const { APIService } = require('./apiService');
const EventEmitter = require('events');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/socket.log' })
  ]
});

class SocketService extends EventEmitter {
  constructor() {
    super();
    this.io = null;
    this.connectedUsers = new Map();
    this.rooms = new Map();
    this.analyticsStreams = new Map();
    this.apiService = new APIService();
    this.redis = redisService;
    this.performanceMetrics = {
      connections: 0,
      totalMessages: 0,
      roomCount: 0,
      averageLatency: 0
    };
    this.setupPerformanceMonitoring();
  }

  initialize(io) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
    this.setupAnalyticsStreaming();
    this.setupHeartbeat();
    logger.info('🚀 Enhanced Socket service initialized with real-time capabilities');
  }

  setupPerformanceMonitoring() {
    setInterval(() => {
      this.updatePerformanceMetrics();
      this.emit('performance_metrics', this.performanceMetrics);
    }, 30000); // Every 30 seconds
  }

  updatePerformanceMetrics() {
    this.performanceMetrics = {
      connections: this.connectedUsers.size,
      totalMessages: this.performanceMetrics.totalMessages,
      roomCount: this.rooms.size,
      averageLatency: this.calculateAverageLatency(),
      timestamp: new Date().toISOString()
    };
  }

  calculateAverageLatency() {
    // Calculate average latency based on ping responses
    const latencies = Array.from(this.connectedUsers.values())
      .filter(user => user.latency !== undefined)
      .map(user => user.latency);
    
    return latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;
  }

  setupHeartbeat() {
    setInterval(() => {
      const timestamp = Date.now();
      this.io.emit('ping', timestamp);
    }, 30000); // Every 30 seconds
  }

  setupAnalyticsStreaming() {
    // Set up real-time analytics data streaming
    setInterval(async () => {
      try {
        for (const [streamId, streamConfig] of this.analyticsStreams.entries()) {
          const { type, teamId, subscribers } = streamConfig;
          
          if (subscribers.size === 0) continue;

          let data;
          switch (type) {
            case 'dashboard':
              data = await this.apiService.getRealTimeAnalytics(teamId);
              break;
            case 'player_performance':
              data = await this.apiService.getRealtimePlayerPerformance(teamId);
              break;
            case 'match_live':
              data = await this.apiService.getLiveMatchData(teamId);
              break;
            default:
              continue;
          }

          if (data?.success) {
            subscribers.forEach(socketId => {
              this.io.to(socketId).emit('analytics_update', {
                type,
                teamId,
                data: data.data,
                timestamp: new Date().toISOString()
              });
            });
          }
        }
      } catch (error) {
        logger.error('Analytics streaming error:', error);
      }
    }, 5000); // Every 5 seconds
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        socket.userEmail = decoded.email;
        
        // Store user session in Redis
        await redisService.setSession(`socket:${socket.id}`, {
          userId: decoded.userId,
          email: decoded.email,
          connectedAt: new Date().toISOString()
        }, 3600);

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Invalid authentication token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.userId} (${socket.id})`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, {
        socketId: socket.id,
        email: socket.userEmail,
        connectedAt: new Date(),
        rooms: new Set()
      });

      // Handle user joining rooms
      socket.on('join_room', async (data) => {
        try {
          const { roomType, roomId } = data;
          const roomKey = `${roomType}:${roomId}`;
          
          await socket.join(roomKey);
          
          // Track room membership
          if (this.connectedUsers.has(socket.userId)) {
            this.connectedUsers.get(socket.userId).rooms.add(roomKey);
          }
          
          // Update room info
          if (!this.rooms.has(roomKey)) {
            this.rooms.set(roomKey, new Set());
          }
          this.rooms.get(roomKey).add(socket.userId);
          
          socket.emit('room_joined', { roomType, roomId, success: true });
          
          // Notify others in the room
          socket.to(roomKey).emit('user_joined_room', {
            userId: socket.userId,
            email: socket.userEmail,
            roomType,
            roomId
          });
          
          logger.info(`User ${socket.userId} joined room ${roomKey}`);
        } catch (error) {
          logger.error('Error joining room:', error);
          socket.emit('room_joined', { success: false, error: error.message });
        }
      });

      // Handle leaving rooms
      socket.on('leave_room', async (data) => {
        try {
          const { roomType, roomId } = data;
          const roomKey = `${roomType}:${roomId}`;
          
          await socket.leave(roomKey);
          
          // Update tracking
          if (this.connectedUsers.has(socket.userId)) {
            this.connectedUsers.get(socket.userId).rooms.delete(roomKey);
          }
          
          if (this.rooms.has(roomKey)) {
            this.rooms.get(roomKey).delete(socket.userId);
            if (this.rooms.get(roomKey).size === 0) {
              this.rooms.delete(roomKey);
            }
          }
          
          socket.emit('room_left', { roomType, roomId, success: true });
          
          // Notify others in the room
          socket.to(roomKey).emit('user_left_room', {
            userId: socket.userId,
            email: socket.userEmail,
            roomType,
            roomId
          });
          
          logger.info(`User ${socket.userId} left room ${roomKey}`);
        } catch (error) {
          logger.error('Error leaving room:', error);
          socket.emit('room_left', { success: false, error: error.message });
        }
      });

      // Handle chat messages
      socket.on('chat_message', async (data) => {
        try {
          const { roomType, roomId, message, messageType = 'text' } = data;
          const roomKey = `${roomType}:${roomId}`;
          
          const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId: socket.userId,
            email: socket.userEmail,
            message,
            messageType,
            timestamp: new Date().toISOString(),
            roomType,
            roomId
          };
          
          // Store message in Redis for history
          await redisService.set(
            `chat:${roomKey}:${chatMessage.id}`,
            chatMessage,
            86400 // 24 hours
          );
          
          // Broadcast to room
          this.io.to(roomKey).emit('chat_message', chatMessage);
          
          logger.info(`Chat message sent in room ${roomKey} by user ${socket.userId}`);
        } catch (error) {
          logger.error('Error handling chat message:', error);
          socket.emit('chat_error', { error: error.message });
        }
      });

      // Handle pong responses for latency calculation
      socket.on('pong', (timestamp) => {
        try {
          const latency = Date.now() - timestamp;
          if (this.connectedUsers.has(socket.userId)) {
            this.connectedUsers.get(socket.userId).latency = latency;
          }
        } catch (error) {
          logger.error('Error handling pong:', error);
        }
      });

      // Handle analytics stream subscription
      socket.on('subscribe_analytics', async (data) => {
        try {
          const { type, teamId } = data;
          const streamId = `${type}:${teamId}`;
          
          if (!this.analyticsStreams.has(streamId)) {
            this.analyticsStreams.set(streamId, {
              type,
              teamId,
              subscribers: new Set()
            });
          }
          
          this.analyticsStreams.get(streamId).subscribers.add(socket.id);
          
          socket.emit('analytics_subscribed', { type, teamId, success: true });
          logger.info(`User ${socket.userId} subscribed to analytics: ${streamId}`);
        } catch (error) {
          logger.error('Error subscribing to analytics:', error);
          socket.emit('analytics_subscribed', { success: false, error: error.message });
        }
      });

      // Handle analytics stream unsubscription
      socket.on('unsubscribe_analytics', async (data) => {
        try {
          const { type, teamId } = data;
          const streamId = `${type}:${teamId}`;
          
          if (this.analyticsStreams.has(streamId)) {
            this.analyticsStreams.get(streamId).subscribers.delete(socket.id);
            
            // Clean up empty streams
            if (this.analyticsStreams.get(streamId).subscribers.size === 0) {
              this.analyticsStreams.delete(streamId);
            }
          }
          
          socket.emit('analytics_unsubscribed', { type, teamId, success: true });
          logger.info(`User ${socket.userId} unsubscribed from analytics: ${streamId}`);
        } catch (error) {
          logger.error('Error unsubscribing from analytics:', error);
          socket.emit('analytics_unsubscribed', { success: false, error: error.message });
        }
      });

      // Handle player status updates
      socket.on('player_status_update', async (data) => {
        try {
          const { playerId, status, location, activity } = data;
          
          const statusUpdate = {
            playerId,
            status,
            location,
            activity,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userId
          };
          
          // Store in Redis for real-time tracking
          await redisService.set(
            `player_status:${playerId}`,
            statusUpdate,
            300 // 5 minutes
          );
          
          // Broadcast to team rooms
          const teamRooms = Array.from(this.rooms.keys())
            .filter(room => room.startsWith('team:'));
          
          teamRooms.forEach(room => {
            this.io.to(room).emit('player_status_update', statusUpdate);
          });
          
          logger.info(`Player status update: ${playerId} - ${status}`);
        } catch (error) {
          logger.error('Error handling player status update:', error);
          socket.emit('player_status_error', { error: error.message });
        }
      });

      // Handle training session live updates
      socket.on('training_live_update', async (data) => {
        try {
          const { sessionId, updateType, playerData, drillData } = data;
          const roomKey = `training:${sessionId}`;
          
          const trainingUpdate = {
            sessionId,
            updateType,
            playerData,
            drillData,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userId
          };
          
          // Store in Redis
          await redisService.set(
            `training_update:${sessionId}:${Date.now()}`,
            trainingUpdate,
            7200 // 2 hours
          );
          
          // Broadcast to training room
          this.io.to(roomKey).emit('training_live_update', trainingUpdate);
          
          logger.info(`Training live update: ${sessionId} - ${updateType}`);
        } catch (error) {
          logger.error('Error handling training update:', error);
          socket.emit('training_update_error', { error: error.message });
        }
      });

      // Handle performance alerts
      socket.on('performance_alert', async (data) => {
        try {
          const { alertType, playerId, teamId, severity, message, metrics } = data;
          
          const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            alertType,
            playerId,
            teamId,
            severity,
            message,
            metrics,
            timestamp: new Date().toISOString(),
            createdBy: socket.userId
          };
          
          // Store alert
          await redisService.set(
            `performance_alert:${alert.id}`,
            alert,
            86400 // 24 hours
          );
          
          // Broadcast to relevant rooms
          const targetRooms = [`team:${teamId}`];
          if (playerId) {
            targetRooms.push(`player:${playerId}`);
          }
          
          targetRooms.forEach(room => {
            this.io.to(room).emit('performance_alert', alert);
          });
          
          logger.info(`Performance alert created: ${alertType} - ${severity}`);
        } catch (error) {
          logger.error('Error handling performance alert:', error);
          socket.emit('performance_alert_error', { error: error.message });
        }
      });

      // Handle injury reports
      socket.on('injury_report', async (data) => {
        try {
          const { playerId, injuryType, severity, description, estimatedRecovery } = data;
          
          const injuryReport = {
            id: `injury_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            playerId,
            injuryType,
            severity,
            description,
            estimatedRecovery,
            timestamp: new Date().toISOString(),
            reportedBy: socket.userId,
            status: 'active'
          };
          
          // Store injury report
          await redisService.set(
            `injury_report:${injuryReport.id}`,
            injuryReport,
            30 * 86400 // 30 days
          );
          
          // Notify medical staff and coaches
          const medicalRooms = Array.from(this.rooms.keys())
            .filter(room => room.includes('medical') || room.includes('coach'));
          
          medicalRooms.forEach(room => {
            this.io.to(room).emit('injury_report', injuryReport);
          });
          
          logger.info(`Injury report created for player ${playerId}: ${injuryType}`);
        } catch (error) {
          logger.error('Error handling injury report:', error);
          socket.emit('injury_report_error', { error: error.message });
        }
      });

      // Handle tactical board updates
      socket.on('tactical_update', async (data) => {
        try {
          const { matchId, formation, playerPositions, tacticalNotes } = data;
          const roomKey = `match:${matchId}`;
          
          const tacticalUpdate = {
            matchId,
            formation,
            playerPositions,
            tacticalNotes,
            timestamp: new Date().toISOString(),
            updatedBy: socket.userId
          };
          
          // Store tactical update
          await redisService.set(
            `tactical_update:${matchId}:${Date.now()}`,
            tacticalUpdate,
            3600 // 1 hour
          );
          
          // Broadcast to match room
          this.io.to(roomKey).emit('tactical_update', tacticalUpdate);
          
          logger.info(`Tactical update for match ${matchId}`);
        } catch (error) {
          logger.error('Error handling tactical update:', error);
          socket.emit('tactical_update_error', { error: error.message });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async (reason) => {
        logger.info(`User disconnected: ${socket.userId} (${socket.id}) - Reason: ${reason}`);
        
        try {
          // Clean up user from all rooms
          if (this.connectedUsers.has(socket.userId)) {
            const user = this.connectedUsers.get(socket.userId);
            
            // Notify all rooms about user leaving
            user.rooms.forEach(roomKey => {
              socket.to(roomKey).emit('user_disconnected', {
                userId: socket.userId,
                email: socket.userEmail,
                disconnectedAt: new Date().toISOString()
              });
              
              // Clean up room tracking
              if (this.rooms.has(roomKey)) {
                this.rooms.get(roomKey).delete(socket.userId);
                if (this.rooms.get(roomKey).size === 0) {
                  this.rooms.delete(roomKey);
                }
              }
            });
            
            this.connectedUsers.delete(socket.userId);
          }
          
          // Clean up session from Redis
          await redisService.deleteSession(`socket:${socket.id}`);
          
        } catch (error) {
          logger.error('Error during disconnect cleanup:', error);
        }
      });
    });
  }

  // Public methods for external use
  async broadcastToRoom(roomType, roomId, event, data) {
    try {
      const roomKey = `${roomType}:${roomId}`;
      this.io.to(roomKey).emit(event, data);
      logger.info(`Broadcasted ${event} to room ${roomKey}`);
      return true;
    } catch (error) {
      logger.error('Error broadcasting to room:', error);
      return false;
    }
  }

  async sendToUser(userId, event, data) {
    try {
      if (this.connectedUsers.has(userId)) {
        const user = this.connectedUsers.get(userId);
        this.io.to(user.socketId).emit(event, data);
        logger.info(`Sent ${event} to user ${userId}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error sending to user:', error);
      return false;
    }
  }

  async broadcastToAll(event, data) {
    try {
      this.io.emit(event, data);
      logger.info(`Broadcasted ${event} to all connected users`);
      return true;
    } catch (error) {
      logger.error('Error broadcasting to all:', error);
      return false;
    }
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  getRoomUsers(roomType, roomId) {
    const roomKey = `${roomType}:${roomId}`;
    return this.rooms.has(roomKey) ? Array.from(this.rooms.get(roomKey)) : [];
  }

  getStats() {
    return {
      connectedUsers: this.connectedUsers.size,
      activeRooms: this.rooms.size,
      totalConnections: this.io.engine.clientsCount,
      analyticsStreams: this.analyticsStreams.size,
      performanceMetrics: this.performanceMetrics
    };
  }

  // =====================================
  // ENHANCED METHODS
  // =====================================

  /**
   * Create emergency alert for all connected users
   */
  createEmergencyAlert(alertData) {
    try {
      const alert = {
        id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'emergency',
        ...alertData,
        timestamp: new Date().toISOString()
      };
      
      this.io.emit('emergency_alert', alert);
      logger.warn(`Emergency alert broadcasted: ${alert.id}`);
      
      return alert;
    } catch (error) {
      logger.error('Error creating emergency alert:', error);
      return null;
    }
  }

  /**
   * Broadcast analytics update to subscribers
   */
  broadcastAnalyticsUpdate(type, teamId, data) {
    try {
      const streamId = `${type}:${teamId}`;
      const stream = this.analyticsStreams.get(streamId);
      
      if (stream && stream.subscribers.size > 0) {
        const updateData = {
          type,
          teamId,
          data,
          timestamp: new Date().toISOString()
        };
        
        stream.subscribers.forEach(socketId => {
          this.io.to(socketId).emit('analytics_update', updateData);
        });
        
        logger.info(`Analytics update broadcasted: ${streamId}`);
        return true;
      }
      
      return false;
    } catch (error) {
      logger.error('Error broadcasting analytics update:', error);
      return false;
    }
  }

  /**
   * Force disconnect a user (admin function)
   */
  forceDisconnectUser(userId, reason = 'Administrative action') {
    try {
      const user = this.connectedUsers.get(userId);
      if (user) {
        this.io.to(user.socketId).emit('force_disconnect', { reason });
        this.io.sockets.sockets.get(user.socketId)?.disconnect(true);
        logger.info(`Force disconnected user ${userId}: ${reason}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error force disconnecting user:', error);
      return false;
    }
  }

  /**
   * Get detailed connection statistics
   */
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      totalRooms: this.rooms.size,
      analyticsStreams: this.analyticsStreams.size,
      performanceMetrics: this.performanceMetrics,
      roomDetails: Array.from(this.rooms.entries()).map(([roomKey, users]) => ({
        room: roomKey,
        userCount: users.size
      })),
      connectedUsers: Array.from(this.connectedUsers.entries()).map(([userId, userData]) => ({
        userId,
        email: userData.email,
        connectedAt: userData.connectedAt,
        roomCount: userData.rooms.size,
        latency: userData.latency
      }))
    };
  }

  /**
   * Clean up resources and close connections
   */
  async close() {
    try {
      logger.info('Closing socket service...');
      
      // Notify all connected users
      this.io.emit('server_shutdown', {
        message: 'Server is shutting down',
        timestamp: new Date().toISOString()
      });
      
      // Close all connections
      this.io.close();
      
      // Clear data structures
      this.connectedUsers.clear();
      this.rooms.clear();
      this.analyticsStreams.clear();
      
      logger.info('Socket service closed successfully');
    } catch (error) {
      logger.error('Error closing socket service:', error);
    }
  }

  /**
   * Health check for socket service
   */
  getHealthStatus() {
    return {
      status: 'healthy',
      connections: this.connectedUsers.size,
      rooms: this.rooms.size,
      analyticsStreams: this.analyticsStreams.size,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  }
}

const socketServiceInstance = new SocketService();

module.exports = socketServiceInstance;
module.exports.SocketService = SocketService;
module.exports.default = socketServiceInstance;