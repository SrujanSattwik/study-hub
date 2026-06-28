'use strict';
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const db = require('../db/postgres');
const cache = require('../db/cache');

// ---------------------------------------------------------------
// FILE UPLOAD CONFIGURATION
// ---------------------------------------------------------------
const UPLOADS_BASE = path.join(__dirname, '../uploads/community');
const MATERIALS_DIR = path.join(UPLOADS_BASE, 'materials');
const CHAT_DIR = path.join(UPLOADS_BASE, 'chat');
const POST_DIR = path.join(UPLOADS_BASE, 'posts');

fs.mkdirSync(MATERIALS_DIR, { recursive: true });
fs.mkdirSync(CHAT_DIR, { recursive: true });
fs.mkdirSync(POST_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const destType = req.body.destType || 'materials';
        if (destType === 'chat') cb(null, CHAT_DIR);
        else if (destType === 'posts') cb(null, POST_DIR);
        else cb(null, MATERIALS_DIR);
    },
    filename: (req, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`)
});

const upload = multer({
    storage,
    limits: { fileSize: 100 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt',
                         '.zip', '.rar', '.png', '.jpg', '.jpeg', '.gif', '.mp4', '.mp3', '.wav'];
        cb(allowed.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('Unsupported extension'), true);
    }
});

// ---------------------------------------------------------------
// PERFORMANCE PROFILING MIDDLEWARE
// Logs: [PERF] METHOD /path | Total: Xms | DB: Xms | Serialize: Xms | Cache: hit/miss
// ---------------------------------------------------------------
router.use((req, res, next) => {
    const reqStart = process.hrtime.bigint();
    req._dbMs = 0; // routes accumulate DB time here
    req._cacheHit = false;

    const originalJson = res.json.bind(res);
    res.json = (body) => {
        const totalMs = Number(process.hrtime.bigint() - reqStart) / 1e6;
        const serializeStart = process.hrtime.bigint();
        const result = originalJson(body);
        const serializeMs = Number(process.hrtime.bigint() - serializeStart) / 1e6;
        const processingMs = totalMs - req._dbMs - serializeMs;
        const cacheTag = req._cacheHit ? 'CACHE HIT' : 'DB';
        console.log(
            `[PERF] ${req.method} ${req.path} | Total: ${totalMs.toFixed(1)}ms | DB: ${req._dbMs.toFixed(1)}ms | ` +
            `Processing: ${processingMs.toFixed(1)}ms | Serialize: ${serializeMs.toFixed(1)}ms | ${cacheTag}`
        );
        return result;
    };
    next();
});

// ---------------------------------------------------------------
// TIMED DB QUERY HELPER — accumulates DB time on req object
// ---------------------------------------------------------------
async function tq(req, text, params) {
    const start = process.hrtime.bigint();
    const result = await db.query(text, params);
    req._dbMs += Number(process.hrtime.bigint() - start) / 1e6;
    return result;
}

// ---------------------------------------------------------------
// GROUP MEMBERSHIP CHECK (cached per user+group, 30s TTL)
// ---------------------------------------------------------------
async function isGroupMember(userId, groupId) {
    const cacheKey = `member:${userId}:${groupId}`;
    const cached = cache.get(cacheKey);
    if (cached !== null) return cached;
    const result = await db.query(
        `SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2 AND status = 'approved'`,
        [groupId, userId]
    );
    const role = result.rows.length > 0 ? result.rows[0].role : null;
    cache.set(cacheKey, role, 30);
    return role;
}

// Invalidate membership cache when user joins/leaves
function invalidateMemberCache(userId, groupId) {
    cache.del(`member:${userId}:${groupId}`);
}

// ---------------------------------------------------------------
// HOME BUNDLE ENDPOINT — replaces 10 individual frontend requests
// Returns: stats, joinedGroups, exploreGroups, feed, events,
//          suggestedGroups, activeMeetings, onlineUsers, notifications, challenges
//
// All queries run in parallel server-side via Promise.all.
// Non-user-specific sections are cached with short TTL.
// ---------------------------------------------------------------
router.get('/home-bundle', async (req, res) => {
    const bundleStart = process.hrtime.bigint();
    try {
        const userId = req.user.user_id;

        // ── Cached sections (user-agnostic, 30s TTL) ──────────────────────────
        const cachedChallenges = cache.get('challenges');
        const challengesPromise = cachedChallenges
            ? Promise.resolve(cachedChallenges)
            : Promise.resolve([
                { id: 1, title: 'Calculus Conqueror', description: 'Solve 3 questions on the math board', progress: 66, goal: '3 questions', reward: '50 XP' },
                { id: 2, title: 'Group Guru', description: 'Join an active study meeting for 30 minutes', progress: 100, goal: '30 mins', reward: '100 XP' },
                { id: 3, title: 'Librarian', description: 'Upload a study resource to private materials', progress: 0, goal: '1 file', reward: '30 XP' }
            ]).then(data => { cache.set('challenges', data, 300); return data; });

        // ── All parallel DB queries ────────────────────────────────────────────
        const [
            statsResults,
            joinedGroupsResult,
            exploreGroupsResult,
            feedResult,
            eventsResult,
            suggestedResult,
            meetingsResult,
            onlineResult,
            notificationsResult,
            challenges
        ] = await Promise.all([
            // 1. STATS — B3 FIX: 2 queries instead of 8 separate ones.
            //    - Query A: 6 global aggregates in one scan per table (no user param).
            //    - Query B: 1 user-specific group member count.
            //    Both run in parallel. Total round-trips: 2 (was 8).
            (async () => {
                const cKey = `stats:${userId}`;
                const hit = cache.get(cKey);
                if (hit) { req._cacheHit = true; return hit; }

                const [globalRow, myGroupsRow] = await Promise.all([
                    db.query(`
                        SELECT
                            (SELECT COUNT(*)::int FROM users)                                             AS active_members,
                            (SELECT COUNT(*)::int FROM presence_status WHERE status='online')             AS online_users,
                            (SELECT COUNT(*)::int FROM group_meetings  WHERE status='active')             AS active_meetings,
                            (SELECT COUNT(*)::int FROM questions        WHERE created_at>=CURRENT_DATE)   AS questions_today,
                            (SELECT COUNT(*)::int FROM questions        WHERE is_solved=TRUE)             AS questions_solved,
                            (SELECT COUNT(*)::int FROM group_materials)                                   AS materials_shared,
                            (SELECT COUNT(*)::int FROM group_events     WHERE event_date>=CURRENT_TIMESTAMP) AS upcoming_events
                    `),
                    db.query(`SELECT COUNT(*)::int AS c FROM group_members WHERE user_id=$1 AND status='approved'`, [userId])
                ]);

                const g = globalRow.rows[0];
                const data = {
                    activeMembers:       g.active_members,
                    myGroups:            myGroupsRow.rows[0].c,
                    onlineUsers:         g.online_users,
                    activeMeetings:      g.active_meetings,
                    questionsAskedToday: g.questions_today,
                    questionsSolved:     g.questions_solved,
                    materialsShared:     g.materials_shared,
                    upcomingEvents:      g.upcoming_events,
                };
                cache.set(cKey, data, 45);
                return data;
            })(),

            // 2. JOINED GROUPS — user-specific, 30s TTL
            (async () => {
                const cKey = `joined:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT sg.group_id, sg.name, sg.description, sg.category,
                           sg.meeting_schedule, sg.cover_image, sg.icon,
                           gm.role, gm.joined_at,
                           COALESCE(mc.cnt, 0) AS member_count
                    FROM study_groups sg
                    JOIN group_members gm ON sg.group_id=gm.group_id AND gm.user_id=$1 AND gm.status='approved'
                    LEFT JOIN (
                        SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id
                    ) mc ON sg.group_id=mc.group_id
                    ORDER BY gm.joined_at DESC
                `, [userId]);
                cache.set(cKey, r.rows, 30);
                return r.rows;
            })(),

            // 3. EXPLORE GROUPS — all groups, 30s TTL
            (async () => {
                const cKey = 'explore_groups';
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT sg.group_id, sg.name, sg.description, sg.category,
                           sg.meeting_schedule, sg.cover_image, sg.icon,
                           COALESCE(mc.cnt, 0) AS member_count
                    FROM study_groups sg
                    LEFT JOIN (
                        SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id
                    ) mc ON sg.group_id=mc.group_id
                    ORDER BY COALESCE(mc.cnt, 0) DESC
                `);
                cache.set(cKey, r.rows, 30);
                return r.rows;
            })(),

            // 4. FEED POSTS — user-specific (likes), 20s TTL, limit 20 (was 50)
            (async () => {
                const cKey = `feed:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
                           cp.is_pinned, cp.created_at, u.full_name AS author_name,
                           COALESCE(pl.cnt, 0) AS likes_count,
                           COALESCE(pc.cnt, 0) AS comments_count,
                           CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked
                    FROM community_posts cp
                    JOIN users u ON cp.user_id=u.user_id
                    LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl ON cp.post_id=pl.post_id
                    LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc ON cp.post_id=pc.post_id
                    LEFT JOIN post_likes ul ON cp.post_id=ul.post_id AND ul.user_id=$1
                    ORDER BY cp.is_pinned DESC, cp.created_at DESC
                    LIMIT 20
                `, [userId]);
                cache.set(cKey, r.rows, 20);
                return r.rows;
            })(),

            // 5. UPCOMING EVENTS — user-specific, 45s TTL
            (async () => {
                const cKey = `events:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT ge.event_id, ge.group_id, ge.title, ge.event_date, ge.location, ge.type,
                           sg.name AS group_name, sg.icon AS group_icon,
                           COALESCE(rc.cnt, 0) AS rsvp_going_count,
                           COALESCE(ur.status, 'none') AS user_rsvp_status
                    FROM group_events ge
                    JOIN study_groups sg ON ge.group_id=sg.group_id
                    JOIN group_members gm ON ge.group_id=gm.group_id AND gm.user_id=$1 AND gm.status='approved'
                    LEFT JOIN (SELECT event_id, COUNT(*)::int AS cnt FROM event_rsvps WHERE status='going' GROUP BY event_id) rc ON ge.event_id=rc.event_id
                    LEFT JOIN event_rsvps ur ON ge.event_id=ur.event_id AND ur.user_id=$1
                    WHERE ge.event_date>=CURRENT_TIMESTAMP
                    ORDER BY ge.event_date ASC
                    LIMIT 5
                `, [userId]);
                cache.set(cKey, r.rows, 45);
                return r.rows;
            })(),

            // 6. SUGGESTED GROUPS — user-specific (excludes joined), 60s TTL
            // Uses LEFT JOIN anti-pattern instead of NOT IN subquery
            (async () => {
                const cKey = `suggested:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT sg.group_id, sg.name, sg.description, sg.category,
                           sg.meeting_schedule, sg.cover_image, sg.icon,
                           COALESCE(mc.cnt, 0) AS member_count
                    FROM study_groups sg
                    LEFT JOIN group_members my_gm ON sg.group_id=my_gm.group_id AND my_gm.user_id=$1 AND my_gm.status='approved'
                    LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
                    WHERE my_gm.group_id IS NULL
                    ORDER BY COALESCE(mc.cnt, 0) DESC
                    LIMIT 3
                `, [userId]);
                cache.set(cKey, r.rows, 60);
                return r.rows;
            })(),

            // 7. ACTIVE MEETINGS — user-specific, 30s TTL
            (async () => {
                const cKey = `meetings:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT gm.meeting_id, gm.group_id, gm.title, gm.status, gm.created_at,
                           sg.name AS group_name, sg.icon AS group_icon, u.full_name AS host_name
                    FROM group_meetings gm
                    JOIN study_groups sg ON gm.group_id=sg.group_id
                    JOIN users u ON gm.host_id=u.user_id
                    JOIN group_members gmem ON gm.group_id=gmem.group_id AND gmem.user_id=$1 AND gmem.status='approved'
                    WHERE gm.status='active'
                    ORDER BY gm.created_at DESC
                `, [userId]);
                cache.set(cKey, r.rows, 30);
                return r.rows;
            })(),

            // 8. ONLINE USERS — not user-specific, 20s TTL
            (async () => {
                const cKey = 'online_users';
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT ps.user_id, ps.status, u.full_name
                    FROM presence_status ps
                    JOIN users u ON ps.user_id=u.user_id
                    WHERE ps.status='online'
                    LIMIT 10
                `);
                cache.set(cKey, r.rows, 20);
                return r.rows;
            })(),

            // 9. NOTIFICATIONS — user-specific, 30s TTL
            (async () => {
                const cKey = `notifs:${userId}`;
                const hit = cache.get(cKey);
                if (hit) return hit;
                const r = await db.query(`
                    SELECT notification_id, type, title, content, link, is_read, created_at
                    FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20
                `, [userId]);
                cache.set(cKey, r.rows, 30);
                return r.rows;
            })(),

            // 10. CHALLENGES — static, 5-minute TTL
            challengesPromise
        ]);

        const bundleMs = Number(process.hrtime.bigint() - bundleStart) / 1e6;
        console.log(`[HOME BUNDLE] Resolved in ${bundleMs.toFixed(1)}ms for user ${userId}`);

        res.json({
            success: true,
            bundle: {
                stats: statsResults,
                joinedGroups: joinedGroupsResult,
                exploreGroups: exploreGroupsResult,
                feed: feedResult,
                events: eventsResult,
                suggestedGroups: suggestedResult,
                activeMeetings: meetingsResult,
                onlineUsers: onlineResult,
                notifications: notificationsResult,
                challenges
            }
        });
    } catch (error) {
        console.error('[COMMUNITY] Home bundle error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to load community data', data: null });
    }
});

// ---------------------------------------------------------------
// 1. STATS — individual endpoint (still available, cached)
// ---------------------------------------------------------------
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `stats:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, stats: hit }); }

        // B3 FIX: 2 queries instead of 8. Global aggregates in one query + 1 user-specific.
        const [globalRow, myGroupsRow] = await Promise.all([
            tq(req, `
                SELECT
                    (SELECT COUNT(*)::int FROM users)                                             AS active_members,
                    (SELECT COUNT(*)::int FROM presence_status WHERE status='online')             AS online_users,
                    (SELECT COUNT(*)::int FROM group_meetings  WHERE status='active')             AS active_meetings,
                    (SELECT COUNT(*)::int FROM questions        WHERE created_at>=CURRENT_DATE)   AS questions_today,
                    (SELECT COUNT(*)::int FROM questions        WHERE is_solved=TRUE)             AS questions_solved,
                    (SELECT COUNT(*)::int FROM group_materials)                                   AS materials_shared,
                    (SELECT COUNT(*)::int FROM group_events     WHERE event_date>=CURRENT_TIMESTAMP) AS upcoming_events
            `),
            tq(req, `SELECT COUNT(*)::int AS c FROM group_members WHERE user_id=$1 AND status='approved'`, [userId])
        ]);

        const g = globalRow.rows[0];
        const stats = {
            activeMembers:       g.active_members,
            myGroups:            myGroupsRow.rows[0].c,
            onlineUsers:         g.online_users,
            activeMeetings:      g.active_meetings,
            questionsAskedToday: g.questions_today,
            questionsSolved:     g.questions_solved,
            materialsShared:     g.materials_shared,
            upcomingEvents:      g.upcoming_events,
        };
        cache.set(cKey, stats, 45);
        res.json({ success: true, stats });
    } catch (error) {
        console.error('[COMMUNITY] Get stats error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics', data: null });
    }
});

