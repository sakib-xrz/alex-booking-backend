-- AlterTable
ALTER TABLE "users" ADD COLUMN     "google_access_token" TEXT,
ADD COLUMN     "google_refresh_token" TEXT,
ADD COLUMN     "google_token_expiry" TIMESTAMP(3),
ADD COLUMN     "is_calendar_connected" BOOLEAN NOT NULL DEFAULT false;
