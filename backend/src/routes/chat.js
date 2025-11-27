const express = require('express');
const Joi = require('joi');
const databaseService = require('../services/database.js');
const redisService = require('../services/redis.js');
const { SocketService } = require('../services/socket.js');
const { 
  asyncHandler, 
  validateRequest, 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} = require('../middleware/errorHandler.js');
const { 
  authenticateToken, 
  requireRole, 
  checkTeamOwnership 
} = require('../middleware/auth.js');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const db = databaseService;
const redis = redisService;
const socket = new SocketService();

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/chat';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|mp4|mov|avi/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Validation schemas
const sendMessageSchema = Joi.object({
  body: Joi.object({
    content: Joi.string().min(1).max(2000).when('message_type', {
      is: 'text',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    message_type: Joi.string().valid('text', 'image', 'file', 'system').default('text'),
    reply_to: Joi.string().uuid().optional(),
    metadata: Joi.object().optional()
  })
});

const createChannelSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(200).optional(),
    type: Joi.string().valid('public', 'private', 'direct').required(),
    team_id: Joi.string().uuid().required(),
    members: Joi.array().items(Joi.string().uuid()).optional()
  })
});

const updateChannelSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    description: Joi.string().max(200).optional(),
    archived: Joi.boolean().optional(),
    muted: Joi.boolean().optional()
  })
});

// Helper functions
const getUserChannels = async (userId, teamId) => {
  const channels = await db.query(`
    SELECT DISTINCT
      c.*,
      cm.role as member_role,
      cm.joined_at,
      cm.muted,
      (
        SELECT COUNT(*) 
        FROM chat_messages msg 
        WHERE msg.channel_id = c.id 
          AND msg.created_at > COALESCE(cm.last_read_at, '1970-01-01')
      ) as unread_count,
      (
        SELECT json_build_object(
          'content', latest.content,
          'created_at', latest.created_at,
          'sender_name', u.first_name || ' ' || u.last_name,
          'message_type', latest.message_type
        )
        FROM chat_messages latest
        JOIN users u ON latest.sender_id = u.id
        WHERE latest.channel_id = c.id
        ORDER BY latest.created_at DESC
        LIMIT 1
      ) as last_message
    FROM chat_channels c
    LEFT JOIN chat_channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
    WHERE (
      (c.type = 'public' AND c.team_id = $2) OR
      (c.type = 'private' AND cm.user_id = $1) OR
      (c.type = 'direct' AND cm.user_id = $1)
    )
    AND c.archived = false
    ORDER BY 
      CASE WHEN cm.muted THEN 1 ELSE 0 END,
      (
        SELECT MAX(created_at) 
        FROM chat_messages 
        WHERE channel_id = c.id
      ) DESC NULLS LAST
  `, [userId, teamId]);

  return channels;
};

const getChannelMessages = async (channelId, userId, page = 1, limit = 50) => {
  const offset = (page - 1) * limit;
  
  const messages = await db.query(`
    SELECT 
      cm.*,
      u.first_name,
      u.last_name,
      u.avatar_url,
      p.position,
      p.jersey_number,
      (
        SELECT json_build_object(
          'id', reply.id,
          'content', reply.content,
          'sender_name', ru.first_name || ' ' || ru.last_name,
          'created_at', reply.created_at
        )
        FROM chat_messages reply
        JOIN users ru ON reply.sender_id = ru.id
        WHERE reply.id = cm.reply_to
      ) as reply_message,
      (
        SELECT json_agg(
          json_build_object(
            'emoji', r.emoji,
            'count', r.count,
            'users', r.user_ids
          )
        )
        FROM (
          SELECT 
            emoji,
            COUNT(*) as count,
            array_agg(user_id) as user_ids
          FROM chat_message_reactions
          WHERE message_id = cm.id
          GROUP BY emoji
        ) r
      ) as reactions
    FROM chat_messages cm
    JOIN users u ON cm.sender_id = u.id
    LEFT JOIN players p ON u.id = p.user_id
    WHERE cm.channel_id = $1
      AND cm.deleted_at IS NULL
    ORDER BY cm.created_at DESC
    LIMIT $2 OFFSET $3
  `, [channelId, limit, offset]);

  // Mark messages as read
  await db.query(`
    INSERT INTO chat_channel_members (channel_id, user_id, last_read_at, updated_at)
    VALUES ($1, $2, NOW(), NOW())
    ON CONFLICT (channel_id, user_id)
    DO UPDATE SET last_read_at = NOW(), updated_at = NOW()
  `, [channelId, userId]);

  return messages.reverse(); // Return in chronological order
};