// ---------------------------------------------------------------
// TRENDING — cached 60s
// ---------------------------------------------------------------
router.get('/trending', async (req, res) => {
    try {
        const userId = req.user.user_id;

        // B8 FIX: Trending data (discussions, questions, files) is NOT user-specific.
        // Only is_liked differs per user, but all other fields are shared.
        // Use a single shared cache key instead of one copy per user.
        // This eliminates N redundant cache entries (one per user) for identical data.
        const cKey = 'trending_base';
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, trending: hit }); }

        const [trendingDiscussions, popularQuestions, popularFiles] = await Promise.all([
            tq(req, `
                SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
                       cp.is_pinned, cp.created_at, u.full_name AS author_name,
                       COALESCE(pl.cnt, 0) AS likes_count, COALESCE(pc.cnt, 0) AS comments_count
                FROM community_posts cp
                JOIN users u ON cp.user_id=u.user_id
                LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl ON cp.post_id=pl.post_id
                LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc ON cp.post_id=pc.post_id
                ORDER BY COALESCE(pc.cnt,0) DESC, COALESCE(pl.cnt,0) DESC, cp.created_at DESC
                LIMIT 5
            `),
            tq(req, `
                SELECT q.question_id, q.group_id, q.title, q.subject,
                       q.is_solved, q.priority, q.views_count, q.created_at,
                       u.full_name AS author_name, sg.name AS group_name,
                       COALESCE(qa.cnt, 0) AS answers_count
                FROM questions q
                JOIN users u ON q.user_id=u.user_id
                JOIN study_groups sg ON q.group_id=sg.group_id
                LEFT JOIN (SELECT question_id, COUNT(*)::int AS cnt FROM question_answers GROUP BY question_id) qa ON q.question_id=qa.question_id
                ORDER BY q.views_count DESC, COALESCE(qa.cnt,0) DESC, q.created_at DESC
                LIMIT 5
            `),
            tq(req, `
                SELECT gm.material_id, gm.group_id, gm.title, gm.file_name,
                       gm.file_size, gm.file_type, gm.file_path, gm.created_at,
                       u.full_name AS author_name, sg.name AS group_name
                FROM group_materials gm
                JOIN users u ON gm.uploaded_by=u.user_id
                JOIN study_groups sg ON gm.group_id=sg.group_id
                ORDER BY gm.created_at DESC LIMIT 5
            `)
        ]);

        const trending = {
            discussions: trendingDiscussions.rows,
            questions: popularQuestions.rows,
            files: popularFiles.rows
        };
        // NOTE: is_liked is omitted from trending (was user-specific) — frontend should
        // use the feed endpoint for liked status. This matches prior behavior where
        // trending did not reliably reflect per-user state.
        cache.set(cKey, trending, 60);
        res.json({ success: true, trending });
    } catch (error) {
        console.error('[COMMUNITY] Get trending error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch trending topics', data: null });
    }
});

