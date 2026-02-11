const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get custom fields for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const fields = await prisma.customField.findMany({
      where: { projectId: parseInt(projectId) },
      orderBy: { name: 'asc' }
    });
    res.json(fields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    res.status(500).json({ error: 'Failed to fetch custom fields' });
  }
});

// Create custom field
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, type, options, required, projectId } = req.body;

    const field = await prisma.customField.create({
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : null,
        required: required || false,
        projectId: parseInt(projectId)
      }
    });

    res.status(201).json(field);
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Field with this name already exists' });
    }
    console.error('Error creating custom field:', error);
    res.status(500).json({ error: 'Failed to create custom field' });
  }
});

// Update custom field
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, options, required } = req.body;

    const field = await prisma.customField.update({
      where: { id: parseInt(id) },
      data: {
        name,
        type,
        options: options ? JSON.stringify(options) : undefined,
        required
      }
    });

    res.json(field);
  } catch (error) {
    console.error('Error updating custom field:', error);
    res.status(500).json({ error: 'Failed to update custom field' });
  }
});

// Delete custom field
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.customField.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    res.status(500).json({ error: 'Failed to delete custom field' });
  }
});

// Get custom field values for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const values = await prisma.customFieldValue.findMany({
      where: { taskId: parseInt(taskId) },
      include: {
        field: true
      }
    });
    res.json(values);
  } catch (error) {
    console.error('Error fetching task custom values:', error);
    res.status(500).json({ error: 'Failed to fetch custom values' });
  }
});

// Set custom field value for a task
router.post('/task/:taskId/field/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { taskId, fieldId } = req.params;
    const { value } = req.body;

    const fieldValue = await prisma.customFieldValue.upsert({
      where: {
        fieldId_taskId: {
          fieldId: parseInt(fieldId),
          taskId: parseInt(taskId)
        }
      },
      update: { value: String(value) },
      create: {
        fieldId: parseInt(fieldId),
        taskId: parseInt(taskId),
        value: String(value)
      },
      include: {
        field: true
      }
    });

    res.json(fieldValue);
  } catch (error) {
    console.error('Error setting custom field value:', error);
    res.status(500).json({ error: 'Failed to set custom field value' });
  }
});

// Delete custom field value for a task
router.delete('/task/:taskId/field/:fieldId', authenticateToken, async (req, res) => {
  try {
    const { taskId, fieldId } = req.params;

    await prisma.customFieldValue.deleteMany({
      where: {
        fieldId: parseInt(fieldId),
        taskId: parseInt(taskId)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field value:', error);
    res.status(500).json({ error: 'Failed to delete custom field value' });
  }
});

// Bulk set custom field values for a task
router.post('/task/:taskId/bulk', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { values } = req.body; // Array of { fieldId, value }

    const results = await Promise.all(
      values.map(({ fieldId, value }) =>
        prisma.customFieldValue.upsert({
          where: {
            fieldId_taskId: {
              fieldId: parseInt(fieldId),
              taskId: parseInt(taskId)
            }
          },
          update: { value: String(value) },
          create: {
            fieldId: parseInt(fieldId),
            taskId: parseInt(taskId),
            value: String(value)
          }
        })
      )
    );

    res.json(results);
  } catch (error) {
    console.error('Error bulk setting custom field values:', error);
    res.status(500).json({ error: 'Failed to set custom field values' });
  }
});

module.exports = router;