const canAccessChannel = async (channelId, userId, teamId) => {
  const channel = await db.query(`
    SELECT 
      c.*,
      cm.user_id as is_member
    FROM chat_channels c
    LEFT JOIN chat_channel_members cm ON c.id = cm.channel_id AND cm.user_id = $2
    WHERE c.id = $1
  `, [channelId, userId]);

  if (!channel.length) {
    return { canAccess: false, reason: 'Channel not found' };
  }

  const channelData = channel[0];

  // Public channels - anyone in the team can access
  if (channelData.type === 'public' && channelData.team_id === teamId) {
    return { canAccess: true, channel: channelData };
  }

  // Private/Direct channels - must be a member
  if ((channelData.type === 'private' || channelData.type === 'direct') && channelData.is_member) {
    return { canAccess: true, channel: channelData };
  }

  return { canAccess: false, reason: 'Access denied' };
};

// Routes

// @route   GET /api/chat/channels
// @desc    Get user's chat channels
// @access  Private
router.get('/channels',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const channels = await getUserChannels(req.user.id, req.user.team_id);
    
    res.json({ channels });
  })
);

// @route   POST /api/chat/channels
// @desc    Create new chat channel
// @access  Private (Coach/Manager/Admin for private channels)
router.post('/channels',
  authenticateToken,
  validateRequest(createChannelSchema),
  asyncHandler(async (req, res) => {
    const { name, description, type, team_id, members = [] } = req.body;

    // Check permissions
    if (type === 'private' && !['coach', 'manager', 'admin'].includes(req.user.role)) {
      throw new AuthorizationError('Only coaches, managers, and admins can create private channels');
    }

    if (req.user.role === 'coach' && req.user.team_id !== team_id) {
      throw new AuthorizationError('Access denied');
    }

    // For direct messages, ensure only 2 members
    if (type === 'direct' && members.length !== 1) {
      throw new ValidationError('Direct channels must have exactly 2 members');
    }

    // Check if direct channel already exists
    if (type === 'direct') {
      const existingChannel = await db.query(`
        SELECT c.id
        FROM chat_channels c
        JOIN chat_channel_members cm1 ON c.id = cm1.channel_id AND cm1.user_id = $1
        JOIN chat_channel_members cm2 ON c.id = cm2.channel_id AND cm2.user_id = $2
        WHERE c.type = 'direct'
          AND (
            SELECT COUNT(*) 
            FROM chat_channel_members 
            WHERE channel_id = c.id
          ) = 2
      `, [req.user.id, members[0]]);

      if (existingChannel.length > 0) {
        return res.json({
          message: 'Direct channel already exists',
          channel_id: existingChannel[0].id
        });
      }
    }

    const channel = await db.create('chat_channels', {
      name,
      description,
      type,
      team_id,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Add creator as admin member
    await db.create('chat_channel_members', {
      channel_id: channel.id,
      user_id: req.user.id,
      role: 'admin',
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Add other members
    if (members.length > 0) {
      const memberInserts = members.map(memberId => ({
        channel_id: channel.id,
        user_id: memberId,
        role: 'member',
        joined_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }));

      await Promise.all(
        memberInserts.map(member => db.create('chat_channel_members', member))
      );
    }

    // For public channels, notify team
    if (type === 'public') {
      socket.emitToTeam(team_id, 'channel_created', {
        channel_id: channel.id,
        name,
        type,
        created_by: `${req.user.first_name} ${req.user.last_name}`
      });
    }

    res.status(201).json({
      message: 'Channel created successfully',
      channel
    });
  })
);

// @route   GET /api/chat/channels/:id
// @desc    Get channel details
// @access  Private
router.get('/channels/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    // Get channel members
    const members = await db.query(`
      SELECT 
        cm.*,
        u.first_name,
        u.last_name,
        u.avatar_url,
        p.position,
        p.jersey_number
      FROM chat_channel_members cm
      JOIN users u ON cm.user_id = u.id
      LEFT JOIN players p ON u.id = p.user_id
      WHERE cm.channel_id = $1
      ORDER BY cm.role DESC, u.first_name, u.last_name
    `, [id]);

    res.json({
      channel: accessCheck.channel,
      members
    });
  })
);

// @route   PUT /api/chat/channels/:id
// @desc    Update channel
// @access  Private (Channel admin)
router.put('/channels/:id',
  authenticateToken,
  validateRequest(updateChannelSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    // Check if user is admin of the channel
    const membership = await db.query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (!membership.length || membership[0].role !== 'admin') {
      throw new AuthorizationError('Only channel admins can update channel settings');
    }

    updates.updated_at = new Date();
    const updatedChannel = await db.update('chat_channels', id, updates);

    // Notify channel members of changes
    socket.emitToChannel(id, 'channel_updated', {
      channel_id: id,
      changes: Object.keys(updates),
      updated_by: `${req.user.first_name} ${req.user.last_name}`
    });

    res.json({
      message: 'Channel updated successfully',
      channel: updatedChannel
    });
  })
);

// @route   GET /api/chat/channels/:id/messages
// @desc    Get channel messages
// @access  Private
router.get('/channels/:id/messages',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    const messages = await getChannelMessages(id, req.user.id, parseInt(page), parseInt(limit));

    res.json({
      messages,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        has_more: messages.length === parseInt(limit)
      }
    });
  })
);