// ---------------------------------------------------------------
// CHALLENGES — static, 5-min cache
// ---------------------------------------------------------------
router.get('/challenges', async (req, res) => {
    try {
        const hit = cache.get('challenges');
        if (hit) { req._cacheHit = true; return res.json({ success: true, challenges: hit }); }
        const challenges = [
            { id: 1, title: 'Calculus Conqueror', description: 'Solve 3 questions on the math board', progress: 66, goal: '3 questions', reward: '50 XP' },
            { id: 2, title: 'Group Guru', description: 'Join an active study meeting for 30 minutes', progress: 100, goal: '30 mins', reward: '100 XP' },
            { id: 3, title: 'Librarian', description: 'Upload a study resource to private materials', progress: 0, goal: '1 file', reward: '30 XP' }
        ];
        cache.set('challenges', challenges, 300);
        res.json({ success: true, challenges });
    } catch (error) {
        console.error('[COMMUNITY] Get challenges error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch challenges', data: null });
    }
});

// ---------------------------------------------------------------
// UPCOMING EVENTS — cached 45s
// ---------------------------------------------------------------
router.get('/events/upcoming', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `events:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, events: hit }); }

        const result = await tq(req, `
            SELECT ge.event_id, ge.group_id, ge.title, ge.event_date, ge.location, ge.type,
                   sg.name AS group_name, sg.icon AS group_icon,
                   COALESCE(rc.cnt, 0) AS rsvp_going_count,
                   COALESCE(ur.status, 'none') AS user_rsvp_status
            FROM group_events ge
            JOIN study_groups sg ON ge.group_id=sg.group_id
            JOIN group_members gm ON ge.group_id=gm.group_id AND gm.user_id=$1 AND gm.status='approved'
            LEFT JOIN (SELECT event_id, COUNT(*)::int AS cnt FROM event_rsvps WHERE status='going' GROUP BY event_id) rc ON ge.event_id=rc.event_id
            LEFT JOIN event_rsvps ur ON ge.event_id=ur.event_id AND ur.user_id=$1
            WHERE ge.event_date>=CURRENT_TIMESTAMP
            ORDER BY ge.event_date ASC LIMIT 5
        `, [userId]);
        cache.set(cKey, result.rows, 45);
        res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get upcoming events error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch upcoming events', data: null });
    }
});

// ---------------------------------------------------------------
// GROUPS/SUGGESTED — LEFT JOIN anti-pattern, 60s cache
// ---------------------------------------------------------------
router.get('/groups/suggested', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `suggested:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, groups: hit }); }

        const result = await tq(req, `
            SELECT sg.group_id, sg.name, sg.description, sg.category,
                   sg.meeting_schedule, sg.cover_image, sg.icon,
                   COALESCE(mc.cnt, 0) AS member_count
            FROM study_groups sg
            LEFT JOIN group_members my_gm ON sg.group_id=my_gm.group_id AND my_gm.user_id=$1 AND my_gm.status='approved'
            LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
            WHERE my_gm.group_id IS NULL
            ORDER BY COALESCE(mc.cnt, 0) DESC
            LIMIT 3
        `, [userId]);
        cache.set(cKey, result.rows, 60);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get suggested groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch suggested groups', data: null });
    }
});

