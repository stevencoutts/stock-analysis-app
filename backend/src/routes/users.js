const express = require('express');
const router = express.Router();
const { User } = require('../models');
const { auth, isAdmin } = require('../middleware/auth');

// Get all users (admin only)
router.get('/', auth, isAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'lastLogin', 'createdAt']
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID (admin or own user)
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if the user is requesting their own info or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'isActive', 'lastLogin', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user (admin or own user)
router.put('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, password } = req.body;
    
    // Check if the user is updating their own info or is an admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Only admin can change roles and active status
    if (req.body.role || req.body.hasOwnProperty('isActive')) {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can change roles or status' });
      }
      
      if (req.body.role) user.role = req.body.role;
      if (req.body.hasOwnProperty('isActive')) user.isActive = req.body.isActive;
    }
    
    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = password;
    
    await user.save();
    
    res.status(200).json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user (admin only)
router.delete('/:id', auth, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await User.count({ where: { role: 'admin' } });
      
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    
    await user.destroy();
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new admin user (admin only)
router.post('/admin', auth, isAdmin, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const user = await User.create({
      username,
      email,
      password,
      role: 'admin'
    });
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 