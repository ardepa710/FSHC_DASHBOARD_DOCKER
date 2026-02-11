const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const phaseRoutes = require('./routes/phases');
const assigneeRoutes = require('./routes/assignees');
const commentsRoutes = require('./routes/comments');
const tagsRoutes = require('./routes/tags');
const timeTrackingRoutes = require('./routes/timeTracking');
const notificationsRoutes = require('./routes/notifications');
const activitiesRoutes = require('./routes/activities');
const dependenciesRoutes = require('./routes/dependencies');
const templatesRoutes = require('./routes/templates');
const customFieldsRoutes = require('./routes/customFields');
const bulkRoutes = require('./routes/bulk');
const attachmentsRoutes = require('./routes/attachments');
const recurringRoutes = require('./routes/recurring');
const reportsRoutes = require('./routes/reports');
const exportRoutes = require('./routes/export');
const filterPresetsRoutes = require('./routes/filterPresets');
const settingsRoutes = require('./routes/settings');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Accesible desde cualquier IP en la red

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/phases', phaseRoutes);
app.use('/api/assignees', assigneeRoutes);
app.use('/api/comments', commentsRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/time-tracking', timeTrackingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/activities', activitiesRoutes);
app.use('/api/dependencies', dependenciesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/custom-fields', customFieldsRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/attachments', attachmentsRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/filter-presets', filterPresetsRoutes);
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  console.log(`Accessible from network at http://<your-ip>:${PORT}`);
});