// ---------------------------------------------------------------
// GROUPS/JOINED — 30s cache
// ---------------------------------------------------------------
router.get('/groups/joined', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `joined:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, groups: hit }); }

        const result = await tq(req, `
            SELECT sg.group_id, sg.name, sg.description, sg.category,
                   sg.meeting_schedule, sg.cover_image, sg.icon,
                   gm.role, gm.joined_at, COALESCE(mc.cnt, 0) AS member_count
            FROM study_groups sg
            JOIN group_members gm ON sg.group_id=gm.group_id AND gm.user_id=$1 AND gm.status='approved'
            LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
            ORDER BY gm.joined_at DESC
        `, [userId]);
        cache.set(cKey, result.rows, 30);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get joined groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch joined groups', data: null });
    }
});

// ---------------------------------------------------------------
// LIST GROUPS (explore, with optional filter & search)
// ---------------------------------------------------------------
router.get('/groups', async (req, res) => {
    try {
        const { category, search } = req.query;
        const cKey = `explore:${category||'all'}:${search||''}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, groups: hit }); }

        let queryStr = `
            SELECT sg.group_id, sg.name, sg.description, sg.category,
                   sg.meeting_schedule, sg.cover_image, sg.icon,
                   COALESCE(mc.cnt, 0) AS member_count
            FROM study_groups sg
            LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
        `;
        const binds = [];
        const conds = [];

        if (category && category !== 'all') {
            conds.push(`sg.category=$${binds.length + 1}`);
            binds.push(category);
        }
        if (search) {
            const p = binds.length + 1;
            conds.push(`(sg.name ILIKE $${p} OR sg.description ILIKE $${p})`);
            binds.push(`%${search}%`);
        }
        if (conds.length) queryStr += ' WHERE ' + conds.join(' AND ');
        queryStr += ' ORDER BY COALESCE(mc.cnt, 0) DESC';

        const result = await tq(req, queryStr, binds);
        cache.set(cKey, result.rows, 30);
        res.json({ success: true, groups: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get groups error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch groups', data: null });
    }
});

// ---------------------------------------------------------------
// CREATE GROUP
// ---------------------------------------------------------------
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

        await db.query(`
            INSERT INTO study_groups (group_id, name, description, category, meeting_schedule, cover_image, icon, created_by)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        `, [groupId, name, description, category || 'other',
            meetingSchedule || 'Not scheduled',
            coverMap[category] || coverMap.languages,
            iconMap[category] || 'fas fa-users',
            userId]);

        await db.query(`INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1,$2,'owner','approved')`, [groupId, userId]);
        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,'created the study group')`, [uuidv4(), groupId, userId]);

        // Invalidate caches that depend on group lists
        cache.del(`joined:${userId}`);
        cache.del(`suggested:${userId}`);
        cache.del('explore_groups');
        cache.delByPrefix('explore:');
        invalidateMemberCache(userId, groupId);

        res.json({ success: true, groupId, message: 'Group created successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Create group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create group', data: null });
    }
});

// ---------------------------------------------------------------
// JOIN GROUP
// ---------------------------------------------------------------
router.post('/groups/:id/join', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        const [groupCheck, memberCheck] = await Promise.all([
            tq(req, 'SELECT name FROM study_groups WHERE group_id=$1', [groupId]),
            tq(req, 'SELECT role, status FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, userId])
        ]);

        if (groupCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });
        if (memberCheck.rows.length > 0) {
            if (memberCheck.rows[0].status === 'banned') return res.status(403).json({ success: false, message: 'You are banned from this group' });
            return res.json({ success: true, message: 'Already a member' });
        }

        await db.query(`INSERT INTO group_members (group_id, user_id, role, status) VALUES ($1,$2,'member','approved')`, [groupId, userId]);
        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,'joined the group')`, [uuidv4(), groupId, userId]);

        // Invalidate caches
        cache.del(`joined:${userId}`);
        cache.del(`suggested:${userId}`);
        cache.del(`stats:${userId}`);
        cache.del('explore_groups');
        invalidateMemberCache(userId, groupId);

        res.json({ success: true, message: 'Joined group successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Join group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to join group', data: null });
    }
});

// ---------------------------------------------------------------
// LEAVE GROUP
// ---------------------------------------------------------------
router.post('/groups/:id/leave', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        const role = await isGroupMember(userId, groupId);
        if (!role) return res.status(403).json({ success: false, message: 'Not a member of this group' });
        if (role === 'owner') return res.status(400).json({ success: false, message: 'Owners cannot leave. Transfer ownership or delete the group.' });

        await db.query('DELETE FROM group_members WHERE group_id=$1 AND user_id=$2', [groupId, userId]);

        cache.del(`joined:${userId}`);
        cache.del(`suggested:${userId}`);
        cache.del(`stats:${userId}`);
        cache.del('explore_groups');
        invalidateMemberCache(userId, groupId);

        res.json({ success: true, message: 'Left group successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Leave group error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to leave group', data: null });
    }
});

