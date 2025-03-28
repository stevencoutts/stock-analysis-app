const { pool } = require('../db/init');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

class UserService {
  async createUser({ name, email, password, role = 'user' }) {
    const client = await pool.connect();
    try {
      // Check if email already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('Email already registered');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Insert new user
      const result = await client.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, role, created_at
      `, [name, email, hashedPassword, role]);

      // Log activity
      await this.logActivity(result.rows[0].id, 'USER_CREATED', { name, email, role });

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async authenticate(email, password) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length === 0) {
        throw new Error('Invalid credentials');
      }

      const user = result.rows[0];
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      const token = jwt.sign(
        { 
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET || 'your_jwt_secret_key',
        { expiresIn: '24h' }
      );

      await client.query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async updateUser(id, { name, email, role, status }) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        UPDATE users
        SET name = $1,
            email = $2,
            role = $3,
            status = $4,
            updated_at = NOW()
        WHERE id = $5
        RETURNING id, name, email, role, status, updated_at
      `, [name, email, role, status, id]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Log activity
      await this.logActivity(id, 'USER_UPDATED', { name, email, role, status });

      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async changePassword(id, currentPassword, newPassword) {
    const client = await pool.connect();
    try {
      // Verify current password
      const user = await client.query('SELECT password FROM users WHERE id = $1', [id]);
      
      if (user.rows.length === 0) {
        throw new Error('User not found');
      }

      const isValid = await bcrypt.compare(currentPassword, user.rows[0].password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
      await client.query(`
        UPDATE users
        SET password = $1,
            updated_at = NOW()
        WHERE id = $2
      `, [hashedPassword, id]);

      // Log activity
      await this.logActivity(id, 'PASSWORD_CHANGED', { });

      return true;
    } finally {
      client.release();
    }
  }

  async deleteUser(id) {
    const client = await pool.connect();
    try {
      // Log activity before deletion
      await this.logActivity(id, 'USER_DELETED', { });

      // Delete user sessions
      await client.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);

      // Delete user
      const result = await client.query(
        'DELETE FROM users WHERE id = $1 RETURNING id',
        [id]
      );

      return result.rows.length > 0;
    } finally {
      client.release();
    }
  }

  async getAllUsers() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT id, name, email, role, status, last_login, created_at, updated_at
        FROM users
        ORDER BY created_at DESC
      `);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async logActivity(userId, action, details = {}) {
    const client = await pool.connect();
    try {
      await client.query(`
        INSERT INTO user_activity_log (user_id, action, details)
        VALUES ($1, $2, $3)
      `, [userId, action, JSON.stringify(details)]);
    } finally {
      client.release();
    }
  }

  async getUserActivity(userId) {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT action, details, created_at
        FROM user_activity_log
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
      `, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }
}

module.exports = new UserService(); 