import { Prisma, SessionType } from '@prisma/client';
import prisma from '../../utils/prisma';

const GetCounselorCalendar = async (counselorId: string) => {
  const calendarDates = await prisma.calendar.findMany({
    where: {
      counselor_id: counselorId,
      counselor: {
        is_deleted: false,
      },
    },
    select: {
      id: true,
      date: true,
      counselor: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true,
        },
      },
      _count: {
        select: {
          time_slots: {
            where: {
              status: 'AVAILABLE',
            },
          },
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
  });

  const calendar = calendarDates.map((item) => ({
    id: item.id,
    date: item.date.toISOString().split('T')[0],
    counselor: item.counselor,
    availableSlots: item._count.time_slots,
    hasAvailableSlots: item._count.time_slots > 0,
  }));

  return { calendar };
};

const GetCounselorDateSlots = async (
  calendarId: string,
  date: string,
  type: SessionType,
) => {
  const where: Prisma.TimeSlotWhereInput = {
    calendar: {
      date: new Date(date).toISOString(),
      counselor_id: calendarId,
    },
    status: 'AVAILABLE',
  };

  if (type) {
    where.type = type;
  }

  const slots = await prisma.timeSlot.findMany({
    where,
    // select: {
    //   id: true,
    //   start_time: true,
    //   end_time: true,
    //   type: true,
    //   status: true,
    //   calendar: {
    //     select: {
    //       date: true,
    //       counselor: {
    //         select: {
    //           id: true,
    //           name: true,
    //           profile_picture: true,
    //         },
    //       },
    //     },
    //   },
    // },
    // orderBy: {
    //   start_time: 'asc',
    // },
  });

  return { slots };
};

const PublicCalendarService = {
  GetCounselorCalendar,
  GetCounselorDateSlots,
};

export default PublicCalendarService;
