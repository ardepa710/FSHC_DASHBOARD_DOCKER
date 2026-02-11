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

// Get all assignees for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignees = await prisma.assignee.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json(assignees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignees' });
  }
});

// Get single assignee with tasks
router.get('/:id', async (req, res) => {
  try {
    const assignee = await prisma.assignee.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tasks: {
          include: {
            phase: true,
            subtasks: true,
          }
        },
        _count: {
          select: { tasks: true }
        }
      },
    });

    if (!assignee) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, assignee.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(assignee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignee' });
  }
});

// Create assignee
router.post('/', async (req, res) => {
  try {
    const { name, initials, color, role, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projId = parseInt(projectId);

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, projId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate initials if not provided
    const assigneeInitials = initials || name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // Generate color if not provided
    const colors = ['#6c8cff', '#8b5cf6', '#10b981', '#ec4899', '#f59e0b', '#14b8a6', '#ef4444'];
    const randomColor = color || colors[Math.floor(Math.random() * colors.length)];

    const assignee = await prisma.assignee.create({
      data: {
        name,
        initials: assigneeInitials,
        color: randomColor,
        role,
        projectId: projId
      },
      include: { _count: { select: { tasks: true } } }
    });
    res.status(201).json(assignee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assignee' });
  }
});

// Update assignee
router.put('/:id', async (req, res) => {
  try {
    const { name, initials, color, role } = req.body;

    const existingAssignee = await prisma.assignee.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existingAssignee) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, existingAssignee.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const assignee = await prisma.assignee.update({
      where: { id: parseInt(req.params.id) },
      data: { name, initials, color, role },
      include: { _count: { select: { tasks: true } } }
    });
    res.json(assignee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update assignee' });
  }
});

// Delete assignee
router.delete('/:id', async (req, res) => {
  try {
    const assignee = await prisma.assignee.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { tasks: true } } }
    });

    if (!assignee) {
      return res.status(404).json({ error: 'Assignee not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, assignee.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (assignee._count.tasks > 0) {
      return res.status(400).json({ error: 'Cannot delete assignee with tasks. Reassign tasks first.' });
    }

    await prisma.assignee.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete assignee' });
  }
});

module.exports = router;
