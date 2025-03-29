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
router.put('/settings/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Get user ID from the authenticated request, fallback to null
    const userId = req.user?.id || null;
    
    console.log(`Updating setting ${key} with user ID:`, userId);
    
    const result = await settingsService.updateSetting(key, value, userId);
    res.json(result);
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ 
      error: 'Failed to update setting',
      details: error.message 
    });
  }
});

module.exports = router; 