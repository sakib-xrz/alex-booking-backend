-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('GOOGLE_MEET', 'ZOOM');

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "platform" "MeetingPlatform" NOT NULL DEFAULT 'GOOGLE_MEET',
    "link" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "meetings_appointment_id_key" ON "meetings"("appointment_id");

-- AddForeignKey
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
