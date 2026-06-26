const db = require('./db/postgres');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  user_id        VARCHAR(36) PRIMARY KEY,
  full_name      VARCHAR(100),
  email          VARCHAR(150) UNIQUE NOT NULL,
  password_hash  VARCHAR(255) NOT NULL,
  role           VARCHAR(20) DEFAULT 'student',
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at  TIMESTAMP
);

CREATE TABLE IF NOT EXISTS materials (
  id              VARCHAR(36) PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  description     TEXT,
  type            VARCHAR(50),
  format          VARCHAR(50),
  file_path       VARCHAR(500),
  link            VARCHAR(500),
  thumbnail       VARCHAR(500),
  download_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  author          VARCHAR(150) DEFAULT 'Anonymous',
  user_id         VARCHAR(36)
);
`;

async function init() {
  try {
    console.log('Initializing database tables...');
    await db.query(schema);
    
    // Add user_id column if the table already exists
    console.log('Ensuring user_id column exists on materials table...');
    await db.query(`ALTER TABLE materials ADD COLUMN IF NOT EXISTS user_id VARCHAR(36)`);
    
    console.log('✅ Tables created/migrated successfully or already exist!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message || err);
  } finally {
    await db.pool.end();
  }
}

init();
