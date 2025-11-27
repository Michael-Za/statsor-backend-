const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const db = require('../services/database');

const router = express.Router();

// @route   GET /api/v1/notifications
// @desc    Get user notifications
// @access  Private
router.get(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { limit = 50, offset = 0, unread_only = false } = req.query;

    const query = { user_id: userId };
    if (unread_only === 'true') {
      query.read = false;
    }

    const notifications = await db.findMany('notifications', query, {
      orderBy: { created_at: 'desc' },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.json({
      success: true,
      data: notifications,
      count: notifications.length,
    });
  })
);

// @route   GET /api/v1/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get(
  '/unread-count',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const notifications = await db.findMany('notifications', {
      user_id: userId,
      read: false,
    });

    res.json({
      success: true,
      count: notifications.length,
    });
  })
);

// @route   POST /api/v1/notifications
// @desc    Create notification
// @access  Private
router.post(
  '/',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { user_id, type, title, message, action_url, metadata } = req.body;

    // Only allow creating notifications for self or if admin
    if (user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to create notifications for other users',
      });
    }

    const notification = await db.create('notifications', {
      user_id,
      type,
      title,
      message,
      action_url,
      metadata,
      read: false,
      created_at: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: notification,
    });
  })
);

// @route   PUT /api/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put(
  '/:id/read',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await db.findById('notifications', id);
    if (!notification || notification.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    const updated = await db.update('notifications', id, {
      read: true,
      updated_at: new Date().toISOString(),
    });

    res.json({
      success: true,
      data: updated,
    });
  })
);

// @route   PUT /api/v1/notifications/mark-all-read
// @desc    Mark all notifications as read
// @access  Private
router.put(
  '/mark-all-read',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;

    // Get all unread notifications
    const unreadNotifications = await db.findMany('notifications', {
      user_id: userId,
      read: false,
    });

    // Update each one
    const updatePromises = unreadNotifications.map((notification) =>
      db.update('notifications', notification.id, {
        read: true,
        updated_at: new Date().toISOString(),
      })
    );

    await Promise.all(updatePromises);

    res.json({
      success: true,
      message: 'All notifications marked as read',
      count: unreadNotifications.length,
    });
  })
);

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify notification belongs to user
    const notification = await db.findById('notifications', id);
    if (!notification || notification.user_id !== userId) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found',
      });
    }

    await db.delete('notifications', id);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  })
);

module.exports = router;
