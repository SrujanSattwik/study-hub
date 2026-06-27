const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      statement_timeout: 15000,          // 15s query timeout
      connectionTimeoutMillis: 5000,     // 5s to acquire a connection
      idleTimeoutMillis: 30000,          // 30s idle before closing
      max: 20                            // max pool size
    })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'studyhub',
      password: process.env.DB_PASSWORD || 'studyhub2026',
      database: process.env.DB_NAME || 'studyhub',
      statement_timeout: 15000,          // 15s query timeout
      connectionTimeoutMillis: 5000,     // 5s to acquire a connection
      idleTimeoutMillis: 30000,          // 30s idle before closing
      max: 20                            // max pool size
    });

// Prevent unhandled pool errors from crashing the server
pool.on('error', (err, client) => {
  console.error('[DB POOL ERROR] Unexpected error on idle client:', err.message);
});

// Helper function to execute queries using the pool
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[DB QUERY ERROR]', err.message, '| Query:', text.substring(0, 120));
    throw err;
  }
}

module.exports = {
  query,
  pool
};
