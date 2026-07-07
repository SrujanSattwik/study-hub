-- =====================================================================
-- Migration: add_enum_types
-- Context: DB was originally created via raw SQL (init-db.js) using
--          VARCHAR for role/status columns. This migration creates the
--          proper PostgreSQL ENUM types and converts existing data.
-- =====================================================================

-- Step 1: Create enum types
CREATE TYPE "Role" AS ENUM ('student', 'admin', 'owner');
CREATE TYPE "rsvp_status" AS ENUM ('going', 'maybe', 'declined', 'none');

-- Step 2: Drop defaults before altering column type (required by Postgres)
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "event_rsvps" ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Convert users.role from varchar to Role enum
ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "Role"
  USING CASE
    WHEN role IN ('student', 'admin', 'owner') THEN role::"Role"
    ELSE 'student'::"Role"
  END;

-- Step 4: Restore default with proper enum cast
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student'::"Role";

-- Step 5: Convert event_rsvps.status from varchar to rsvp_status enum
ALTER TABLE "event_rsvps"
  ALTER COLUMN "status" TYPE "rsvp_status"
  USING CASE
    WHEN status IN ('going', 'maybe', 'declined', 'none') THEN status::"rsvp_status"
    ELSE 'none'::"rsvp_status"
  END;

-- Step 6: Restore default
ALTER TABLE "event_rsvps" ALTER COLUMN "status" SET DEFAULT 'none'::"rsvp_status";
