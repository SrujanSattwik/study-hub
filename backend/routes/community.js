const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/postgres');

// Define community upload directories
const UPLOADS_BASE = path.join(__dirname, '../uploads/community');
const MATERIALS_DIR = path.join(UPLOADS_BASE, 'materials');
const CHAT_DIR = path.join(UPLOADS_BASE, 'chat');
const POST_DIR = path.join(UPLOADS_BASE, 'posts');

// Ensure directories exist
fs.mkdirSync(MATERIALS_DIR, { recursive: true });
fs.mkdirSync(CHAT_DIR, { recursive: true });
fs.mkdirSync(POST_DIR, { recursive: true });

// Multer storage setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destType = req.body.destType || 'materials';
        if (destType === 'chat') cb(null, CHAT_DIR);
        else if (destType === 'posts') cb(null, POST_DIR);
        else cb(null, MATERIALS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB max size
    fileFilter: (req, file, cb) => {
        const allowedExts = [
            '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
            '.zip', '.rar', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mp3', '.wav'
        ];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedExts.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file extension'));
        }
    }
});

// Helper: check if user is a member of the group
async function isGroupMember(userId, groupId) {
    const result = await db.query(
        `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'approved'`,
        [groupId, userId]
    );
    return result.rows.length > 0 ? result.rows[0].role : null;
}

// -------------------------------------------------------------
// 1. GROUPS API
// NOTE: Specific sub-routes (/joined, /suggested) MUST come BEFORE the /:id dynamic route
// -------------------------------------------------------------

// Get community stats (parallelized queries)
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [
            activeMembers,
            myGroups,
            onlineUsers,
            activeMeetings,
            questionsAskedToday,
            questionsSolved,
            materialsShared,
            upcomingEvents
        ] = await Promise.all([
            db.query('SELECT COUNT(*)::int as count FROM users'),
            db.query(`SELECT COUNT(*)::int as count FROM group_members WHERE user_id = $1 AND status = 'approved'`, [userId]),
            db.query(`SELECT COUNT(*)::int as count FROM presence_status WHERE status = 'online'`),
            db.query(`SELECT COUNT(*)::int as count FROM group_meetings WHERE status = 'active'`),
            db.query('SELECT COUNT(*)::int as count FROM questions WHERE created_at >= CURRENT_DATE'),
            db.query('SELECT COUNT(*)::int as count FROM questions WHERE is_solved = TRUE'),
            db.query('SELECT COUNT(*)::int as count FROM group_materials'),
            db.query('SELECT COUNT(*)::int as count FROM group_events WHERE event_date >= CURRENT_TIMESTAMP')
        ]);

        res.json({
            success: true,
            stats: {
                activeMembers: activeMembers.rows[0].count,
                myGroups: myGroups.rows[0].count,
                onlineUsers: onlineUsers.rows[0].count,
                activeMeetings: activeMeetings.rows[0].count,
                questionsAskedToday: questionsAskedToday.rows[0].count,
                questionsSolved: questionsSolved.rows[0].count,
                materialsShared: materialsShared.rows[0].count,
                upcomingEvents: upcomingEvents.rows[0].count
            }
        });
    } catch (error) {
        console.error('[COMMUNITY] Get stats error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', data: null });
    }
});

// Get trending items (JOIN-based aggregation instead of correlated subqueries)
router.get('/trending', async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [trendingDiscussions, popularQuestions, popularFiles] = await Promise.all([
            // Trending discussions using LEFT JOIN aggregation
            db.query(`
                SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type, cp.is_pinned, cp.created_at,
                       u.full_name as author_name,
                       COALESCE(pl.likes_count, 0) as likes_count,
                       COALESCE(pc.comments_count, 0) as comments_count,
                       CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
                FROM community_posts cp
                JOIN users u ON cp.user_id = u.user_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*)::int as likes_count FROM post_likes GROUP BY post_id
                ) pl ON cp.post_id = pl.post_id
                LEFT JOIN (
                    SELECT post_id, COUNT(*)::int as comments_count FROM post_comments GROUP BY post_id
                ) pc ON cp.post_id = pc.post_id
                LEFT JOIN post_likes ul ON cp.post_id = ul.post_id AND ul.user_id = $1
                ORDER BY COALESCE(pc.comments_count, 0) DESC, COALESCE(pl.likes_count, 0) DESC, cp.created_at DESC
                LIMIT 5
            `, [userId]),

            // Popular Q&A using LEFT JOIN aggregation
            db.query(`
                SELECT q.question_id, q.group_id, q.user_id, q.title, q.description, q.subject, q.tags,
                       q.is_solved, q.priority, q.views_count, q.created_at,
                       u.full_name as author_name, sg.name as group_name,
                       COALESCE(qa.answers_count, 0) as answers_count
                FROM questions q
                JOIN users u ON q.user_id = u.user_id
                JOIN study_groups sg ON q.group_id = sg.group_id
                LEFT JOIN (
                    SELECT question_id, COUNT(*)::int as answers_count FROM question_answers GROUP BY question_id
                ) qa ON q.question_id = qa.question_id
                ORDER BY q.views_count DESC, COALESCE(qa.answers_count, 0) DESC, q.created_at DESC
                LIMIT 5
            `),

            // Popular shared files
            db.query(`
                SELECT gm.material_id, gm.group_id, gm.title, gm.description, gm.file_path,
                       gm.file_name, gm.file_size, gm.file_type, gm.created_at,
                       u.full_name as author_name, sg.name as group_name
                FROM group_materials gm
                JOIN users u ON gm.uploaded_by = u.user_id
                JOIN study_groups sg ON gm.group_id = sg.group_id
                ORDER BY gm.created_at DESC
                LIMIT 5
            `)
        ]);

        res.json({
            success: true,
            trending: {
                discussions: trendingDiscussions.rows,
                questions: popularQuestions.rows,
                files: popularFiles.rows
            }
        });
    } catch (error) {
        console.error('[COMMUNITY] Get trending error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch trending topics', data: null });
    }
});

