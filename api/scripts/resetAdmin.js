const { pool } = require('../db/init');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  const client = await pool.connect();
  try {
    // Generate new password hash
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update or create admin user
    const result = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
      SET password = $3, updated_at = NOW()
      RETURNING id, email, role;
    `, ['Admin User', 'admin@example.com', hashedPassword, 'admin']);

    console.log('Admin user updated:', result.rows[0]);
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await client.end();
  }
}

resetAdminPassword().catch(console.error); 