const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get notifications for current user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { unreadOnly, limit = 50 } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await prisma.notification.count({
      where: { userId, read: false }
    });
    res.json({ count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await prisma.notification.updateMany({
      where: { id: parseInt(id), userId },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

// Mark all as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { id: parseInt(id), userId }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Delete all read notifications
router.delete('/clear-read', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    await prisma.notification.deleteMany({
      where: { userId, read: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

// Create notification (internal use, but exposed for testing)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, title, message, userId, taskId, projectId, actorId, metadata } = req.body;

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        userId: parseInt(userId),
        taskId: taskId ? parseInt(taskId) : null,
        projectId: projectId ? parseInt(projectId) : null,
        actorId: actorId ? parseInt(actorId) : null,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

module.exports = router;