// Get study challenges (static list — fast endpoint)
router.get('/challenges', async (req, res) => {
    try {
        const challenges = [
            { id: 1, title: 'Calculus Conqueror', description: 'Solve 3 questions on the math board', progress: 66, goal: '3 questions', reward: '50 XP' },
            { id: 2, title: 'Group Guru', description: 'Join an active study meeting for 30 minutes', progress: 100, goal: '30 mins', reward: '100 XP' },
            { id: 3, title: 'Librarian', description: 'Upload a study resource to private materials', progress: 0, goal: '1 file', reward: '30 XP' }
        ];
        res.json({ success: true, challenges });
    } catch (error) {
        console.error('[COMMUNITY] Get challenges error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch challenges', data: null });
    }
});

// Get upcoming events for groups user has joined
// IMPORTANT: This route MUST appear BEFORE /events/:id to avoid route conflict
router.get('/events/upcoming', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(`
            SELECT ge.event_id, ge.group_id, ge.title, ge.description, ge.type, ge.event_date, ge.location, ge.created_at,
                   sg.name as group_name, sg.icon as group_icon, u.full_name as creator_name,
                   COALESCE(rsvp_counts.going_count, 0) as rsvp_going_count,
                   COALESCE(user_rsvp.status, 'none') as user_rsvp_status
            FROM group_events ge
            JOIN study_groups sg ON ge.group_id = sg.group_id
            JOIN users u ON ge.created_by = u.user_id
            JOIN group_members gm ON ge.group_id = gm.group_id
            LEFT JOIN (
                SELECT event_id, COUNT(*)::int as going_count FROM event_rsvps WHERE status = 'going' GROUP BY event_id
            ) rsvp_counts ON ge.event_id = rsvp_counts.event_id
            LEFT JOIN event_rsvps user_rsvp ON ge.event_id = user_rsvp.event_id AND user_rsvp.user_id = $1
            WHERE gm.user_id = $1 AND gm.status = 'approved' AND ge.event_date >= CURRENT_TIMESTAMP
            ORDER BY ge.event_date ASC
            LIMIT 5
        `, [userId]);
        res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get upcoming events error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming events', data: null });
    }
});

// Get suggested study groups (that user has NOT joined)
// IMPORTANT: This route MUST appear BEFORE /groups/:id to avoid route conflict
router.get('/groups/suggested', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(`
            SELECT sg.group_id, sg.name, sg.description, sg.category, sg.meeting_schedule, sg.cover_image, sg.icon,
                   COALESCE(mc.member_count, 0) as member_count
            FROM study_groups sg
            LEFT JOIN (
                SELECT group_id, COUNT(*)::int as member_count
                FROM group_members WHERE status = 'approved' GROUP BY group_id
            ) mc ON sg.group_id = mc.group_id
            WHERE sg.group_id NOT IN (
                SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'approved'
            )
            ORDER BY COALESCE(mc.member_count, 0) DESC
            LIMIT 3
        `, [userId]);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get suggested groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch suggested groups', data: null });
    }
});

// Get user's joined groups
// IMPORTANT: This route MUST appear BEFORE /groups/:id to avoid route conflict
router.get('/groups/joined', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(`
            SELECT sg.group_id, sg.name, sg.description, sg.category, sg.meeting_schedule, sg.cover_image, sg.icon,
                   gm.role, gm.joined_at,
                   COALESCE(mc.member_count, 0) as member_count
            FROM study_groups sg
            JOIN group_members gm ON sg.group_id = gm.group_id
            LEFT JOIN (
                SELECT group_id, COUNT(*)::int as member_count
                FROM group_members WHERE status = 'approved' GROUP BY group_id
            ) mc ON sg.group_id = mc.group_id
            WHERE gm.user_id = $1 AND gm.status = 'approved'
            ORDER BY gm.joined_at DESC
        `, [userId]);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get joined groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch joined groups', data: null });
    }
});

