/**
 * Prisma Seed Script
 *
 * Populates the database with realistic test data for development.
 * Run via: npx prisma db seed
 *
 * Safe to run multiple times — checks for existing records before inserting.
 */

import dotenv from "dotenv";
import path from "path";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { PrismaClient } from "@prisma/client";

// Support loading env vars from both backend folder and root directory
dotenv.config({ path: path.join(__dirname, "../backend/.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

// ─── Seed Data Constants ─────────────────────────────────────────────────────

const SEED_USERS = [
  {
    fullName: "Alice Chen",
    email: "alice@studyhub.dev",
    role: "admin" as const,
  },
  {
    fullName: "Bob Kumar",
    email: "bob@studyhub.dev",
    role: "student" as const,
  },
  {
    fullName: "Carol Mendez",
    email: "carol@studyhub.dev",
    role: "student" as const,
  },
  {
    fullName: "David Osei",
    email: "david@studyhub.dev",
    role: "student" as const,
  },
];

const SEED_GROUPS = [
  {
    name: "Calculus Masters",
    description: "Tackling limits, derivatives, and integrals together",
    category: "mathematics",
    schedule: "Mondays & Wednesdays 7pm",
  },
  {
    name: "Python Coders",
    description: "From beginner to pro — all things Python",
    category: "programming",
    schedule: "Saturdays 10am",
  },
  {
    name: "Organic Chemistry",
    description: "Making sense of reactions, bonds, and mechanisms",
    category: "science",
    schedule: "Tuesdays 5pm",
  },
  {
    name: "Mandarin Beginners",
    description: "Learning Mandarin from scratch, HSK 1-2 level",
    category: "languages",
    schedule: "Fridays 6pm",
  },
];

const SEED_MATERIALS = [
  {
    title: "Calculus Cheat Sheet",
    description: "All key formulas for Calc 1 & 2",
    type: "notes",
    subject: "Mathematics",
    difficulty: "intermediate",
  },
  {
    title: "Python OOP Guide",
    description: "Object-oriented programming in Python explained clearly",
    type: "textbook",
    subject: "Computer Science",
    difficulty: "beginner",
  },
  {
    title: "Organic Mechanisms PDF",
    description: "Complete mechanism drawings for Orgo I",
    type: "notes",
    subject: "Chemistry",
    difficulty: "advanced",
  },
];

// ─── Main Seed Function ──────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Starting database seed...\n");

  // ── 1. Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("StudyHub@2026", 12);
  const userIds: Record<string, string> = {};

  for (const u of SEED_USERS) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
    });
    if (existing) {
      console.log(`  ⏩ User already exists: ${u.email}`);
      userIds[u.email] = existing.id;
      continue;
    }
    const id = uuidv4();
    await prisma.user.create({
      data: {
        id,
        fullName: u.fullName,
        email: u.email,
        passwordHash,
        role: u.role,
      },
    });
    userIds[u.email] = id;
    console.log(`  ✅ Created user: ${u.fullName} (${u.email})`);
  }

  const adminId = userIds["alice@studyhub.dev"];
  const bobId = userIds["bob@studyhub.dev"];
  const carolId = userIds["carol@studyhub.dev"];
  const davidId = userIds["david@studyhub.dev"];

  // ── 2. Study Groups ────────────────────────────────────────────────────────
  const coverMap: Record<string, string> = {
    mathematics: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&q=80&w=600",
    science: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=600",
    programming: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=600",
    languages: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
  };
  const iconMap: Record<string, string> = {
    mathematics: "fas fa-calculator",
    science: "fas fa-flask",
    programming: "fas fa-code",
    languages: "fas fa-language",
  };

  const groupIds: string[] = [];

  for (const g of SEED_GROUPS) {
    const existing = await prisma.studyGroup.findFirst({
      where: { name: g.name },
    });
    if (existing) {
      console.log(`  ⏩ Group already exists: ${g.name}`);
      groupIds.push(existing.id);
      continue;
    }

    const groupId = uuidv4();
    await prisma.studyGroup.create({
      data: {
        id: groupId,
        name: g.name,
        description: g.description,
        category: g.category,
        meetingSchedule: g.schedule,
        coverImage: coverMap[g.category] ?? coverMap.languages,
        icon: iconMap[g.category] ?? "fas fa-users",
        createdBy: adminId,
      },
    });
    groupIds.push(groupId);

    // Add alice as owner
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId: adminId } },
      create: { groupId, userId: adminId, role: "owner", status: "approved" },
      update: {},
    });

    console.log(`  ✅ Created group: ${g.name}`);
  }

  // ── 3. Memberships ──────────────────────────────────────────────────────────
  const memberships = [
    { groupId: groupIds[0], userId: bobId },
    { groupId: groupIds[0], userId: carolId },
    { groupId: groupIds[1], userId: bobId },
    { groupId: groupIds[1], userId: davidId },
    { groupId: groupIds[2], userId: carolId },
    { groupId: groupIds[3], userId: davidId },
  ];

  for (const m of memberships) {
    if (!m.groupId) continue;
    await prisma.groupMember.upsert({
      where: { groupId_userId: { groupId: m.groupId, userId: m.userId } },
      create: {
        groupId: m.groupId,
        userId: m.userId,
        role: "member",
        status: "approved",
      },
      update: {},
    });
  }
  console.log(`  ✅ Group memberships created`);

  // ── 4. Materials ───────────────────────────────────────────────────────────
  for (const m of SEED_MATERIALS) {
    const existing = await prisma.material.findFirst({
      where: { title: m.title },
    });
    if (existing) {
      console.log(`  ⏩ Material already exists: ${m.title}`);
      continue;
    }
    await prisma.material.create({
      data: {
        id: uuidv4(),
        title: m.title,
        description: m.description,
        type: m.type,
        format: "pdf",
        author: "Alice Chen",
        userId: adminId,
        subject: m.subject,
        difficulty: m.difficulty,
        downloadCount: Math.floor(Math.random() * 50),
      },
    });
    console.log(`  ✅ Created material: ${m.title}`);
  }

  // ── 5. Community Posts ──────────────────────────────────────────────────────
  const postContents = [
    "Just finished the calculus problem set — happy to share my notes if anyone needs them! 📚",
    "Who else is preparing for the organic chemistry midterm? Let's create a study group chat 🧪",
    'Found an amazing Python tutorial on YouTube — search "Corey Schafer OOP" — highly recommend!',
  ];
  const postUsers = [adminId, bobId, carolId];

  for (let i = 0; i < postContents.length; i++) {
    const existing = await prisma.communityPost.findFirst({
      where: { content: postContents[i] },
    });
    if (existing) continue;
    await prisma.communityPost.create({
      data: {
        id: uuidv4(),
        userId: postUsers[i],
        content: postContents[i],
      },
    });
  }
  console.log(`  ✅ Community posts created`);

  // ── 6. Group Announcements ──────────────────────────────────────────────────
  if (groupIds[0]) {
    const annExists = await prisma.groupAnnouncement.findFirst({
      where: { groupId: groupIds[0] },
    });
    if (!annExists) {
      await prisma.groupAnnouncement.create({
        data: {
          id: uuidv4(),
          groupId: groupIds[0],
          title: "Welcome to Calculus Masters!",
          content: "This group is for students tackling Calculus I & II. Share resources, ask questions, and support each other. Weekly problem sessions every Monday 7pm.",
          createdBy: adminId,
        },
      });
      console.log(`  ✅ Announcement created for Calculus Masters`);
    }
  }

  // ── 7. Notifications ────────────────────────────────────────────────────────
  const notifications = [
    {
      userId: bobId,
      type: "join",
      title: "Welcome to StudyHub!",
      content: "Your account is set up and ready. Explore study groups and connect with peers.",
    },
    {
      userId: carolId,
      type: "event",
      title: "Upcoming Study Session",
      content: "Organic Chemistry group has a session tomorrow at 5pm.",
    },
  ];

  for (const n of notifications) {
    const exists = await prisma.notification.findFirst({
      where: { userId: n.userId, title: n.title },
    });
    if (!exists) {
      await prisma.notification.create({
        data: { id: uuidv4(), ...n },
      });
    }
  }
  console.log(`  ✅ Notifications created`);

  // ── 8. Group Messages (Extended) ────────────────────────────────────────────
  if (groupIds[0]) {
    const msgExists = await prisma.groupMessage.findFirst({
      where: { groupId: groupIds[0] },
    });
    if (!msgExists) {
      const messages = [
        { userId: bobId, content: "Hey guys! Does anyone know how to solve the limits worksheet?" },
        { userId: carolId, content: "Yes! Use L'Hopital's rule on question 3, it simplifies it quickly." },
        { userId: adminId, content: "Welcome everyone! I'll pin the midterm syllabus here shortly." },
      ];

      for (const m of messages) {
        await prisma.groupMessage.create({
          data: {
            id: uuidv4(),
            groupId: groupIds[0],
            userId: m.userId,
            content: m.content,
            isPinned: false,
          },
        });
      }
      console.log(`  ✅ Group messages created for Calculus Masters`);
    }
  }

  // ── 9. Activity Logs (Extended) ─────────────────────────────────────────────
  if (groupIds[0]) {
    const logExists = await prisma.activityLog.findFirst({
      where: { groupId: groupIds[0] },
    });
    if (!logExists) {
      const logs = [
        { userId: adminId, action: "created the study group" },
        { userId: bobId, action: "joined the study group" },
        { userId: carolId, action: "joined the study group" },
      ];

      for (const l of logs) {
        await prisma.activityLog.create({
          data: {
            id: uuidv4(),
            groupId: groupIds[0],
            userId: l.userId,
            action: l.action,
          },
        });
      }
      console.log(`  ✅ Activity logs created for Calculus Masters`);
    }
  }

  console.log("\n🎉 Seed complete!\n");
  console.log("Test accounts (password: StudyHub@2026):");
  for (const u of SEED_USERS) {
    console.log(`  ${u.role.padEnd(8)} → ${u.email}`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
