const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get time entries for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const entries = await prisma.timeEntry.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        user: { select: { id: true, name: true, username: true } }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get time entries for a user (My Time)
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const where = { userId: parseInt(userId) };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            phase: { select: { name: true, projectId: true, project: { select: { name: true } } } }
          }
        }
      },
      orderBy: { startTime: 'desc' }
    });
    res.json(entries);
  } catch (error) {
    console.error('Error fetching user time entries:', error);
    res.status(500).json({ error: 'Failed to fetch time entries' });
  }
});

// Get time summary for a project
router.get('/project/:projectId/summary', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { startDate, endDate } = req.query;

    const tasks = await prisma.task.findMany({
      where: { phase: { projectId: parseInt(projectId) } },
      select: { id: true }
    });
    const taskIds = tasks.map(t => t.id);

    const where = { taskId: { in: taskIds } };
    if (startDate && endDate) {
      where.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        task: { select: { id: true, title: true } }
      }
    });

    // Calculate totals
    const totalMinutes = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const byUser = {};
    const byTask = {};

    entries.forEach(entry => {
      // By user
      if (!byUser[entry.userId]) {
        byUser[entry.userId] = { user: entry.user, totalMinutes: 0 };
      }
      byUser[entry.userId].totalMinutes += entry.duration || 0;

      // By task
      if (!byTask[entry.taskId]) {
        byTask[entry.taskId] = { task: entry.task, totalMinutes: 0 };
      }
      byTask[entry.taskId].totalMinutes += entry.duration || 0;
    });

    res.json({
      totalMinutes,
      totalHours: Math.round(totalMinutes / 60 * 100) / 100,
      byUser: Object.values(byUser),
      byTask: Object.values(byTask),
      entriesCount: entries.length
    });
  } catch (error) {
    console.error('Error fetching time summary:', error);
    res.status(500).json({ error: 'Failed to fetch time summary' });
  }
});

// Start timer (create entry without endTime)
router.post('/start', authenticateToken, async (req, res) => {
  try {
    const { taskId, description } = req.body;
    const userId = req.user.id;

    // Check if user has an active timer
    const activeTimer = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null }
    });

    if (activeTimer) {
      return res.status(400).json({ error: 'You already have an active timer', activeEntry: activeTimer });
    }

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: parseInt(taskId),
        userId,
        description,
        startTime: new Date()
      },
      include: {
        task: { select: { id: true, title: true } }
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error starting timer:', error);
    res.status(500).json({ error: 'Failed to start timer' });
  }
});

// Stop timer
router.post('/stop/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await prisma.timeEntry.findUnique({ where: { id: parseInt(id) } });
    if (!entry || entry.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const endTime = new Date();
    const duration = Math.round((endTime - entry.startTime) / 60000); // minutes

    const updated = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: { endTime, duration }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error stopping timer:', error);
    res.status(500).json({ error: 'Failed to stop timer' });
  }
});

// Create manual time entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { taskId, description, startTime, endTime, duration } = req.body;
    const userId = req.user.id;

    const entry = await prisma.timeEntry.create({
      data: {
        taskId: parseInt(taskId),
        userId,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        duration: duration ? parseInt(duration) : null
      }
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Error creating time entry:', error);
    res.status(500).json({ error: 'Failed to create time entry' });
  }
});

// Update time entry
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { description, startTime, endTime, duration } = req.body;
    const userId = req.user.id;

    const entry = await prisma.timeEntry.findUnique({ where: { id: parseInt(id) } });
    if (!entry || entry.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: {
        description,
        startTime: startTime ? new Date(startTime) : undefined,
        endTime: endTime ? new Date(endTime) : undefined,
        duration: duration ? parseInt(duration) : undefined
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating time entry:', error);
    res.status(500).json({ error: 'Failed to update time entry' });
  }
});

// Delete time entry
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const entry = await prisma.timeEntry.findUnique({ where: { id: parseInt(id) } });
    if (!entry || (entry.userId !== userId && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.timeEntry.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting time entry:', error);
    res.status(500).json({ error: 'Failed to delete time entry' });
  }
});

// Get active timer for current user
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const activeTimer = await prisma.timeEntry.findFirst({
      where: { userId, endTime: null },
      include: {
        task: { select: { id: true, title: true } }
      }
    });
    res.json(activeTimer);
  } catch (error) {
    console.error('Error fetching active timer:', error);
    res.status(500).json({ error: 'Failed to fetch active timer' });
  }
});

module.exports = router;
