-- CreateTable
CREATE TABLE "email_otp_verifications" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otp_verifications_email_idx" ON "email_otp_verifications"("email");

-- CreateIndex
CREATE INDEX "email_otp_verifications_otp_idx" ON "email_otp_verifications"("otp");
