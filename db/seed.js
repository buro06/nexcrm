/**
 * Creates the users table and inserts a default admin user.
 * Usage: node db/seed.js
 * Default credentials: admin / password
 */
const bcrypt = require('bcryptjs');
const db = require('../db');

async function seed() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS customers (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(150),
      phone VARCHAR(30),
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const hash = await bcrypt.hash('password', 10);

  await db.query(
    'INSERT IGNORE INTO users (username, password) VALUES (?, ?)',
    ['admin', hash]
  );

  console.log('Seed complete. Login with admin / password');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
