const express = require('express');
const router = express.Router();
const { pool } = require('../db/mysql');

// GET /api/projects
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, client, color, tracked_hours as trackedHours, budget, hourly_rate as hourlyRate, is_billable as isBillable
      FROM projects
      ORDER BY name ASC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ success: false, message: 'Error fetching projects', error: err.message });
  }
});

// POST /api/projects
router.post('/', async (req, res) => {
  try {
    const { name, client, color, hourlyRate, budget, isBillable } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Project name is required.' });
    }

    const id = req.body.id || `proj-${Date.now()}`;
    await pool.query(`
      INSERT INTO projects (id, name, client, color, tracked_hours, budget, hourly_rate, is_billable)
      VALUES (?, ?, ?, ?, '00:00', ?, ?, ?)
    `, [id, name, client || 'DigiPlusAgency', color || '#10b981', budget || '40h', hourlyRate || 85.00, isBillable !== undefined ? isBillable : true]);

    res.status(201).json({
      success: true,
      message: 'Project created in MySQL database',
      data: { id, name, client: client || 'DigiPlusAgency', color: color || '#10b981', trackedHours: '00:00', budget: budget || '40h', hourlyRate: hourlyRate || 85, isBillable }
    });
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ success: false, message: 'Error creating project', error: err.message });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM projects WHERE id = ?', [id]);
    res.json({ success: true, message: 'Project deleted from MySQL database.' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ success: false, message: 'Error deleting project', error: err.message });
  }
});

module.exports = router;
