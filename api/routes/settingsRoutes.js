const express = require('express');
const router = express.Router();
const settingsService = require('../services/settingsService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all settings (admin only)
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await settingsService.getAllSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update setting (admin only)
router.put('/settings/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    const setting = await settingsService.updateSetting(key, value, req.user.userId);
    res.json(setting);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 