/*
  Warnings:

  - Changed the type of `otp` on the `email_otp_verifications` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropIndex
DROP INDEX "email_otp_verifications_otp_idx";

-- AlterTable
ALTER TABLE "email_otp_verifications" DROP COLUMN "otp",
ADD COLUMN     "otp" INTEGER NOT NULL;
