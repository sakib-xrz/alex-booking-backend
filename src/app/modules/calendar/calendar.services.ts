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

const GetDateSlots = async (calendarId: string, type?: SessionType) => {
  const where: Prisma.TimeSlotWhereInput = {
    calendar_id: calendarId,
  };

  if (type) {
    where.type = type;
  }

  const result = await prisma.timeSlot.findMany({
    where,
    select: {
      id: true,
      start_time: true,
      end_time: true,
      type: true,
      status: true,
      created_at: true,
      updated_at: true,
    },
  });

  return result;
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

const CalendarService = {
  GetCalenders,
  CreateCalenderDate,
  GetDateSlots,
  CreateDateSlots,
};

export default CalendarService;
