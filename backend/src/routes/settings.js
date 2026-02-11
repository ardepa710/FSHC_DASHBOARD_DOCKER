const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get user settings
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      theme,
      keyboardShortcuts,
      emailNotifications,
      emailTaskAssigned,
      emailTaskCompleted,
      emailMentions,
      emailDueReminders,
      reminderDaysBefore
    } = req.body;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: {
        theme,
        keyboardShortcuts,
        emailNotifications,
        emailTaskAssigned,
        emailTaskCompleted,
        emailMentions,
        emailDueReminders,
        reminderDaysBefore
      },
      create: {
        userId,
        theme: theme || 'dark',
        keyboardShortcuts: keyboardShortcuts !== false,
        emailNotifications: emailNotifications || false,
        emailTaskAssigned: emailTaskAssigned !== false,
        emailTaskCompleted: emailTaskCompleted !== false,
        emailMentions: emailMentions !== false,
        emailDueReminders: emailDueReminders !== false,
        reminderDaysBefore: reminderDaysBefore || 1
      }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Update theme only
router.patch('/theme', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme } = req.body;

    if (!['dark', 'light', 'system'].includes(theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { theme },
      create: { userId, theme }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating theme:', error);
    res.status(500).json({ error: 'Failed to update theme' });
  }
});

// Toggle keyboard shortcuts
router.patch('/keyboard-shortcuts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    let settings = await prisma.userSettings.findUnique({
      where: { userId }
    });

    const newValue = settings ? !settings.keyboardShortcuts : true;

    settings = await prisma.userSettings.upsert({
      where: { userId },
      update: { keyboardShortcuts: newValue },
      create: { userId, keyboardShortcuts: newValue }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error toggling keyboard shortcuts:', error);
    res.status(500).json({ error: 'Failed to toggle keyboard shortcuts' });
  }
});

// Update email notification settings
router.patch('/email-notifications', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      emailTaskAssigned,
      emailTaskCompleted,
      emailMentions,
      emailDueReminders,
      reminderDaysBefore
    } = req.body;

    const updateData = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (emailTaskAssigned !== undefined) updateData.emailTaskAssigned = emailTaskAssigned;
    if (emailTaskCompleted !== undefined) updateData.emailTaskCompleted = emailTaskCompleted;
    if (emailMentions !== undefined) updateData.emailMentions = emailMentions;
    if (emailDueReminders !== undefined) updateData.emailDueReminders = emailDueReminders;
    if (reminderDaysBefore !== undefined) updateData.reminderDaysBefore = reminderDaysBefore;

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      update: updateData,
      create: { userId, ...updateData }
    });

    res.json(settings);
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Failed to update email settings' });
  }
});

module.exports = router;
