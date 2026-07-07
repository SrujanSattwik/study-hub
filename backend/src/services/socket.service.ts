import { Prisma } from "@prisma/client";
import { Server, Socket } from "socket.io";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../database/client";
import { verifyAccessToken } from "./auth.service";
import { logger } from "../utils/logger";

// Store online users mapping: user_id -> Set of socket IDs (multi-tab support)
export const onlineUsers = new Map<string, Set<string>>();

// O(1) author name cache (cleared on disconnect when last tab closes)
const userNames = new Map<string, string>();

async function fetchRecentMessages(groupId: string) {
  const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT gm.message_id, gm.group_id, gm.user_id, gm.content,
           gm.parent_id, gm.created_at, u.full_name AS author_name
    FROM group_messages gm
    JOIN users u ON gm.user_id = u.user_id
    WHERE gm.group_id = ${groupId}
    ORDER BY gm.created_at ASC LIMIT 100
  `);

  return rows.map((row) => ({
    messageId: row.message_id,
    groupId: row.group_id,
    userId: row.user_id,
    authorName: row.author_name,
    content: row.content,
    parentId: row.parent_id,
    createdAt: row.created_at,
  }));
}

async function broadcastPresenceToGroups(
  io: Server,
  userId: string,
  status: string,
) {
  try {
    const [groupsResult, userNameRes] = await Promise.all([
      prisma.$queryRaw<{ group_id: string }[]>(Prisma.sql`
        SELECT group_id FROM group_members WHERE user_id = ${userId} AND status = 'approved'
      `),
      prisma.$queryRaw<{ full_name: string }[]>(Prisma.sql`
        SELECT full_name FROM users WHERE user_id = ${userId}
      `),
    ]);

    const userName = userNameRes.length > 0 ? userNameRes[0].full_name : "User";

    groupsResult.forEach((row) => {
      io.to(`group_${row.group_id}`).emit("presenceChanged", {
        userId,
        userName,
        status,
      });
    });
  } catch (err: any) {
    logger.error(`[SOCKET] Error broadcasting presence: ${err.message}`);
  }
}

export function initSocket(io: Server) {
  const ioAny = io as any;
  if (ioAny._communitySocketInitialized) return;
  ioAny._communitySocketInitialized = true;

  io.on("connection", (socket: Socket) => {
    logger.info(`🔌 WebSocket connected: ${socket.id}`);
    let currentUserId: string | null = null;

    // ── 1. Authenticate user ─────────────────────────────────────────────────

    socket.on(
      "registerUser",
      (data: { userId: string; token: string; userName?: string }) => {
        if (!data?.userId || !data?.token) {
          socket.emit("authError", { message: "Authentication required" });
          return;
        }

        // Validate JWT access token
        let decoded;
        try {
          decoded = verifyAccessToken(data.token);
        } catch {
          logger.warn(`[SOCKET] Invalid token for userId ${data.userId}`);
          socket.emit("authError", {
            message: "Invalid or expired access token",
          });
          return;
        }

        // Ensure token user_id matches claimed userId
        if (decoded.user_id !== data.userId) {
          socket.emit("authError", { message: "Token user mismatch" });
          return;
        }

        currentUserId = decoded.user_id;

        if (data.userName) {
          userNames.set(currentUserId, data.userName);
        } else if (!userNames.has(currentUserId)) {
          prisma
            .$queryRaw<{ full_name: string }[]>(
              Prisma.sql`
          SELECT full_name FROM users WHERE user_id = ${currentUserId}
        `,
            )
            .then((r) => {
              if (r.length > 0 && currentUserId)
                userNames.set(currentUserId, r[0].full_name);
            })
            .catch(() => {});
        }

        if (!onlineUsers.has(currentUserId))
          onlineUsers.set(currentUserId, new Set());
        onlineUsers.get(currentUserId)!.add(socket.id);

        logger.info(
          `👤 Socket user registered: ${currentUserId} on ${socket.id}`,
        );

        // Upsert presence to online
        prisma.$executeRaw`
        INSERT INTO presence_status (user_id, status, last_seen_at)
        VALUES (${currentUserId}, 'online', CURRENT_TIMESTAMP)
        ON CONFLICT (user_id) DO UPDATE SET status = 'online', last_seen_at = CURRENT_TIMESTAMP
      `.catch((err: any) =>
          logger.error(`[SOCKET] Presence DB error: ${err.message}`),
        );

        broadcastPresenceToGroups(io, currentUserId, "online");
      },
    );

    // ── 2. Join group room ────────────────────────────────────────────────────

    socket.on("joinGroup", (data: { groupId: string; userId: string }) => {
      if (!data?.groupId || !data?.userId) return;
      if (!currentUserId) currentUserId = data.userId;

      const roomName = `group_${data.groupId}`;
      socket.join(roomName);
      logger.info(`👥 User ${data.userId} joined room ${roomName}`);

      fetchRecentMessages(data.groupId)
        .then((messages) =>
          socket.emit("recentMessages", { groupId: data.groupId, messages }),
        )
        .catch((err: any) =>
          logger.error(`[SOCKET] Error fetching messages: ${err.message}`),
        );
    });

    // ── 3. Send group message ─────────────────────────────────────────────────

    socket.on(
      "sendGroupMessage",
      async (data: {
        groupId: string;
        userId: string;
        content: string;
        parentId?: string;
      }) => {
        if (!data?.groupId || !data?.userId || !data?.content) return;

        // Ensure sender matches authenticated user
        if (currentUserId && currentUserId !== data.userId) {
          socket.emit("chatError", { message: "User mismatch" });
          return;
        }

        const { groupId, userId, content, parentId } = data;
        const messageId = uuidv4();

        try {
          let authorName = userNames.get(userId) ?? null;

          const insertPromise = prisma.$executeRaw`
            INSERT INTO group_messages (message_id, group_id, user_id, content, parent_id)
            VALUES (${messageId}, ${groupId}, ${userId}, ${content}, ${parentId ?? null})
          `;

          if (!authorName) {
            const [, userResult] = await Promise.all([
              insertPromise,
              prisma.$queryRaw<{ full_name: string }[]>(Prisma.sql`
                SELECT full_name FROM users WHERE user_id = ${userId}
              `),
            ]);
            authorName =
              userResult.length > 0 ? userResult[0].full_name : "Anonymous";
            userNames.set(userId, authorName);
          } else {
            await insertPromise;
          }

          io.to(`group_${groupId}`).emit("newGroupMessage", {
            messageId,
            groupId,
            userId,
            authorName,
            content,
            parentId: parentId ?? null,
            createdAt: new Date().toISOString(),
          });
        } catch (err: any) {
          logger.error(`[SOCKET] Error saving message: ${err.message}`);
          socket.emit("chatError", { message: "Failed to send message" });
        }
      },
    );

    // ── 4. Typing indicator ───────────────────────────────────────────────────

    socket.on(
      "typing",
      (data: { groupId: string; userId: string; isTyping: boolean }) => {
        if (data?.groupId && data?.userId) {
          socket.to(`group_${data.groupId}`).emit("userTyping", data);
        }
      },
    );

    // ── 5. Whiteboard ────────────────────────────────────────────────────────

    socket.on("draw", (data: any) => {
      if (data?.groupId)
        socket.to(`group_${data.groupId}`).emit("drawEvent", data);
    });

    socket.on("clearWhiteboard", (data: { groupId: string }) => {
      if (data?.groupId)
        socket.to(`group_${data.groupId}`).emit("clearWhiteboardEvent");
    });

    // ── 6. Meeting events ─────────────────────────────────────────────────────

    socket.on(
      "raiseHand",
      (data: {
        groupId: string;
        userId: string;
        userName: string;
        raised: boolean;
      }) => {
        if (data?.groupId && data?.userId) {
          io.to(`group_${data.groupId}`).emit("handRaised", {
            userId: data.userId,
            userName: data.userName,
            raised: data.raised,
          });
        }
      },
    );

    socket.on("meetingSignal", (data: any) => {
      if (data?.groupId)
        socket.to(`group_${data.groupId}`).emit("meetingSignalEvent", data);
    });

    socket.on("toggleMute", (data: any) => {
      if (data?.groupId && data?.userId) {
        socket.to(`group_${data.groupId}`).emit("participantMuteToggled", data);
      }
    });

    socket.on("toggleCamera", (data: any) => {
      if (data?.groupId && data?.userId) {
        socket
          .to(`group_${data.groupId}`)
          .emit("participantCameraToggled", data);
      }
    });

    // ── 7. Disconnect ─────────────────────────────────────────────────────────

    socket.on("disconnect", () => {
      logger.info(`🔌 WebSocket disconnected: ${socket.id}`);

      if (currentUserId) {
        const userSockets = onlineUsers.get(currentUserId);
        if (userSockets) {
          userSockets.delete(socket.id);

          if (userSockets.size === 0) {
            onlineUsers.delete(currentUserId);
            userNames.delete(currentUserId);

            const uid = currentUserId;
            prisma.$executeRaw`
              UPDATE presence_status SET status = 'offline', last_seen_at = CURRENT_TIMESTAMP
              WHERE user_id = ${uid}
            `.catch((err: any) =>
              logger.error(`[SOCKET] Disconnect DB error: ${err.message}`),
            );

            broadcastPresenceToGroups(io, uid, "offline");
            logger.info(`👤 User ${uid} fully offline`);
          }
        }
      }
    });
  });
}