// ---------------------------------------------------------------
// GROUP WORKSPACE OVERVIEW — parallel sub-queries, 30s member-cached
// ---------------------------------------------------------------
router.get('/groups/:id', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        const role = await isGroupMember(userId, groupId);
        if (!role) return res.status(403).json({ success: false, message: 'You are not a member of this study group' });

        const [groupQuery, announcements, files, meetings, activity] = await Promise.all([
            tq(req, `
                SELECT sg.group_id, sg.name, sg.description, sg.category,
                       sg.meeting_schedule, sg.cover_image, sg.icon, sg.created_at,
                       COALESCE(mc.cnt, 0) AS member_count
                FROM study_groups sg
                LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
                WHERE sg.group_id=$1
            `, [groupId]),
            tq(req, `
                SELECT ga.announcement_id, ga.title, ga.content, ga.created_at, u.full_name AS author_name
                FROM group_announcements ga
                JOIN users u ON ga.created_by=u.user_id
                WHERE ga.group_id=$1 ORDER BY ga.created_at DESC LIMIT 5
            `, [groupId]),
            tq(req, `
                SELECT gm.material_id, gm.title, gm.file_name, gm.file_size, gm.file_type, gm.file_path, gm.created_at,
                       u.full_name AS uploaded_by_name
                FROM group_materials gm
                LEFT JOIN users u ON gm.uploaded_by=u.user_id
                WHERE gm.group_id=$1 ORDER BY gm.created_at DESC LIMIT 5
            `, [groupId]),
            tq(req, `
                SELECT gm.meeting_id, gm.title, gm.status, gm.created_at, u.full_name AS host_name
                FROM group_meetings gm
                JOIN users u ON gm.host_id=u.user_id
                WHERE gm.group_id=$1 AND gm.status='active'
                ORDER BY gm.created_at DESC LIMIT 3
            `, [groupId]),
            tq(req, `
                SELECT al.log_id, al.action, al.created_at, u.full_name AS user_name
                FROM activity_logs al
                JOIN users u ON al.user_id=u.user_id
                WHERE al.group_id=$1 ORDER BY al.created_at DESC LIMIT 10
            `, [groupId])
        ]);

        if (groupQuery.rows.length === 0) return res.status(404).json({ success: false, message: 'Group not found' });

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

// ---------------------------------------------------------------
// FEED — 20s user-specific cache
// ---------------------------------------------------------------
router.get('/feed', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `feed:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, posts: hit }); }

        const result = await tq(req, `
            SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
                   cp.is_pinned, cp.created_at, u.full_name AS author_name,
                   COALESCE(pl.cnt, 0) AS likes_count,
                   COALESCE(pc.cnt, 0) AS comments_count,
                   CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked
            FROM community_posts cp
            JOIN users u ON cp.user_id=u.user_id
            LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl ON cp.post_id=pl.post_id
            LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc ON cp.post_id=pc.post_id
            LEFT JOIN post_likes ul ON cp.post_id=ul.post_id AND ul.user_id=$1
            ORDER BY cp.is_pinned DESC, cp.created_at DESC
            LIMIT 20
        `, [userId]);
        cache.set(cKey, result.rows, 20);
        res.json({ success: true, posts: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get feed error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch feed', data: null });
    }
});

// CREATE POST — invalidates feed cache
router.post('/feed', upload.single('media'), async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.user.user_id;

        if (!content) return res.status(400).json({ success: false, message: 'Post content cannot be empty' });

        const postId = uuidv4();
        let mediaPath = null, mediaType = null;
        if (req.file) {
            mediaPath = `/uploads/community/posts/${req.file.filename}`;
            mediaType = req.file.mimetype;
        }

        await db.query(`INSERT INTO community_posts (post_id, user_id, content, media_path, media_type) VALUES ($1,$2,$3,$4,$5)`,
            [postId, userId, content, mediaPath, mediaType]);

        // Invalidate feed caches — use delBySubstring to clear all user feed caches
        // (conservative: only clear the poster's feed; for a shared timeline, clear all feed: keys)
        cache.del(`feed:${userId}`);
        cache.del(`stats:${userId}`);

        res.json({ success: true, message: 'Posted successfully', postId });
    } catch (error) {
        console.error('[COMMUNITY] Create feed post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to publish post', data: null });
    }
});

// LIKE/UNLIKE POST — invalidates feed cache
router.post('/feed/:id/like', async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;

        const check = await db.query('SELECT 1 FROM post_likes WHERE post_id=$1 AND user_id=$2', [postId, userId]);
        if (check.rows.length > 0) {
            await db.query('DELETE FROM post_likes WHERE post_id=$1 AND user_id=$2', [postId, userId]);
            cache.del(`feed:${userId}`);
            res.json({ success: true, liked: false });
        } else {
            await db.query('INSERT INTO post_likes (post_id, user_id) VALUES ($1,$2)', [postId, userId]);
            cache.del(`feed:${userId}`);
            res.json({ success: true, liked: true });
        }
    } catch (error) {
        console.error('[COMMUNITY] Like post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle like', data: null });
    }
});

// GET COMMENTS
router.get('/feed/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const result = await tq(req, `
            SELECT pc.comment_id, pc.content, pc.created_at, pc.parent_id, u.full_name AS author_name
            FROM post_comments pc
            JOIN users u ON pc.user_id=u.user_id
            WHERE pc.post_id=$1 ORDER BY pc.created_at ASC
        `, [postId]);
        res.json({ success: true, comments: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get comments error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch comments', data: null });
    }
});

// ADD COMMENT
router.post('/feed/:id/comments', async (req, res) => {
    try {
        const postId = req.params.id;
        const { content, parentId } = req.body;
        const userId = req.user.user_id;

        if (!content) return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });

        const commentId = uuidv4();
        await db.query(`INSERT INTO post_comments (comment_id, post_id, user_id, content, parent_id) VALUES ($1,$2,$3,$4,$5)`,
            [commentId, postId, userId, content, parentId || null]);

        cache.del(`feed:${userId}`); // refresh comment count on next fetch
        res.json({ success: true, message: 'Comment added successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Add comment error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post comment', data: null });
    }
});

// DELETE POST
router.delete('/feed/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const userId = req.user.user_id;

        const check = await db.query('SELECT user_id FROM community_posts WHERE post_id=$1', [postId]);
        if (check.rows.length === 0) return res.status(404).json({ success: false, message: 'Post not found' });
        if (check.rows[0].user_id !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });

        await db.query('DELETE FROM community_posts WHERE post_id=$1', [postId]);
        cache.del(`feed:${userId}`);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Delete post error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete post', data: null });
    }
});

// ---------------------------------------------------------------
// GROUP MATERIALS
// ---------------------------------------------------------------
router.get('/groups/:id/materials', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { categoryId } = req.query;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        const [categoriesResult, filesResult] = await Promise.all([
            tq(req, `SELECT * FROM material_categories WHERE group_id=$1 AND (parent_id=$2 OR (parent_id IS NULL AND $2 IS NULL))`, [groupId, categoryId || null]),
            tq(req, `
                SELECT gm.material_id, gm.title, gm.description, gm.file_path, gm.file_name, gm.file_size, gm.file_type, gm.created_at,
                       u.full_name AS author_name
                FROM group_materials gm
                LEFT JOIN users u ON gm.uploaded_by=u.user_id
                WHERE gm.group_id=$1 AND (gm.category_id=$2 OR (gm.category_id IS NULL AND $2 IS NULL))
            `, [groupId, categoryId || null])
        ]);

        res.json({ success: true, folders: categoriesResult.rows, files: filesResult.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get materials error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch materials', data: null });
    }
});

router.post('/groups/:id/materials/folders', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { name, parentId } = req.body;
        const userId = req.user.user_id;

        if (!name) return res.status(400).json({ success: false, message: 'Folder name is required' });
        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        const categoryId = uuidv4();
        await db.query('INSERT INTO material_categories (category_id, group_id, name, parent_id) VALUES ($1,$2,$3,$4)', [categoryId, groupId, name, parentId || null]);
        res.json({ success: true, message: 'Folder created successfully', folderId: categoryId });
    } catch (error) {
        console.error('[COMMUNITY] Create folder error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create folder', data: null });
    }
});

router.post('/groups/:id/materials', upload.single('file'), async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, categoryId, tags } = req.body;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const materialId = uuidv4();
        const filePath = `/uploads/community/materials/${req.file.filename}`;
        const fileName = req.file.originalname;
        const fileSize = req.file.size;
        const fileType = path.extname(fileName).slice(1);

        await db.query(`
            INSERT INTO group_materials (material_id, group_id, category_id, title, description, file_path, file_name, file_size, file_type, uploaded_by, tags)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        `, [materialId, groupId, categoryId || null, title || fileName, description || '', filePath, fileName, fileSize, fileType, userId, tags || '']);

        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,$4)`,
            [uuidv4(), groupId, userId, `uploaded file "${title || fileName}"`]);

        cache.del(`stats:${userId}`); // materialsShared count changed
        res.json({ success: true, message: 'File uploaded successfully', fileId: materialId });
    } catch (error) {
        console.error('[COMMUNITY] Upload file error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to upload file', data: null });
    }
});

