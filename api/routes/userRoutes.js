const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Authentication routes
router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const result = await userService.authenticate(email, password, ipAddress, userAgent);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// User management routes (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User profile routes (for authenticated users)
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userService.getUser(req.user.userId);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/profile/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await userService.changePassword(req.user.userId, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/profile/activity', authenticateToken, async (req, res) => {
  try {
    const activity = await userService.getUserActivity(req.user.userId);
    res.json(activity);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 