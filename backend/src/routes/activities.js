const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get activity log for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, offset = 0, entityType } = req.query;

    const where = { projectId: parseInt(projectId) };
    if (entityType) {
      where.entityType = entityType;
    }

    const activities = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activity log for a specific task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await prisma.activityLog.findMany({
      where: {
        entityType: 'task',
        entityId: parseInt(taskId)
      },
      include: {
        user: { select: { id: true, name: true, username: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching task activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get user's recent activity
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    const activities = await prisma.activityLog.findMany({
      where: { userId: parseInt(userId) },
      include: {
        project: { select: { id: true, name: true, icon: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Helper function to log activity (used by other routes)
const logActivity = async (action, entityType, entityId, entityName, userId, projectId, changes = null) => {
  try {
    await prisma.activityLog.create({
      data: {
        action,
        entityType,
        entityId,
        entityName,
        userId,
        projectId,
        changes: changes ? JSON.stringify(changes) : null
      }
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

module.exports = router;
module.exports.logActivity = logActivity;
