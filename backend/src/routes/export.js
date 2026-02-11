const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Export tasks to JSON
router.get('/tasks/json', authenticateToken, async (req, res) => {
  try {
    const { projectId, phaseId, status, priority, assigneeId } = req.query;

    const where = {};
    if (phaseId) {
      where.phaseId = parseInt(phaseId);
    } else if (projectId) {
      where.phase = { projectId: parseInt(projectId) };
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = parseInt(assigneeId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        phase: { select: { name: true, color: true } },
        assignee: { select: { name: true, initials: true } },
        subtasks: { select: { title: true, completed: true } },
        tags: { include: { tag: { select: { name: true, color: true } } } }
      },
      orderBy: [{ phase: { order: 'asc' } }, { createdAt: 'asc' }]
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      tasks: tasks.map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        phase: t.phase.name,
        assignee: t.assignee?.name || null,
        subtasks: t.subtasks.map(s => ({ title: s.title, completed: s.completed })),
        tags: t.tags.map(tt => tt.tag.name),
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting tasks:', error);
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

// Export tasks to CSV
router.get('/tasks/csv', authenticateToken, async (req, res) => {
  try {
    const { projectId, phaseId, status, priority, assigneeId } = req.query;

    const where = {};
    if (phaseId) {
      where.phaseId = parseInt(phaseId);
    } else if (projectId) {
      where.phase = { projectId: parseInt(projectId) };
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assigneeId) where.assigneeId = parseInt(assigneeId);

    const tasks = await prisma.task.findMany({
      where,
      include: {
        phase: { select: { name: true } },
        assignee: { select: { name: true } },
        tags: { include: { tag: { select: { name: true } } } }
      },
      orderBy: [{ phase: { order: 'asc' } }, { createdAt: 'asc' }]
    });

    // CSV headers
    const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Phase', 'Assignee', 'Tags', 'Created At'];

    // CSV rows
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      `"${t.phase.name}"`,
      `"${t.assignee?.name || ''}"`,
      `"${t.tags.map(tt => tt.tag.name).join(', ')}"`,
      new Date(t.createdAt).toISOString().split('T')[0]
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${Date.now()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting tasks to CSV:', error);
    res.status(500).json({ error: 'Failed to export tasks' });
  }
});

// Import tasks from JSON
router.post('/tasks/import', authenticateToken, async (req, res) => {
  try {
    const { tasks, projectId, defaultPhaseId } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Invalid tasks data' });
    }

    // Get phases and tags for mapping
    const phases = await prisma.phase.findMany({
      where: { projectId: parseInt(projectId) }
    });
    const tags = await prisma.tag.findMany({
      where: { projectId: parseInt(projectId) }
    });
    const assignees = await prisma.assignee.findMany({
      where: { projectId: parseInt(projectId) }
    });

    const phaseMap = {};
    phases.forEach(p => { phaseMap[p.name.toLowerCase()] = p.id; });

    const tagMap = {};
    tags.forEach(t => { tagMap[t.name.toLowerCase()] = t.id; });

    const assigneeMap = {};
    assignees.forEach(a => { assigneeMap[a.name.toLowerCase()] = a.id; });

    const results = { created: 0, errors: [] };

    for (const taskData of tasks) {
      try {
        // Find phase
        let phaseId = defaultPhaseId;
        if (taskData.phase) {
          const foundPhaseId = phaseMap[taskData.phase.toLowerCase()];
          if (foundPhaseId) phaseId = foundPhaseId;
        }

        if (!phaseId) {
          results.errors.push({ task: taskData.title, error: 'No valid phase' });
          continue;
        }

        // Find assignee
        let assigneeId = null;
        if (taskData.assignee) {
          assigneeId = assigneeMap[taskData.assignee.toLowerCase()] || null;
        }

        // Find tags
        const tagIds = [];
        if (taskData.tags && Array.isArray(taskData.tags)) {
          taskData.tags.forEach(tagName => {
            const tagId = tagMap[tagName.toLowerCase()];
            if (tagId) tagIds.push(tagId);
          });
        }

        // Create task
        await prisma.task.create({
          data: {
            title: taskData.title,
            description: taskData.description || null,
            status: ['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'DONE'].includes(taskData.status)
              ? taskData.status
              : 'NOT_STARTED',
            priority: ['LOW', 'MEDIUM', 'HIGH'].includes(taskData.priority)
              ? taskData.priority
              : 'MEDIUM',
            dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
            phaseId: parseInt(phaseId),
            assigneeId,
            subtasks: {
              create: (taskData.subtasks || []).map(s => ({
                title: typeof s === 'string' ? s : s.title,
                completed: typeof s === 'object' ? (s.completed || false) : false
              }))
            },
            tags: {
              create: tagIds.map(tagId => ({ tagId }))
            }
          }
        });

        results.created++;
      } catch (taskError) {
        results.errors.push({ task: taskData.title, error: taskError.message });
      }
    }

    res.json({
      success: true,
      imported: results.created,
      errors: results.errors.length,
      errorDetails: results.errors.slice(0, 10) // Limit error details
    });
  } catch (error) {
    console.error('Error importing tasks:', error);
    res.status(500).json({ error: 'Failed to import tasks' });
  }
});

module.exports = router;
