const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get templates for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const templates = await prisma.taskTemplate.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { name: 'asc' }
    });
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Get single template
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const template = await prisma.taskTemplate.findUnique({
      where: { id: parseInt(id) }
    });
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// Create template
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, title, description, priority, subtasks, tags, projectId } = req.body;

    const template = await prisma.taskTemplate.create({
      data: {
        name,
        title,
        description,
        priority: priority || 'MEDIUM',
        subtasks: subtasks ? JSON.stringify(subtasks) : null,
        tags: tags ? JSON.stringify(tags) : null,
        projectId: parseInt(projectId)
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Create template from existing task
router.post('/from-task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { name } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      include: {
        subtasks: { select: { title: true } },
        tags: { include: { tag: true } },
        phase: { select: { projectId: true } }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const template = await prisma.taskTemplate.create({
      data: {
        name: name || `Template from: ${task.title}`,
        title: task.title,
        description: task.description,
        priority: task.priority,
        subtasks: JSON.stringify(task.subtasks.map(s => s.title)),
        tags: JSON.stringify(task.tags.map(t => t.tagId)),
        projectId: task.phase.projectId
      }
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template from task:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Update template
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, description, priority, subtasks, tags } = req.body;

    const template = await prisma.taskTemplate.update({
      where: { id: parseInt(id) },
      data: {
        name,
        title,
        description,
        priority,
        subtasks: subtasks ? JSON.stringify(subtasks) : undefined,
        tags: tags ? JSON.stringify(tags) : undefined
      }
    });

    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// Delete template
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.taskTemplate.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

// Create task from template
router.post('/:id/create-task', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { phaseId, assigneeId, dueDate } = req.body;

    const template = await prisma.taskTemplate.findUnique({
      where: { id: parseInt(id) }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const subtasks = template.subtasks ? JSON.parse(template.subtasks) : [];
    const tagIds = template.tags ? JSON.parse(template.tags) : [];

    const task = await prisma.task.create({
      data: {
        title: template.title,
        description: template.description,
        priority: template.priority,
        phaseId: parseInt(phaseId),
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        templateId: template.id,
        subtasks: {
          create: subtasks.map(title => ({ title }))
        },
        tags: {
          create: tagIds.map(tagId => ({ tagId }))
        }
      },
      include: {
        subtasks: true,
        tags: { include: { tag: true } },
        phase: true,
        assignee: true
      }
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task from template:', error);
    res.status(500).json({ error: 'Failed to create task from template' });
  }
});

module.exports = router;