// @route   POST /api/chat/channels/:id/messages
// @desc    Send message to channel
// @access  Private
router.post('/channels/:id/messages',
  authenticateToken,
  upload.single('file'),
  validateRequest(sendMessageSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, message_type = 'text', reply_to, metadata } = req.body;

    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    let messageData = {
      channel_id: id,
      sender_id: req.user.id,
      content,
      message_type,
      reply_to,
      metadata,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Handle file upload
    if (req.file) {
      messageData.message_type = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
      messageData.file_url = `/uploads/chat/${req.file.filename}`;
      messageData.file_name = req.file.originalname;
      messageData.file_size = req.file.size;
      messageData.content = messageData.content || req.file.originalname;
    }

    const message = await db.create('chat_messages', messageData);

    // Get sender details for real-time emission
    const senderDetails = await db.query(`
      SELECT 
        u.first_name,
        u.last_name,
        u.avatar_url,
        p.position,
        p.jersey_number
      FROM users u
      LEFT JOIN players p ON u.id = p.user_id
      WHERE u.id = $1
    `, [req.user.id]);

    const messageWithSender = {
      ...message,
      ...senderDetails[0],
      reactions: []
    };

    // Emit to channel members
    socket.emitToChannel(id, 'new_message', messageWithSender);

    // Update channel's last activity
    await db.update('chat_channels', id, {
      last_activity_at: new Date(),
      updated_at: new Date()
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageWithSender
    });
  })
);

// @route   PUT /api/chat/messages/:id
// @desc    Edit message
// @access  Private (Message sender)
router.put('/messages/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      throw new ValidationError('Message content is required');
    }

    const message = await db.findById('chat_messages', id);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check if user is the sender
    if (message.sender_id !== req.user.id) {
      throw new AuthorizationError('You can only edit your own messages');
    }

    // Check if message is not too old (e.g., 15 minutes)
    const messageAge = Date.now() - new Date(message.created_at).getTime();
    if (messageAge > 15 * 60 * 1000) {
      throw new ValidationError('Messages can only be edited within 15 minutes');
    }

    const updatedMessage = await db.update('chat_messages', id, {
      content,
      edited_at: new Date(),
      updated_at: new Date()
    });

    // Emit update to channel
    socket.emitToChannel(message.channel_id, 'message_edited', {
      message_id: id,
      content,
      edited_at: updatedMessage.edited_at
    });

    res.json({
      message: 'Message updated successfully',
      data: updatedMessage
    });
  })
);