// List groups (with category filter & search)
router.get('/groups', async (req, res) => {
    try {
        const { category, search } = req.query;
        let queryStr = `
            SELECT sg.group_id, sg.name, sg.description, sg.category, sg.meeting_schedule, sg.cover_image, sg.icon,
                   COALESCE(mc.member_count, 0) as member_count
            FROM study_groups sg
            LEFT JOIN (
                SELECT group_id, COUNT(*)::int as member_count
                FROM group_members WHERE status = 'approved' GROUP BY group_id
            ) mc ON sg.group_id = mc.group_id
        `;
        const binds = [];
        const conditions = [];

        if (category && category !== 'all') {
            conditions.push(`sg.category = $${binds.length + 1}`);
            binds.push(category);
        }

        if (search) {
            // Push the search term once and use the same $N for both ILIKE conditions
            const paramIdx = binds.length + 1;
            conditions.push(`(sg.name ILIKE $${paramIdx} OR sg.description ILIKE $${paramIdx})`);
            binds.push(`%${search}%`);
        }

        if (conditions.length > 0) {
            queryStr += ' WHERE ' + conditions.join(' AND ');
        }

        queryStr += ' ORDER BY COALESCE(mc.member_count, 0) DESC';
        const result = await db.query(queryStr, binds);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch groups', data: null });
    }
});

