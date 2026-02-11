const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get recurring config for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const config = await prisma.recurringTask.findUnique({
      where: { taskId: parseInt(taskId) }
    });
    res.json(config);
  } catch (error) {
    console.error('Error fetching recurring config:', error);
    res.status(500).json({ error: 'Failed to fetch recurring config' });
  }
});

// Get all recurring tasks for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await prisma.task.findMany({
      where: {
        phase: { projectId: parseInt(projectId) },
        recurringConfig: { isNot: null }
      },
      include: {
        recurringConfig: true,
        phase: true,
        assignee: true
      }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching recurring tasks:', error);
    res.status(500).json({ error: 'Failed to fetch recurring tasks' });
  }
});

// Create/update recurring config
router.post('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { frequency, interval, daysOfWeek, dayOfMonth, endDate, isActive } = req.body;

    const config = await prisma.recurringTask.upsert({
      where: { taskId: parseInt(taskId) },
      update: {
        frequency,
        interval: interval || 1,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
        dayOfMonth,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true
      },
      create: {
        taskId: parseInt(taskId),
        frequency,
        interval: interval || 1,
        daysOfWeek: daysOfWeek ? JSON.stringify(daysOfWeek) : null,
        dayOfMonth,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    res.json(config);
  } catch (error) {
    console.error('Error saving recurring config:', error);
    res.status(500).json({ error: 'Failed to save recurring config' });
  }
});

// Delete recurring config
router.delete('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    await prisma.recurringTask.delete({
      where: { taskId: parseInt(taskId) }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring config:', error);
    res.status(500).json({ error: 'Failed to delete recurring config' });
  }
});

// Toggle recurring active status
router.patch('/task/:taskId/toggle', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const config = await prisma.recurringTask.findUnique({
      where: { taskId: parseInt(taskId) }
    });

    if (!config) {
      return res.status(404).json({ error: 'Recurring config not found' });
    }

    const updated = await prisma.recurringTask.update({
      where: { taskId: parseInt(taskId) },
      data: { isActive: !config.isActive }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error toggling recurring:', error);
    res.status(500).json({ error: 'Failed to toggle recurring' });
  }
});

// Process recurring tasks (called by cron or manually)
router.post('/process', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Get all active recurring tasks
    const recurringTasks = await prisma.recurringTask.findMany({
      where: {
        isActive: true,
        OR: [
          { endDate: null },
          { endDate: { gte: today } }
        ]
      },
      include: {
        task: {
          include: {
            subtasks: true,
            tags: true
          }
        }
      }
    });

    const createdTasks = [];

    for (const config of recurringTasks) {
      const shouldCreate = shouldCreateRecurringTask(config, today);

      if (shouldCreate) {
        const task = config.task;
        const newTask = await prisma.task.create({
          data: {
            title: task.title,
            description: task.description,
            status: 'NOT_STARTED',
            priority: task.priority,
            phaseId: task.phaseId,
            assigneeId: task.assigneeId,
            parentTaskId: task.id,
            dueDate: calculateNextDueDate(config, today),
            subtasks: {
              create: task.subtasks.map(s => ({ title: s.title, completed: false }))
            },
            tags: {
              create: task.tags.map(t => ({ tagId: t.tagId }))
            }
          }
        });

        // Update lastCreated
        await prisma.recurringTask.update({
          where: { id: config.id },
          data: { lastCreated: today }
        });

        createdTasks.push(newTask);
      }
    }

    res.json({
      processed: recurringTasks.length,
      created: createdTasks.length,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Error processing recurring tasks:', error);
    res.status(500).json({ error: 'Failed to process recurring tasks' });
  }
});

// Helper: Check if recurring task should be created today
function shouldCreateRecurringTask(config, today) {
  const lastCreated = config.lastCreated ? new Date(config.lastCreated) : null;

  // If never created, create it
  if (!lastCreated) return true;

  const daysSinceLastCreated = Math.floor((today - lastCreated) / (1000 * 60 * 60 * 24));

  switch (config.frequency) {
    case 'DAILY':
      return daysSinceLastCreated >= config.interval;

    case 'WEEKLY':
      if (daysSinceLastCreated < 7 * config.interval) return false;
      if (config.daysOfWeek) {
        const days = JSON.parse(config.daysOfWeek);
        return days.includes(today.getDay());
      }
      return true;

    case 'MONTHLY':
      const monthsSinceLastCreated =
        (today.getFullYear() - lastCreated.getFullYear()) * 12 +
        (today.getMonth() - lastCreated.getMonth());
      if (monthsSinceLastCreated < config.interval) return false;
      if (config.dayOfMonth) {
        return today.getDate() === config.dayOfMonth;
      }
      return true;

    case 'YEARLY':
      const yearsSinceLastCreated = today.getFullYear() - lastCreated.getFullYear();
      return yearsSinceLastCreated >= config.interval;

    default:
      return false;
  }
}

// Helper: Calculate next due date based on frequency
function calculateNextDueDate(config, fromDate) {
  const dueDate = new Date(fromDate);

  switch (config.frequency) {
    case 'DAILY':
      dueDate.setDate(dueDate.getDate() + config.interval);
      break;
    case 'WEEKLY':
      dueDate.setDate(dueDate.getDate() + 7 * config.interval);
      break;
    case 'MONTHLY':
      dueDate.setMonth(dueDate.getMonth() + config.interval);
      break;
    case 'YEARLY':
      dueDate.setFullYear(dueDate.getFullYear() + config.interval);
      break;
  }

  return dueDate;
}

module.exports = router;
