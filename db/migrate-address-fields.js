/**
 * Migrates the customers table from a single `address` TEXT column
 * to four structured columns: street, city, state, zip.
 * Usage: node db/migrate-address-fields.js
 */
const db = require('../db');

async function migrate() {
  await db.query(`
    ALTER TABLE customers
      DROP COLUMN IF EXISTS address,
      ADD COLUMN IF NOT EXISTS street  VARCHAR(255) AFTER phone,
      ADD COLUMN IF NOT EXISTS city    VARCHAR(100) AFTER street,
      ADD COLUMN IF NOT EXISTS state   VARCHAR(100) AFTER city,
      ADD COLUMN IF NOT EXISTS zip     VARCHAR(20)  AFTER state
  `);
  console.log('Migration complete: address split into street, city, state, zip.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
