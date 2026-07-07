-- =====================================================================
-- Migration: production_hardening_indexes_refresh_tokens
-- Changes:
--   1. Add refresh_tokens table for JWT refresh token rotation
--   2. Add missing indexes across all high-traffic tables
-- =====================================================================

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "token_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "family" VARCHAR(36) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "replaced_by" VARCHAR(36),
    "user_agent" VARCHAR(255),
    "ip_address" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token_id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex: refresh_tokens
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");
CREATE INDEX "refresh_tokens_family_idx" ON "refresh_tokens"("family");
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateForeignKey: refresh_tokens -> users
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex: users
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex: materials
CREATE INDEX "materials_user_id_idx" ON "materials"("user_id");
CREATE INDEX "materials_type_idx" ON "materials"("type");
CREATE INDEX "materials_created_at_idx" ON "materials"("created_at");

-- CreateIndex: material_categories
CREATE INDEX "material_categories_group_id_idx" ON "material_categories"("group_id");

-- CreateIndex: group_material_likes
CREATE INDEX "group_material_likes_material_id_idx" ON "group_material_likes"("material_id");

-- CreateIndex: group_material_comments
CREATE INDEX "group_material_comments_material_id_idx" ON "group_material_comments"("material_id");

-- CreateIndex: material_downloads
CREATE INDEX "material_downloads_material_id_idx" ON "material_downloads"("material_id");
CREATE INDEX "material_downloads_user_id_idx" ON "material_downloads"("user_id");

-- CreateIndex: notifications
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex: activity_logs
CREATE INDEX "activity_logs_group_id_created_at_idx" ON "activity_logs"("group_id", "created_at");
CREATE INDEX "activity_logs_user_id_idx" ON "activity_logs"("user_id");

-- CreateIndex: user_bookmarks
CREATE INDEX "user_bookmarks_user_id_idx" ON "user_bookmarks"("user_id");

-- CreateIndex: reports
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex: invitations
CREATE INDEX "invitations_receiver_id_status_idx" ON "invitations"("receiver_id", "status");
CREATE INDEX "invitations_group_id_idx" ON "invitations"("group_id");

-- CreateIndex: typing_status
CREATE INDEX "typing_status_group_id_idx" ON "typing_status"("group_id");
