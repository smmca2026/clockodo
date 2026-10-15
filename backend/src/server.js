const fs = require('fs');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { initDatabase } = require('./db/mysql');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const timesheetRoutes = require('./routes/timesheetRoutes');
const projectRoutes = require('./routes/projectRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();
// Default to 3022 matching VPS Nginx reverse proxy configuration
const PORT = process.env.PORT || 3022;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Dual-routing: Matches /api/* and /*
app.get(['/api/health', '/health'], (req, res) => {
  res.json({
    status: 'ok',
    service: 'Clockodo MySQL REST API Backend',
    database: 'MySQL (clockodo)',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/users', '/users'], userRoutes);
app.use(['/api/activities', '/activities'], activityRoutes);
app.use(['/api/timesheets', '/timesheets'], timesheetRoutes);
app.use(['/api/projects', '/projects'], projectRoutes);
app.use(['/api/attendance', '/attendance'], attendanceRoutes);
app.use(['/api/reports', '/reports'], reportRoutes);

// Serve frontend static build files (SPA fallback)
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
});

// Prevent server crash from unhandled exceptions
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception in Node process (prevented crash):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️ Unhandled Rejection in Node process (prevented crash):', reason);
});

// Start listening immediately on 0.0.0.0 to guarantee Nginx proxy never hits 502 Bad Gateway
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Clockodo REST API Backend is LIVE & LISTENING on 0.0.0.0:${PORT}`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Also bind secondary port 3000 if PORT is not 3000 (ensuring whichever port Nginx targets works)
if (Number(PORT) !== 3000) {
  try {
    const server3000 = app.listen(3000, '0.0.0.0', () => {
      console.log(`🚀 Clockodo secondary fallback listener active on 0.0.0.0:3000`);
    });
    server3000.keepAliveTimeout = 65000;
    server3000.headersTimeout = 66000;
    server3000.on('error', () => {});
  } catch (e) {}
}

// Initialize database in background without blocking HTTP server
initDatabase().catch(err => {
  console.error('Database initialization warning:', err);
});
