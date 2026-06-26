const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'studyhub',
      password: process.env.DB_PASSWORD || 'studyhub2026',
      database: process.env.DB_NAME || 'studyhub',
    });

// Helper function to execute queries using the pool
async function query(text, params) {
  return await pool.query(text, params);
}

module.exports = {
  query,
  pool
};
