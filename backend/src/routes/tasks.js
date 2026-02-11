const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const prisma = new PrismaClient();

// All routes require authentication
router.use(authenticateToken);

// Helper to check project access
async function checkProjectAccess(userId, projectId, userRole) {
  if (userRole === 'ADMIN') return true;

  const access = await prisma.userProject.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId
      }
    }
  });
  return !!access;
}

// Helper to get project ID from phase
async function getProjectIdFromPhase(phaseId) {
  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    select: { projectId: true }
  });
  return phase?.projectId;
}

// Get all tasks for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { phase, status, search, assignee, priority } = req.query;

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all phases for this project
    const phases = await prisma.phase.findMany({
      where: { projectId },
      select: { id: true }
    });
    const phaseIds = phases.map(p => p.id);

    const where = {
      phaseId: { in: phaseIds }
    };

    if (phase && phase !== 'all') {
      where.phaseId = parseInt(phase);
    }
    if (status) {
      where.status = status;
    }
    if (assignee) {
      where.assigneeId = parseInt(assignee);
    }
    if (priority) {
      where.priority = priority;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        phase: true,
        assignee: true,
        subtasks: { orderBy: { id: 'asc' } },
        deliverables: { orderBy: { id: 'asc' } },
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        },
      },
      orderBy: [{ phase: { order: 'asc' } }, { id: 'asc' }],
    });
    res.json(tasks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get single task
router.get('/:id', async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        phase: true,
        assignee: true,
        subtasks: { orderBy: { id: 'asc' } },
        deliverables: { orderBy: { id: 'asc' } },
        notes: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const projectId = await getProjectIdFromPhase(task.phaseId);
    const hasAccess = await checkProjectAccess(req.user.id, projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, status, priority, dueDate, description, phaseId, assigneeId, subtasks, deliverables } = req.body;

    // Check access via phase
    const projectId = await getProjectIdFromPhase(parseInt(phaseId));
    if (!projectId) {
      return res.status(400).json({ error: 'Invalid phase' });
    }

    const hasAccess = await checkProjectAccess(req.user.id, projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        status: status || 'NOT_STARTED',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        phaseId: parseInt(phaseId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        subtasks: subtasks?.length ? {
          create: subtasks.map(s => ({ title: s.title || s, completed: s.completed || false }))
        } : undefined,
        deliverables: deliverables?.length ? {
          create: deliverables.map(d => ({ label: d.label, type: d.type }))
        } : undefined,
      },
      include: {
        phase: true,
        assignee: true,
        subtasks: true,
        deliverables: true,
        notes: true,
      },
    });
    res.status(201).json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task
router.put('/:id', async (req, res) => {
  try {
    const { title, status, priority, dueDate, description, phaseId, assigneeId } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { phase: true }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, existingTask.phase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        description,
        phaseId: phaseId ? parseInt(phaseId) : undefined,
        assigneeId: assigneeId !== undefined ? (assigneeId ? parseInt(assigneeId) : null) : undefined,
      },
      include: {
        phase: true,
        assignee: true,
        subtasks: true,
        deliverables: true,
        notes: { include: { author: true } },
      },
    });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { phase: true }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, existingTask.phase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = await prisma.task.update({
      where: { id: parseInt(req.params.id) },
      data: { status },
      include: {
        phase: true,
        assignee: true,
        subtasks: true,
        deliverables: true,
        notes: { include: { author: true } },
      },
    });
    res.json(task);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const existingTask = await prisma.task.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { phase: true }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, existingTask.phase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.task.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ============ SUBTASKS ============

// Add subtask
router.post('/:taskId/subtasks', async (req, res) => {
  try {
    const { title } = req.body;
    const subtask = await prisma.subtask.create({
      data: {
        title,
        taskId: parseInt(req.params.taskId),
      },
    });
    res.status(201).json(subtask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create subtask' });
  }
});

// Update subtask
router.put('/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    const { title, completed } = req.body;
    const subtask = await prisma.subtask.update({
      where: { id: parseInt(req.params.subtaskId) },
      data: { title, completed },
    });
    res.json(subtask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update subtask' });
  }
});

// Toggle subtask
router.patch('/:taskId/subtasks/:subtaskId/toggle', async (req, res) => {
  try {
    const subtask = await prisma.subtask.findUnique({
      where: { id: parseInt(req.params.subtaskId) },
    });

    const updated = await prisma.subtask.update({
      where: { id: parseInt(req.params.subtaskId) },
      data: { completed: !subtask.completed },
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to toggle subtask' });
  }
});

// Delete subtask
router.delete('/:taskId/subtasks/:subtaskId', async (req, res) => {
  try {
    await prisma.subtask.delete({
      where: { id: parseInt(req.params.subtaskId) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
});

// ============ NOTES ============

// Add note to task
router.post('/:taskId/notes', async (req, res) => {
  try {
    const { content, authorId } = req.body;
    const note = await prisma.note.create({
      data: {
        content,
        taskId: parseInt(req.params.taskId),
        authorId: authorId ? parseInt(authorId) : null,
      },
      include: { author: true },
    });
    res.status(201).json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:taskId/notes/:noteId', async (req, res) => {
  try {
    const { content } = req.body;
    const note = await prisma.note.update({
      where: { id: parseInt(req.params.noteId) },
      data: { content },
      include: { author: true },
    });
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:taskId/notes/:noteId', async (req, res) => {
  try {
    await prisma.note.delete({
      where: { id: parseInt(req.params.noteId) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

// ============ DELIVERABLES ============

// Add deliverable
router.post('/:taskId/deliverables', async (req, res) => {
  try {
    const { label, type } = req.body;
    const deliverable = await prisma.deliverable.create({
      data: {
        label,
        type,
        taskId: parseInt(req.params.taskId),
      },
    });
    res.status(201).json(deliverable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create deliverable' });
  }
});

// Update deliverable
router.put('/:taskId/deliverables/:deliverableId', async (req, res) => {
  try {
    const { label, type } = req.body;
    const deliverable = await prisma.deliverable.update({
      where: { id: parseInt(req.params.deliverableId) },
      data: { label, type },
    });
    res.json(deliverable);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update deliverable' });
  }
});

// Delete deliverable
router.delete('/:taskId/deliverables/:deliverableId', async (req, res) => {
  try {
    await prisma.deliverable.delete({
      where: { id: parseInt(req.params.deliverableId) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete deliverable' });
  }
});

module.exports = router;
