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

// Get all phases for a project
router.get('/project/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const phases = await prisma.phase.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { tasks: true }
        }
      },
      orderBy: { order: 'asc' },
    });
    res.json(phases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch phases' });
  }
});

// Get phase with tasks
router.get('/:id', async (req, res) => {
  try {
    const phase = await prisma.phase.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        tasks: {
          include: {
            assignee: true,
            subtasks: true,
            deliverables: true,
            _count: { select: { notes: true } }
          },
          orderBy: { createdAt: 'asc' }
        },
        _count: { select: { tasks: true } }
      },
    });

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, phase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(phase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch phase' });
  }
});

// Create phase
router.post('/', async (req, res) => {
  try {
    const { name, icon, color, duration, order, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projId = parseInt(projectId);

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, projId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get max order if not provided
    let phaseOrder = order;
    if (phaseOrder === undefined) {
      const maxOrder = await prisma.phase.aggregate({
        where: { projectId: projId },
        _max: { order: true }
      });
      phaseOrder = (maxOrder._max.order || 0) + 1;
    }

    const phase = await prisma.phase.create({
      data: { name, icon, color, duration, order: phaseOrder, projectId: projId },
      include: { _count: { select: { tasks: true } } }
    });
    res.status(201).json(phase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create phase' });
  }
});

// Update phase
router.put('/:id', async (req, res) => {
  try {
    const { name, icon, color, duration, order } = req.body;

    const existingPhase = await prisma.phase.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existingPhase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, existingPhase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const phase = await prisma.phase.update({
      where: { id: parseInt(req.params.id) },
      data: { name, icon, color, duration, order },
      include: { _count: { select: { tasks: true } } }
    });
    res.json(phase);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update phase' });
  }
});

// Delete phase
router.delete('/:id', async (req, res) => {
  try {
    const phase = await prisma.phase.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { _count: { select: { tasks: true } } }
    });

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, phase.projectId, req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (phase._count.tasks > 0) {
      return res.status(400).json({ error: 'Cannot delete phase with tasks. Move or delete tasks first.' });
    }

    await prisma.phase.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete phase' });
  }
});

// Reorder phases
router.post('/reorder', async (req, res) => {
  try {
    const { phaseIds, projectId } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    // Check access
    const hasAccess = await checkProjectAccess(req.user.id, parseInt(projectId), req.user.role);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = phaseIds.map((id, index) =>
      prisma.phase.update({
        where: { id },
        data: { order: index },
      })
    );

    await prisma.$transaction(updates);

    const phases = await prisma.phase.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { order: 'asc' },
      include: { _count: { select: { tasks: true } } }
    });
    res.json(phases);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reorder phases' });
  }
});

module.exports = router;
