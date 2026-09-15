const express = require('express');
const router = express.Router();
const { pool } = require('../db/mysql');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        id, name, username, email, password, role, department, 
        active, avatar_initials as avatarInitials, avatar_color as avatarColor, workspace, created_at
      FROM users 
      ORDER BY role DESC, created_at DESC
    `);

    const mapped = rows.map(u => ({
      ...u,
      active: Boolean(u.active),
      accessGranted: Boolean(u.active)
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ success: false, message: 'Database error fetching users', error: err.message });
  }
});

// PATCH /api/users/:id/access (Admin Grant / Revoke Access)
router.patch('/:id/access', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?)', [id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const user = rows[0];
    const newStatus = !Boolean(user.active);

    await pool.query('UPDATE users SET active = ? WHERE id = ?', [newStatus, user.id]);

    res.json({
      success: true,
      message: `Access ${newStatus ? 'Granted (Active)' : 'Revoked (Pending)'} for ${user.name}`,
      userId: user.id,
      active: newStatus,
      accessGranted: newStatus
    });
  } catch (err) {
    console.error('Toggle access error:', err);
    res.status(500).json({ success: false, message: 'Database error updating access', error: err.message });
  }
});

// PUT /api/users/:id/profile (Update Name, Email, Department, Workspace, etc.)
router.put('/:id/profile', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, workspace, username } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?)', [id, id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const user = rows[0];
    const updatedName = name !== undefined ? name.trim() : user.name;
    const updatedEmail = email !== undefined ? email.trim().toLowerCase() : user.email;
    const updatedDept = department !== undefined ? department : user.department;
    const updatedWorkspace = workspace !== undefined ? workspace : user.workspace;
    const updatedUsername = username !== undefined ? username.trim().toLowerCase() : user.username;

    // Compute initials if name changed
    const initials = updatedName ? updatedName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.avatar_initials;

    await pool.query(
      'UPDATE users SET name = ?, email = ?, department = ?, workspace = ?, username = ? WHERE id = ?',
      [updatedName, updatedEmail, updatedDept, updatedWorkspace, updatedUsername, user.id]
    );

    res.json({
      success: true,
      message: 'Profile details updated successfully!',
      user: {
        ...user,
        name: updatedName,
        email: updatedEmail,
        department: updatedDept,
        workspace: updatedWorkspace,
        username: updatedUsername,
        avatarInitials: initials,
        active: Boolean(user.active)
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Database error updating profile', error: err.message });
  }
});

// POST /api/users (Admin Add New Team Member directly with standard password)
router.post('/', async (req, res) => {
  try {
    const { name, email, department, role, password, active } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [existing] = await pool.query('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists in workspace.' });
    }

    const id = `usr-${Date.now()}`;
    const username = cleanEmail.split('@')[0];
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#06b6d4', '#14b8a6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const assignedPassword = (password || 'Digi@2024').trim();
    const isActive = active !== undefined ? Boolean(active) : true; // Admin created members are active by default

    await pool.query(
      'INSERT INTO users (id, name, username, email, password, role, department, active, avatar_initials, avatar_color, workspace) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name.trim(), username, cleanEmail, assignedPassword, role || 'employee', department || 'Full Stack', isActive, initials, color, 'DigiPlus']
    );

    const newUser = {
      id,
      name: name.trim(),
      username,
      email: cleanEmail,
      password: assignedPassword,
      role: role || 'employee',
      department: department || 'Full Stack',
      active: isActive,
      accessGranted: isActive,
      avatarInitials: initials,
      avatar_initials: initials,
      avatarColor: color,
      avatar_color: color,
      workspace: 'DigiPlus',
      created_at: new Date().toISOString()
    };

    res.status(201).json({
      success: true,
      message: `Employee ${name} added successfully with standard password (${assignedPassword})`,
      user: newUser,
      data: newUser
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ success: false, message: 'Database error adding member', error: err.message });
  }
});

// PUT /api/users/:id/credentials (Update Username & Password)
router.put('/:id/credentials', async (req, res) => {
  try {
    const { id } = req.params;
    const { username, currentPassword, newPassword } = req.body;

    let [rows] = await pool.query('SELECT * FROM users WHERE id = ? OR LOWER(email) = LOWER(?)', [id, id]);
    if (rows.length === 0 && (id === 'usr-admin-1' || String(id).toLowerCase().includes('admin') || String(id).toLowerCase().includes('bharath'))) {
      [rows] = await pool.query("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    }
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found in database.' });
    }

    const user = rows[0];

    // Directly update password into database
    if (newPassword && newPassword.trim()) {
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [newPassword.trim(), user.id]);
      user.password = newPassword.trim();
    }

    // If changing username
    let updatedUsername = user.username;
    if (username && username.trim()) {
      updatedUsername = username.trim().toLowerCase();
      await pool.query('UPDATE users SET username = ? WHERE id = ?', [updatedUsername, user.id]);
      user.username = updatedUsername;
    }

    res.json({
      success: true,
      message: 'Account credentials (Username / Password) updated successfully in database!',
      user: {
        ...user,
        username: updatedUsername,
        password: user.password,
        active: Boolean(user.active)
      }
    });
  } catch (err) {
    console.error('Update credentials error:', err);
    res.status(500).json({ success: false, message: 'Database error updating credentials', error: err.message });
  }
});

module.exports = router;