// Create study group
router.post('/groups', async (req, res) => {
    try {
        const { name, description, category, meetingSchedule } = req.body;
        const userId = req.user.user_id;

        if (!name || !description) {
            return res.status(400).json({ success: false, message: 'Group name and description are required' });
        }

        const groupId = uuidv4();
        const coverMap = {
            mathematics: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600',
            science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600',
            programming: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600',
            languages: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
        };
        const iconMap = {
            mathematics: 'fas fa-calculator',
            science: 'fas fa-flask',
            programming: 'fas fa-code',
            languages: 'fas fa-language'
        };

        const coverImage = coverMap[category] || 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600';
        const icon = iconMap[category] || 'fas fa-users';

        // Insert group and add creator as owner in parallel-safe sequential tx
        await db.query(`
            INSERT INTO study_groups (group_id, name, description, category, meeting_schedule, cover_image, icon, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [groupId, name, description, category || 'other', meetingSchedule || 'Not scheduled', coverImage, icon, userId]);

        await db.query(`
            INSERT INTO group_members (group_id, user_id, role, status)
            VALUES ($1, $2, 'owner', 'approved')
        `, [groupId, userId]);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), groupId, userId, 'created the study group']);

        res.json({ success: true, groupId, message: 'Group created successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Create group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create group', data: null });
    }
});

// Join study group
router.post('/groups/:id/join', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        // Check group exists and membership in parallel
        const [groupCheck, memberCheck] = await Promise.all([
            db.query('SELECT name FROM study_groups WHERE group_id = $1', [groupId]),
            db.query('SELECT role, status FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId])
        ]);

        if (groupCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        if (memberCheck.rows.length > 0) {
            const memberStatus = memberCheck.rows[0].status;
            if (memberStatus === 'banned') {
                return res.status(403).json({ success: false, message: 'You are banned from this group' });
            }
            return res.json({ success: true, message: 'Already a member' });
        }

        await db.query(`
            INSERT INTO group_members (group_id, user_id, role, status)
            VALUES ($1, $2, 'member', 'approved')
        `, [groupId, userId]);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), groupId, userId, 'joined the group']);

        res.json({ success: true, message: 'Joined group successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Join group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to join group', data: null });
    }
});

// Leave group
router.post('/groups/:id/leave', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        const role = await isGroupMember(userId, groupId);
        if (!role) {
            return res.status(403).json({ success: false, message: 'Not a member of this group' });
        }

        if (role === 'owner') {
            return res.status(400).json({ success: false, message: 'Owners cannot leave. Transfer ownership or delete the group.' });
        }

        await db.query('DELETE FROM group_members WHERE group_id = $1 AND user_id = $2', [groupId, userId]);
        res.json({ success: true, message: 'Left group successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Leave group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to leave group', data: null });
    }
});

// Get group overview/details — ALL sub-queries run in parallel
router.get('/groups/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        const role = await isGroupMember(userId, groupId);
        if (!role) {
            return res.status(403).json({ success: false, message: 'You are not a member of this study group' });
        }

        // Run all 5 sub-queries in parallel
        const [groupQuery, announcements, files, meetings, activity] = await Promise.all([
            db.query(`
                SELECT sg.group_id, sg.name, sg.description, sg.category, sg.meeting_schedule, sg.cover_image, sg.icon, sg.created_at,
                       COALESCE(mc.member_count, 0) as member_count
                FROM study_groups sg
                LEFT JOIN (
                    SELECT group_id, COUNT(*)::int as member_count
                    FROM group_members WHERE status = 'approved' GROUP BY group_id
                ) mc ON sg.group_id = mc.group_id
                WHERE sg.group_id = $1
            `, [groupId]),

            db.query(`
                SELECT ga.announcement_id, ga.title, ga.content, ga.created_at, u.full_name as author_name
                FROM group_announcements ga
                JOIN users u ON ga.created_by = u.user_id
                WHERE ga.group_id = $1
                ORDER BY ga.created_at DESC LIMIT 5
            `, [groupId]),

            db.query(`
                SELECT gm.material_id, gm.title, gm.file_name, gm.file_size, gm.file_type, gm.file_path, gm.created_at,
                       u.full_name as uploaded_by_name
                FROM group_materials gm
                LEFT JOIN users u ON gm.uploaded_by = u.user_id
                WHERE gm.group_id = $1
                ORDER BY gm.created_at DESC LIMIT 5
            `, [groupId]),

            db.query(`
                SELECT gm.meeting_id, gm.title, gm.status, gm.created_at, u.full_name as host_name
                FROM group_meetings gm
                JOIN users u ON gm.host_id = u.user_id
                WHERE gm.group_id = $1 AND gm.status = 'active'
                ORDER BY gm.created_at DESC LIMIT 3
            `, [groupId]),

            db.query(`
                SELECT al.log_id, al.action, al.created_at, u.full_name as user_name
                FROM activity_logs al
                JOIN users u ON al.user_id = u.user_id
                WHERE al.group_id = $1
                ORDER BY al.created_at DESC LIMIT 10
            `, [groupId])
        ]);

        if (groupQuery.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        res.json({
            success: true,
            group: groupQuery.rows[0],
            userRole: role,
            announcements: announcements.rows,
            files: files.rows,
            meetings: meetings.rows,
            activity: activity.rows
        });
    } catch (error) {
        console.error('[COMMUNITY] Get group workspace overview error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load group workspace', data: null });
    }
});

// -------------------------------------------------------------
// 2. DISCUSSION FEED API
// -------------------------------------------------------------

// Get feed posts (JOIN-based aggregation)
router.get('/feed', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(`
            SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type, cp.is_pinned, cp.created_at,
                   u.full_name as author_name,
                   COALESCE(pl.likes_count, 0) as likes_count,
                   COALESCE(pc.comments_count, 0) as comments_count,
                   CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END as is_liked
            FROM community_posts cp
            JOIN users u ON cp.user_id = u.user_id
            LEFT JOIN (
                SELECT post_id, COUNT(*)::int as likes_count FROM post_likes GROUP BY post_id
            ) pl ON cp.post_id = pl.post_id
            LEFT JOIN (
                SELECT post_id, COUNT(*)::int as comments_count FROM post_comments GROUP BY post_id
            ) pc ON cp.post_id = pc.post_id
            LEFT JOIN post_likes ul ON cp.post_id = ul.post_id AND ul.user_id = $1
            ORDER BY cp.is_pinned DESC, cp.created_at DESC
            LIMIT 50
        `, [userId]);
        res.json({ success: true, posts: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get feed error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch feed', data: null });
    }
});

// Create feed post
router.post('/feed', upload.single('media'), async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.user_id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
        }

        const postId = uuidv4();
        let mediaPath = null;
        let mediaType = null;

        if (req.file) {
            mediaPath = `/uploads/community/posts/${req.file.filename}`;
            mediaType = req.file.mimetype;
        }

        await db.query(`
            INSERT INTO community_posts (post_id, user_id, content, media_path, media_type)
            VALUES ($1, $2, $3, $4, $5)
        `, [postId, userId, content, mediaPath, mediaType]);

        res.json({ success: true, message: 'Posted successfully', postId });
    } catch (error) {
        console.error('[COMMUNITY] Create feed post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to publish post', data: null });
    }
});

// Like/Unlike post
router.post('/feed/:id/like', async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;

        const check = await db.query('SELECT 1 FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
        if (check.rows.length > 0) {
            await db.query('DELETE FROM post_likes WHERE post_id = $1 AND user_id = $2', [postId, userId]);
            res.json({ success: true, liked: false });
        } else {
            await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1, $2)', [postId, userId]);
            res.json({ success: true, liked: true });
        }
    } catch (error) {
        console.error('[COMMUNITY] Like post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle like', data: null });
    }
});

// Get post comments
router.get('/feed/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const result = await db.query(`
            SELECT pc.comment_id, pc.content, pc.created_at, pc.parent_id, u.full_name as author_name
            FROM post_comments pc
            JOIN users u ON pc.user_id = u.user_id
            WHERE pc.post_id = $1
            ORDER BY pc.created_at ASC
        `, [postId]);
        res.json({ success: true, comments: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get comments error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch comments', data: null });
    }
});

// Add comment to post
router.post('/feed/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, parentId } = req.body;
        const userId = req.user.user_id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
        }

        const commentId = uuidv4();
        await db.query(`
            INSERT INTO post_comments (comment_id, post_id, user_id, content, parent_id)
            VALUES ($1, $2, $3, $4, $5)
        `, [commentId, postId, userId, content, parentId || null]);

        res.json({ success: true, message: 'Comment added successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Add comment error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post comment', data: null });
    }
});

// Delete post
router.delete('/feed/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;

        const check = await db.query('SELECT user_id FROM community_posts WHERE post_id = $1', [postId]);
        if (check.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (check.rows[0].user_id !== userId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await db.query('DELETE FROM community_posts WHERE post_id = $1', [postId]);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Delete post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete post', data: null });
    }
});

// -------------------------------------------------------------
// 3. GROUP PRIVATE MATERIALS LIBRARY
// -------------------------------------------------------------

// Get categories and files inside group materials
router.get('/groups/:id/materials', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { categoryId } = req.query;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Fetch categories and files in parallel
        const [categoriesResult, filesResult] = await Promise.all([
            db.query(
                `SELECT * FROM material_categories WHERE group_id = $1 AND (parent_id = $2 OR (parent_id IS NULL AND $2 IS NULL))`,
                [groupId, categoryId || null]
            ),
            db.query(
                `SELECT gm.material_id, gm.title, gm.description, gm.file_path, gm.file_name, gm.file_size, gm.file_type, gm.created_at,
                        u.full_name as author_name
                 FROM group_materials gm
                 LEFT JOIN users u ON gm.uploaded_by = u.user_id
                 WHERE gm.group_id = $1 AND (gm.category_id = $2 OR (gm.category_id IS NULL AND $2 IS NULL))`,
                [groupId, categoryId || null]
            )
        ]);

        res.json({
            success: true,
            folders: categoriesResult.rows,
            files: filesResult.rows
        });
    } catch (error) {
        console.error('[COMMUNITY] Get materials error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch materials', data: null });
    }
});

// Create folder/category
router.post('/groups/:id/materials/folders', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { name, parentId } = req.body;
        const userId = req.user.user_id;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Folder name is required' });
        }

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const categoryId = uuidv4();
        await db.query(
            'INSERT INTO material_categories (category_id, group_id, name, parent_id) VALUES ($1, $2, $3, $4)',
            [categoryId, groupId, name, parentId || null]
        );

        res.json({ success: true, message: 'Folder created successfully', folderId: categoryId });
    } catch (error) {
        console.error('[COMMUNITY] Create folder error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create folder', data: null });
    }
});

// Upload private material file
router.post('/groups/:id/materials', upload.single('file'), async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, categoryId, tags } = req.body;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const materialId = uuidv4();
        const filePath = `/uploads/community/materials/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;
        const fileType = path.extname(fileName).slice(1);

        await db.query(`
            INSERT INTO group_materials (material_id, group_id, category_id, title, description, file_path, file_name, file_size, file_type, uploaded_by, tags)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [materialId, groupId, categoryId || null, title || fileName, description || '', filePath, fileName, fileSize, fileType, userId, tags || '']);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), groupId, userId, `uploaded file "${title || fileName}"`]);

        res.json({ success: true, message: 'File uploaded successfully', fileId: materialId });
    } catch (error) {
        console.error('[COMMUNITY] Upload file error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to upload file', data: null });
    }
});

// -------------------------------------------------------------
// 4. QUESTIONS & ANSWERS (Q&A) API
// -------------------------------------------------------------

// List questions in group
router.get('/groups/:id/questions', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { search, solved, subject } = req.query;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        let queryStr = `
            SELECT q.question_id, q.group_id, q.user_id, q.title, q.description, q.subject, q.tags,
                   q.is_solved, q.priority, q.views_count, q.created_at,
                   u.full_name as author_name,
                   COALESCE(ac.answers_count, 0) as answers_count
            FROM questions q
            JOIN users u ON q.user_id = u.user_id
            LEFT JOIN (
                SELECT question_id, COUNT(*)::int as answers_count FROM question_answers GROUP BY question_id
            ) ac ON q.question_id = ac.question_id
            WHERE q.group_id = $1
        `;
        const binds = [groupId];

        if (solved !== undefined) {
            queryStr += ` AND q.is_solved = $${binds.length + 1}`;
            binds.push(solved === 'true');
        }

        if (subject) {
            queryStr += ` AND q.subject = $${binds.length + 1}`;
            binds.push(subject);
        }

        if (search) {
            // Push search term once and use same $N for both ILIKE conditions
            const paramIdx = binds.length + 1;
            queryStr += ` AND (q.title ILIKE $${paramIdx} OR q.description ILIKE $${paramIdx})`;
            binds.push(`%${search}%`);
        }

        queryStr += ' ORDER BY q.created_at DESC';
        const result = await db.query(queryStr, binds);
        res.json({ success: true, questions: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get questions error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch questions', data: null });
    }
});

// Ask a new question
router.post('/groups/:id/questions', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, subject, tags, priority } = req.body;
        const userId = req.user.user_id;

        if (!title || !description) {
            return res.status(400).json({ success: false, message: 'Title and description are required' });
        }

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const questionId = uuidv4();
        await db.query(`
            INSERT INTO questions (question_id, group_id, user_id, title, description, subject, tags, priority)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [questionId, groupId, userId, title, description, subject || 'general', tags || '', priority || 'medium']);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), groupId, userId, `asked a new question: "${title}"`]);

        res.json({ success: true, message: 'Question posted successfully', questionId });
    } catch (error) {
        console.error('[COMMUNITY] Ask question error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post question', data: null });
    }
});