// ---------------------------------------------------------------
// Q&A
// ---------------------------------------------------------------
router.get('/groups/:id/questions', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { search, solved, subject } = req.query;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        let queryStr = `
            SELECT q.question_id, q.group_id, q.user_id, q.title, q.subject,
                   q.is_solved, q.priority, q.views_count, q.created_at,
                   u.full_name AS author_name,
                   COALESCE(ac.cnt, 0) AS answers_count
            FROM questions q
            JOIN users u ON q.user_id=u.user_id
            LEFT JOIN (SELECT question_id, COUNT(*)::int AS cnt FROM question_answers GROUP BY question_id) ac ON q.question_id=ac.question_id
            WHERE q.group_id=$1
        `;
        const binds = [groupId];

        if (solved !== undefined) { queryStr += ` AND q.is_solved=$${binds.length + 1}`; binds.push(solved === 'true'); }
        if (subject) { queryStr += ` AND q.subject=$${binds.length + 1}`; binds.push(subject); }
        if (search) {
            const p = binds.length + 1;
            queryStr += ` AND (q.title ILIKE $${p} OR q.description ILIKE $${p})`;
            binds.push(`%${search}%`);
        }
        queryStr += ' ORDER BY q.created_at DESC';

        const result = await tq(req, queryStr, binds);
        res.json({ success: true, questions: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get questions error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch questions', data: null });
    }
});

router.post('/groups/:id/questions', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, subject, tags, priority } = req.body;
        const userId = req.user.user_id;

        if (!title || !description) return res.status(400).json({ success: false, message: 'Title and description are required' });
        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        const questionId = uuidv4();
        await db.query(`INSERT INTO questions (question_id, group_id, user_id, title, description, subject, tags, priority) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [questionId, groupId, userId, title, description, subject || 'general', tags || '', priority || 'medium']);
        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,$4)`,
            [uuidv4(), groupId, userId, `asked a new question: "${title}"`]);

        cache.del(`stats:${userId}`);
        res.json({ success: true, message: 'Question posted successfully', questionId });
    } catch (error) {
        console.error('[COMMUNITY] Ask question error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post question', data: null });
    }
});

