const express = require('express');
const router = express.Router();
const { pool, calculateShiftStatus } = require('../db/mysql');

// GET /api/attendance
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, user_id as userId, user_name as userName, user_role as userRole, date, clock_in as clockIn, clock_out as clockOut, break_time as breakTime, total_shift as totalShift, status
      FROM attendance
      ORDER BY created_at DESC
    `);

    const evaluated = rows.map(r => ({
      ...r,
      status: calculateShiftStatus(r.clockIn, r.status)
    }));

    res.json({ success: true, data: evaluated });
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ success: false, message: 'Error fetching attendance', error: err.message });
  }
});

// POST /api/attendance/clock-in
router.post('/clock-in', async (req, res) => {
  try {
    const { userId, userName, userRole, clockInTime } = req.body;
    const now = new Date();
    const timeStr = clockInTime || now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    const status = calculateShiftStatus(timeStr, 'Active (Working)');
    const id = `att-${Date.now()}`;

    await pool.query(`
      INSERT INTO attendance (id, user_id, user_name, user_role, date, clock_in, clock_out, break_time, total_shift, status)
      VALUES (?, ?, ?, ?, ?, ?, '—', '00:00:00', '00:00:00', ?)
    `, [id, userId || 'usr-1', userName || 'Bharath (Owner)', userRole || 'Admin (Owner)', dateStr, timeStr, status]);

    res.status(201).json({
      success: true,
      message: 'Clock-in recorded in MySQL database',
      data: { id, userId, userName, userRole, date: dateStr, clockIn: timeStr, clockOut: '—', breakTime: '00:00:00', totalShift: '00:00:00', status }
    });
  } catch (err) {
    console.error('Clock-in error:', err);
    res.status(500).json({ success: false, message: 'Error recording clock-in', error: err.message });
  }
});

module.exports = router;
