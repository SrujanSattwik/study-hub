const { v4: uuidv4 } = require('uuid');
const db = require('./postgres');

// Store online users mapping: user_id -> Set of socket IDs (multi-tab support)
const onlineUsers = new Map();

// O(1) author name lookup — populated at registerUser, avoids DB query on every chat message
const userNames = new Map(); // user_id -> full_name

// Import active sessions so we can validate socket auth
let activeSessions;
try {
  activeSessions = require('./sessions');
} catch (e) {
  console.warn('[SOCKET] Could not load sessions module for socket auth:', e.message);
  activeSessions = new Map();
}

function initSocket(io) {
  // Guard: prevent registering the connection listener more than once
  if (io._communitySocketInitialized) return;
  io._communitySocketInitialized = true;

  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);
    let currentUserId = null;
    let currentGroupId = null;

    // 1. Authenticate and register user
    socket.on('registerUser', (data) => {
      if (!data || !data.userId || !data.token) {
        console.warn(`[SOCKET] registerUser rejected: missing userId or token (socket ${socket.id})`);
        socket.emit('authError', { message: 'Authentication required' });
        return;
      }

      // Validate session token
      const sessionUser = activeSessions.get(data.token);
      if (!sessionUser || sessionUser.user_id !== data.userId) {
        console.warn(`[SOCKET] registerUser rejected: invalid token for userId ${data.userId}`);
        socket.emit('authError', { message: 'Invalid session token' });
        return;
      }

      currentUserId = data.userId;

      // Cache name for O(1) lookup in sendGroupMessage
      if (data.userName) {
        userNames.set(currentUserId, data.userName);
      } else if (!userNames.has(currentUserId)) {
        // Fetch once and cache — only on first connection
        db.query('SELECT full_name FROM users WHERE user_id = $1', [currentUserId])
          .then(r => { if (r.rows.length > 0) userNames.set(currentUserId, r.rows[0].full_name); })
          .catch(() => {});
      }

      // Multi-tab: store Set of socket IDs per user
      if (!onlineUsers.has(currentUserId)) {
        onlineUsers.set(currentUserId, new Set());
      }
      onlineUsers.get(currentUserId).add(socket.id);

      console.log(`👤 User registered: ${currentUserId} on socket ${socket.id} (${onlineUsers.get(currentUserId).size} tab(s))`);

      // Set presence status to online
      db.query(
        `INSERT INTO presence_status (user_id, status, last_seen_at)
         VALUES ($1, 'online', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id) DO UPDATE SET status = 'online', last_seen_at = CURRENT_TIMESTAMP`,
        [currentUserId]
      ).catch(err => console.error('[SOCKET] Presence DB error:', err.message));

      // Broadcast online status to all user's groups
      broadcastPresenceToGroups(io, currentUserId, 'online');
    });

    // 2. Join a study group room
    socket.on('joinGroup', (data) => {
      if (data && data.groupId && data.userId) {
        const { groupId, userId } = data;
        currentGroupId = groupId;
        // Allow re-registering currentUserId in case registerUser was called after joinGroup
        if (!currentUserId) currentUserId = userId;

        const roomName = `group_${groupId}`;
        socket.join(roomName);
        console.log(`👥 User ${userId} joined room ${roomName}`);

        // Fetch recent messages and send to client
        fetchRecentMessages(groupId)
          .then(messages => {
            socket.emit('recentMessages', { groupId, messages });
          })
          .catch(err => console.error('[SOCKET] Error fetching recent messages:', err.message));
      }
    });

    // 3. Send message in group chat
    socket.on('sendGroupMessage', async (data) => {
      if (!data || !data.groupId || !data.userId || !data.content) return;

      const { groupId, userId, content, parentId } = data;
      const messageId = uuidv4();

      try {
        // B9 FIX: Use O(1) local name cache — zero DB queries on the hot path.
        // Falls back to DB only if name not yet cached (first message race, edge case).
        let authorName = userNames.get(userId) || null;

        const insertPromise = db.query(
          `INSERT INTO group_messages (message_id, group_id, user_id, content, parent_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [messageId, groupId, userId, content, parentId || null]
        );

        if (!authorName) {
          // Cache miss — parallel insert + name fetch (rare path)
          const [, userResult] = await Promise.all([
            insertPromise,
            db.query('SELECT full_name FROM users WHERE user_id = $1', [userId])
          ]);
          authorName = userResult.rows.length > 0 ? userResult.rows[0].full_name : 'Anonymous';
          userNames.set(userId, authorName);
        } else {
          await insertPromise;
        }

        // Broadcast to room
        const messageObj = {
          messageId,
          groupId,
          userId,
          authorName,
          content,
          parentId: parentId || null,
          createdAt: new Date().toISOString()
        };

        io.to(`group_${groupId}`).emit('newGroupMessage', messageObj);

        // NOTE: Activity log for every message was removed — too noisy.
        // Only significant actions (join, upload, Q&A) get logged.

      } catch (err) {
        console.error('[SOCKET] Error saving group message:', err.message);
        socket.emit('chatError', { message: 'Failed to send message' });
      }
    });

    // 4. Typing indicator
    socket.on('typing', (data) => {
      if (data && data.groupId && data.userId) {
        socket.to(`group_${data.groupId}`).emit('userTyping', {
          groupId: data.groupId,
          userId: data.userId,
          isTyping: data.isTyping
        });
      }
    });

    // 5. Whiteboard Sync
    socket.on('draw', (data) => {
      if (data && data.groupId) {
        socket.to(`group_${data.groupId}`).emit('drawEvent', data);
      }
    });

    socket.on('clearWhiteboard', (data) => {
      if (data && data.groupId) {
        socket.to(`group_${data.groupId}`).emit('clearWhiteboardEvent');
      }
    });

    // 6. Live Meetings Events
    socket.on('raiseHand', (data) => {
      if (data && data.groupId && data.userId) {
        io.to(`group_${data.groupId}`).emit('handRaised', {
          userId: data.userId,
          userName: data.userName,
          raised: data.raised
        });
      }
    });

    socket.on('meetingSignal', (data) => {
      if (data && data.groupId) {
        socket.to(`group_${data.groupId}`).emit('meetingSignalEvent', data);
      }
    });

    socket.on('toggleMute', (data) => {
      if (data && data.groupId && data.userId) {
        socket.to(`group_${data.groupId}`).emit('participantMuteToggled', data);
      }
    });

    socket.on('toggleCamera', (data) => {
      if (data && data.groupId && data.userId) {
        socket.to(`group_${data.groupId}`).emit('participantCameraToggled', data);
      }
    });

    // 7. Disconnection — handle multi-tab correctly
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      if (currentUserId) {
        const userSockets = onlineUsers.get(currentUserId);
        if (userSockets) {
          userSockets.delete(socket.id);

          // Only go offline if ALL tabs are closed
          if (userSockets.size === 0) {
            onlineUsers.delete(currentUserId);
            userNames.delete(currentUserId); // free name cache entry

            // Update presence to offline
            db.query(
              `UPDATE presence_status
               SET status = 'offline', last_seen_at = CURRENT_TIMESTAMP
               WHERE user_id = $1`,
              [currentUserId]
            ).catch(err => console.error('[SOCKET] Presence disconnect error:', err.message));

            broadcastPresenceToGroups(io, currentUserId, 'offline');
            console.log(`👤 User ${currentUserId} is fully offline (all tabs closed)`);
          } else {
            console.log(`👤 User ${currentUserId} still has ${userSockets.size} tab(s) open`);
          }
        }
      }
    });
  });
}

// Fetch messages helper
async function fetchRecentMessages(groupId) {
  const result = await db.query(
    `SELECT gm.message_id, gm.group_id, gm.user_id, gm.content, gm.parent_id, gm.created_at, u.full_name as author_name
     FROM group_messages gm
     JOIN users u ON gm.user_id = u.user_id
     WHERE gm.group_id = $1
     ORDER BY gm.created_at ASC LIMIT 100`,
    [groupId]
  );

  return result.rows.map(row => ({
    messageId: row.message_id,
    groupId: row.group_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    parentId: row.parent_id,
    createdAt: row.created_at
  }));
}

// Broadcast user presence to all joined groups — parallelized
async function broadcastPresenceToGroups(io, userId, status) {
  try {
    // Run both queries in parallel
    const [groupsResult, userNameRes] = await Promise.all([
      db.query(
        `SELECT group_id FROM group_members WHERE user_id = $1 AND status = 'approved'`,
        [userId]
      ),
      db.query('SELECT full_name FROM users WHERE user_id = $1', [userId])
    ]);

    const userName = userNameRes.rows.length > 0 ? userNameRes.rows[0].full_name : 'User';

    groupsResult.rows.forEach(row => {
      io.to(`group_${row.group_id}`).emit('presenceChanged', {
        userId,
        userName,
        status
      });
    });
  } catch (err) {
    console.error('[SOCKET] Error broadcasting presence:', err.message);
  }
}

module.exports = {
  initSocket,
  onlineUsers
};
