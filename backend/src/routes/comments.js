const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get comments for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await prisma.comment.findMany({
      where: {
        taskId: parseInt(taskId),
        parentId: null // Only top-level comments
      },
      include: {
        author: {
          select: { id: true, name: true, username: true }
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, username: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Create comment
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { taskId, content, parentId, mentions } = req.body;
    const userId = req.user.id;

    const comment = await prisma.comment.create({
      data: {
        taskId: parseInt(taskId),
        content,
        authorId: userId,
        parentId: parentId ? parseInt(parentId) : null,
        mentions: mentions ? JSON.stringify(mentions) : null
      },
      include: {
        author: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    // Create notifications for mentions
    if (mentions && mentions.length > 0) {
      const task = await prisma.task.findUnique({
        where: { id: parseInt(taskId) },
        select: { title: true, phaseId: true, phase: { select: { projectId: true } } }
      });

      await prisma.notification.createMany({
        data: mentions.map(mentionedUserId => ({
          type: 'MENTION',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
          userId: mentionedUserId,
          taskId: parseInt(taskId),
          projectId: task.phase.projectId,
          actorId: userId
        }))
      });
    }

    // Log activity
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      select: { title: true, phase: { select: { projectId: true } } }
    });

    await prisma.activityLog.create({
      data: {
        action: 'COMMENT_ADDED',
        entityType: 'task',
        entityId: parseInt(taskId),
        entityName: task.title,
        userId,
        projectId: task.phase.projectId
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Update comment
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Check ownership
    const existing = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    const comment = await prisma.comment.update({
      where: { id: parseInt(id) },
      data: { content },
      include: {
        author: {
          select: { id: true, name: true, username: true }
        }
      }
    });

    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.comment.findUnique({ where: { id: parseInt(id) } });
    if (!existing || (existing.authorId !== userId && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await prisma.comment.delete({ where: { id: parseInt(id) } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
