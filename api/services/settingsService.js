const { pool } = require('../db/init');

class SettingsService {
  async getSetting(key) {
    const client = await pool.connect();
    try {
      const result = await client.query(
        'SELECT value FROM system_settings WHERE key = $1',
        [key]
      );
      return result.rows[0]?.value;
    } finally {
      client.release();
    }
  }

  async updateSetting(key, value, userId) {
    const client = await pool.connect();
    try {
      // First check if the user exists and is an admin
      const userResult = await client.query(
        'SELECT id, role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        // If no user found, use NULL for updated_by
        console.log('No user found, using NULL for updated_by');
        await client.query(
          `UPDATE system_settings 
           SET value = $1, updated_at = NOW(), updated_by = NULL 
           WHERE key = $2`,
          [value, key]
        );
      } else {
        // If user found, use their ID
        await client.query(
          `UPDATE system_settings 
           SET value = $1, updated_at = NOW(), updated_by = $2 
           WHERE key = $3`,
          [value, userId, key]
        );
      }

      // If this is the API key, clear any cached version
      if (key === 'ALPHA_VANTAGE_API_KEY') {
        this.cachedApiKey = null;
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getAllSettings() {
    const client = await pool.connect();
    try {
      console.log('Executing settings query'); // Debug log
      const result = await client.query(`
        SELECT 
          s.*,
          u.name as updated_by_name
        FROM system_settings s
        LEFT JOIN users u ON s.updated_by = u.id
        ORDER BY s.key
      `);
      console.log('Settings query result:', result.rows); // Debug log
      return result.rows;
    } catch (error) {
      console.error('Error in getAllSettings:', error); // Debug log
      throw error;
    } finally {
      client.release();
    }
  }

  // Cache the API key in memory but refresh from DB periodically
  #apiKeyCache = null;
  #lastCacheTime = null;
  #cacheDuration = 5 * 60 * 1000; // 5 minutes

  async getApiKey() {
    // Return cached value if still fresh
    if (this.#apiKeyCache && this.#lastCacheTime && 
        (Date.now() - this.#lastCacheTime) < this.#cacheDuration) {
      return this.#apiKeyCache;
    }

    // Fetch from database
    const apiKey = await this.getSetting('ALPHA_VANTAGE_API_KEY');
    
    // Update cache
    this.#apiKeyCache = apiKey;
    this.#lastCacheTime = Date.now();
    
    return apiKey;
  }
}

module.exports = new SettingsService(); 