// Get question with answers
router.get('/questions/:id', async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.user_id;

        // Increment view count and fetch question in parallel
        const [, questionResult] = await Promise.all([
            db.query('UPDATE questions SET views_count = views_count + 1 WHERE question_id = $1', [questionId]),
            db.query(`
                SELECT q.question_id, q.group_id, q.user_id, q.title, q.description, q.subject, q.tags,
                       q.is_solved, q.priority, q.views_count, q.created_at,
                       u.full_name as author_name, sg.name as group_name
                FROM questions q
                JOIN users u ON q.user_id = u.user_id
                JOIN study_groups sg ON q.group_id = sg.group_id
                WHERE q.question_id = $1
            `, [questionId])
        ]);

        if (questionResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const question = questionResult.rows[0];

        if (!(await isGroupMember(userId, question.group_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const answersResult = await db.query(`
            SELECT qa.answer_id, qa.question_id, qa.user_id, qa.content, qa.is_accepted, qa.created_at,
                   u.full_name as author_name,
                   COALESCE(vs.votes_sum, 0)::int as votes_sum,
                   COALESCE(uv.vote_value, 0) as user_vote
            FROM question_answers qa
            JOIN users u ON qa.user_id = u.user_id
            LEFT JOIN (
                SELECT answer_id, SUM(vote_value) as votes_sum FROM answer_votes GROUP BY answer_id
            ) vs ON qa.answer_id = vs.answer_id
            LEFT JOIN answer_votes uv ON qa.answer_id = uv.answer_id AND uv.user_id = $2
            WHERE qa.question_id = $1
            ORDER BY qa.is_accepted DESC, COALESCE(vs.votes_sum, 0) DESC, qa.created_at ASC
        `, [questionId, userId]);

        res.json({
            success: true,
            question,
            answers: answersResult.rows
        });
    } catch (error) {
        console.error('[COMMUNITY] Get question details error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch question details', data: null });
    }
});

// Answer a question
router.post('/questions/:id/answers', async (req, res) => {
    try {
        const questionId = req.params.id;
        const { content } = req.body;
        const userId = req.user.user_id;

        if (!content) {
            return res.status(400).json({ success: false, message: 'Answer content cannot be empty' });
        }

        const qCheck = await db.query('SELECT group_id, title FROM questions WHERE question_id = $1', [questionId]);
        if (qCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Question not found' });
        }

        const question = qCheck.rows[0];

        if (!(await isGroupMember(userId, question.group_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const answerId = uuidv4();
        await db.query(`
            INSERT INTO question_answers (answer_id, question_id, user_id, content)
            VALUES ($1, $2, $3, $4)
        `, [answerId, questionId, userId, content]);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), question.group_id, userId, `answered the question: "${question.title}"`]);

        res.json({ success: true, message: 'Answer posted successfully', answerId });
    } catch (error) {
        console.error('[COMMUNITY] Answer question error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to answer question', data: null });
    }
});

