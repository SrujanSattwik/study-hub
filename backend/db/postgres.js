'use strict';
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      statement_timeout: 15000,          // 15s query timeout
      connectionTimeoutMillis: 5000,     // 5s to acquire a connection
      idleTimeoutMillis: 30000,          // 30s idle before closing
      max: 30,                           // bumped for concurrent load
      keepAlive: true,                   // prevents TCP teardown between queries
      keepAliveInitialDelayMillis: 10000
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
      max: 30,                           // bumped for concurrent load
      keepAlive: true,                   // prevents TCP teardown between queries
      keepAliveInitialDelayMillis: 10000
    });

// Prevent unhandled pool errors from crashing the server
pool.on('error', (err, client) => {
  console.error('[DB POOL ERROR] Unexpected error on idle client:', err.message);
});

// Standard query — used across all routes
async function query(text, params) {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('[DB QUERY ERROR]', err.message, '| Query:', text.substring(0, 120));
    throw err;
  }
}

/**
 * Timed query — returns { rows, rowCount, queryMs }
 * Used by profiling middleware and home-bundle to measure DB overhead precisely.
 * Slow queries (>100ms) trigger a warning log automatically.
 */
async function timedQuery(text, params) {
  const start = process.hrtime.bigint();
  try {
    const result = await pool.query(text, params);
    const queryMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (queryMs > 100) {
      console.warn(`[DB SLOW QUERY] ${queryMs.toFixed(1)}ms | ${text.substring(0, 100)}`);
    }
    return { rows: result.rows, rowCount: result.rowCount, queryMs };
  } catch (err) {
    console.error('[DB QUERY ERROR]', err.message, '| Query:', text.substring(0, 120));
    throw err;
  }
}

/**
 * Verifies active database connectivity.
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS current_time');
    return { success: true, time: res.rows[0].current_time };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  query,
  timedQuery,
  testConnection,
  pool
};