// @route   DELETE /api/chat/messages/:id
// @desc    Delete message
// @access  Private (Message sender or channel admin)
router.delete('/messages/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const message = await db.query(`
      SELECT 
        cm.*,
        ccm.role as user_channel_role
      FROM chat_messages cm
      LEFT JOIN chat_channel_members ccm ON cm.channel_id = ccm.channel_id AND ccm.user_id = $2
      WHERE cm.id = $1
    `, [id, req.user.id]);

    if (!message.length) {
      throw new NotFoundError('Message not found');
    }

    const messageData = message[0];

    // Check permissions
    const canDelete = messageData.sender_id === req.user.id || 
                     messageData.user_channel_role === 'admin' ||
                     ['admin', 'manager'].includes(req.user.role);

    if (!canDelete) {
      throw new AuthorizationError('You can only delete your own messages or you must be a channel admin');
    }

    // Soft delete
    await db.update('chat_messages', id, {
      deleted_at: new Date(),
      updated_at: new Date()
    });

    // Emit deletion to channel
    socket.emitToChannel(messageData.channel_id, 'message_deleted', {
      message_id: id,
      deleted_by: req.user.id
    });

    res.json({ message: 'Message deleted successfully' });
  })
);

// @route   POST /api/chat/messages/:id/reactions
// @desc    Add reaction to message
// @access  Private
router.post('/messages/:id/reactions',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      throw new ValidationError('Emoji is required');
    }

    const message = await db.findById('chat_messages', id);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    // Check channel access
    const accessCheck = await canAccessChannel(message.channel_id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    // Check if reaction already exists
    const existingReaction = await db.query(`
      SELECT id FROM chat_message_reactions
      WHERE message_id = $1 AND user_id = $2 AND emoji = $3
    `, [id, req.user.id, emoji]);

    if (existingReaction.length > 0) {
      // Remove reaction
      await db.delete('chat_message_reactions', existingReaction[0].id);
      
      socket.emitToChannel(message.channel_id, 'reaction_removed', {
        message_id: id,
        emoji,
        user_id: req.user.id
      });

      return res.json({ message: 'Reaction removed' });
    }

    // Add reaction
    await db.create('chat_message_reactions', {
      message_id: id,
      user_id: req.user.id,
      emoji,
      created_at: new Date()
    });

    socket.emitToChannel(message.channel_id, 'reaction_added', {
      message_id: id,
      emoji,
      user_id: req.user.id,
      user_name: `${req.user.first_name} ${req.user.last_name}`
    });

    res.json({ message: 'Reaction added' });
  })
);

// @route   POST /api/chat/channels/:id/members
// @desc    Add member to channel
// @access  Private (Channel admin)
router.post('/channels/:id/members',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;

    if (!user_id) {
      throw new ValidationError('User ID is required');
    }

    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    // Check if user is admin of the channel
    const membership = await db.query(`
      SELECT role FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
    `, [id, req.user.id]);

    if (!membership.length || membership[0].role !== 'admin') {
      throw new AuthorizationError('Only channel admins can add members');
    }

    // Check if user is already a member
    const existingMember = await db.query(`
      SELECT id FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
    `, [id, user_id]);

    if (existingMember.length > 0) {
      throw new ValidationError('User is already a member of this channel');
    }

    // Verify user exists and is in the same team
    const user = await db.query(`
      SELECT u.*, p.team_id
      FROM users u
      LEFT JOIN players p ON u.id = p.user_id
      WHERE u.id = $1
    `, [user_id]);

    if (!user.length) {
      throw new NotFoundError('User not found');
    }

    if (user[0].team_id !== req.user.team_id && req.user.role !== 'admin') {
      throw new AuthorizationError('Can only add users from your team');
    }

    // Add member
    await db.create('chat_channel_members', {
      channel_id: id,
      user_id,
      role,
      joined_at: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    });

    // Notify channel
    socket.emitToChannel(id, 'member_added', {
      channel_id: id,
      user_id,
      user_name: `${user[0].first_name} ${user[0].last_name}`,
      added_by: `${req.user.first_name} ${req.user.last_name}`
    });

    res.json({ message: 'Member added successfully' });
  })
);

// @route   DELETE /api/chat/channels/:id/members/:userId
// @desc    Remove member from channel
// @access  Private (Channel admin or self)
router.delete('/channels/:id/members/:userId',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id, userId } = req.params;

    const accessCheck = await canAccessChannel(id, req.user.id, req.user.team_id);
    if (!accessCheck.canAccess) {
      throw new AuthorizationError(accessCheck.reason);
    }

    // Check permissions
    const canRemove = userId === req.user.id; // Self removal
    
    if (!canRemove) {
      // Check if user is admin of the channel
      const membership = await db.query(`
        SELECT role FROM chat_channel_members
        WHERE channel_id = $1 AND user_id = $2
      `, [id, req.user.id]);

      if (!membership.length || membership[0].role !== 'admin') {
        throw new AuthorizationError('Only channel admins can remove members');
      }
    }

    // Remove member
    await db.query(`
      DELETE FROM chat_channel_members
      WHERE channel_id = $1 AND user_id = $2
    `, [id, userId]);

    // Get user details for notification
    const user = await db.query(`
      SELECT first_name, last_name FROM users WHERE id = $1
    `, [userId]);

    // Notify channel
    socket.emitToChannel(id, 'member_removed', {
      channel_id: id,
      user_id: userId,
      user_name: user.length ? `${user[0].first_name} ${user[0].last_name}` : 'Unknown User',
      removed_by: `${req.user.first_name} ${req.user.last_name}`,
      self_removal: userId === req.user.id
    });

    res.json({ message: 'Member removed successfully' });
  })
);

// @route   GET /api/chat/search
// @desc    Search messages
// @access  Private
router.get('/search',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { q, channel_id, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      throw new ValidationError('Search query must be at least 2 characters');
    }

    let whereClause = `
      WHERE cm.deleted_at IS NULL
        AND cm.content ILIKE $1
        AND EXISTS (
          SELECT 1 FROM chat_channel_members ccm
          WHERE ccm.channel_id = cm.channel_id AND ccm.user_id = $2
        )
    `;
    const params = [`%${q}%`, req.user.id];
    let paramCount = 2;

    if (channel_id) {
      whereClause += ` AND cm.channel_id = $${++paramCount}`;
      params.push(channel_id);
    }

    const results = await db.query(`
      SELECT 
        cm.*,
        u.first_name,
        u.last_name,
        u.avatar_url,
        cc.name as channel_name,
        cc.type as channel_type
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      JOIN chat_channels cc ON cm.channel_id = cc.id
      ${whereClause}
      ORDER BY cm.created_at DESC
      LIMIT $${++paramCount}
    `, [...params, limit]);

    res.json({
      query: q,
      results,
      total: results.length
    });
  })
);

// @route   GET /api/chat/unread-count
// @desc    Get total unread message count
// @access  Private
router.get('/unread-count',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const unreadCount = await db.query(`
      SELECT 
        SUM(
          (
            SELECT COUNT(*) 
            FROM chat_messages msg 
            WHERE msg.channel_id = c.id 
              AND msg.created_at > COALESCE(cm.last_read_at, '1970-01-01')
              AND msg.sender_id != $1
          )
        ) as total_unread
      FROM chat_channels c
      LEFT JOIN chat_channel_members cm ON c.id = cm.channel_id AND cm.user_id = $1
      WHERE (
        (c.type = 'public' AND c.team_id = $2) OR
        (c.type = 'private' AND cm.user_id = $1) OR
        (c.type = 'direct' AND cm.user_id = $1)
      )
      AND c.archived = false
      AND cm.muted = false
    `, [req.user.id, req.user.team_id]);

    res.json({
      unread_count: parseInt(unreadCount[0]?.total_unread || 0)
    });
  })
);

module.exports = router;
module.exports.default = module.exports;