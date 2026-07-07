# StudyClub — Database Guide

## Overview

- **Database**: PostgreSQL 16
- **ORM**: Prisma 5
- **Schema location**: `prisma/schema.prisma` (repo root)
- **Client output**: `backend/node_modules/.prisma/client`
- **Models**: 32 tables

---

## Migration Workflow

### Development

```bash
# Create and apply a new migration
cd backend && npm run prisma:migrate
# Equivalent to: prisma migrate dev --schema ../prisma/schema.prisma

# After schema changes, regenerate the Prisma client
cd backend && npm run prisma:generate
```

### Production / CI

```bash
# Apply pending migrations safely (no schema changes, no data loss)
cd backend && npm run prisma:deploy
# Equivalent to: prisma migrate deploy --schema ../prisma/schema.prisma
```

> [!IMPORTANT]
> Never run `prisma migrate dev` in production — it can drop and recreate tables.
> Always use `prisma migrate deploy` in production environments.

---

## Seeding

```bash
# From repo root — seeds 4 users, 4 groups, materials, messages, activity logs
npx prisma db seed

# Test credentials (password: StudyHub@2026)
# alice@studyhub.dev  → admin
# bob@studyhub.dev    → student
# carol@studyhub.dev  → student
# david@studyhub.dev  → student
```

---

## Schema Domains

### Auth & Users
```prisma
User              — core user record (id, email, passwordHash, role)
RefreshToken      — active refresh token sessions
```

### Study Groups
```prisma
StudyGroup        — group metadata (name, category, coverImage, createdBy)
GroupMember       — membership with role (owner/admin/member) and status
GroupAnnouncement — pinned group notices
```

### Real-time Chat
```prisma
GroupMessage      — chat messages (supports thread replies via parentId)
MessageReaction   — emoji reactions (messageId + userId + reaction)
MessageAttachment — file attachments on messages
```

### Community Feed
```prisma
CommunityPost     — public posts with optional media
PostLike          — post likes (postId + userId composite PK)
PostComment       — threaded comments with parentId for replies
```

### Q&A
```prisma
Question          — group questions (title, tags, priority, isSolved)
QuestionAnswer    — answers with isAccepted flag
AnswerVote        — upvote/downvote tracking
AnswerAttachment  — file attachments on answers
```

### Materials
```prisma
Material          — public study materials (type, format, subject, difficulty)
GroupMaterial     — group-specific materials with category
MaterialCategory  — hierarchical categories (parentId for nested)
GroupMaterialLike — material likes
GroupMaterialComment — material comments
MaterialDownload  — download tracking
```

### Events & Scheduling
```prisma
StudyEvent        — scheduled sessions (startTime, endTime, location)
EventRsvp         — RSVP tracking (going/maybe/declined)
SyllabusItem      — personal study schedule entries
```

### Tracking & Notifications
```prisma
ActivityLog       — group activity audit trail
Notification      — per-user notifications (type, title, isRead)
UserBookmark      — saved items (itemType + itemId polymorphic)
Report            — content moderation reports
Invitation        — group join invitations (pending/accepted/declined)
```

### Meetings
```prisma
GroupMeeting      — video meeting sessions
MeetingParticipant — join/leave tracking per meeting
MeetingRecording  — recording metadata
```

---

## Backup & Restore

### Manual Backup

```bash
# Dump entire database to compressed file
pg_dump \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=study_club \
  --format=custom \
  --compress=9 \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"

# With password prompt suppressed (use PGPASSWORD env var)
PGPASSWORD=yourpassword pg_dump -h localhost -U postgres -d study_club -Fc -Z9 -f backup.dump
```

### Restore from Backup

```bash
# Restore to a clean database (database must exist)
pg_restore \
  --host=localhost \
  --port=5432 \
  --username=postgres \
  --dbname=study_club \
  --clean \
  --if-exists \
  backup.dump

# Or with PGPASSWORD
PGPASSWORD=yourpassword pg_restore -h localhost -U postgres -d study_club --clean backup.dump
```

### Docker Compose Backup

```bash
# Backup from running Docker container
docker compose exec postgres pg_dump \
  -U postgres study_club \
  -Fc -Z9 > "backup_$(date +%Y%m%d_%H%M%S).dump"

# Restore into running container
docker compose exec -T postgres pg_restore \
  -U postgres -d study_club --clean < backup.dump
```

### Automated Daily Backup (cron)

```bash
# Add to crontab: crontab -e
0 2 * * * PGPASSWORD=yourpassword pg_dump -h localhost -U postgres -d study_club -Fc -Z9 \
  -f /backups/studyclub_$(date +\%Y\%m\%d).dump \
  && find /backups -name "*.dump" -mtime +30 -delete
```
> This backs up at 2:00 AM daily and deletes dumps older than 30 days.

---

## Useful Prisma Studio

```bash
# Visual database browser (development only)
cd backend && npm run prisma:studio
# Opens at http://localhost:5555
```

---

## Connection Pooling

For production deployments with multiple instances, consider:
- **PgBouncer** — connection pooler for PostgreSQL
- **Prisma Accelerate** — managed connection pooling from Prisma
- Set `connection_limit` in `DATABASE_URL`: `?connection_limit=5`
