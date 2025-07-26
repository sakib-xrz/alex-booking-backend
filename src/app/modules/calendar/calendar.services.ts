import prisma from '../../utils/prisma';

const GetCalenders = async (counselorId: string) => {
  const calenderDates = await prisma.calendar.findMany({
    where: {
      counselorId,
    },
    select: {
      id: true,
      date: true,
      _count: {
        select: {
          TimeSlot: true,
        },
      },
    },
  });

  const calender = calenderDates.map((item) => ({
    id: item.id,
    isoDate: item.date,
    date: item.date.toISOString().split('T')[0],
    availableSlots: item._count.TimeSlot,
    haveSlots: !!item._count.TimeSlot,
  }));
  return { calender };
};

const CreateCalenderDate = async (counselorId: string, date: string | Date) => {
  const createdCalenderDate = await prisma.calendar.create({
    data: {
      counselorId,
      date,
    },
  });

  return createdCalenderDate;
};

const GetDateSlots = async (calendarId: string, type: string) => {
  const result = await prisma.timeSlot.findMany({
    where: {
      calendarId,
      type,
    },
  });

  return result;
};

const CreateDateSlots = async (calendarId: string, slots: any) => {
  const result = await prisma.timeSlot.createMany({
    data: slots.data.map((item: any) => ({
      calendarId,
      startTime: item.startTime,
      endTime: item.endTime,
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
