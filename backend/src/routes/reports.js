const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get project overview analytics
router.get('/project/:projectId/overview', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const pId = parseInt(projectId);

    // Task counts by status
    const tasksByStatus = await prisma.task.groupBy({
      by: ['status'],
      where: { phase: { projectId: pId } },
      _count: true
    });

    // Task counts by priority
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      where: { phase: { projectId: pId } },
      _count: true
    });

    // Task counts by phase
    const tasksByPhase = await prisma.phase.findMany({
      where: { projectId: pId },
      include: {
        _count: { select: { tasks: true } },
        tasks: {
          select: { status: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    // Overdue tasks
    const overdueTasks = await prisma.task.count({
      where: {
        phase: { projectId: pId },
        status: { not: 'DONE' },
        dueDate: { lt: new Date() }
      }
    });

    // Tasks due this week
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const dueThisWeek = await prisma.task.count({
      where: {
        phase: { projectId: pId },
        status: { not: 'DONE' },
        dueDate: {
          gte: new Date(),
          lte: weekFromNow
        }
      }
    });

    // Completion rate
    const totalTasks = await prisma.task.count({
      where: { phase: { projectId: pId } }
    });
    const completedTasks = await prisma.task.count({
      where: { phase: { projectId: pId }, status: 'DONE' }
    });
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.json({
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {}),
      tasksByPriority: tasksByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count;
        return acc;
      }, {}),
      tasksByPhase: tasksByPhase.map(p => ({
        id: p.id,
        name: p.name,
        color: p.color,
        total: p._count.tasks,
        done: p.tasks.filter(t => t.status === 'DONE').length,
        inProgress: p.tasks.filter(t => t.status === 'IN_PROGRESS').length,
        blocked: p.tasks.filter(t => t.status === 'BLOCKED').length
      })),
      overdueTasks,
      dueThisWeek,
      totalTasks,
      completedTasks,
      completionRate
    });
  } catch (error) {
    console.error('Error fetching project overview:', error);
    res.status(500).json({ error: 'Failed to fetch project overview' });
  }
});

// Get workload by assignee
router.get('/project/:projectId/workload', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const pId = parseInt(projectId);

    const assignees = await prisma.assignee.findMany({
      where: { projectId: pId },
      include: {
        tasks: {
          where: { status: { not: 'DONE' } },
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true
          }
        }
      }
    });

    const workload = assignees.map(assignee => {
      const tasks = assignee.tasks;
      const highPriority = tasks.filter(t => t.priority === 'HIGH').length;
      const overdue = tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date()).length;

      return {
        id: assignee.id,
        name: assignee.name,
        initials: assignee.initials,
        color: assignee.color,
        role: assignee.role,
        totalTasks: tasks.length,
        highPriority,
        overdue,
        inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
        blocked: tasks.filter(t => t.status === 'BLOCKED').length,
        tasks: tasks
      };
    });

    // Sort by total tasks descending
    workload.sort((a, b) => b.totalTasks - a.totalTasks);

    // Unassigned tasks
    const unassignedCount = await prisma.task.count({
      where: {
        phase: { projectId: pId },
        assigneeId: null,
        status: { not: 'DONE' }
      }
    });

    res.json({
      assignees: workload,
      unassignedTasks: unassignedCount
    });
  } catch (error) {
    console.error('Error fetching workload:', error);
    res.status(500).json({ error: 'Failed to fetch workload' });
  }
});

// Get task completion trend (daily/weekly)
router.get('/project/:projectId/trend', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;
    const pId = parseInt(projectId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get tasks completed in date range
    const completedTasks = await prisma.task.findMany({
      where: {
        phase: { projectId: pId },
        status: 'DONE',
        updatedAt: { gte: startDate }
      },
      select: {
        updatedAt: true
      }
    });

    // Group by date
    const trend = {};
    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      trend[dateKey] = 0;
    }

    completedTasks.forEach(task => {
      const dateKey = task.updatedAt.toISOString().split('T')[0];
      if (trend[dateKey] !== undefined) {
        trend[dateKey]++;
      }
    });

    res.json({
      trend: Object.entries(trend).map(([date, count]) => ({ date, completed: count }))
    });
  } catch (error) {
    console.error('Error fetching trend:', error);
    res.status(500).json({ error: 'Failed to fetch trend' });
  }
});

