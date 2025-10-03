-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BalanceTransactionType" AS ENUM ('CREDIT', 'DEBIT', 'PAYOUT', 'MANUAL_ADJUSTMENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_stripe_connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "stripe_account_id" TEXT,
ADD COLUMN     "stripe_public_key" TEXT,
ADD COLUMN     "stripe_secret_key" TEXT;

-- CreateTable
CREATE TABLE "counsellor_balances" (
    "id" TEXT NOT NULL,
    "counsellor_id" TEXT NOT NULL,
    "current_balance" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_earned" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "total_withdrawn" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counsellor_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payout_requests" (
    "id" TEXT NOT NULL,
    "counsellor_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(3),
    "processed_by" TEXT,
    "rejection_reason" TEXT,
    "stripe_transfer_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payout_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "counsellor_id" TEXT NOT NULL,
    "type" "BalanceTransactionType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "description" TEXT NOT NULL,
    "reference_id" TEXT,
    "reference_type" TEXT,
    "balance_before" DECIMAL(10,2) NOT NULL,
    "balance_after" DECIMAL(10,2) NOT NULL,
    "processed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "counsellor_balances_counsellor_id_key" ON "counsellor_balances"("counsellor_id");

-- CreateIndex
CREATE INDEX "counsellor_balances_counsellor_id_idx" ON "counsellor_balances"("counsellor_id");

-- CreateIndex
CREATE INDEX "payout_requests_counsellor_id_idx" ON "payout_requests"("counsellor_id");

-- CreateIndex
CREATE INDEX "payout_requests_status_idx" ON "payout_requests"("status");

-- CreateIndex
CREATE INDEX "payout_requests_requested_at_idx" ON "payout_requests"("requested_at");

-- CreateIndex
CREATE INDEX "balance_transactions_counsellor_id_idx" ON "balance_transactions"("counsellor_id");

-- CreateIndex
CREATE INDEX "balance_transactions_type_idx" ON "balance_transactions"("type");

-- CreateIndex
CREATE INDEX "balance_transactions_reference_id_idx" ON "balance_transactions"("reference_id");

-- CreateIndex
CREATE INDEX "balance_transactions_created_at_idx" ON "balance_transactions"("created_at");

-- AddForeignKey
ALTER TABLE "counsellor_balances" ADD CONSTRAINT "counsellor_balances_counsellor_id_fkey" FOREIGN KEY ("counsellor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payout_requests" ADD CONSTRAINT "payout_requests_counsellor_id_fkey" FOREIGN KEY ("counsellor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_counsellor_id_fkey" FOREIGN KEY ("counsellor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
