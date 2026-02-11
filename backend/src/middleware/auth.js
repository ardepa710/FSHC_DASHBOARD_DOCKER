const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'fshc-dashboard-secret-key-2026';

// Verify JWT token middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Check if user has access to project
const requireProjectAccess = async (req, res, next) => {
  const projectId = parseInt(req.params.projectId || req.body.projectId || req.query.projectId);

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID required' });
  }

  // Admins have access to all projects
  if (req.user.role === 'ADMIN') {
    req.projectId = projectId;
    return next();
  }

  // Check if user is assigned to the project
  const userProject = await prisma.userProject.findUnique({
    where: {
      userId_projectId: {
        userId: req.user.id,
        projectId: projectId,
      }
    }
  });

  if (!userProject) {
    return res.status(403).json({ error: 'Access to this project denied' });
  }

  req.projectId = projectId;
  req.projectRole = userProject.role;
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireProjectAccess,
  JWT_SECRET,
};
