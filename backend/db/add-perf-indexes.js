'use strict';
/**
 * Performance Index Migration
 * Run once: node backend/db/add-perf-indexes.js
 *
 * Uses CREATE INDEX CONCURRENTLY so it never locks tables on a live DB.
 * Safe to run multiple times — IF NOT EXISTS prevents duplicates.
 *
 * Indexes added:
 *  D1 — users(email)                          — fixes sequential scan on every login
 *  D2 — materials(type, created_at DESC)      — supports WHERE type= ORDER BY created_at
 *  D3 — materials(user_id, created_at DESC)   — supports WHERE user_id= ORDER BY
 *  D4 — materials(created_at DESC)            — supports default ORDER BY on list
 *  D5 — community_posts(is_pinned DESC, created_at DESC) — feed ORDER BY
 *  D6 — questions(is_solved, created_at DESC) — stats + Q&A list filters
 *  D7 — group_materials(created_at DESC)      — trending files sort
 */

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'studyhub',
      password: process.env.DB_PASSWORD || 'studyhub2026',
      database: process.env.DB_NAME || 'studyhub',
    });

// NOTE: CONCURRENTLY cannot run inside a transaction block.
// Each index is executed in its own client call.
const indexes = [
  {
    name: 'idx_users_email',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
    description: 'D1 — Login/OTP email lookup (eliminates sequential scan on users table)',
  },
  {
    name: 'idx_materials_type_created',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materials_type_created ON materials(type, created_at DESC)',
    description: 'D2 — Materials list filtered by type, sorted by newest first',
  },
  {
    name: 'idx_materials_user_created',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materials_user_created ON materials(user_id, created_at DESC)',
    description: 'D3 — Materials list filtered by user_id',
  },
  {
    name: 'idx_materials_created',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materials_created ON materials(created_at DESC)',
    description: 'D4 — Default ORDER BY created_at DESC on materials list',
  },
  {
    name: 'idx_community_posts_pinned_created',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_community_posts_pinned_created ON community_posts(is_pinned DESC, created_at DESC)',
    description: 'D5 — Feed ORDER BY is_pinned DESC, created_at DESC',
  },
  {
    name: 'idx_questions_solved',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_questions_solved ON questions(is_solved, created_at DESC)',
    description: 'D6 — Stats COUNT(is_solved=TRUE) and Q&A filter',
  },
  {
    name: 'idx_group_materials_created',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_group_materials_created ON group_materials(created_at DESC)',
    description: 'D7 — Trending files ORDER BY created_at DESC',
  },
];

async function run() {
  console.log('🚀 Running performance index migration...\n');

  for (const idx of indexes) {
    const start = Date.now();
    try {
      // CONCURRENTLY requires autocommit — acquire a dedicated client
      const client = await pool.connect();
      try {
        await client.query(idx.sql);
        const ms = Date.now() - start;
        console.log(`  ✅ ${idx.name} (${ms}ms) — ${idx.description}`);
      } finally {
        client.release();
      }
    } catch (err) {
      console.error(`  ❌ ${idx.name} FAILED: ${err.message}`);
    }
  }

  console.log('\n✅ Index migration complete.');

  // Verify indexes exist
  console.log('\n📊 Verifying indexes in pg_indexes...');
  try {
    const result = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE indexname IN (${indexes.map((_, i) => `$${i + 1}`).join(',')})
      ORDER BY tablename, indexname
    `, indexes.map(i => i.name));
    result.rows.forEach(r => console.log(`  ✓ ${r.tablename}.${r.indexname}`));
    if (result.rows.length !== indexes.length) {
      const found = new Set(result.rows.map(r => r.indexname));
      indexes.forEach(i => {
        if (!found.has(i.name)) console.warn(`  ⚠️  NOT FOUND: ${i.name}`);
      });
    }
  } catch (err) {
    console.error('Verification failed:', err.message);
  }

  await pool.end();
}

run().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