// Get My Tasks (personal dashboard)
router.get('/my-tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's projects
    const userProjects = await prisma.userProject.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const projectIds = userProjects.map(up => up.projectId);

    // Get assignees linked to this user (by name match or you can add userId to Assignee)
    const user = await prisma.user.findUnique({ where: { id: userId } });

    // Find all tasks assigned to assignees with matching name
    const assignees = await prisma.assignee.findMany({
      where: {
        projectId: { in: projectIds },
        name: { contains: user.name, mode: 'insensitive' }
      },
      select: { id: true }
    });
    const assigneeIds = assignees.map(a => a.id);

    // Get tasks
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { assigneeId: { in: assigneeIds } },
          // Also include tasks from user's projects if they created them
          {
            phase: { projectId: { in: projectIds } },
            // You might want to add createdBy field to track this
          }
        ]
      },
      include: {
        phase: {
          include: { project: { select: { id: true, name: true, icon: true, color: true } } }
        },
        assignee: true,
        tags: { include: { tag: true } }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' }
      ]
    });

    // Organize by status
    const organized = {
      overdue: tasks.filter(t => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < new Date()),
      today: tasks.filter(t => {
        if (t.status === 'DONE' || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        return due.toDateString() === today.toDateString();
      }),
      upcoming: tasks.filter(t => {
        if (t.status === 'DONE' || !t.dueDate) return false;
        const due = new Date(t.dueDate);
        const today = new Date();
        const weekFromNow = new Date();
        weekFromNow.setDate(weekFromNow.getDate() + 7);
        return due > today && due <= weekFromNow;
      }),
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS'),
      notStarted: tasks.filter(t => t.status === 'NOT_STARTED'),
      blocked: tasks.filter(t => t.status === 'BLOCKED'),
      completed: tasks.filter(t => t.status === 'DONE').slice(0, 10) // Last 10 completed
    };

    res.json({
      tasks: organized,
      summary: {
        total: tasks.filter(t => t.status !== 'DONE').length,
        overdue: organized.overdue.length,
        dueToday: organized.today.length,
        inProgress: organized.inProgress.length,
        blocked: organized.blocked.length
      }
    });
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ error: 'Failed to fetch my tasks' });
  }
});

// Get burndown chart data
router.get('/project/:projectId/burndown', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { days = 30 } = req.query;
    const pId = parseInt(projectId);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get all tasks in project
    const allTasks = await prisma.task.findMany({
      where: { phase: { projectId: pId } },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Calculate burndown
    const burndown = [];
    const totalTasks = allTasks.length;

    for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      const completedByDate = allTasks.filter(t =>
        t.status === 'DONE' &&
        t.updatedAt <= d
      ).length;

      burndown.push({
        date: dateKey,
        remaining: totalTasks - completedByDate,
        completed: completedByDate,
        total: totalTasks
      });
    }

    res.json({ burndown });
  } catch (error) {
    console.error('Error fetching burndown:', error);
    res.status(500).json({ error: 'Failed to fetch burndown' });
  }
});

// Get tag analytics
router.get('/project/:projectId/tags', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const pId = parseInt(projectId);

    const tags = await prisma.tag.findMany({
      where: { projectId: pId },
      include: {
        tasks: {
          include: {
            task: {
              select: { status: true, priority: true }
            }
          }
        }
      }
    });

    const tagStats = tags.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color,
      totalTasks: tag.tasks.length,
      completed: tag.tasks.filter(tt => tt.task.status === 'DONE').length,
      inProgress: tag.tasks.filter(tt => tt.task.status === 'IN_PROGRESS').length,
      highPriority: tag.tasks.filter(tt => tt.task.priority === 'HIGH').length
    }));

    res.json(tagStats);
  } catch (error) {
    console.error('Error fetching tag analytics:', error);
    res.status(500).json({ error: 'Failed to fetch tag analytics' });
  }
});

module.exports = router;
