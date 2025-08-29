import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { appointmentSearchableFields } from './appointment.constant';
import { Prisma } from '@prisma/client';
import GoogleCalendarService from '../google/googleCalendar.services';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

interface IAppointmentFilters {
  search?: string;
  session_type?: 'ONLINE' | 'IN_PERSON';
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'DELETED';
  date?: string;
}

const GetCounselorAppointmentsById = async (
  counselor_id: string,
  filters: IAppointmentFilters,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);
  const { search, session_type, status, date } = filters;

  // Build where clause
  const whereConditions: Prisma.AppointmentWhereInput = {
    counselor_id,
    status: {
      not: 'PENDING',
    },
  };

  // Add search functionality across client fields
  if (search) {
    whereConditions.OR = appointmentSearchableFields.map((field) => ({
      client: {
        [field]: {
          contains: search,
          mode: 'insensitive' as Prisma.QueryMode,
        },
      },
    }));
  }

  // Add session_type filter
  if (session_type) {
    whereConditions.session_type = session_type;
  }

  // Add status filter
  if (status) {
    whereConditions.status = status;
  }

  // Add date filter
  if (date) {
    whereConditions.date = new Date(date);
  }

  // Build order by clause
  const orderBy: Prisma.AppointmentOrderByWithRelationInput = {};

  if (sort_by === 'client_name') {
    orderBy.client = {
      first_name: sort_order as Prisma.SortOrder,
    };
  } else if (sort_by === 'client_email') {
    orderBy.client = {
      email: sort_order as Prisma.SortOrder,
    };
  } else if (sort_by === 'session_type') {
    orderBy.session_type = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'status') {
    orderBy.status = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'date') {
    orderBy.date = sort_order as Prisma.SortOrder;
  } else {
    orderBy.created_at = sort_order as Prisma.SortOrder;
  }

  // Get total count for pagination
  const total = await prisma.appointment.count({
    where: whereConditions,
  });

  // Get appointments with pagination
  const appointments = await prisma.appointment.findMany({
    where: whereConditions,
    select: {
      id: true,
      date: true,
      session_type: true,
      status: true,
      time_slot: {
        select: {
          start_time: true,
          end_time: true,
        },
      },
      client: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
        },
      },
      meeting: {
        select: {
          platform: true,
          link: true,
        },
      },
      created_at: true,
    },
    orderBy,
    skip,
    take: limit,
  });

  const formattedAppointments = appointments.map((appointment) => ({
    id: appointment.id,
    sessionType: appointment.session_type,
    appointmentDate: appointment.date,
    startTime: appointment.time_slot.start_time,
    endTime: appointment.time_slot.end_time,
    status: appointment.status,
    client: {
      firstName: appointment.client.first_name,
      lastName: appointment.client.last_name,
      email: appointment.client.email,
      phone: appointment.client.phone,
    },
    createdAt: appointment.created_at,
  }));

  return {
    data: formattedAppointments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const GetCounselorAppointmentDetailsById = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      date: true,
      session_type: true,
      status: true,
      time_slot: {
        select: {
          start_time: true,
          end_time: true,
        },
      },
      client: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          date_of_birth: true,
          gender: true,
        },
      },
      meeting: {
        select: {
          platform: true,
          link: true,
        },
      },
      payment: {
        select: {
          amount: true,
          currency: true,
          status: true,
          transaction_id: true,
        },
      },
      notes: true,
      created_at: true,
    },
  });

  return appointment;
};

const CompleteAppointmentById = async (id: string) => {
  const appointment = await prisma.appointment.update({
    where: {
      id,
    },
    data: {
      status: 'COMPLETED',
    },
  });

  return appointment;
};

const CancelAppointmentById = async (id: string, counselorId: string) => {
  // Start a database transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Get appointment details first to validate and get necessary IDs
    const appointment = await tx.appointment.findUnique({
      where: { id },
      include: {
        time_slot: true,
        counselor: true,
        meeting: true,
      },
    });

    if (!appointment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found');
    }

    // Verify that the appointment belongs to the counselor
    if (appointment.counselor_id !== counselorId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You are not authorized to cancel this appointment',
      );
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'CANCELLED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Appointment is already cancelled',
      );
    }

    if (appointment.status === 'COMPLETED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Cannot cancel a completed appointment',
      );
    }

    try {
      // 2. Update TimeSlot status to AVAILABLE
      await tx.timeSlot.update({
        where: { id: appointment.time_slot_id },
        data: { status: 'AVAILABLE' },
      });

      // 3. Update Appointment status to CANCELLED
      const updatedAppointment = await tx.appointment.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // 4. Delete meeting entry if exists
      if (appointment.meeting) {
        await tx.meeting.delete({
          where: { id: appointment.meeting.id },
        });
      }

      // 5. Cancel Google Calendar event if event_id exists
      // Note: This is done outside the transaction since it's an external API call
      if (appointment.event_id) {
        try {
          await GoogleCalendarService.cancelCalendarEvent(
            appointment.event_id,
            counselorId,
          );
        } catch (calendarError) {
          console.error(
            'Failed to cancel Google Calendar event:',
            calendarError,
          );
          // We don't throw here because the database operations should succeed
          // even if calendar cancellation fails
        }
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error during appointment cancellation:', error);
      throw error;
    }
  });
};

