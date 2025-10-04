-- AlterTable: Remove old Stripe API key fields
ALTER TABLE "users" DROP COLUMN "stripe_public_key",
DROP COLUMN "stripe_secret_key";

-- AlterTable: Add new Stripe Connect fields
ALTER TABLE "users" 
ADD COLUMN "stripe_charges_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripe_payouts_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripe_details_submitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripe_onboarding_complete" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: Add unique constraint on stripe_account_id
CREATE UNIQUE INDEX "users_stripe_account_id_key" ON "users"("stripe_account_id");

