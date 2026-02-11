const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Bulk update task status
router.patch('/tasks/status', authenticateToken, async (req, res) => {
  try {
    const { taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      data: { status }
    });

    // Log activity for each task
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      select: { id: true, title: true, phase: { select: { projectId: true } } }
    });

    await prisma.activityLog.createMany({
      data: tasks.map(task => ({
        action: 'STATUS_CHANGED',
        entityType: 'task',
        entityId: task.id,
        entityName: task.title,
        userId: req.user.id,
        projectId: task.phase.projectId,
        changes: JSON.stringify({ newStatus: status })
      }))
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk updating status:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Bulk update task assignee
router.patch('/tasks/assignee', authenticateToken, async (req, res) => {
  try {
    const { taskIds, assigneeId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      data: { assigneeId: assigneeId ? parseInt(assigneeId) : null }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk updating assignee:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Bulk update task priority
router.patch('/tasks/priority', authenticateToken, async (req, res) => {
  try {
    const { taskIds, priority } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      data: { priority }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk updating priority:', error);
    res.status(500).json({ error: 'Failed to update tasks' });
  }
});

// Bulk move tasks to phase
router.patch('/tasks/phase', authenticateToken, async (req, res) => {
  try {
    const { taskIds, phaseId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      data: { phaseId: parseInt(phaseId) }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk moving tasks:', error);
    res.status(500).json({ error: 'Failed to move tasks' });
  }
});

// Bulk add tag to tasks
router.post('/tasks/tags', authenticateToken, async (req, res) => {
  try {
    const { taskIds, tagId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    // Use createMany with skipDuplicates
    const result = await prisma.taskTag.createMany({
      data: taskIds.map(taskId => ({
        taskId: parseInt(taskId),
        tagId: parseInt(tagId)
      })),
      skipDuplicates: true
    });

    res.json({ added: result.count });
  } catch (error) {
    console.error('Error bulk adding tags:', error);
    res.status(500).json({ error: 'Failed to add tags' });
  }
});

// Bulk remove tag from tasks
router.delete('/tasks/tags', authenticateToken, async (req, res) => {
  try {
    const { taskIds, tagId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.taskTag.deleteMany({
      where: {
        taskId: { in: taskIds.map(id => parseInt(id)) },
        tagId: parseInt(tagId)
      }
    });

    res.json({ removed: result.count });
  } catch (error) {
    console.error('Error bulk removing tags:', error);
    res.status(500).json({ error: 'Failed to remove tags' });
  }
});

// Bulk delete tasks
router.delete('/tasks', authenticateToken, async (req, res) => {
  try {
    const { taskIds } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    // Get tasks for activity log
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      select: { id: true, title: true, phase: { select: { projectId: true } } }
    });

    const result = await prisma.task.deleteMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } }
    });

    // Log activity
    await prisma.activityLog.createMany({
      data: tasks.map(task => ({
        action: 'DELETED',
        entityType: 'task',
        entityId: task.id,
        entityName: task.title,
        userId: req.user.id,
        projectId: task.phase.projectId
      }))
    });

    res.json({ deleted: result.count });
  } catch (error) {
    console.error('Error bulk deleting tasks:', error);
    res.status(500).json({ error: 'Failed to delete tasks' });
  }
});

// Bulk set due date
router.patch('/tasks/dueDate', authenticateToken, async (req, res) => {
  try {
    const { taskIds, dueDate } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const result = await prisma.task.updateMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      data: { dueDate: dueDate ? new Date(dueDate) : null }
    });

    res.json({ updated: result.count });
  } catch (error) {
    console.error('Error bulk setting due date:', error);
    res.status(500).json({ error: 'Failed to update due dates' });
  }
});

// Duplicate tasks
router.post('/tasks/duplicate', authenticateToken, async (req, res) => {
  try {
    const { taskIds, targetPhaseId } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds.map(id => parseInt(id)) } },
      include: {
        subtasks: true,
        tags: true
      }
    });

    const duplicatedTasks = await Promise.all(
      tasks.map(async (task) => {
        return prisma.task.create({
          data: {
            title: `${task.title} (copy)`,
            description: task.description,
            status: 'NOT_STARTED',
            priority: task.priority,
            dueDate: task.dueDate,
            phaseId: targetPhaseId ? parseInt(targetPhaseId) : task.phaseId,
            assigneeId: task.assigneeId,
            subtasks: {
              create: task.subtasks.map(s => ({ title: s.title, completed: false }))
            },
            tags: {
              create: task.tags.map(t => ({ tagId: t.tagId }))
            }
          },
          include: {
            subtasks: true,
            tags: { include: { tag: true } },
            phase: true,
            assignee: true
          }
        });
      })
    );

    res.status(201).json(duplicatedTasks);
  } catch (error) {
    console.error('Error duplicating tasks:', error);
    res.status(500).json({ error: 'Failed to duplicate tasks' });
  }
});

module.exports = router;
