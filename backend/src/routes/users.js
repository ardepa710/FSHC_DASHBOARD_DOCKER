const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const prisma = new PrismaClient();

// All routes require admin
router.use(authenticateToken, requireAdmin);

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        projects: {
          include: {
            project: {
              select: { id: true, name: true, icon: true, color: true }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(users.map(u => ({
      ...u,
      projects: u.projects.map(up => ({
        ...up.project,
        userRole: up.role
      }))
    })));
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        projects: {
          include: {
            project: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      projects: user.projects.map(up => ({
        ...up.project,
        userRole: up.role
      }))
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, role, projectIds } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    // Check if username exists
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        email,
        role: role || 'USER',
        projects: projectIds?.length ? {
          create: projectIds.map(projectId => ({
            projectId,
            role: 'MEMBER'
          }))
        } : undefined
      },
      include: {
        projects: {
          include: { project: true }
        }
      }
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      projects: user.projects.map(up => ({
        ...up.project,
        userRole: up.role
      }))
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const userId = parseInt(req.params.id);

    const updateData = { name, email, role };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Assign user to projects
router.put('/:id/projects', async (req, res) => {
  try {
    const { projectIds, projectRole } = req.body;
    const userId = parseInt(req.params.id);

    // Remove existing assignments
    await prisma.userProject.deleteMany({
      where: { userId }
    });

    // Add new assignments
    if (projectIds?.length) {
      await prisma.userProject.createMany({
        data: projectIds.map(projectId => ({
          userId,
          projectId,
          role: projectRole || 'MEMBER'
        }))
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: {
          include: { project: true }
        }
      }
    });

    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      projects: user.projects.map(up => ({
        ...up.project,
        userRole: up.role
      }))
    });
  } catch (error) {
    console.error('Assign projects error:', error);
    res.status(500).json({ error: 'Failed to assign projects' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Prevent deleting yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
