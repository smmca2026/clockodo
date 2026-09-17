const express = require('express');
const router = express.Router();
const { pool } = require('../db/mysql');

// GET /api/activities
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, project, project_color as projectColor, description, group_name as \`group\`, 
        date, start_time as startTime, end_time as endTime, 
        duration_formatted as durationFormatted, duration_seconds as durationSeconds, 
        billable, user_name as user, created_at
      FROM activities 
      ORDER BY created_at DESC
    `);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, message: 'Error fetching activities', error: err.message });
  }
});

// POST /api/activities (Upsert / deduplicate by project, date, and user)
router.post('/', async (req, res) => {
  try {
    const { project, projectColor, description, group, date, startTime, endTime, durationFormatted, durationSeconds, billable, user } = req.body;
    if (!project) {
      return res.status(400).json({ success: false, message: 'Project is required.' });
    }

    const id = req.body.id || `act-${Date.now()}`;
    const curDate = date || new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    const userName = user || 'Bharath (Owner)';

    // Check if an entry for the exact same project, date, and user already exists
    const [existing] = await pool.query(
      'SELECT id FROM activities WHERE LOWER(TRIM(project)) = LOWER(TRIM(?)) AND TRIM(date) = TRIM(?) AND LOWER(TRIM(user_name)) = LOWER(TRIM(?))',
      [project, curDate, userName]
    );

    if (existing.length > 0) {
      // Update existing record instead of creating duplicate
      const primaryId = existing[0].id;
      await pool.query(`
        UPDATE activities 
        SET duration_formatted = ?, duration_seconds = ?, description = ?, project_color = ?, start_time = ?, end_time = ?, billable = ?
        WHERE id = ?
      `, [
        durationFormatted || '01:00:00', durationSeconds || 3600, description || 'Working session',
        projectColor || '#10b981', startTime || '09:00 AM', endTime || '05:00 PM', billable !== undefined ? billable : true,
        primaryId
      ]);

      // Remove any extra duplicates if they existed
      if (existing.length > 1) {
        const extraIds = existing.slice(1).map(e => e.id);
        for (const extraId of extraIds) {
          await pool.query('DELETE FROM activities WHERE id = ?', [extraId]);
        }
      }

      return res.json({
        success: true,
        message: 'Activity updated (deduplicated) in MySQL database',
        data: { id: primaryId, project, projectColor, description, group: group || 'Today', date: curDate, startTime, endTime, durationFormatted, durationSeconds, billable, user: userName }
      });
    }

    await pool.query(`
      INSERT INTO activities (id, project, project_color, description, group_name, date, start_time, end_time, duration_formatted, duration_seconds, billable, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, project, projectColor || '#10b981', description || 'Working session', group || 'Today',
      curDate, startTime || '09:00 AM', endTime || '05:00 PM', durationFormatted || '01:00:00',
      durationSeconds || 3600, billable !== undefined ? billable : true, userName
    ]);

    res.status(201).json({
      success: true,
      message: 'Activity saved to MySQL database',
      data: { id, project, projectColor, description, group: group || 'Today', date: curDate, startTime, endTime, durationFormatted, durationSeconds, billable, user: userName }
    });
  } catch (err) {
    console.error('Insert activity error:', err);
    res.status(500).json({ success: false, message: 'Error saving activity to database', error: err.message });
  }
});

// PUT /api/activities/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { durationFormatted, durationSeconds, description, project, projectColor, startTime, endTime, billable, date, group } = req.body;

    await pool.query(`
      UPDATE activities 
      SET duration_formatted = COALESCE(?, duration_formatted),
          duration_seconds = COALESCE(?, duration_seconds),
          description = COALESCE(?, description),
          project = COALESCE(?, project),
          project_color = COALESCE(?, project_color),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          billable = COALESCE(?, billable),
          date = COALESCE(?, date),
          group_name = COALESCE(?, group_name)
      WHERE id = ?
    `, [durationFormatted, durationSeconds, description, project, projectColor, startTime, endTime, billable, date, group, id]);

    res.json({ success: true, message: 'Activity updated successfully in database.' });
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ success: false, message: 'Error updating activity', error: err.message });
  }
});
  } catch (err) {
    console.error('Update activity error:', err);
    res.status(500).json({ success: false, message: 'Error updating activity', error: err.message });
  }
});

// DELETE /api/activities/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM activities WHERE id = ?', [id]);
    res.json({ success: true, message: 'Activity deleted from database.' });
  } catch (err) {
    console.error('Delete activity error:', err);
    res.status(500).json({ success: false, message: 'Error deleting activity', error: err.message });
  }
});

// DELETE /api/activities/project/:projectName
router.delete('/project/:projectName', async (req, res) => {
  try {
    const { projectName } = req.params;
    await pool.query('DELETE FROM activities WHERE LOWER(TRIM(project)) = LOWER(TRIM(?))', [projectName]);
    res.json({ success: true, message: `Activities for ${projectName} deleted from database.` });
  } catch (err) {
    console.error('Bulk delete activities error:', err);
    res.status(500).json({ success: false, message: 'Error deleting activities by project', error: err.message });
  }
});

module.exports = router;
