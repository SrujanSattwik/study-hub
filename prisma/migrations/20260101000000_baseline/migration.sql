-- CreateEnum
CREATE TYPE "Role" AS ENUM ('student', 'admin', 'owner');

-- CreateEnum
CREATE TYPE "rsvp_status" AS ENUM ('going', 'maybe', 'declined', 'none');

-- CreateTable
CREATE TABLE "users" (
    "user_id" VARCHAR(36) NOT NULL,
    "full_name" VARCHAR(100),
    "email" VARCHAR(150) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50),
    "format" VARCHAR(50),
    "file_path" VARCHAR(500),
    "link" VARCHAR(500),
    "thumbnail" VARCHAR(500),
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "author" VARCHAR(150) NOT NULL DEFAULT 'Anonymous',
    "user_id" VARCHAR(36),
    "subject" VARCHAR(100),
    "difficulty" VARCHAR(50),

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "study_groups" (
    "group_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "meeting_schedule" VARCHAR(255),
    "cover_image" VARCHAR(500),
    "icon" VARCHAR(100) NOT NULL DEFAULT 'fas fa-users',
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "study_groups_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "group_members" (
    "group_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'approved',

    CONSTRAINT "group_members_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateTable
CREATE TABLE "group_announcements" (
    "announcement_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_announcements_pkey" PRIMARY KEY ("announcement_id")
);

-- CreateTable
CREATE TABLE "group_events" (
    "event_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(50),
    "event_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "location" VARCHAR(255) NOT NULL DEFAULT 'Virtual',
    "created_by" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "event_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "status" "rsvp_status" NOT NULL DEFAULT 'none',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("event_id","user_id")
);

-- CreateTable
CREATE TABLE "group_meetings" (
    "meeting_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "host_id" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "is_waiting_room_enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "group_meetings_pkey" PRIMARY KEY ("meeting_id")
);

-- CreateTable
CREATE TABLE "meeting_participants" (
    "meeting_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_camera_on" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "meeting_participants_pkey" PRIMARY KEY ("meeting_id","user_id")
);

-- CreateTable
CREATE TABLE "group_messages" (
    "message_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "content" TEXT,
    "parent_id" VARCHAR(36),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "group_messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "message_reactions" (
    "message_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "reaction" VARCHAR(50) NOT NULL,

    CONSTRAINT "message_reactions_pkey" PRIMARY KEY ("message_id","user_id","reaction")
);

-- CreateTable
CREATE TABLE "message_attachments" (
    "attachment_id" VARCHAR(36) NOT NULL,
    "message_id" VARCHAR(36) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "post_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "media_path" VARCHAR(500),
    "media_type" VARCHAR(50),
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("post_id")
);

-- CreateTable
CREATE TABLE "post_likes" (
    "post_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id","user_id")
);

