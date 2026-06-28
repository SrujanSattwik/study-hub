const db = require('./db/postgres');

const tables = [
  // 1. study_groups
  `CREATE TABLE IF NOT EXISTS study_groups (
    group_id          VARCHAR(36) PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    description       TEXT,
    category          VARCHAR(100),
    meeting_schedule  VARCHAR(255),
    cover_image       VARCHAR(500),
    icon              VARCHAR(100) DEFAULT 'fas fa-users',
    created_by        VARCHAR(36) REFERENCES users(user_id) ON DELETE SET NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 2. group_members
  `CREATE TABLE IF NOT EXISTS group_members (
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    role              VARCHAR(50) DEFAULT 'member', -- 'owner', 'moderator', 'member'
    joined_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status            VARCHAR(20) DEFAULT 'approved', -- 'pending', 'approved', 'banned'
    PRIMARY KEY (group_id, user_id)
  )`,

  // 3. group_announcements
  `CREATE TABLE IF NOT EXISTS group_announcements (
    announcement_id   VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    content           TEXT NOT NULL,
    created_by        VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 4. group_events
  `CREATE TABLE IF NOT EXISTS group_events (
    event_id          VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    type              VARCHAR(50), -- 'study_session', 'exam', 'hackathon', 'meetup', 'assignment', 'live_class', 'revision'
    event_date        TIMESTAMP NOT NULL,
    end_date          TIMESTAMP,
    location          VARCHAR(255) DEFAULT 'Virtual',
    created_by        VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 5. event_rsvps
  `CREATE TABLE IF NOT EXISTS event_rsvps (
    event_id          VARCHAR(36) REFERENCES group_events(event_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    status            VARCHAR(20) DEFAULT 'going', -- 'going', 'interested', 'not_going'
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id)
  )`,

  // 6. group_meetings
  `CREATE TABLE IF NOT EXISTS group_meetings (
    meeting_id               VARCHAR(36) PRIMARY KEY,
    group_id                 VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    title                    VARCHAR(255) NOT NULL,
    host_id                  VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    status                   VARCHAR(20) DEFAULT 'active', -- 'active', 'ended'
    is_waiting_room_enabled  BOOLEAN DEFAULT FALSE,
    created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at                 TIMESTAMP
  )`,

  // 7. meeting_participants
  `CREATE TABLE IF NOT EXISTS meeting_participants (
    meeting_id        VARCHAR(36) REFERENCES group_meetings(meeting_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at           TIMESTAMP,
    is_muted          BOOLEAN DEFAULT FALSE,
    is_camera_on      BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (meeting_id, user_id)
  )`,

  // 8. group_messages
  `CREATE TABLE IF NOT EXISTS group_messages (
    message_id        VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content           TEXT,
    parent_id         VARCHAR(36) REFERENCES group_messages(message_id) ON DELETE SET NULL,
    is_pinned         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
  )`,

  // 9. message_reactions
  `CREATE TABLE IF NOT EXISTS message_reactions (
    message_id        VARCHAR(36) REFERENCES group_messages(message_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    reaction          VARCHAR(50) NOT NULL,
    PRIMARY KEY (message_id, user_id, reaction)
  )`,

  // 10. message_attachments
  `CREATE TABLE IF NOT EXISTS message_attachments (
    attachment_id     VARCHAR(36) PRIMARY KEY,
    message_id        VARCHAR(36) REFERENCES group_messages(message_id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_type         VARCHAR(100) NOT NULL,
    file_size         INTEGER NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 11. community_posts
  `CREATE TABLE IF NOT EXISTS community_posts (
    post_id           VARCHAR(36) PRIMARY KEY,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    media_path        VARCHAR(500),
    media_type        VARCHAR(50),
    is_pinned         BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP
  )`,

  // 12. post_likes
  `CREATE TABLE IF NOT EXISTS post_likes (
    post_id           VARCHAR(36) REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, user_id)
  )`,

  // 13. post_comments
  `CREATE TABLE IF NOT EXISTS post_comments (
    comment_id        VARCHAR(36) PRIMARY KEY,
    post_id           VARCHAR(36) REFERENCES community_posts(post_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    parent_id         VARCHAR(36) REFERENCES post_comments(comment_id) ON DELETE SET NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 14. questions
  `CREATE TABLE IF NOT EXISTS questions (
    question_id       VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    title             VARCHAR(255) NOT NULL,
    description       TEXT NOT NULL,
    subject           VARCHAR(100),
    tags              TEXT,
    is_solved         BOOLEAN DEFAULT FALSE,
    priority          VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    views_count       INTEGER DEFAULT 0,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 15. question_answers
  `CREATE TABLE IF NOT EXISTS question_answers (
    answer_id         VARCHAR(36) PRIMARY KEY,
    question_id       VARCHAR(36) REFERENCES questions(question_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    is_accepted       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 16. answer_votes
  `CREATE TABLE IF NOT EXISTS answer_votes (
    answer_id         VARCHAR(36) REFERENCES question_answers(answer_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    vote_value        INTEGER NOT NULL, -- 1 or -1
    PRIMARY KEY (answer_id, user_id)
  )`,

  // 17. answer_attachments
  `CREATE TABLE IF NOT EXISTS answer_attachments (
    attachment_id     VARCHAR(36) PRIMARY KEY,
    answer_id         VARCHAR(36) REFERENCES question_answers(answer_id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    file_path         VARCHAR(500) NOT NULL,
    file_type         VARCHAR(100) NOT NULL,
    file_size         INTEGER NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 18. material_categories
  `CREATE TABLE IF NOT EXISTS material_categories (
    category_id       VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    name              VARCHAR(100) NOT NULL,
    parent_id         VARCHAR(36) REFERENCES material_categories(category_id) ON DELETE SET NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 19. group_materials
  `CREATE TABLE IF NOT EXISTS group_materials (
    material_id       VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    category_id       VARCHAR(36) REFERENCES material_categories(category_id) ON DELETE SET NULL,
    title             VARCHAR(255) NOT NULL,
    description       TEXT,
    file_path         VARCHAR(500),
    file_name         VARCHAR(255),
    file_size         INTEGER,
    file_type         VARCHAR(100),
    uploaded_by       VARCHAR(36) REFERENCES users(user_id) ON DELETE SET NULL,
    tags              TEXT,
    is_favorite       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 20. group_material_likes
  `CREATE TABLE IF NOT EXISTS group_material_likes (
    material_id       VARCHAR(36) REFERENCES group_materials(material_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (material_id, user_id)
  )`,

  // 21. group_material_comments
  `CREATE TABLE IF NOT EXISTS group_material_comments (
    comment_id        VARCHAR(36) PRIMARY KEY,
    material_id       VARCHAR(36) REFERENCES group_materials(material_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    content           TEXT NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 22. material_downloads
  `CREATE TABLE IF NOT EXISTS material_downloads (
    download_id       VARCHAR(36) PRIMARY KEY,
    material_id       VARCHAR(36) REFERENCES group_materials(material_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    downloaded_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 23. notifications
  `CREATE TABLE IF NOT EXISTS notifications (
    notification_id   VARCHAR(36) PRIMARY KEY,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    type              VARCHAR(50), -- 'invitation', 'message', 'reply', 'meeting_reminder', 'material_upload', 'question_answer', 'announcement', 'mention', 'event_reminder'
    title             VARCHAR(255),
    content           TEXT,
    link              VARCHAR(500),
    is_read           BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 24. activity_logs
  `CREATE TABLE IF NOT EXISTS activity_logs (
    log_id            VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    action            TEXT NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 25. user_bookmarks
  `CREATE TABLE IF NOT EXISTS user_bookmarks (
    bookmark_id       VARCHAR(36) PRIMARY KEY,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    item_type         VARCHAR(50), -- 'question', 'material', 'post'
    item_id           VARCHAR(36) NOT NULL,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 26. reports
  `CREATE TABLE IF NOT EXISTS reports (
    report_id         VARCHAR(36) PRIMARY KEY,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    item_type         VARCHAR(50), -- 'post', 'comment', 'message', 'material'
    item_id           VARCHAR(36) NOT NULL,
    reason            TEXT,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 27. invitations
  `CREATE TABLE IF NOT EXISTS invitations (
    invitation_id     VARCHAR(36) PRIMARY KEY,
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    sender_id         VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    receiver_id       VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    role              VARCHAR(50) DEFAULT 'member',
    status            VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 28. meeting_recordings
  `CREATE TABLE IF NOT EXISTS meeting_recordings (
    recording_id      VARCHAR(36) PRIMARY KEY,
    meeting_id        VARCHAR(36) REFERENCES group_meetings(meeting_id) ON DELETE CASCADE,
    file_path         VARCHAR(500),
    duration_seconds  INTEGER,
    created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 29. presence_status
  `CREATE TABLE IF NOT EXISTS presence_status (
    user_id           VARCHAR(36) PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    status            VARCHAR(20) DEFAULT 'offline', -- 'online', 'offline', 'idle'
    last_seen_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 30. typing_status
  `CREATE TABLE IF NOT EXISTS typing_status (
    group_id          VARCHAR(36) REFERENCES study_groups(group_id) ON DELETE CASCADE,
    user_id           VARCHAR(36) REFERENCES users(user_id) ON DELETE CASCADE,
    is_typing         BOOLEAN DEFAULT FALSE,
    last_typed_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id)
  )`
];

const indexes = [
  // Core membership lookups
  'CREATE INDEX IF NOT EXISTS idx_group_members_user ON group_members(user_id)',
  'CREATE INDEX IF NOT EXISTS idx_group_members_user_status ON group_members(user_id, status)',
  'CREATE INDEX IF NOT EXISTS idx_group_members_group ON group_members(group_id)',
  // Chat performance
  'CREATE INDEX IF NOT EXISTS idx_group_messages_group ON group_messages(group_id)',
  'CREATE INDEX IF NOT EXISTS idx_group_messages_created ON group_messages(created_at)',
  // Q&A
  'CREATE INDEX IF NOT EXISTS idx_questions_group ON questions(group_id)',
  'CREATE INDEX IF NOT EXISTS idx_question_answers_question ON question_answers(question_id)',
  // Votes & likes aggregation
  'CREATE INDEX IF NOT EXISTS idx_answer_votes_answer ON answer_votes(answer_id)',
  'CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id)',
  'CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id)',
  // Materials
  'CREATE INDEX IF NOT EXISTS idx_group_materials_group ON group_materials(group_id)',
  // Notifications
  'CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read)',
  // Events & RSVPs
  'CREATE INDEX IF NOT EXISTS idx_group_events_group ON group_events(group_id)',
  'CREATE INDEX IF NOT EXISTS idx_group_events_date ON group_events(event_date)',
  'CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id)',
  // Presence
  'CREATE INDEX IF NOT EXISTS idx_presence_status_status ON presence_status(status)',
  // Community feed
  'CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at)',
  'CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id)'
];

const seedQueries = [
  // Insert some default groups if they do not exist
  `INSERT INTO study_groups (group_id, name, description, category, meeting_schedule, cover_image, icon)
   VALUES 
   ('group-math-101', 'Mathematics Masters', 'Advanced mathematics and problem-solving techniques', 'mathematics', 'Daily at 4 PM', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600', 'fas fa-calculator'),
   ('group-science-101', 'Science Explorers', 'Chemistry, physics, and biology study group', 'science', 'Mondays and Wednesdays at 6 PM', 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600', 'fas fa-flask'),
   ('group-code-101', 'Code Warriors', 'Programming, web development and algorithmic thinking', 'programming', 'Saturdays at 10 AM', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600', 'fas fa-code')
   ON CONFLICT (group_id) DO NOTHING`,

  // Seed events
  `INSERT INTO group_events (event_id, group_id, title, description, type, event_date, location)
   VALUES
   ('event-math-1', 'group-math-101', 'Calculus Revision Session', 'Covering integrals and derivatives', 'study_session', CURRENT_TIMESTAMP + INTERVAL '2 days', 'Virtual'),
   ('event-science-1', 'group-science-101', 'Physics Lab Prep', 'Preparing for the upcoming electricity lab exam', 'revision', CURRENT_TIMESTAMP + INTERVAL '4 days', 'Virtual'),
   ('event-code-1', 'group-code-101', 'JavaScript Hackathon', 'Building mini projects in JS', 'hackathon', CURRENT_TIMESTAMP + INTERVAL '7 days', 'Virtual')
   ON CONFLICT (event_id) DO NOTHING`
];

async function run() {
  try {
    console.log('🚀 Running database migrations for Community Module...');

    // Execute table creations
    for (const sql of tables) {
      const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
      await db.query(sql);
      console.log(`  ✓ Table checked/created: ${tableName}`);
    }

    // Execute index creations
    for (const sql of indexes) {
      await db.query(sql);
    }
    console.log('  ✓ Database indexes established.');

    // Execute seeds
    for (const sql of seedQueries) {
      await db.query(sql);
    }
    console.log('  ✓ Seed data populated successfully.');
    console.log('✅ Community database setup completed!');
  } catch (err) {
    console.error('❌ Migration Error:', err.message || err);
  } finally {
    await db.pool.end();
    console.log('🔌 DB pool connection closed.');
  }
}

run();
