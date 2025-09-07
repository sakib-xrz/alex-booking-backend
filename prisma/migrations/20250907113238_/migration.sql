-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "is_rescheduled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "time_slots" ADD COLUMN     "is_rescheduled" BOOLEAN NOT NULL DEFAULT false;
