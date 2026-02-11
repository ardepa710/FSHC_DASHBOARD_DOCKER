const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get tags for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const tags = await prisma.tag.findMany({
      where: { projectId: parseInt(projectId) },
      include: {
        _count: { select: { tasks: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create tag
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, color, projectId } = req.body;
    const tag = await prisma.tag.create({
      data: {
        name,
        color: color || '#6c8cff',
        projectId: parseInt(projectId)
      }
    });
    res.status(201).json(tag);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Tag with this name already exists' });
    }
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// Update tag
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const tag = await prisma.tag.update({
      where: { id: parseInt(id) },
      data: { name, color }
    });
    res.json(tag);
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// Delete tag
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tag.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// Add tag to task
router.post('/task/:taskId/tag/:tagId', authenticateToken, async (req, res) => {
  try {
    const { taskId, tagId } = req.params;
    const taskTag = await prisma.taskTag.create({
      data: {
        taskId: parseInt(taskId),
        tagId: parseInt(tagId)
      },
      include: { tag: true }
    });
    res.status(201).json(taskTag);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Tag already assigned to task' });
    }
    console.error('Error adding tag to task:', error);
    res.status(500).json({ error: 'Failed to add tag to task' });
  }
});

// Remove tag from task
router.delete('/task/:taskId/tag/:tagId', authenticateToken, async (req, res) => {
  try {
    const { taskId, tagId } = req.params;
    await prisma.taskTag.deleteMany({
      where: {
        taskId: parseInt(taskId),
        tagId: parseInt(tagId)
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing tag from task:', error);
    res.status(500).json({ error: 'Failed to remove tag from task' });
  }
});

module.exports = router;