router.get('/questions/:id', async (req, res) => {
    try {
        const questionId = req.params.id;
        const userId = req.user.user_id;

        const [, questionResult] = await Promise.all([
            db.query('UPDATE questions SET views_count=views_count+1 WHERE question_id=$1', [questionId]),
            tq(req, `
                SELECT q.question_id, q.group_id, q.user_id, q.title, q.description, q.subject, q.tags,
                       q.is_solved, q.priority, q.views_count, q.created_at,
                       u.full_name AS author_name, sg.name AS group_name
                FROM questions q
                JOIN users u ON q.user_id=u.user_id
                JOIN study_groups sg ON q.group_id=sg.group_id
                WHERE q.question_id=$1
            `, [questionId])
        ]);

        if (questionResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Question not found' });

        const question = questionResult.rows[0];
        if (!(await isGroupMember(userId, question.group_id))) return res.status(403).json({ success: false, message: 'Access denied' });

        const answersResult = await tq(req, `
            SELECT qa.answer_id, qa.question_id, qa.user_id, qa.content, qa.is_accepted, qa.created_at,
                   u.full_name AS author_name,
                   COALESCE(vs.votes_sum, 0)::int AS votes_sum,
                   COALESCE(uv.vote_value, 0) AS user_vote
            FROM question_answers qa
            JOIN users u ON qa.user_id=u.user_id
            LEFT JOIN (SELECT answer_id, SUM(vote_value) AS votes_sum FROM answer_votes GROUP BY answer_id) vs ON qa.answer_id=vs.answer_id
            LEFT JOIN answer_votes uv ON qa.answer_id=uv.answer_id AND uv.user_id=$2
            WHERE qa.question_id=$1
            ORDER BY qa.is_accepted DESC, COALESCE(vs.votes_sum,0) DESC, qa.created_at ASC
        `, [questionId, userId]);

        res.json({ success: true, question, answers: answersResult.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get question details error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch question details', data: null });
    }
});

router.post('/questions/:id/answers', async (req, res) => {
    try {
        const questionId = req.params.id;
        const { content } = req.body;
        const userId = req.user.user_id;

        if (!content) return res.status(400).json({ success: false, message: 'Answer content cannot be empty' });

        const qCheck = await db.query('SELECT group_id, title FROM questions WHERE question_id=$1', [questionId]);
        if (qCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Question not found' });

        const question = qCheck.rows[0];
        if (!(await isGroupMember(userId, question.group_id))) return res.status(403).json({ success: false, message: 'Access denied' });

        const answerId = uuidv4();
        await db.query(`INSERT INTO question_answers (answer_id, question_id, user_id, content) VALUES ($1,$2,$3,$4)`, [answerId, questionId, userId, content]);
        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,$4)`,
            [uuidv4(), question.group_id, userId, `answered the question: "${question.title}"`]);

        res.json({ success: true, message: 'Answer posted successfully', answerId });
    } catch (error) {
        console.error('[COMMUNITY] Answer question error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to answer question', data: null });
    }
});

router.post('/answers/:id/vote', async (req, res) => {
    try {
        const answerId = req.params.id;
        const { vote } = req.body;
        const userId = req.user.user_id;

        if (![1, -1].includes(Number(vote))) return res.status(400).json({ success: false, message: 'Invalid vote value' });

        const ansCheck = await db.query(`
            SELECT qa.answer_id, q.group_id FROM question_answers qa
            JOIN questions q ON qa.question_id=q.question_id WHERE qa.answer_id=$1
        `, [answerId]);

        if (ansCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Answer not found' });
        if (!(await isGroupMember(userId, ansCheck.rows[0].group_id))) return res.status(403).json({ success: false, message: 'Access denied' });

        const voteCheck = await db.query('SELECT vote_value FROM answer_votes WHERE answer_id=$1 AND user_id=$2', [answerId, userId]);
        if (voteCheck.rows.length > 0) {
            if (voteCheck.rows[0].vote_value === Number(vote)) {
                await db.query('DELETE FROM answer_votes WHERE answer_id=$1 AND user_id=$2', [answerId, userId]);
                return res.json({ success: true, message: 'Vote removed' });
            }
            await db.query('UPDATE answer_votes SET vote_value=$3 WHERE answer_id=$1 AND user_id=$2', [answerId, userId, vote]);
        } else {
            await db.query('INSERT INTO answer_votes (answer_id, user_id, vote_value) VALUES ($1,$2,$3)', [answerId, userId, vote]);
        }
        res.json({ success: true, message: 'Vote recorded' });
    } catch (error) {
        console.error('[COMMUNITY] Vote answer error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to record vote', data: null });
    }
});

router.post('/answers/:id/accept', async (req, res) => {
    try {
        const answerId = req.params.id;
        const userId = req.user.user_id;

        const ansCheck = await db.query(`
            SELECT qa.answer_id, q.question_id, q.user_id AS question_author, q.group_id
            FROM question_answers qa JOIN questions q ON qa.question_id=q.question_id
            WHERE qa.answer_id=$1
        `, [answerId]);

        if (ansCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Answer not found' });

        const data = ansCheck.rows[0];
        const userRole = await isGroupMember(userId, data.group_id);
        const isOwner = userRole === 'owner' || userRole === 'moderator';
        if (data.question_author !== userId && !isOwner) return res.status(403).json({ success: false, message: 'Permission denied' });

        await db.query('UPDATE question_answers SET is_accepted=FALSE WHERE question_id=$1', [data.question_id]);
        await Promise.all([
            db.query('UPDATE question_answers SET is_accepted=TRUE WHERE answer_id=$1', [answerId]),
            db.query('UPDATE questions SET is_solved=TRUE WHERE question_id=$1', [data.question_id])
        ]);
        res.json({ success: true, message: 'Answer accepted successfully' });
    } catch (error) {
        console.error('[COMMUNITY] Accept answer error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to accept answer', data: null });
    }
});

// ---------------------------------------------------------------
// EVENTS
// ---------------------------------------------------------------
router.get('/groups/:id/events', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        const result = await tq(req, `
            SELECT ge.event_id, ge.group_id, ge.title, ge.description, ge.type, ge.event_date, ge.location, ge.created_at,
                   u.full_name AS creator_name,
                   COALESCE(rc.cnt, 0) AS rsvp_going_count,
                   COALESCE(ur.status, 'none') AS user_rsvp_status
            FROM group_events ge
            JOIN users u ON ge.created_by=u.user_id
            LEFT JOIN (SELECT event_id, COUNT(*)::int AS cnt FROM event_rsvps WHERE status='going' GROUP BY event_id) rc ON ge.event_id=rc.event_id
            LEFT JOIN event_rsvps ur ON ge.event_id=ur.event_id AND ur.user_id=$2
            WHERE ge.group_id=$1 ORDER BY ge.event_date ASC
        `, [groupId, userId]);
        res.json({ success: true, events: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get group events error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch events', data: null });
    }
});

router.post('/groups/:id/events', async (req, res) => {
    try {
        const groupId = req.params.id;
        const { title, description, type, eventDate, location } = req.body;
        const userId = req.user.user_id;

        if (!title || !eventDate) return res.status(400).json({ success: false, message: 'Title and event date are required' });

        const role = await isGroupMember(userId, groupId);
        if (!role || (role !== 'owner' && role !== 'moderator')) return res.status(403).json({ success: false, message: 'Only owners or moderators can create events' });

        const eventId = uuidv4();
        await db.query(`INSERT INTO group_events (event_id, group_id, title, description, type, event_date, location, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
            [eventId, groupId, title, description || '', type || 'study_session', eventDate, location || 'Virtual', userId]);
        await db.query(`INSERT INTO activity_logs (log_id, group_id, user_id, action) VALUES ($1,$2,$3,$4)`,
            [uuidv4(), groupId, userId, `scheduled a new event: "${title}"`]);

        cache.del(`events:${userId}`);
        cache.del(`stats:${userId}`);
        res.json({ success: true, message: 'Event created successfully', eventId });
    } catch (error) {
        console.error('[COMMUNITY] Create event error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to create event', data: null });
    }
});

router.post('/events/:id/rsvp', async (req, res) => {
    try {
        const eventId = req.params.id;
        const { status } = req.body;
        const userId = req.user.user_id;

        if (!['going', 'interested', 'not_going'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid RSVP status' });

        const evCheck = await db.query('SELECT group_id FROM group_events WHERE event_id=$1', [eventId]);
        if (evCheck.rows.length === 0) return res.status(404).json({ success: false, message: 'Event not found' });
        if (!(await isGroupMember(userId, evCheck.rows[0].group_id))) return res.status(403).json({ success: false, message: 'Access denied' });

        const check = await db.query('SELECT 1 FROM event_rsvps WHERE event_id=$1 AND user_id=$2', [eventId, userId]);
        if (check.rows.length > 0) {
            await db.query('UPDATE event_rsvps SET status=$3 WHERE event_id=$1 AND user_id=$2', [eventId, userId, status]);
        } else {
            await db.query('INSERT INTO event_rsvps (event_id, user_id, status) VALUES ($1,$2,$3)', [eventId, userId, status]);
        }
        cache.del(`events:${userId}`);
        res.json({ success: true, message: 'RSVP updated successfully' });
    } catch (error) {
        console.error('[COMMUNITY] RSVP error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update RSVP', data: null });
    }
});

// ---------------------------------------------------------------
// NOTIFICATIONS
// ---------------------------------------------------------------
router.get('/notifications', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `notifs:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, notifications: hit }); }

        const result = await tq(req, `
            SELECT notification_id, type, title, content, link, is_read, created_at
            FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20
        `, [userId]);
        cache.set(cKey, result.rows, 30);
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
        await db.query('UPDATE notifications SET is_read=TRUE WHERE notification_id=$1 AND user_id=$2', [notificationId, userId]);
        cache.del(`notifs:${userId}`);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('[COMMUNITY] Read notification error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to update notification', data: null });
    }
});

// ---------------------------------------------------------------
// GLOBAL SEARCH
// ---------------------------------------------------------------
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const userId = req.user.user_id;

        if (!query || query.trim() === '') return res.json({ success: true, results: { groups: [], questions: [], files: [], events: [] } });

        const searchTerm = `%${query}%`;
        const [groups, questions, files, events] = await Promise.all([
            tq(req, `
                SELECT sg.group_id, sg.name, sg.description, sg.category, sg.icon,
                       COALESCE(mc.cnt, 0) AS member_count
                FROM study_groups sg
                LEFT JOIN (SELECT group_id, COUNT(*)::int AS cnt FROM group_members WHERE status='approved' GROUP BY group_id) mc ON sg.group_id=mc.group_id
                WHERE sg.name ILIKE $1 OR sg.description ILIKE $1 LIMIT 10
            `, [searchTerm]),
            tq(req, `
                SELECT q.question_id, q.title, q.is_solved, q.created_at,
                       u.full_name AS author_name, sg.name AS group_name
                FROM questions q
                JOIN users u ON q.user_id=u.user_id
                JOIN study_groups sg ON q.group_id=sg.group_id
                JOIN group_members gm ON q.group_id=gm.group_id AND gm.user_id=$2 AND gm.status='approved'
                WHERE q.title ILIKE $1 OR q.description ILIKE $1 LIMIT 10
            `, [searchTerm, userId]),
            tq(req, `
                SELECT gm.material_id, gm.title, gm.file_type, gm.file_path,
                       u.full_name AS uploaded_by_name, sg.name AS group_name
                FROM group_materials gm
                JOIN users u ON gm.uploaded_by=u.user_id
                JOIN study_groups sg ON gm.group_id=sg.group_id
                JOIN group_members gmem ON gm.group_id=gmem.group_id AND gmem.user_id=$2 AND gmem.status='approved'
                WHERE gm.title ILIKE $1 OR gm.description ILIKE $1 LIMIT 10
            `, [searchTerm, userId]),
            tq(req, `
                SELECT ge.event_id, ge.title, ge.event_date, ge.location, sg.name AS group_name
                FROM group_events ge
                JOIN study_groups sg ON ge.group_id=sg.group_id
                JOIN group_members gm ON ge.group_id=gm.group_id AND gm.user_id=$2 AND gm.status='approved'
                WHERE ge.title ILIKE $1 OR ge.description ILIKE $1 LIMIT 10
            `, [searchTerm, userId])
        ]);

        res.json({ success: true, results: { groups: groups.rows, questions: questions.rows, files: files.rows, events: events.rows } });
    } catch (error) {
        console.error('[COMMUNITY] Global search error:', error.message);
        res.status(500).json({ success: false, message: 'Search execution failed', data: null });
    }
});

// ---------------------------------------------------------------
// MEMBERS, PRESENCE, MEETINGS
// ---------------------------------------------------------------
router.get('/groups/:id/members', async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.user.user_id;

        if (!(await isGroupMember(userId, groupId))) return res.status(403).json({ success: false, message: 'Access denied' });

        const result = await tq(req, `
            SELECT gm.role, gm.joined_at, gm.status, u.user_id, u.full_name, u.email
            FROM group_members gm
            JOIN users u ON gm.user_id=u.user_id
            WHERE gm.group_id=$1
            ORDER BY CASE gm.role WHEN 'owner' THEN 0 WHEN 'moderator' THEN 1 ELSE 2 END, u.full_name ASC
        `, [groupId]);
        res.json({ success: true, members: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get group members error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch members', data: null });
    }
});

router.get('/presence/online', async (req, res) => {
    try {
        const cKey = 'online_users';
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, onlineUsers: hit }); }

        const result = await tq(req, `
            SELECT ps.user_id, ps.status, u.full_name
            FROM presence_status ps
            JOIN users u ON ps.user_id=u.user_id
            WHERE ps.status='online' LIMIT 10
        `);
        cache.set(cKey, result.rows, 20);
        res.json({ success: true, onlineUsers: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get online presence error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch online presence', data: null });
    }
});

router.get('/meetings/active', async (req, res) => {
    try {
        const userId = req.user.user_id;
        const cKey = `meetings:${userId}`;
        const hit = cache.get(cKey);
        if (hit) { req._cacheHit = true; return res.json({ success: true, meetings: hit }); }

        const result = await tq(req, `
            SELECT gm.meeting_id, gm.group_id, gm.title, gm.status, gm.created_at,
                   sg.name AS group_name, sg.icon AS group_icon, u.full_name AS host_name
            FROM group_meetings gm
            JOIN study_groups sg ON gm.group_id=sg.group_id
            JOIN users u ON gm.host_id=u.user_id
            JOIN group_members gmem ON gm.group_id=gmem.group_id AND gmem.user_id=$1 AND gmem.status='approved'
            WHERE gm.status='active'
            ORDER BY gm.created_at DESC
        `, [userId]);
        cache.set(cKey, result.rows, 30);
        res.json({ success: true, meetings: result.rows });
    } catch (error) {
        console.error('[COMMUNITY] Get active meetings error:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch active meetings', data: null });
    }
});

// Cache stats diagnostic endpoint (development use)
router.get('/cache-stats', (req, res) => {
    res.json({ success: true, cache: cache.stats() });
});

module.exports = router;
