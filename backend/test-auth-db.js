const db = require('./db/postgres');

async function testDatabase() {
  console.log('🔍 Testing PostgreSQL Database Connection...\n');
  
  try {
    // Check users table
    const result = await db.query(
      `SELECT table_name 
       FROM information_schema.tables 
       WHERE table_name = 'users'`
    );

    if (result.rows.length > 0) {
      console.log('✅ USERS table exists\n');

      // Get table structure
      const columns = await db.query(
        `SELECT column_name, data_type, character_maximum_length, is_nullable 
         FROM information_schema.columns 
         WHERE table_name = 'users' 
         ORDER BY ordinal_position`
      );

      console.log('📋 Table Structure:');
      console.log('─'.repeat(60));
      columns.rows.forEach(col => {
        const lengthStr = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
        console.log(`${col.column_name.padEnd(20)} ${col.data_type}${lengthStr} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      console.log('─'.repeat(60));

      // Count existing users
      const count = await db.query('SELECT COUNT(*) as cnt FROM users');
      console.log(`\n📊 Current users in database: ${count.rows[0].cnt}`);

    } else {
      console.log('❌ USERS table not found!');
      console.log('\nPlease create the table using:');
      console.log(`
CREATE TABLE users (
  user_id        VARCHAR(36) PRIMARY KEY,
  full_name      VARCHAR(100),
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20) DEFAULT 'student',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP
);
      `);
    }

    console.log('\n✅ Database test complete!');
    console.log('\n🚀 Ready to start server.js');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\nPlease check:');
    console.log('1. PostgreSQL database is running');
    console.log('2. Connection details in backend/.env are correct');
  } finally {
    try {
      await db.pool.end();
    } catch (closeErr) {
      console.error('Error closing pool:', closeErr);
    }
  }
}

testDatabase();