// Vote on answer
router.post('/answers/:id/vote', async (req, res) => {
    try {
        const answerId = req.params.id;
        const { vote } = req.body;
        const userId = req.user.user_id;

        if (![1, -1].includes(Number(vote))) {
            return res.status(400).json({ success: false, message: 'Invalid vote value' });
        }

        const ansCheck = await db.query(`
            SELECT qa.answer_id, q.group_id
            FROM question_answers qa
            JOIN questions q ON qa.question_id = q.question_id
            WHERE qa.answer_id = $1
        `, [answerId]);

        if (ansCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Answer not found' });
        }

        if (!(await isGroupMember(userId, ansCheck.rows[0].group_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const voteCheck = await db.query('SELECT vote_value FROM answer_votes WHERE answer_id = $1 AND user_id = $2', [answerId, userId]);
        if (voteCheck.rows.length > 0) {
            if (voteCheck.rows[0].vote_value === Number(vote)) {
                await db.query('DELETE FROM answer_votes WHERE answer_id = $1 AND user_id = $2', [answerId, userId]);
                return res.json({ success: true, message: 'Vote removed' });
            } else {
                await db.query('UPDATE answer_votes SET vote_value = $3 WHERE answer_id = $1 AND user_id = $2', [answerId, userId, vote]);
            }
        } else {
            await db.query('INSERT INTO answer_votes (answer_id, user_id, vote_value) VALUES ($1, $2, $3)', [answerId, userId, vote]);
        }

        res.json({ success: true, message: 'Vote recorded' });
    } catch (error) {
        console.error('[COMMUNITY] Vote answer error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to record vote', data: null });
    }
});

// Accept answer
router.post('/answers/:id/accept', async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.user_id;

        const ansCheck = await db.query(`
            SELECT qa.answer_id, q.question_id, q.user_id as question_author, q.group_id
            FROM question_answers qa
            JOIN questions q ON qa.question_id = q.question_id
            WHERE qa.answer_id = $1
        `, [answerId]);

        if (ansCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Answer not found' });
        }

        const data = ansCheck.rows[0];
        const userRole = await isGroupMember(userId, data.group_id);
        const isOwner = userRole === 'owner' || userRole === 'moderator';

        if (data.question_author !== userId && !isOwner) {
            return res.status(403).json({ success: false, message: 'Permission denied' });
        }

        await Promise.all([
            db.query('UPDATE question_answers SET is_accepted = FALSE WHERE question_id = $1', [data.question_id]),
        ]);
        await Promise.all([
            db.query('UPDATE question_answers SET is_accepted = TRUE WHERE answer_id = $1', [answerId]),
            db.query('UPDATE questions SET is_solved = TRUE WHERE question_id = $1', [data.question_id])
        ]);

        res.json({ success: true, message: 'Answer accepted successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Accept answer error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to accept answer', data: null });
    }
});

