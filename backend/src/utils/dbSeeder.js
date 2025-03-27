const { User } = require('../models');
const bcrypt = require('bcryptjs');

/**
 * Seed the database with initial data
 */
const seedDatabase = async () => {
  try {
    // Check if admin user exists
    const adminExists = await User.findOne({
      where: { 
        email: 'admin@example.com',
        role: 'admin'
      }
    });
    
    if (!adminExists) {
      console.log('Creating admin user...');
      
      // Create admin user
      await User.create({
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        isActive: true
      });
      
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
    
    // Add any other seeding operations here
    
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = { seedDatabase }; 