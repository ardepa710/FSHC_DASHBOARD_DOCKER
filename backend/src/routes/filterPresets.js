const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user's filter presets for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const presets = await prisma.filterPreset.findMany({
      where: {
        projectId: parseInt(projectId),
        userId
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }]
    });

    res.json(presets.map(p => ({
      ...p,
      filters: JSON.parse(p.filters)
    })));
  } catch (error) {
    console.error('Error fetching filter presets:', error);
    res.status(500).json({ error: 'Failed to fetch filter presets' });
  }
});

// Create filter preset
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, filters, isDefault, projectId } = req.body;
    const userId = req.user.id;

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.filterPreset.updateMany({
        where: { userId, projectId: parseInt(projectId), isDefault: true },
        data: { isDefault: false }
      });
    }

    const preset = await prisma.filterPreset.create({
      data: {
        name,
        filters: JSON.stringify(filters),
        isDefault: isDefault || false,
        userId,
        projectId: parseInt(projectId)
      }
    });

    res.status(201).json({
      ...preset,
      filters: JSON.parse(preset.filters)
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Preset with this name already exists' });
    }
    console.error('Error creating filter preset:', error);
    res.status(500).json({ error: 'Failed to create filter preset' });
  }
});

// Update filter preset
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, filters, isDefault } = req.body;
    const userId = req.user.id;

    // Verify ownership
    const existing = await prisma.filterPreset.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await prisma.filterPreset.updateMany({
        where: { userId, projectId: existing.projectId, isDefault: true, id: { not: parseInt(id) } },
        data: { isDefault: false }
      });
    }

    const preset = await prisma.filterPreset.update({
      where: { id: parseInt(id) },
      data: {
        name,
        filters: filters ? JSON.stringify(filters) : undefined,
        isDefault
      }
    });

    res.json({
      ...preset,
      filters: JSON.parse(preset.filters)
    });
  } catch (error) {
    console.error('Error updating filter preset:', error);
    res.status(500).json({ error: 'Failed to update filter preset' });
  }
});

// Delete filter preset
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const existing = await prisma.filterPreset.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    await prisma.filterPreset.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter preset:', error);
    res.status(500).json({ error: 'Failed to delete filter preset' });
  }
});

// Set preset as default
router.patch('/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const preset = await prisma.filterPreset.findFirst({
      where: { id: parseInt(id), userId }
    });

    if (!preset) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    // Unset other defaults
    await prisma.filterPreset.updateMany({
      where: { userId, projectId: preset.projectId, isDefault: true },
      data: { isDefault: false }
    });

    // Set this as default
    const updated = await prisma.filterPreset.update({
      where: { id: parseInt(id) },
      data: { isDefault: true }
    });

    res.json({
      ...updated,
      filters: JSON.parse(updated.filters)
    });
  } catch (error) {
    console.error('Error setting default preset:', error);
    res.status(500).json({ error: 'Failed to set default preset' });
  }
});

module.exports = router;