// -------------------------------------------------------------
// 5. EVENTS API
// -------------------------------------------------------------

// List group events
router.get('/groups/:id/events', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const result = await db.query(`
            SELECT ge.event_id, ge.group_id, ge.title, ge.description, ge.type, ge.event_date, ge.location, ge.created_at,
                   u.full_name as creator_name,
                   COALESCE(rc.going_count, 0) as rsvp_going_count,
                   COALESCE(ur.status, 'none') as user_rsvp_status
            FROM group_events ge
            JOIN users u ON ge.created_by = u.user_id
            LEFT JOIN (
                SELECT event_id, COUNT(*)::int as going_count FROM event_rsvps WHERE status = 'going' GROUP BY event_id
            ) rc ON ge.event_id = rc.event_id
            LEFT JOIN event_rsvps ur ON ge.event_id = ur.event_id AND ur.user_id = $2
            WHERE ge.group_id = $1
            ORDER BY ge.event_date ASC
        `, [groupId, userId]);

        res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get group events error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch events', data: null });
    }
});

// Create event
router.post('/groups/:id/events', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, type, eventDate, location } = req.body;
        const userId = req.user.user_id;

        if (!title || !eventDate) {
            return res.status(400).json({ success: false, message: 'Title and event date are required' });
        }

        const role = await isGroupMember(userId, groupId);
        if (!role || (role !== 'owner' && role !== 'moderator')) {
            return res.status(403).json({ success: false, message: 'Only owners or moderators can create events' });
        }

        const eventId = uuidv4();
        await db.query(`
            INSERT INTO group_events (event_id, group_id, title, description, type, event_date, location, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [eventId, groupId, title, description || '', type || 'study_session', eventDate, location || 'Virtual', userId]);

        await db.query(`
            INSERT INTO activity_logs (log_id, group_id, user_id, action)
            VALUES ($1, $2, $3, $4)
        `, [uuidv4(), groupId, userId, `scheduled a new event: "${title}"`]);

        res.json({ success: true, message: 'Event created successfully', eventId });
    } catch (error) {
        console.error('[COMMUNITY] Create event error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create event', data: null });
    }
});

// RSVP to event
router.post('/events/:id/rsvp', async (req, res) => {
    try {
        const eventId = req.params.id;
        const { status } = req.body;
        const userId = req.user.user_id;

        if (!['going', 'interested', 'not_going'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid RSVP status' });
        }

        const evCheck = await db.query('SELECT group_id FROM group_events WHERE event_id = $1', [eventId]);
        if (evCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!(await isGroupMember(userId, evCheck.rows[0].group_id))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const check = await db.query('SELECT 1 FROM event_rsvps WHERE event_id = $1 AND user_id = $2', [eventId, userId]);
        if (check.rows.length > 0) {
            await db.query('UPDATE event_rsvps SET status = $3 WHERE event_id = $1 AND user_id = $2', [eventId, userId, status]);
        } else {
            await db.query('INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1, $2, $3)', [eventId, userId, status]);
        }

        res.json({ success: true, message: 'RSVP updated successfully' });
    } catch (error) {
        console.error('[COMMUNITY] RSVP error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update RSVP', data: null });
    }
});

// -------------------------------------------------------------
// 6. NOTIFICATIONS API
// -------------------------------------------------------------

router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(
            `SELECT notification_id, type, title, content, link, is_read, created_at
             FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 30`,
            [userId]
        );
        res.json({ success: true, notifications: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get notifications error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load notifications', data: null });
    }
});

router.post('/notifications/:id/read', async (req, res) => {
    try {
        const notificationId = req.params.id;
        const userId = req.user.user_id;

        await db.query(
            'UPDATE notifications SET is_read = TRUE WHERE notification_id = $1 AND user_id = $2',
            [notificationId, userId]
        );
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('[COMMUNITY] Read notification error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update notification', data: null });
    }
});

// -------------------------------------------------------------
// 7. GLOBAL SEARCH API
// -------------------------------------------------------------
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.user_id;

        if (!query || query.trim() === '') {
            return res.json({ success: true, results: { groups: [], questions: [], files: [], events: [] } });
        }

        const searchTerm = `%${query}%`;

        // All 4 searches in parallel
        const [groups, questions, files, events] = await Promise.all([
            db.query(`
                SELECT sg.group_id, sg.name, sg.description, sg.category, sg.icon,
                       COALESCE(mc.member_count, 0) as member_count
                FROM study_groups sg
                LEFT JOIN (
                    SELECT group_id, COUNT(*)::int as member_count
                    FROM group_members WHERE status = 'approved' GROUP BY group_id
                ) mc ON sg.group_id = mc.group_id
                WHERE sg.name ILIKE $1 OR sg.description ILIKE $1
                LIMIT 10
            `, [searchTerm]),

            db.query(`
                SELECT q.question_id, q.title, q.description, q.is_solved, q.created_at,
                       u.full_name as author_name, sg.name as group_name
                FROM questions q
                JOIN users u ON q.user_id = u.user_id
                JOIN study_groups sg ON q.group_id = sg.group_id
                JOIN group_members gm ON q.group_id = gm.group_id
                WHERE gm.user_id = $2 AND gm.status = 'approved' AND (q.title ILIKE $1 OR q.description ILIKE $1)
                LIMIT 10
            `, [searchTerm, userId]),

            db.query(`
                SELECT gm.material_id, gm.title, gm.description, gm.file_type, gm.file_path,
                       u.full_name as uploaded_by_name, sg.name as group_name
                FROM group_materials gm
                JOIN users u ON gm.uploaded_by = u.user_id
                JOIN study_groups sg ON gm.group_id = sg.group_id
                JOIN group_members gmem ON gm.group_id = gmem.group_id
                WHERE gmem.user_id = $2 AND gmem.status = 'approved' AND (gm.title ILIKE $1 OR gm.description ILIKE $1)
                LIMIT 10
            `, [searchTerm, userId]),

            db.query(`
                SELECT ge.event_id, ge.title, ge.description, ge.event_date, ge.location,
                       sg.name as group_name
                FROM group_events ge
                JOIN study_groups sg ON ge.group_id = sg.group_id
                JOIN group_members gm ON ge.group_id = gm.group_id
                WHERE gm.user_id = $2 AND gm.status = 'approved' AND (ge.title ILIKE $1 OR ge.description ILIKE $1)
                LIMIT 10
            `, [searchTerm, userId])
        ]);

        res.json({
            success: true,
            results: {
                groups: groups.rows,
                questions: questions.rows,
                files: files.rows,
                events: events.rows
            }
        });
    } catch (error) {
        console.error('[COMMUNITY] Global search error:', error.message);
        res.status(500).json({ success: false, message: 'Search execution failed', data: null });
    }
});

// Member Management endpoints
router.get('/groups/:id/members', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const result = await db.query(`
            SELECT gm.role, gm.joined_at, gm.status, u.user_id, u.full_name, u.email
            FROM group_members gm
            JOIN users u ON gm.user_id = u.user_id
            WHERE gm.group_id = $1
            ORDER BY
                CASE gm.role WHEN 'owner' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END,
                u.full_name ASC
        `, [groupId]);

        res.json({ success: true, members: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get group members error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch members', data: null });
    }
});

// Get list of online community members
router.get('/presence/online', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT ps.user_id, ps.status, ps.last_seen_at, u.full_name, u.email
            FROM presence_status ps
            JOIN users u ON ps.user_id = u.user_id
            WHERE ps.status = 'online'
            LIMIT 10
        `);
        res.json({ success: true, onlineUsers: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get online presence error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch online presence', data: null });
    }
});

// Get active study room meetings for user's joined groups
router.get('/meetings/active', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const result = await db.query(`
            SELECT gm.meeting_id, gm.group_id, gm.title, gm.status, gm.created_at,
                   sg.name as group_name, sg.icon as group_icon, u.full_name as host_name
            FROM group_meetings gm
            JOIN study_groups sg ON gm.group_id = sg.group_id
            JOIN users u ON gm.host_id = u.user_id
            JOIN group_members gmem ON gm.group_id = gmem.group_id
            WHERE gm.status = 'active' AND gmem.user_id = $1 AND gmem.status = 'approved'
            ORDER BY gm.created_at DESC
        `, [userId]);
        res.json({ success: true, meetings: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get active meetings error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch active meetings', data: null });
    }
});

module.exports = router;
