import { Prisma } from "@prisma/client";
import { prisma } from "../database/client";
import { cache } from "../database/cache";
import { logger } from "../utils/logger";
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from "../utils/errors";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { broadcastGroupEvent } from "./socket.service";

export class CommunityService {
  // ─── Membership ─────────────────────────────────────────────────────────────

  async isGroupMember(userId: string, groupId: string): Promise<string | null> {
    const cacheKey = `member:${userId}:${groupId}`;
    const cached = cache.get<string | null>(cacheKey);
    if (cached !== null) return cached;

    const result = await prisma.$queryRaw<{ role: string }[]>(
      Prisma.sql`SELECT role FROM group_members
                 WHERE group_id = ${groupId} AND user_id = ${userId} AND status = 'approved'`,
    );
    const role = result.length > 0 ? result[0].role : null;
    cache.set(cacheKey, role, 30);
    return role;
  }

  invalidateMemberCache(userId: string, groupId: string) {
    cache.del(`member:${userId}:${groupId}`);
  }

  // ─── Home Bundle ─────────────────────────────────────────────────────────────

  async getHomeBundle(userId: string) {
    const cachedChallenges = cache.get("challenges");
    const challengesPromise = cachedChallenges
      ? Promise.resolve(cachedChallenges)
      : Promise.resolve([
          {
            id: 1,
            title: "Calculus Conqueror",
            description: "Solve 3 questions on the math board",
            progress: 66,
            goal: "3 questions",
            reward: "50 XP",
          },
          {
            id: 2,
            title: "Group Guru",
            description: "Join an active study meeting for 30 minutes",
            progress: 100,
            goal: "30 mins",
            reward: "100 XP",
          },
          {
            id: 3,
            title: "Librarian",
            description: "Upload a study resource to private materials",
            progress: 0,
            goal: "1 file",
            reward: "30 XP",
          },
        ]).then((data) => {
          cache.set("challenges", data, 300);
          return data;
        });

    const [
      stats,
      joinedGroups,
      exploreGroups,
      feed,
      events,
      suggestedGroups,
      activeMeetings,
      onlineUsers,
      notifications,
      challenges,
    ] = await Promise.all([
      // 1. Stats
      (async () => {
        const cKey = `stats:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;

        const [globalRes, myGroupsRes] = await Promise.all([
          prisma.$queryRaw<any[]>(Prisma.sql`
            SELECT
              (SELECT COUNT(*)::int FROM users)                                               AS active_members,
              (SELECT COUNT(*)::int FROM presence_status WHERE status = 'online')             AS online_users,
              (SELECT COUNT(*)::int FROM group_meetings  WHERE status = 'active')             AS active_meetings,
              (SELECT COUNT(*)::int FROM questions        WHERE created_at >= CURRENT_DATE)   AS questions_today,
              (SELECT COUNT(*)::int FROM questions        WHERE is_solved = TRUE)             AS questions_solved,
              (SELECT COUNT(*)::int FROM group_materials)                                     AS materials_shared,
              (SELECT COUNT(*)::int FROM group_events     WHERE event_date >= CURRENT_TIMESTAMP) AS upcoming_events
          `),
          prisma.$queryRaw<{ c: number }[]>(Prisma.sql`
            SELECT COUNT(*)::int AS c FROM group_members
            WHERE user_id = ${userId} AND status = 'approved'
          `),
        ]);

        const g = globalRes[0];
        const data = {
          activeMembers: g.active_members,
          myGroups: myGroupsRes[0].c,
          onlineUsers: g.online_users,
          activeMeetings: g.active_meetings,
          questionsAskedToday: g.questions_today,
          questionsSolved: g.questions_solved,
          materialsShared: g.materials_shared,
          upcomingEvents: g.upcoming_events,
        };
        cache.set(cKey, data, 45);
        return data;
      })(),

      // 2. Joined groups
      (async () => {
        const cKey = `joined:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT sg.group_id, sg.name, sg.description, sg.category,
                 sg.meeting_schedule, sg.cover_image, sg.icon,
                 gm.role, gm.joined_at,
                 COALESCE(mc.cnt, 0) AS member_count
          FROM study_groups sg
          JOIN group_members gm ON sg.group_id = gm.group_id
            AND gm.user_id = ${userId} AND gm.status = 'approved'
          LEFT JOIN (
            SELECT group_id, COUNT(*)::int AS cnt FROM group_members
            WHERE status = 'approved' GROUP BY group_id
          ) mc ON sg.group_id = mc.group_id
          ORDER BY gm.joined_at DESC
        `);
        cache.set(cKey, rows, 30);
        return rows;
      })(),

      // 3. Explore groups
      (async () => {
        const cKey = "explore_groups";
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT sg.group_id, sg.name, sg.description, sg.category,
                 sg.meeting_schedule, sg.cover_image, sg.icon,
                 COALESCE(mc.cnt, 0) AS member_count
          FROM study_groups sg
          LEFT JOIN (
            SELECT group_id, COUNT(*)::int AS cnt FROM group_members
            WHERE status = 'approved' GROUP BY group_id
          ) mc ON sg.group_id = mc.group_id
          ORDER BY COALESCE(mc.cnt, 0) DESC
        `);
        cache.set(cKey, rows, 30);
        return rows;
      })(),

      // 4. Feed
      (async () => {
        const cKey = `feed:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
                 cp.is_pinned, cp.created_at, u.full_name AS author_name,
                 COALESCE(pl.cnt, 0) AS likes_count,
                 COALESCE(pc.cnt, 0) AS comments_count,
                 CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked
          FROM community_posts cp
          JOIN users u ON cp.user_id = u.user_id
          LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl
            ON cp.post_id = pl.post_id
          LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc
            ON cp.post_id = pc.post_id
          LEFT JOIN post_likes ul ON cp.post_id = ul.post_id AND ul.user_id = ${userId}
          ORDER BY cp.is_pinned DESC, cp.created_at DESC
          LIMIT 20
        `);
        cache.set(cKey, rows, 20);
        return rows;
      })(),

      // 5. Events
      (async () => {
        const cKey = `events:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT ge.event_id, ge.group_id, ge.title, ge.event_date, ge.location, ge.type,
                 sg.name AS group_name, sg.icon AS group_icon,
                 COALESCE(rc.cnt, 0) AS rsvp_going_count,
                 COALESCE(ur.status, 'none') AS user_rsvp_status
          FROM group_events ge
          JOIN study_groups sg ON ge.group_id = sg.group_id
          JOIN group_members gm ON ge.group_id = gm.group_id
            AND gm.user_id = ${userId} AND gm.status = 'approved'
          LEFT JOIN (
            SELECT event_id, COUNT(*)::int AS cnt FROM event_rsvps
            WHERE status = 'going' GROUP BY event_id
          ) rc ON ge.event_id = rc.event_id
          LEFT JOIN event_rsvps ur ON ge.event_id = ur.event_id AND ur.user_id = ${userId}
          WHERE ge.event_date >= CURRENT_TIMESTAMP
          ORDER BY ge.event_date ASC
          LIMIT 5
        `);
        cache.set(cKey, rows, 45);
        return rows;
      })(),