-- CreateTable
CREATE TABLE "post_comments" (
    "comment_id" VARCHAR(36) NOT NULL,
    "post_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "parent_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "questions" (
    "question_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "subject" VARCHAR(100),
    "tags" TEXT,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,
    "priority" VARCHAR(20) NOT NULL DEFAULT 'medium',
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("question_id")
);

-- CreateTable
CREATE TABLE "question_answers" (
    "answer_id" VARCHAR(36) NOT NULL,
    "question_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "is_accepted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_answers_pkey" PRIMARY KEY ("answer_id")
);

-- CreateTable
CREATE TABLE "answer_votes" (
    "answer_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "vote_value" INTEGER NOT NULL,

    CONSTRAINT "answer_votes_pkey" PRIMARY KEY ("answer_id","user_id")
);

-- CreateTable
CREATE TABLE "answer_attachments" (
    "attachment_id" VARCHAR(36) NOT NULL,
    "answer_id" VARCHAR(36) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_type" VARCHAR(100) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "answer_attachments_pkey" PRIMARY KEY ("attachment_id")
);

-- CreateTable
CREATE TABLE "material_categories" (
    "category_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "parent_id" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "group_materials" (
    "material_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "category_id" VARCHAR(36),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "file_path" VARCHAR(500),
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "file_type" VARCHAR(100),
    "uploaded_by" VARCHAR(36),
    "tags" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_materials_pkey" PRIMARY KEY ("material_id")
);

-- CreateTable
CREATE TABLE "group_material_likes" (
    "material_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,

    CONSTRAINT "group_material_likes_pkey" PRIMARY KEY ("material_id","user_id")
);

-- CreateTable
CREATE TABLE "group_material_comments" (
    "comment_id" VARCHAR(36) NOT NULL,
    "material_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_material_comments_pkey" PRIMARY KEY ("comment_id")
);

-- CreateTable
CREATE TABLE "material_downloads" (
    "download_id" VARCHAR(36) NOT NULL,
    "material_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "material_downloads_pkey" PRIMARY KEY ("download_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "type" VARCHAR(50),
    "title" VARCHAR(255),
    "content" TEXT,
    "link" VARCHAR(500),
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "log_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("log_id")
);

-- CreateTable
CREATE TABLE "user_bookmarks" (
    "bookmark_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "item_type" VARCHAR(50),
    "item_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_bookmarks_pkey" PRIMARY KEY ("bookmark_id")
);

-- CreateTable
CREATE TABLE "reports" (
    "report_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "item_type" VARCHAR(50),
    "item_id" VARCHAR(36) NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("report_id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "invitation_id" VARCHAR(36) NOT NULL,
    "group_id" VARCHAR(36) NOT NULL,
    "sender_id" VARCHAR(36) NOT NULL,
    "receiver_id" VARCHAR(36) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'member',
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("invitation_id")
);

-- CreateTable
CREATE TABLE "meeting_recordings" (
    "recording_id" VARCHAR(36) NOT NULL,
    "meeting_id" VARCHAR(36) NOT NULL,
    "file_path" VARCHAR(500),
    "duration_seconds" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_recordings_pkey" PRIMARY KEY ("recording_id")
);

-- CreateTable
CREATE TABLE "presence_status" (
    "user_id" VARCHAR(36) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'offline',
    "last_seen_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "presence_status_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "typing_status" (
    "group_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "is_typing" BOOLEAN NOT NULL DEFAULT false,
    "last_typed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "typing_status_pkey" PRIMARY KEY ("group_id","user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "group_members_user_id_idx" ON "group_members"("user_id");

-- CreateIndex
CREATE INDEX "group_members_user_id_status_idx" ON "group_members"("user_id", "status");

-- CreateIndex
CREATE INDEX "group_members_group_id_idx" ON "group_members"("group_id");

-- CreateIndex
CREATE INDEX "group_events_group_id_idx" ON "group_events"("group_id");

-- CreateIndex
CREATE INDEX "group_events_event_date_idx" ON "group_events"("event_date");

-- CreateIndex
CREATE INDEX "event_rsvps_event_id_idx" ON "event_rsvps"("event_id");

-- CreateIndex
CREATE INDEX "group_messages_group_id_idx" ON "group_messages"("group_id");

-- CreateIndex
CREATE INDEX "group_messages_created_at_idx" ON "group_messages"("created_at");

-- CreateIndex
CREATE INDEX "community_posts_created_at_idx" ON "community_posts"("created_at");

-- CreateIndex
CREATE INDEX "community_posts_user_id_idx" ON "community_posts"("user_id");

-- CreateIndex
CREATE INDEX "post_likes_post_id_idx" ON "post_likes"("post_id");

-- CreateIndex
CREATE INDEX "post_comments_post_id_idx" ON "post_comments"("post_id");

-- CreateIndex
CREATE INDEX "questions_group_id_idx" ON "questions"("group_id");

-- CreateIndex
CREATE INDEX "question_answers_question_id_idx" ON "question_answers"("question_id");

-- CreateIndex
CREATE INDEX "answer_votes_answer_id_idx" ON "answer_votes"("answer_id");

-- CreateIndex
CREATE INDEX "group_materials_group_id_idx" ON "group_materials"("group_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "presence_status_status_idx" ON "presence_status"("status");

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "study_groups" ADD CONSTRAINT "study_groups_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcements" ADD CONSTRAINT "group_announcements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_announcements" ADD CONSTRAINT "group_announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_events" ADD CONSTRAINT "group_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "group_events"("event_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_meetings" ADD CONSTRAINT "group_meetings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_meetings" ADD CONSTRAINT "group_meetings_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "group_meetings"("meeting_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_participants" ADD CONSTRAINT "meeting_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_messages" ADD CONSTRAINT "group_messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "group_messages"("message_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "group_messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_reactions" ADD CONSTRAINT "message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_attachments" ADD CONSTRAINT "message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "group_messages"("message_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_likes" ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "community_posts"("post_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_comments" ADD CONSTRAINT "post_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "post_comments"("comment_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("question_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_answers" ADD CONSTRAINT "question_answers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "question_answers"("answer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_votes" ADD CONSTRAINT "answer_votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_attachments" ADD CONSTRAINT "answer_attachments_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "question_answers"("answer_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_categories" ADD CONSTRAINT "material_categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_categories" ADD CONSTRAINT "material_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "material_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_materials" ADD CONSTRAINT "group_materials_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_materials" ADD CONSTRAINT "group_materials_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "material_categories"("category_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_materials" ADD CONSTRAINT "group_materials_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_material_likes" ADD CONSTRAINT "group_material_likes_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "group_materials"("material_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_material_likes" ADD CONSTRAINT "group_material_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_material_comments" ADD CONSTRAINT "group_material_comments_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "group_materials"("material_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_material_comments" ADD CONSTRAINT "group_material_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_downloads" ADD CONSTRAINT "material_downloads_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "group_materials"("material_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_downloads" ADD CONSTRAINT "material_downloads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_bookmarks" ADD CONSTRAINT "user_bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_recordings" ADD CONSTRAINT "meeting_recordings_meeting_id_fkey" FOREIGN KEY ("meeting_id") REFERENCES "group_meetings"("meeting_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presence_status" ADD CONSTRAINT "presence_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_status" ADD CONSTRAINT "typing_status_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "study_groups"("group_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "typing_status" ADD CONSTRAINT "typing_status_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

