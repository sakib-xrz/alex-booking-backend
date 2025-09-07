import prisma from '../../utils/prisma';
import { Prisma, SessionType } from '@prisma/client';

const GetCalenders = async (counselorId: string) => {
  const calenderDates = await prisma.calendar.findMany({
    where: {
      counselor_id: counselorId,
    },
    select: {
      id: true,
      date: true,
      _count: {
        select: {
          time_slots: true,
        },
      },
    },
  });

  const calender = calenderDates.map((item) => ({
    id: item.id,
    isoDate: item.date,
    date: item.date.toISOString().split('T')[0],
    availableSlots: item._count.time_slots,
    haveSlots: !!item._count.time_slots,
  }));
  return { calender };
};

const CreateCalenderDate = async (counselorId: string, date: string | Date) => {
  const createdCalenderDate = await prisma.calendar.create({
    data: {
      counselor_id: counselorId,
      date,
    },
  });

  return createdCalenderDate;
};

const GetDateSlots = async (calendarId: string) => {
  const where: Prisma.TimeSlotWhereInput = {
    calendar_id: calendarId,
  };

  const result = await prisma.timeSlot.findMany({
    where,
    select: {
      id: true,
      start_time: true,
      end_time: true,
      type: true,
      status: true,
      is_rescheduled: true,
      created_at: true,
      updated_at: true,
    },
  });

  const formattedResult = result.map((slot) => ({
    id: slot.id,
    startTime: slot.start_time,
    endTime: slot.end_time,
    type: slot.type,
    status: slot.status,
    is_rescheduled: slot.is_rescheduled,
    createdAt: slot.created_at,
    updatedAt: slot.updated_at,
  }));

  return formattedResult;
};

interface CreateSlotData {
  start_time: string;
  end_time: string;
  type: SessionType;
}

interface CreateSlotsPayload {
  data: CreateSlotData[];
}

const CreateDateSlots = async (
  calendarId: string,
  slots: CreateSlotsPayload,
) => {
  const result = await prisma.timeSlot.createMany({
    data: slots.data.map((item) => ({
      calendar_id: calendarId,
      start_time: item.start_time,
      end_time: item.end_time,
      type: item.type,
    })),
  });

  return result;
};

// Slot type
type Slot = {
  start_time: string; // e.g. "8:00 AM"
  end_time: string; // e.g. "9:00 AM"
  type: 'ONLINE' | 'IN_PERSON'; // restrict to your enum values
};

// Day with slots
type DaySlots = {
  date: string; // ISO date string, e.g. "2025-09-07"
  slots: Slot[];
};

// Whole payload
type CalendarPayload = { data: DaySlots[] };

const CreateSlotsWithCalendarDate = async (
  counselorId: string,
  slots: CalendarPayload,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const allSlots: any[] = [];

    for (const day of slots.data) {
      const calendarDate = new Date(day.date);
      calendarDate.setUTCHours(0, 0, 0, 0);

      // Find or create calendar
      let calendar = await tx.calendar.findUnique({
        where: {
          counselor_id_date: {
            counselor_id: counselorId,
            date: calendarDate,
          },
        },
      });

      if (!calendar) {
        calendar = await tx.calendar.create({
          data: {
            counselor_id: counselorId,
            date: calendarDate,
          },
        });
      }

      // Collect all slots for bulk insert
      for (const slot of day.slots) {
        allSlots.push({
          calendar_id: calendar.id,
          start_time: slot.start_time,
          end_time: slot.end_time,
          type: slot.type,
          status: 'AVAILABLE',
        });
      }
    }

    // Insert all slots in one bulk query
    const createdSlots = await tx.timeSlot.createMany({
      data: allSlots,
      skipDuplicates: true,
    });

    return createdSlots;
  });

  return result;
};

const GetSlotsWithCalendarDate = async (counselorId: string) => {
  const calendars = await prisma.calendar.findMany({
    where: { counselor_id: counselorId },
    include: { time_slots: true },
  });

  return calendars;
};

const DeleteTimeSlot = async (counselorId: string, slotId: string) => {
  // First verify that the slot belongs to the counselor
  const slot = await prisma.timeSlot.findFirst({
    where: {
      id: slotId,
      calendar: {
        counselor_id: counselorId,
      },
    },
    include: {
      calendar: true,
    },
  });

  if (!slot) {
    throw new Error(
      'Time slot not found or you do not have permission to delete it',
    );
  }

  // Only allow deletion if status is AVAILABLE
  if (slot.status !== 'AVAILABLE') {
    throw new Error('Only available slots can be deleted');
  }

  // Delete the slot
  const deletedSlot = await prisma.timeSlot.delete({
    where: {
      id: slotId,
    },
  });

  return deletedSlot;
};

const CalendarService = {
  GetCalenders,
  CreateCalenderDate,
  GetDateSlots,
  CreateDateSlots,
  CreateSlotsWithCalendarDate,
  GetSlotsWithCalendarDate,
  DeleteTimeSlot,
};

export default CalendarService;
