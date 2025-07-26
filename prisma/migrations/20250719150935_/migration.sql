-- CreateEnum
CREATE TYPE "SlotType" AS ENUM ('ONLINE', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('AVAILABLE', 'PROCESSING', 'BOOKED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Calendar" (
    "id" TEXT NOT NULL,
    "counselorId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "roomId" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "type" "SlotType" NOT NULL,
    "status" "SlotStatus" NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Calendar_counselorId_date_key" ON "Calendar"("counselorId", "date");

-- CreateIndex
CREATE INDEX "TimeSlot_calendarId_startTime_endTime_idx" ON "TimeSlot"("calendarId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "Calendar" ADD CONSTRAINT "Calendar_counselorId_fkey" FOREIGN KEY ("counselorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_calendarId_fkey" FOREIGN KEY ("calendarId") REFERENCES "Calendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
