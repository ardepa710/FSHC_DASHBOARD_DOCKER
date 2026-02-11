const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get dependencies for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    // Get tasks this task depends on (blocking tasks)
    const dependsOn = await prisma.taskDependency.findMany({
      where: { dependentTaskId: parseInt(taskId) },
      include: {
        blockingTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, name: true, initials: true, color: true } }
          }
        }
      }
    });

    // Get tasks blocked by this task
    const blocks = await prisma.taskDependency.findMany({
      where: { blockingTaskId: parseInt(taskId) },
      include: {
        dependentTask: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            assignee: { select: { id: true, name: true, initials: true, color: true } }
          }
        }
      }
    });

    res.json({
      dependsOn: dependsOn.map(d => ({ ...d.blockingTask, dependencyId: d.id })),
      blocks: blocks.map(d => ({ ...d.dependentTask, dependencyId: d.id }))
    });
  } catch (error) {
    console.error('Error fetching dependencies:', error);
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
});

// Add dependency (taskId depends on blockingTaskId)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { dependentTaskId, blockingTaskId } = req.body;

    // Prevent self-dependency
    if (dependentTaskId === blockingTaskId) {
      return res.status(400).json({ error: 'A task cannot depend on itself' });
    }

    // Check for circular dependency
    const wouldCreateCycle = await checkCircularDependency(
      parseInt(blockingTaskId),
      parseInt(dependentTaskId)
    );

    if (wouldCreateCycle) {
      return res.status(400).json({ error: 'This would create a circular dependency' });
    }

    const dependency = await prisma.taskDependency.create({
      data: {
        dependentTaskId: parseInt(dependentTaskId),
        blockingTaskId: parseInt(blockingTaskId)
      },
      include: {
        blockingTask: {
          select: { id: true, title: true, status: true }
        },
        dependentTask: {
          select: { id: true, title: true, status: true }
        }
      }
    });

    // Log activity
    const task = await prisma.task.findUnique({
      where: { id: parseInt(dependentTaskId) },
      select: { title: true, phase: { select: { projectId: true } } }
    });

    await prisma.activityLog.create({
      data: {
        action: 'DEPENDENCY_ADDED',
        entityType: 'task',
        entityId: parseInt(dependentTaskId),
        entityName: task.title,
        userId: req.user.id,
        projectId: task.phase.projectId,
        changes: JSON.stringify({ blockingTaskId, blockingTaskTitle: dependency.blockingTask.title })
      }
    });

    res.status(201).json(dependency);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'This dependency already exists' });
    }
    console.error('Error creating dependency:', error);
    res.status(500).json({ error: 'Failed to create dependency' });
  }
});

// Remove dependency
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const dependency = await prisma.taskDependency.findUnique({
      where: { id: parseInt(id) },
      include: {
        dependentTask: { select: { title: true, phase: { select: { projectId: true } } } },
        blockingTask: { select: { title: true } }
      }
    });

    if (!dependency) {
      return res.status(404).json({ error: 'Dependency not found' });
    }

    await prisma.taskDependency.delete({ where: { id: parseInt(id) } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'DEPENDENCY_REMOVED',
        entityType: 'task',
        entityId: dependency.dependentTaskId,
        entityName: dependency.dependentTask.title,
        userId: req.user.id,
        projectId: dependency.dependentTask.phase.projectId,
        changes: JSON.stringify({ removedBlockingTask: dependency.blockingTask.title })
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting dependency:', error);
    res.status(500).json({ error: 'Failed to delete dependency' });
  }
});

// Check if all dependencies are resolved for a task
router.get('/task/:taskId/resolved', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;

    const unresolved = await prisma.taskDependency.findMany({
      where: {
        dependentTaskId: parseInt(taskId),
        blockingTask: {
          status: { not: 'DONE' }
        }
      },
      include: {
        blockingTask: { select: { id: true, title: true, status: true } }
      }
    });

    res.json({
      resolved: unresolved.length === 0,
      unresolvedCount: unresolved.length,
      unresolvedTasks: unresolved.map(d => d.blockingTask)
    });
  } catch (error) {
    console.error('Error checking dependencies:', error);
    res.status(500).json({ error: 'Failed to check dependencies' });
  }
});

// Helper: Check for circular dependency
async function checkCircularDependency(startTaskId, targetTaskId, visited = new Set()) {
  if (startTaskId === targetTaskId) return true;
  if (visited.has(startTaskId)) return false;

  visited.add(startTaskId);

  const dependencies = await prisma.taskDependency.findMany({
    where: { dependentTaskId: startTaskId },
    select: { blockingTaskId: true }
  });

  for (const dep of dependencies) {
    if (await checkCircularDependency(dep.blockingTaskId, targetTaskId, visited)) {
      return true;
    }
  }

  return false;
}

module.exports = router;
