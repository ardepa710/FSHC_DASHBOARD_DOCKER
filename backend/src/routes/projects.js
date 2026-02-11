const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// Get all projects (filtered by user access)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      // Admin sees all projects
      projects = await prisma.project.findMany({
        include: {
          _count: {
            select: {
              phases: true,
              users: true,
            }
          },
          users: {
            include: {
              user: {
                select: { id: true, name: true, username: true }
              }
            }
          }
        },
        orderBy: { name: 'asc' }
      });
    } else {
      // Regular user sees only assigned projects
      const userProjects = await prisma.userProject.findMany({
        where: { userId: req.user.id },
        include: {
          project: {
            include: {
              _count: {
                select: {
                  phases: true,
                  users: true,
                }
              }
            }
          }
        }
      });
      projects = userProjects.map(up => ({
        ...up.project,
        userRole: up.role
      }));
    }

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project with details
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Check access
    if (req.user.role !== 'ADMIN') {
      const access = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId
          }
        }
      });
      if (!access) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          orderBy: { order: 'asc' },
          include: {
            _count: { select: { tasks: true } }
          }
        },
        assignees: {
          orderBy: { name: 'asc' }
        },
        users: {
          include: {
            user: {
              select: { id: true, name: true, username: true, email: true }
            }
          }
        },
        _count: {
          select: { phases: true, users: true, assignees: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create project (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#6c8cff',
        icon: icon || '📁',
        users: {
          create: {
            userId: req.user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        _count: { select: { phases: true, users: true } }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, color, icon, isActive } = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(req.params.id) },
      data: { name, description, color, icon, isActive },
      include: {
        _count: { select: { phases: true, users: true } }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Assign users to project (admin only)
router.put('/:id/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userIds, projectRole } = req.body;
    const projectId = parseInt(req.params.id);

    // Remove existing assignments (except admin's)
    await prisma.userProject.deleteMany({
      where: {
        projectId,
        userId: { not: req.user.id }
      }
    });

    // Add new assignments
    if (userIds?.length) {
      const existingAdmin = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId
          }
        }
      });

      const newAssignments = userIds
        .filter(userId => userId !== req.user.id || !existingAdmin)
        .map(userId => ({
          userId,
          projectId,
          role: projectRole || 'MEMBER'
        }));

      if (newAssignments.length) {
        await prisma.userProject.createMany({
          data: newAssignments,
          skipDuplicates: true
        });
      }
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        users: {
          include: {
            user: {
              select: { id: true, name: true, username: true }
            }
          }
        }
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Assign users error:', error);
    res.status(500).json({ error: 'Failed to assign users' });
  }
});

// Delete project (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: parseInt(req.params.id) }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get project stats
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);

    // Check access
    if (req.user.role !== 'ADMIN') {
      const access = await prisma.userProject.findUnique({
        where: {
          userId_projectId: {
            userId: req.user.id,
            projectId
          }
        }
      });
      if (!access) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const phases = await prisma.phase.findMany({
      where: { projectId },
      select: { id: true }
    });
    const phaseIds = phases.map(p => p.id);

    const [totalTasks, doneTasks, inProgressTasks, blockedTasks, highPriorityTasks] = await Promise.all([
      prisma.task.count({ where: { phaseId: { in: phaseIds } } }),
      prisma.task.count({ where: { phaseId: { in: phaseIds }, status: 'DONE' } }),
      prisma.task.count({ where: { phaseId: { in: phaseIds }, status: 'IN_PROGRESS' } }),
      prisma.task.count({ where: { phaseId: { in: phaseIds }, status: 'BLOCKED' } }),
      prisma.task.count({ where: { phaseId: { in: phaseIds }, priority: 'HIGH', status: { not: 'DONE' } } }),
    ]);

    res.json({
      totalTasks,
      doneTasks,
      inProgressTasks,
      blockedTasks,
      highPriorityTasks,
      completionPercentage: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
