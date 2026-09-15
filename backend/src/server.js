const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./db/mysql');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const projectRoutes = require('./routes/projectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} -${duration}ms`);
  });
  next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Clockodo MySQL REST API Backend',
    database: 'MySQL (clockodo_db)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/timesheets', timesheetRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Initialize MySQL Schema and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`
  ======================================================
  🐬 Clockodo MySQL REST API Backend Server is RUNNING!
  📡 URL: http://localhost:${PORT}
  🔗 Health Check: http://localhost:${PORT}/api/health
  📂 Database: MySQL Connected & Seeded (clockodo_db)
  🔑 MySQL Password: Configured & Verified
  ======================================================
    `);
  });
}).catch(err => {
  console.error('Fatal: Failed to connect to MySQL database:', err);
});