const RescheduleAppointmentById = async (
  appointmentId: string,
  counselorId: string,
  newTimeSlotId: string,
) => {
  // Start a database transaction
  return await prisma.$transaction(async (tx) => {
    // 1. Get current appointment details
    const currentAppointment = await tx.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        time_slot: {
          include: {
            calendar: true,
          },
        },
        client: true,
        counselor: true,
        meeting: true,
      },
    });

    if (!currentAppointment) {
      throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found');
    }

    // Verify that the appointment belongs to the counselor
    if (currentAppointment.counselor_id !== counselorId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'You are not authorized to reschedule this appointment',
      );
    }

    // Check if appointment can be rescheduled
    if (currentAppointment.status === 'CANCELLED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Cannot reschedule a cancelled appointment',
      );
    }

    if (currentAppointment.status === 'COMPLETED') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Cannot reschedule a completed appointment',
      );
    }

    // 2. Get new time slot details
    const newTimeSlot = await tx.timeSlot.findUnique({
      where: { id: newTimeSlotId },
      include: {
        calendar: true,
      },
    });

    if (!newTimeSlot) {
      throw new AppError(httpStatus.NOT_FOUND, 'New time slot not found');
    }

    // Check if new time slot is available
    if (newTimeSlot.status !== 'AVAILABLE') {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Selected time slot is not available',
      );
    }

    // Check if new time slot belongs to the same counselor
    const newCalendar = await tx.calendar.findUnique({
      where: { id: newTimeSlot.calendar_id },
    });

    if (!newCalendar || newCalendar.counselor_id !== counselorId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'New time slot must belong to the same counselor',
      );
    }

    try {
      // 3. Update old time slot status to AVAILABLE
      await tx.timeSlot.update({
        where: { id: currentAppointment.time_slot_id },
        data: { status: 'AVAILABLE' },
      });

      // 4. Update new time slot status to BOOKED
      await tx.timeSlot.update({
        where: { id: newTimeSlotId },
        data: { status: 'BOOKED' },
      });

      // 5. Update appointment with new time slot and date
      const updatedAppointment = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          time_slot_id: newTimeSlotId,
          date: newTimeSlot.calendar.date,
          status: 'CONFIRMED', // Set status to confirmed after rescheduling
        },
        include: {
          time_slot: {
            include: {
              calendar: true,
            },
          },
          client: true,
          counselor: true,
          meeting: true,
        },
      });

      // 6. Update Google Calendar event if event_id exists
      if (currentAppointment.event_id) {
        try {
          // Calculate new start and end times
          const appointmentDate = new Date(newTimeSlot.calendar.date);
          const [startHour, startMinute] = newTimeSlot.start_time
            .split(':')
            .map(Number);
          const [endHour, endMinute] = newTimeSlot.end_time
            .split(':')
            .map(Number);

          const startDateTime = new Date(appointmentDate);
          startDateTime.setHours(startHour, startMinute, 0, 0);

          const endDateTime = new Date(appointmentDate);
          endDateTime.setHours(endHour, endMinute, 0, 0);

          // Convert to UTC (assuming local times are in business timezone)
          const businessTimeZone = 'Asia/Dhaka'; // This should come from config
          const utcStartTime = new Date(
            startDateTime.getTime() - startDateTime.getTimezoneOffset() * 60000,
          );
          const utcEndTime = new Date(
            endDateTime.getTime() - endDateTime.getTimezoneOffset() * 60000,
          );

          await GoogleCalendarService.rescheduleCalendarEvent(
            currentAppointment.event_id,
            counselorId,
            {
              appointmentId: appointmentId,
              clientEmail: currentAppointment.client.email,
              clientName: `${currentAppointment.client.first_name} ${currentAppointment.client.last_name}`,
              startDateTime: utcStartTime,
              endDateTime: utcEndTime,
              timeZone: businessTimeZone,
            },
          );
        } catch (calendarError) {
          console.error(
            'Failed to reschedule Google Calendar event:',
            calendarError,
          );
          // We don't throw here because the database operations should succeed
          // even if calendar rescheduling fails
        }
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error during appointment rescheduling:', error);
      throw error;
    }
  });
};

const AppointmentService = {
  GetCounselorAppointmentsById,
  GetCounselorAppointmentDetailsById,
  CompleteAppointmentById,
  CancelAppointmentById,
  RescheduleAppointmentById,
};

export default AppointmentService;
