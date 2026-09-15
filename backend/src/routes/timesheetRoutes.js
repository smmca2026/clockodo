const express = require('express');
const router = express.Router();
const { pool } = require('../db/mysql');

// GET /api/timesheets
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, project_name as projectName, project_color as projectColor, task_description as taskDescription, billable, days_json as days, total
      FROM timesheets
      ORDER BY created_at ASC
    `);
    
    // Parse JSON if needed and attach both days and hours properties
    const parsed = rows.map(r => {
      const daysObj = typeof r.days === 'string' ? JSON.parse(r.days) : (r.days || {});
      return {
        ...r,
        days: daysObj,
        hours: daysObj
      };
    });

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('Get timesheets error:', err);
    res.status(500).json({ success: false, message: 'Error fetching timesheets', error: err.message });
  }
});

// PUT /api/timesheets (Full Sync)
router.put('/', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) {
      return res.status(400).json({ success: false, message: 'Rows must be an array.' });
    }

    await pool.query('DELETE FROM timesheets');
    for (const r of rows) {
      const daysJson = JSON.stringify(r.days || r.hours || {});
      await pool.query(`
        INSERT INTO timesheets (id, project_name, project_color, task_description, billable, days_json, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [r.id || `ts-${Date.now()}`, r.projectName, r.projectColor || '#10b981', r.taskDescription || '', r.billable !== undefined ? r.billable : true, daysJson, r.total || '00:00:00']);
    }

    res.json({ success: true, message: 'Timesheet synchronized to MySQL database' });
  } catch (err) {
    console.error('Sync timesheets error:', err);
    res.status(500).json({ success: false, message: 'Error syncing timesheets', error: err.message });
  }
});

module.exports = router;