      // 6. Suggested groups
      (async () => {
        const cKey = `suggested:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT sg.group_id, sg.name, sg.description, sg.category,
                 sg.meeting_schedule, sg.cover_image, sg.icon,
                 COALESCE(mc.cnt, 0) AS member_count
          FROM study_groups sg
          LEFT JOIN group_members my_gm
            ON sg.group_id = my_gm.group_id AND my_gm.user_id = ${userId} AND my_gm.status = 'approved'
          LEFT JOIN (
            SELECT group_id, COUNT(*)::int AS cnt FROM group_members
            WHERE status = 'approved' GROUP BY group_id
          ) mc ON sg.group_id = mc.group_id
          WHERE my_gm.group_id IS NULL
          ORDER BY COALESCE(mc.cnt, 0) DESC
          LIMIT 3
        `);
        cache.set(cKey, rows, 60);
        return rows;
      })(),

      // 7. Active meetings
      (async () => {
        const cKey = `meetings:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT gm.meeting_id, gm.group_id, gm.title, gm.status, gm.created_at,
                 sg.name AS group_name, sg.icon AS group_icon, u.full_name AS host_name
          FROM group_meetings gm
          JOIN study_groups sg ON gm.group_id = sg.group_id
          JOIN users u ON gm.host_id = u.user_id
          JOIN group_members gmem ON gm.group_id = gmem.group_id
            AND gmem.user_id = ${userId} AND gmem.status = 'approved'
          WHERE gm.status = 'active'
          ORDER BY gm.created_at DESC
        `);
        cache.set(cKey, rows, 30);
        return rows;
      })(),

      // 8. Online users
      (async () => {
        const cKey = "online_users";
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT ps.user_id, ps.status, u.full_name
          FROM presence_status ps
          JOIN users u ON ps.user_id = u.user_id
          WHERE ps.status = 'online'
          LIMIT 10
        `);
        cache.set(cKey, rows, 20);
        return rows;
      })(),

      // 9. Notifications
      (async () => {
        const cKey = `notifs:${userId}`;
        const hit = cache.get(cKey);
        if (hit) return hit;
        const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
          SELECT notification_id, type, title, content, link, is_read, created_at
          FROM notifications WHERE user_id = ${userId}
          ORDER BY created_at DESC LIMIT 20
        `);
        cache.set(cKey, rows, 30);
        return rows;
      })(),

      // 10. Challenges
      challengesPromise,
    ]);

    return {
      stats,
      joinedGroups,
      exploreGroups,
      feed,
      events,
      suggestedGroups,
      activeMeetings,
      onlineUsers,
      notifications,
      challenges,
    };
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getStats(userId: string) {
    const cKey = `stats:${userId}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const [globalRow, myGroupsRow] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT
          (SELECT COUNT(*)::int FROM users)                                               AS active_members,
          (SELECT COUNT(*)::int FROM presence_status WHERE status = 'online')             AS online_users,
          (SELECT COUNT(*)::int FROM group_meetings  WHERE status = 'active')             AS active_meetings,
          (SELECT COUNT(*)::int FROM questions        WHERE created_at >= CURRENT_DATE)   AS questions_today,
          (SELECT COUNT(*)::int FROM questions        WHERE is_solved = TRUE)             AS questions_solved,
          (SELECT COUNT(*)::int FROM group_materials)                                     AS materials_shared,
          (SELECT COUNT(*)::int FROM group_events     WHERE event_date >= CURRENT_TIMESTAMP) AS upcoming_events
      `),
      prisma.$queryRaw<{ c: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS c FROM group_members
        WHERE user_id = ${userId} AND status = 'approved'
      `),
    ]);

    const g = globalRow[0];
    const stats = {
      activeMembers: g.active_members,
      myGroups: myGroupsRow[0].c,
      onlineUsers: g.online_users,
      activeMeetings: g.active_meetings,
      questionsAskedToday: g.questions_today,
      questionsSolved: g.questions_solved,
      materialsShared: g.materials_shared,
      upcomingEvents: g.upcoming_events,
    };
    cache.set(cKey, stats, 45);
    return stats;
  }

  // ─── Trending ────────────────────────────────────────────────────────────────

  async getTrending() {
    const cKey = "trending_base";
    const hit = cache.get(cKey);
    if (hit) return hit;

    const [trendingDiscussions, popularQuestions, popularFiles] =
      await Promise.all([
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
               cp.is_pinned, cp.created_at, u.full_name AS author_name,
               COALESCE(pl.cnt, 0) AS likes_count, COALESCE(pc.cnt, 0) AS comments_count
        FROM community_posts cp
        JOIN users u ON cp.user_id = u.user_id
        LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl
          ON cp.post_id = pl.post_id
        LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc
          ON cp.post_id = pc.post_id
        ORDER BY COALESCE(pc.cnt, 0) DESC, COALESCE(pl.cnt, 0) DESC, cp.created_at DESC
        LIMIT 5
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT q.question_id, q.group_id, q.title, q.subject,
               q.is_solved, q.priority, q.views_count, q.created_at,
               u.full_name AS author_name, sg.name AS group_name,
               COALESCE(qa.cnt, 0) AS answers_count
        FROM questions q
        JOIN users u ON q.user_id = u.user_id
        JOIN study_groups sg ON q.group_id = sg.group_id
        LEFT JOIN (SELECT question_id, COUNT(*)::int AS cnt FROM question_answers GROUP BY question_id) qa
          ON q.question_id = qa.question_id
        ORDER BY q.views_count DESC, COALESCE(qa.cnt, 0) DESC, q.created_at DESC
        LIMIT 5
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT gm.material_id, gm.group_id, gm.title, gm.file_name,
               gm.file_size, gm.file_type, gm.file_path, gm.created_at,
               u.full_name AS author_name, sg.name AS group_name
        FROM group_materials gm
        JOIN users u ON gm.uploaded_by = u.user_id
        JOIN study_groups sg ON gm.group_id = sg.group_id
        ORDER BY gm.created_at DESC LIMIT 5
      `),
      ]);

    const trending = {
      discussions: trendingDiscussions,
      questions: popularQuestions,
      files: popularFiles,
    };
    cache.set(cKey, trending, 60);
    return trending;
  }

  // ─── Events ──────────────────────────────────────────────────────────────────

  async getUpcomingEvents(userId: string) {
    const cKey = `events:${userId}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT ge.event_id, ge.group_id, ge.title, ge.event_date, ge.location, ge.type,
             sg.name AS group_name, sg.icon AS group_icon,
             COALESCE(rc.cnt, 0) AS rsvp_going_count,
             COALESCE(ur.status, 'none') AS user_rsvp_status
      FROM group_events ge
      JOIN study_groups sg ON ge.group_id = sg.group_id
      JOIN group_members gm ON ge.group_id = gm.group_id
        AND gm.user_id = ${userId} AND gm.status = 'approved'
      LEFT JOIN (
        SELECT event_id, COUNT(*)::int AS cnt FROM event_rsvps
        WHERE status = 'going' GROUP BY event_id
      ) rc ON ge.event_id = rc.event_id
      LEFT JOIN event_rsvps ur ON ge.event_id = ur.event_id AND ur.user_id = ${userId}
      WHERE ge.event_date >= CURRENT_TIMESTAMP
      ORDER BY ge.event_date ASC LIMIT 5
    `);
    cache.set(cKey, rows, 45);
    return rows;
  }

  async getSuggestedGroups(userId: string) {
    const cKey = `suggested:${userId}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT sg.group_id, sg.name, sg.description, sg.category,
             sg.meeting_schedule, sg.cover_image, sg.icon,
             COALESCE(mc.cnt, 0) AS member_count
      FROM study_groups sg
      LEFT JOIN group_members my_gm
        ON sg.group_id = my_gm.group_id AND my_gm.user_id = ${userId} AND my_gm.status = 'approved'
      LEFT JOIN (
        SELECT group_id, COUNT(*)::int AS cnt FROM group_members
        WHERE status = 'approved' GROUP BY group_id
      ) mc ON sg.group_id = mc.group_id
      WHERE my_gm.group_id IS NULL
      ORDER BY COALESCE(mc.cnt, 0) DESC
      LIMIT 3
    `);
    cache.set(cKey, rows, 60);
    return rows;
  }

  async getJoinedGroups(userId: string) {
    const cKey = `joined:${userId}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT sg.group_id, sg.name, sg.description, sg.category,
             sg.meeting_schedule, sg.cover_image, sg.icon,
             gm.role, gm.joined_at, COALESCE(mc.cnt, 0) AS member_count
      FROM study_groups sg
      JOIN group_members gm ON sg.group_id = gm.group_id
        AND gm.user_id = ${userId} AND gm.status = 'approved'
      LEFT JOIN (
        SELECT group_id, COUNT(*)::int AS cnt FROM group_members
        WHERE status = 'approved' GROUP BY group_id
      ) mc ON sg.group_id = mc.group_id
      ORDER BY gm.joined_at DESC
    `);
    cache.set(cKey, rows, 30);
    return rows;
  }

  // ─── Groups ──────────────────────────────────────────────────────────────────

  /**
   * Dynamic group listing with optional category + search filters.
   * Uses Prisma.sql fragments for safe parameterized dynamic WHERE clause.
   */
  async listGroups(category?: string, search?: string, sort?: string) {
    const cKey = `explore:${category ?? "all"}:${search ?? ""}:${sort ?? "popular"}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const conditions: Prisma.Sql[] = [];
    if (category && category !== "all") {
      conditions.push(Prisma.sql`sg.category = ${category}`);
    }
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        Prisma.sql`(sg.name ILIKE ${pattern} OR sg.description ILIKE ${pattern} OR sg.category ILIKE ${pattern})`,
      );
    }

    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`
        : Prisma.empty;

    const orderByClause = sort === 'newest'
      ? Prisma.sql`ORDER BY sg.created_at DESC`
      : Prisma.sql`ORDER BY COALESCE(mc.cnt, 0) DESC`;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT sg.group_id, sg.name, sg.description, sg.category,
             sg.meeting_schedule, sg.cover_image, sg.icon,
             COALESCE(mc.cnt, 0) AS member_count
      FROM study_groups sg
      LEFT JOIN (
        SELECT group_id, COUNT(*)::int AS cnt FROM group_members
        WHERE status = 'approved' GROUP BY group_id
      ) mc ON sg.group_id = mc.group_id
      ${whereClause}
      ${orderByClause}
    `);
    cache.set(cKey, rows, 30);
    return rows;
  }

  async createGroup(
    userId: string,
    name: string,
    description: string,
    category?: string,
    meetingSchedule?: string,
    icon?: string,
  ) {
    const groupId = uuidv4();
    const coverMap: Record<string, string> = {
      mathematics:
        "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600",
      science:
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600",
      programming:
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
      languages:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
    };
    const iconMap: Record<string, string> = {
      mathematics: "fas fa-calculator",
      science: "fas fa-flask",
      programming: "fas fa-code",
      languages: "fas fa-language",
    };

    const finalCategory = category ?? "other";
    const finalIcon = icon || iconMap[finalCategory] || "fas fa-users";
    const finalCover = coverMap[finalCategory] ?? coverMap.languages;
    const schedule = meetingSchedule ?? "Not scheduled";
    const logId = uuidv4();

    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO study_groups (group_id, name, description, category, meeting_schedule, cover_image, icon, created_by)
        VALUES (${groupId}, ${name}, ${description}, ${finalCategory}, ${schedule}, ${finalCover}, ${finalIcon}, ${userId})
      `,
      prisma.$executeRaw`
        INSERT INTO group_members (group_id, user_id, role, status) VALUES (${groupId}, ${userId}, 'owner', 'approved')
      `,
      prisma.$executeRaw`
        INSERT INTO activity_logs (log_id, group_id, user_id, action)
        VALUES (${logId}, ${groupId}, ${userId}, 'created the study group')
      `,
    ]);

    cache.del(`joined:${userId}`);
    cache.del(`suggested:${userId}`);
    cache.del("explore_groups");
    cache.delByPrefix("explore:");
    this.invalidateMemberCache(userId, groupId);

    return { groupId };
  }

  async joinGroup(userId: string, groupId: string) {
    const groupCheck = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT name FROM study_groups WHERE group_id = ${groupId}`,
    );
    if (groupCheck.length === 0) throw new NotFoundError("Group not found");

    const memberCheck = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT role, status FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}`,
    );

    if (memberCheck.length > 0) {
      if (memberCheck[0].status === "banned")
        throw new ForbiddenError("You are banned from this group");
      return { message: "Already a member" };
    }

    const logId = uuidv4();
    await prisma.$transaction([
      prisma.$executeRaw`
        INSERT INTO group_members (group_id, user_id, role, status) VALUES (${groupId}, ${userId}, 'member', 'approved')
      `,
      prisma.$executeRaw`
        INSERT INTO activity_logs (log_id, group_id, user_id, action)
        VALUES (${logId}, ${groupId}, ${userId}, 'joined the group')
      `,
    ]);

    cache.del(`joined:${userId}`);
    cache.del(`suggested:${userId}`);
    cache.del(`stats:${userId}`);
    cache.del("explore_groups");
    this.invalidateMemberCache(userId, groupId);

    return { message: "Joined group successfully" };
  }

  async leaveGroup(userId: string, groupId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Not a member of this group");
    if (role === "owner")
      throw new BadRequestError(
        "Owners cannot leave. Transfer ownership or delete the group.",
      );

    await prisma.$executeRaw`DELETE FROM group_members WHERE group_id = ${groupId} AND user_id = ${userId}`;

    cache.del(`joined:${userId}`);
    cache.del(`suggested:${userId}`);
    cache.del(`stats:${userId}`);
    cache.del("explore_groups");
    this.invalidateMemberCache(userId, groupId);

    return { message: "Left group successfully" };
  }

  async getGroupWorkspace(userId: string, groupId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role)
      throw new ForbiddenError("You are not a member of this study group");

    const [groupQuery, announcements, files, meetings, activity] =
      await Promise.all([
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT sg.group_id, sg.name, sg.description, sg.category,
               sg.meeting_schedule, sg.cover_image, sg.icon, sg.created_at,
               COALESCE(mc.cnt, 0) AS member_count
        FROM study_groups sg
        LEFT JOIN (
          SELECT group_id, COUNT(*)::int AS cnt FROM group_members
          WHERE status = 'approved' GROUP BY group_id
        ) mc ON sg.group_id = mc.group_id
        WHERE sg.group_id = ${groupId}
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT ga.announcement_id, ga.title, ga.content, ga.created_at, u.full_name AS author_name
        FROM group_announcements ga
        JOIN users u ON ga.created_by = u.user_id
        WHERE ga.group_id = ${groupId} ORDER BY ga.created_at DESC LIMIT 5
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT gm.material_id, gm.title, gm.file_name, gm.file_size, gm.file_type,
               gm.file_path, gm.created_at, u.full_name AS uploaded_by_name
        FROM group_materials gm
        LEFT JOIN users u ON gm.uploaded_by = u.user_id
        WHERE gm.group_id = ${groupId} ORDER BY gm.created_at DESC LIMIT 5
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT gm.meeting_id, gm.title, gm.status, gm.created_at, u.full_name AS host_name
        FROM group_meetings gm
        JOIN users u ON gm.host_id = u.user_id
        WHERE gm.group_id = ${groupId} AND gm.status = 'active'
        ORDER BY gm.created_at DESC LIMIT 3
      `),
        prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT al.log_id, al.action, al.created_at, u.full_name AS user_name
        FROM activity_logs al
        JOIN users u ON al.user_id = u.user_id
        WHERE al.group_id = ${groupId} ORDER BY al.created_at DESC LIMIT 10
      `),
      ]);

    if (groupQuery.length === 0) throw new NotFoundError("Group not found");

    return {
      group: groupQuery[0],
      userRole: role,
      announcements,
      files,
      meetings,
      activity,
    };
  }

  // ─── Feed ────────────────────────────────────────────────────────────────────

  async getFeed(userId: string) {
    const cKey = `feed:${userId}`;
    const hit = cache.get(cKey);
    if (hit) return hit;

    const rows = await prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT cp.post_id, cp.user_id, cp.content, cp.media_path, cp.media_type,
             cp.is_pinned, cp.created_at, u.full_name AS author_name,
             COALESCE(pl.cnt, 0) AS likes_count,
             COALESCE(pc.cnt, 0) AS comments_count,
             CASE WHEN ul.user_id IS NOT NULL THEN TRUE ELSE FALSE END AS is_liked
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.user_id
      LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_likes GROUP BY post_id) pl
        ON cp.post_id = pl.post_id
      LEFT JOIN (SELECT post_id, COUNT(*)::int AS cnt FROM post_comments GROUP BY post_id) pc
        ON cp.post_id = pc.post_id
      LEFT JOIN post_likes ul ON cp.post_id = ul.post_id AND ul.user_id = ${userId}
      ORDER BY cp.is_pinned DESC, cp.created_at DESC
      LIMIT 20
    `);
    cache.set(cKey, rows, 20);
    return rows;
  }

  async createPost(
    userId: string,
    content: string,
    file?: Express.Multer.File,
  ) {
    const postId = uuidv4();
    const mediaPath = file ? `/uploads/community/posts/${file.filename}` : null;
    const mediaType = file ? file.mimetype : null;

    await prisma.$executeRaw`
      INSERT INTO community_posts (post_id, user_id, content, media_path, media_type)
      VALUES (${postId}, ${userId}, ${content}, ${mediaPath}, ${mediaType})
    `;

    cache.del(`feed:${userId}`);
    cache.del(`stats:${userId}`);
    return { postId };
  }

  async toggleLikePost(userId: string, postId: string) {
    const check = await prisma.$queryRaw<any[]>(
      Prisma.sql`SELECT 1 FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}`,
    );

    if (check.length > 0) {
      await prisma.$executeRaw`DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}`;
      cache.del(`feed:${userId}`);
      return { liked: false };
    } else {
      await prisma.$executeRaw`INSERT INTO post_likes (post_id, user_id) VALUES (${postId}, ${userId})`;
      cache.del(`feed:${userId}`);
      return { liked: true };
    }
  }

  async getComments(postId: string) {
    return prisma.$queryRaw<any[]>(Prisma.sql`
      SELECT pc.comment_id, pc.content, pc.created_at, pc.parent_id, u.full_name AS author_name
      FROM post_comments pc
      JOIN users u ON pc.user_id = u.user_id
      WHERE pc.post_id = ${postId}
      ORDER BY pc.created_at ASC
    `);
  }

  async addComment(
    userId: string,
    postId: string,
    content: string,
    parentId?: string | null,
  ) {
    const commentId = uuidv4();
    await prisma.$executeRaw`
      INSERT INTO post_comments (comment_id, post_id, user_id, content, parent_id)
      VALUES (${commentId}, ${postId}, ${userId}, ${content}, ${parentId ?? null})
    `;
    cache.del(`feed:${userId}`);
    return { commentId };
  }

  async deletePost(userId: string, postId: string) {
    const check = await prisma.$queryRaw<{ user_id: string }[]>(
      Prisma.sql`SELECT user_id FROM community_posts WHERE post_id = ${postId}`,
    );
    if (check.length === 0) throw new NotFoundError("Post not found");
    if (check[0].user_id !== userId) throw new ForbiddenError("Unauthorized");

    await prisma.$executeRaw`DELETE FROM community_posts WHERE post_id = ${postId}`;
    cache.del(`feed:${userId}`);
    return { message: "Post deleted successfully" };
  }

  // ─── Group Materials ──────────────────────────────────────────────────────────

  async getGroupMaterials(
    userId: string,
    groupId: string,
    categoryId?: string | null,
  ) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    const [folders, files] = await Promise.all([
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT * FROM material_categories
        WHERE group_id = ${groupId}
          AND (parent_id = ${categoryId ?? null} OR (parent_id IS NULL AND ${categoryId ?? null} IS NULL))
      `),
      prisma.$queryRaw<any[]>(Prisma.sql`
        SELECT gm.material_id, gm.title, gm.description, gm.file_path, gm.file_name,
               gm.file_size, gm.file_type, gm.created_at, u.full_name AS author_name
        FROM group_materials gm
        LEFT JOIN users u ON gm.uploaded_by = u.user_id
        WHERE gm.group_id = ${groupId}
          AND (gm.category_id = ${categoryId ?? null} OR (gm.category_id IS NULL AND ${categoryId ?? null} IS NULL))
      `),
    ]);

    return { folders, files };
  }

  async createGroupFolder(
    userId: string,
    groupId: string,
    name: string,
    parentId?: string | null,
  ) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    const categoryId = uuidv4();
    await prisma.$executeRaw`
      INSERT INTO material_categories (category_id, group_id, name, parent_id)
      VALUES (${categoryId}, ${groupId}, ${name}, ${parentId ?? null})
    `;
    return { folderId: categoryId };
  }

  async uploadGroupMaterial(
    userId: string,
    groupId: string,
    title: string,
    description?: string,
    categoryId?: string | null,
    tags?: string,
    file?: Express.Multer.File,
  ) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");
    if (!file) throw new BadRequestError("No file uploaded");

    const materialId = uuidv4();
    const filePath = `/uploads/community/materials/${file.filename}`;
    const fileName = file.originalname;
    const fileSize = file.size;
    const fileType = path.extname(fileName).slice(1);

    await prisma.$executeRaw`
      INSERT INTO group_materials
        (material_id, group_id, category_id, title, description, file_path, file_name, file_size, file_type, uploaded_by, tags)
      VALUES
        (${materialId}, ${groupId}, ${categoryId ?? null}, ${title}, ${description ?? ""}, ${filePath}, ${fileName}, ${fileSize}, ${fileType}, ${userId}, ${tags ?? ""})
    `;

    broadcastGroupEvent(groupId, "materialUploaded", { materialId });
    return { materialId };
  }

  async deleteGroupMaterial(userId: string, groupId: string, materialId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");

    const material = await prisma.groupMaterial.findUnique({
      where: { id: materialId }
    });

    if (!material) throw new NotFoundError("Material not found");

    if (material.uploadedBy !== userId && role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError("Unauthorized to delete this material");
    }

    await prisma.groupMaterial.delete({
      where: { id: materialId }
    });

    broadcastGroupEvent(groupId, "materialDeleted", { materialId });
  }

  async trackGroupMaterialDownload(userId: string, groupId: string, materialId: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    await prisma.groupMaterial.update({
      where: { id: materialId },
      data: {
        downloadCount: { increment: 1 }
      }
    });
  }

  async getGroupAnnouncements(userId: string, groupId: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    return prisma.groupAnnouncement.findMany({
      where: { groupId },
      orderBy: [
        { pinned: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        creator: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async createGroupAnnouncement(userId: string, groupId: string, title: string, content: string, pinned = false) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");
    if (role !== 'owner' && role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenError("Only creator/admins/moderators can post announcements");
    }

    const id = uuidv4();
    const announcement = await prisma.groupAnnouncement.create({
      data: {
        id,
        groupId,
        title,
        content,
        createdBy: userId,
        pinned
      },
      include: {
        creator: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "announcementCreated", announcement);
    return announcement;
  }

  async updateGroupAnnouncement(userId: string, groupId: string, announcementId: string, title: string, content: string, pinned = false) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");
    if (role !== 'owner' && role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenError("Only creator/admins/moderators can edit announcements");
    }

    const announcement = await prisma.groupAnnouncement.update({
      where: { id: announcementId },
      data: {
        title,
        content,
        pinned
      },
      include: {
        creator: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "announcementUpdated", announcement);
    return announcement;
  }

  async deleteGroupAnnouncement(userId: string, groupId: string, announcementId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");
    if (role !== 'owner' && role !== 'admin' && role !== 'moderator') {
      throw new ForbiddenError("Only creator/admins/moderators can delete announcements");
    }

    await prisma.groupAnnouncement.delete({
      where: { id: announcementId }
    });

    broadcastGroupEvent(groupId, "announcementDeleted", { announcementId });
  }

  async getGroupQuestions(userId: string, groupId: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    return prisma.question.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        answers: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  async createGroupQuestion(userId: string, groupId: string, title: string, description: string, subject?: string, tags?: string, attachmentUrl?: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    const id = uuidv4();
    const question = await prisma.question.create({
      data: {
        id,
        groupId,
        userId,
        title,
        description,
        subject: subject || null,
        tags: tags || null,
        attachmentUrl: attachmentUrl || null
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        answers: true
      }
    });

    broadcastGroupEvent(groupId, "questionCreated", question);
    return question;
  }

  async updateGroupQuestionStatus(userId: string, groupId: string, questionId: string, isSolved: boolean) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) throw new NotFoundError("Question not found");

    if (question.userId !== userId && role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError("Unauthorized to update this question status");
    }

    const updated = await prisma.question.update({
      where: { id: questionId },
      data: { isSolved },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        },
        answers: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true
              }
            }
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "questionUpdated", updated);
    return updated;
  }

  async deleteGroupQuestion(userId: string, groupId: string, questionId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");

    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) throw new NotFoundError("Question not found");

    if (question.userId !== userId && role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError("Unauthorized to delete this question");
    }

    await prisma.question.delete({
      where: { id: questionId }
    });

    broadcastGroupEvent(groupId, "questionDeleted", { questionId });
  }

  async createGroupAnswer(userId: string, groupId: string, questionId: string, content: string, attachmentUrl?: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    const id = uuidv4();
    const answer = await prisma.questionAnswer.create({
      data: {
        id,
        questionId,
        userId,
        content,
        attachmentUrl: attachmentUrl || null
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "answerCreated", { questionId, answer });
    return answer;
  }

  async deleteGroupAnswer(userId: string, groupId: string, answerId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");

    const answer = await prisma.questionAnswer.findUnique({
      where: { id: answerId }
    });

    if (!answer) throw new NotFoundError("Answer not found");

    if (answer.userId !== userId && role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError("Unauthorized to delete this answer");
    }

    await prisma.questionAnswer.delete({
      where: { id: answerId }
    });

    broadcastGroupEvent(groupId, "answerDeleted", { questionId: answer.questionId, answerId });
  }

  async getGroupMeetings(userId: string, groupId: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    return prisma.groupMeeting.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        host: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });
  }

  async createGroupMeeting(userId: string, groupId: string, title: string) {
    if (!(await this.isGroupMember(userId, groupId)))
      throw new ForbiddenError("Access denied");

    // Close any previous active meetings hosted by this user in this group
    await prisma.groupMeeting.updateMany({
      where: { groupId, hostId: userId, status: 'active' },
      data: { status: 'ended', endedAt: new Date() }
    });

    const id = uuidv4();
    const meeting = await prisma.groupMeeting.create({
      data: {
        id,
        groupId,
        title,
        hostId: userId,
        status: 'active'
      },
      include: {
        host: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "meetingStarted", meeting);
    return meeting;
  }

  async endGroupMeeting(userId: string, groupId: string, meetingId: string) {
    const role = await this.isGroupMember(userId, groupId);
    if (!role) throw new ForbiddenError("Access denied");

    const meeting = await prisma.groupMeeting.findUnique({
      where: { id: meetingId }
    });

    if (!meeting) throw new NotFoundError("Meeting not found");

    if (meeting.hostId !== userId && role !== 'owner' && role !== 'admin') {
      throw new ForbiddenError("Only host or group admin can end this meeting");
    }

    const updated = await prisma.groupMeeting.update({
      where: { id: meetingId },
      data: {
        status: 'ended',
        endedAt: new Date()
      },
      include: {
        host: {
          select: {
            fullName: true,
            email: true
          }
        }
      }
    });

    broadcastGroupEvent(groupId, "meetingEnded", updated);
    return updated;
  }
}

export const communityService = new CommunityService();
