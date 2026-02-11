const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'application/zip', 'application/x-rar-compressed'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

// Get attachments for a task
router.get('/task/:taskId', authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const attachments = await prisma.attachment.findMany({
      where: { taskId: parseInt(taskId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(attachments);
  } catch (error) {
    console.error('Error fetching attachments:', error);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

// Upload attachment
router.post('/task/:taskId', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await prisma.attachment.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        taskId: parseInt(taskId),
        uploadedBy: userId
      }
    });

    // Log activity
    const task = await prisma.task.findUnique({
      where: { id: parseInt(taskId) },
      select: { title: true, phase: { select: { projectId: true } } }
    });

    await prisma.activityLog.create({
      data: {
        action: 'ATTACHMENT_ADDED',
        entityType: 'task',
        entityId: parseInt(taskId),
        entityName: task.title,
        userId,
        projectId: task.phase.projectId,
        changes: JSON.stringify({ filename: req.file.originalname })
      }
    });

    res.status(201).json(attachment);
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
});

// Download attachment
router.get('/download/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    const filePath = path.join(__dirname, '../../uploads', attachment.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, attachment.originalName);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ error: 'Failed to download attachment' });
  }
});

// Delete attachment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const attachment = await prisma.attachment.findUnique({
      where: { id: parseInt(id) }
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    // Check permission (uploader or admin)
    if (attachment.uploadedBy !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Not authorized to delete this attachment' });
    }

    // Delete file from disk
    const filePath = path.join(__dirname, '../../uploads', attachment.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await prisma.attachment.delete({ where: { id: parseInt(id) } });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
});

module.exports = router;
