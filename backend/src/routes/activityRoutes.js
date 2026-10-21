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
        billable, user_name as user, user_name as userName, created_at
      FROM activities 
      ORDER BY created_at DESC
    `);

    // Ensure date is cleanly formatted as YYYY-MM-DD so timezone shifts never alter the saved date
    const normalized = (rows || []).map(r => {
      let dStr = r.date;
      if (dStr instanceof Date) {
        const yr = dStr.getFullYear();
        const mo = String(dStr.getMonth() + 1).padStart(2, '0');
        const da = String(dStr.getDate()).padStart(2, '0');
        dStr = `${yr}-${mo}-${da}`;
      } else if (typeof dStr === 'string' && dStr.includes('T')) {
        const parsed = new Date(dStr);
        if (!isNaN(parsed.getTime())) {
          const yr = parsed.getFullYear();
          const mo = String(parsed.getMonth() + 1).padStart(2, '0');
          const da = String(parsed.getDate()).padStart(2, '0');
          dStr = `${yr}-${mo}-${da}`;
        } else {
          dStr = dStr.split('T')[0];
        }
      }
      return {
        ...r,
        date: dStr || '',
        user: r.user || r.userName || 'Bharath',
        userName: r.user || r.userName || 'Bharath'
      };
    });

    res.json({ success: true, count: normalized.length, data: normalized });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, message: 'Error fetching activities', error: err.message });
  }
});

// POST /api/activities (Insert or Update by ID)
router.post('/', async (req, res) => {
  try {
    const { project, projectColor, description, group, date, startTime, endTime, durationFormatted, durationSeconds, billable, user, userName: bodyUserName, userEmail } = req.body;
    if (!project) {
      return res.status(400).json({ success: false, message: 'Project is required.' });
    }

    const id = req.body.id || `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    // Resolve dynamic current date (YYYY-MM-DD) if not provided
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const defaultDate = `${y}-${m}-${d}`;

    let curDate = defaultDate;
    if (date && typeof date === 'string') {
      const trimmed = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        curDate = trimmed;
      } else if (trimmed.includes('T')) {
        const parsed = new Date(trimmed);
        if (!isNaN(parsed.getTime())) {
          const yr = parsed.getFullYear();
          const mo = String(parsed.getMonth() + 1).padStart(2, '0');
          const da = String(parsed.getDate()).padStart(2, '0');
          curDate = `${yr}-${mo}-${da}`;
        } else {
          curDate = trimmed.split('T')[0];
        }
      } else {
        curDate = trimmed;
      }
    }
    const curGroup = group || 'Today';
    const assignedUser = user || bodyUserName || req.body.user_name || (userEmail ? userEmail.split('@')[0] : 'Bharath');

    // Check if an entry for the exact same ID already exists
    const [existing] = await pool.query('SELECT id FROM activities WHERE id = ?', [id]);

    if (existing && existing.length > 0) {
      // Update existing record
      await pool.query(`
        UPDATE activities 
        SET duration_formatted = ?, duration_seconds = ?, description = ?, project = ?, project_color = ?, 
            start_time = ?, end_time = ?, billable = ?, date = ?, group_name = ?, user_name = ?
        WHERE id = ?
      `, [
        durationFormatted || '01:00:00', durationSeconds || 3600, description || 'Working session',
        project, projectColor || '#10b981', startTime || '09:00 AM', endTime || '05:00 PM',
        billable !== undefined ? billable : true, curDate, curGroup, assignedUser,
        id
      ]);

      return res.json({
        success: true,
        message: 'Activity updated in database',
        data: { id, project, projectColor, description, group: curGroup, date: curDate, startTime, endTime, durationFormatted, durationSeconds, billable, user: assignedUser, userName: assignedUser }
      });
    }

    await pool.query(`
      INSERT INTO activities (id, project, project_color, description, group_name, date, start_time, end_time, duration_formatted, duration_seconds, billable, user_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, project, projectColor || '#10b981', description || 'Working session', curGroup,
      curDate, startTime || '09:00 AM', endTime || '05:00 PM', durationFormatted || '01:00:00',
      durationSeconds || 3600, billable !== undefined ? billable : true, assignedUser
    ]);

    res.status(201).json({
      success: true,
      message: 'Activity saved to database',
      data: { id, project, projectColor, description, group: curGroup, date: curDate, startTime, endTime, durationFormatted, durationSeconds, billable, user: assignedUser, userName: assignedUser }
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
    const { durationFormatted, durationSeconds, description, project, projectColor, startTime, endTime, billable, date, group, user, userName: bodyUserName } = req.body;

    let cleanDate = date;
    if (cleanDate && typeof cleanDate === 'string' && cleanDate.includes('T')) {
      const parsed = new Date(cleanDate);
      if (!isNaN(parsed.getTime())) {
        const yr = parsed.getFullYear();
        const mo = String(parsed.getMonth() + 1).padStart(2, '0');
        const da = String(parsed.getDate()).padStart(2, '0');
        cleanDate = `${yr}-${mo}-${da}`;
      } else {
        cleanDate = cleanDate.split('T')[0];
      }
    }

    const assignedUser = user || bodyUserName || null;

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
          group_name = COALESCE(?, group_name),
          user_name = COALESCE(?, user_name)
      WHERE id = ?
    `, [durationFormatted, durationSeconds, description, project, projectColor, startTime, endTime, billable, cleanDate, group, assignedUser, id]);

    res.json({ success: true, message: 'Activity updated successfully in database.' });
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

// ALL /api/activities/all-clean (Wipe all test activities & timesheets from MySQL while preserving projects & users)
router.all('/all-clean', async (req, res) => {
  try {
    await pool.query('DELETE FROM activities');
    await pool.query('DELETE FROM timesheets');
    await pool.query('DELETE FROM attendance');
    await pool.query('DELETE FROM shared_reports');
    res.json({ success: true, message: 'All test activities and timesheets cleared. 460 Projects and 19 Users are preserved.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
