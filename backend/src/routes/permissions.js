const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Default permissions by role
const defaultPermissions = {
  OWNER: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: true,
    canAssignTasks: true,
    canManagePhases: true,
    canManageTeam: true,
    canManageProject: true,
    visiblePhases: null, // all
  },
  MEMBER: {
    canCreateTasks: true,
    canEditTasks: true,
    canDeleteTasks: false,
    canAssignTasks: true,
    canManagePhases: false,
    canManageTeam: false,
    canManageProject: false,
    visiblePhases: null, // all
  },
  VIEWER: {
    canCreateTasks: false,
    canEditTasks: false,
    canDeleteTasks: false,
    canAssignTasks: false,
    canManagePhases: false,
    canManageTeam: false,
    canManageProject: false,
    visiblePhases: null, // all
  },
};

// Get user permissions for a project
router.get('/project/:projectId/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Check if requesting user has permission to view this
    const requesterRole = await getUserProjectRole(req.user.id, parseInt(projectId));
    if (!requesterRole || (requesterRole !== 'OWNER' && req.user.id !== parseInt(userId))) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get custom permissions if exists
    const customPerms = await prisma.projectPermission.findUnique({
      where: {
        userId_projectId: {
          userId: parseInt(userId),
          projectId: parseInt(projectId),
        },
      },
    });

    if (customPerms) {
      return res.json({
        ...customPerms,
        visiblePhases: customPerms.visiblePhases ? JSON.parse(customPerms.visiblePhases) : null,
        isCustom: true,
      });
    }

    // Get default permissions based on role
    const userProject = await prisma.userProject.findUnique({
      where: {
        userId_projectId: {
          userId: parseInt(userId),
          projectId: parseInt(projectId),
        },
      },
    });

    if (!userProject) {
      return res.status(404).json({ error: 'User not in project' });
    }

    res.json({
      userId: parseInt(userId),
      projectId: parseInt(projectId),
      ...defaultPermissions[userProject.role],
      isCustom: false,
      role: userProject.role,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Get current user's permissions for a project
router.get('/project/:projectId/me', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Check if user is admin (bypass all permissions)
    if (req.user.role === 'ADMIN') {
      return res.json({
        userId,
        projectId: parseInt(projectId),
        ...defaultPermissions.OWNER,
        isAdmin: true,
      });
    }

    // Get custom permissions if exists
    const customPerms = await prisma.projectPermission.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: parseInt(projectId),
        },
      },
    });

    if (customPerms) {
      return res.json({
        ...customPerms,
        visiblePhases: customPerms.visiblePhases ? JSON.parse(customPerms.visiblePhases) : null,
        isCustom: true,
      });
    }

    // Get default permissions based on role
    const userProject = await prisma.userProject.findUnique({
      where: {
        userId_projectId: {
          userId,
          projectId: parseInt(projectId),
        },
      },
    });

    if (!userProject) {
      return res.status(404).json({ error: 'Not in project' });
    }

    res.json({
      userId,
      projectId: parseInt(projectId),
      ...defaultPermissions[userProject.role],
      isCustom: false,
      role: userProject.role,
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Set custom permissions for a user
router.put('/project/:projectId/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { projectId, userId } = req.params;
    const {
      canCreateTasks,
      canEditTasks,
      canDeleteTasks,
      canAssignTasks,
      canManagePhases,
      canManageTeam,
      canManageProject,
      visiblePhases,
    } = req.body;

    // Check if requesting user has permission
    const requesterRole = await getUserProjectRole(req.user.id, parseInt(projectId));
    if (requesterRole !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only project owners can modify permissions' });
    }

    const permissions = await prisma.projectPermission.upsert({
      where: {
        userId_projectId: {
          userId: parseInt(userId),
          projectId: parseInt(projectId),
        },
      },
      update: {
        canCreateTasks,
        canEditTasks,
        canDeleteTasks,
        canAssignTasks,
        canManagePhases,
        canManageTeam,
        canManageProject,
        visiblePhases: visiblePhases ? JSON.stringify(visiblePhases) : null,
      },
      create: {
        userId: parseInt(userId),
        projectId: parseInt(projectId),
        canCreateTasks: canCreateTasks ?? true,
        canEditTasks: canEditTasks ?? true,
        canDeleteTasks: canDeleteTasks ?? false,
        canAssignTasks: canAssignTasks ?? true,
        canManagePhases: canManagePhases ?? false,
        canManageTeam: canManageTeam ?? false,
        canManageProject: canManageProject ?? false,
        visiblePhases: visiblePhases ? JSON.stringify(visiblePhases) : null,
      },
    });

    res.json({
      ...permissions,
      visiblePhases: permissions.visiblePhases ? JSON.parse(permissions.visiblePhases) : null,
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Delete custom permissions (revert to role defaults)
router.delete('/project/:projectId/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { projectId, userId } = req.params;

    // Check if requesting user has permission
    const requesterRole = await getUserProjectRole(req.user.id, parseInt(projectId));
    if (requesterRole !== 'OWNER' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only project owners can modify permissions' });
    }

    await prisma.projectPermission.delete({
      where: {
        userId_projectId: {
          userId: parseInt(userId),
          projectId: parseInt(projectId),
        },
      },
    });

    res.json({ success: true, message: 'Reverted to default permissions' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.json({ success: true, message: 'No custom permissions to delete' });
    }
    console.error('Error deleting permissions:', error);
    res.status(500).json({ error: 'Failed to delete permissions' });
  }
});

// Get all project members with their permissions
router.get('/project/:projectId/all', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if requesting user has permission
    const requesterRole = await getUserProjectRole(req.user.id, parseInt(projectId));
    if (!requesterRole && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Get all users in project
    const userProjects = await prisma.userProject.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        user: {
          select: { id: true, name: true, username: true, email: true },
        },
      },
    });

    // Get custom permissions
    const customPerms = await prisma.projectPermission.findMany({
      where: { projectId: parseInt(projectId) },
    });

    const customPermsMap = new Map(customPerms.map((p) => [p.userId, p]));

    const result = userProjects.map((up) => {
      const custom = customPermsMap.get(up.userId);
      if (custom) {
        return {
          user: up.user,
          role: up.role,
          permissions: {
            ...custom,
            visiblePhases: custom.visiblePhases ? JSON.parse(custom.visiblePhases) : null,
          },
          isCustom: true,
        };
      }
      return {
        user: up.user,
        role: up.role,
        permissions: defaultPermissions[up.role],
        isCustom: false,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Error fetching all permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Helper function to get user's project role
async function getUserProjectRole(userId, projectId) {
  const userProject = await prisma.userProject.findUnique({
    where: {
      userId_projectId: {
        userId,
        projectId,
      },
    },
  });
  return userProject?.role || null;
}

module.exports = router;
