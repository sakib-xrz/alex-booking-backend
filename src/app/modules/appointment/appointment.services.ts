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
  // First perform database updates in a single, short transaction with explicit timeout
  const txResult = await prisma.$transaction(
    async (tx) => {
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

      // Return values needed for post-transaction Google Calendar update
      return {
        updatedAppointment,
        eventId: currentAppointment.event_id,
        appointmentDate: newTimeSlot.calendar.date,
        startTimeText: newTimeSlot.start_time as any,
        endTimeText: newTimeSlot.end_time as any,
        clientEmail: currentAppointment.client.email,
        clientName: `${currentAppointment.client.first_name} ${currentAppointment.client.last_name}`,
      };
    },
    {
      // Explicit timeout configuration for serverless environments
      timeout: 10000, // 10 seconds
      maxWait: 5000, // 5 seconds max wait for connection
    },
  );

  const {
    updatedAppointment,
    eventId,
    appointmentDate,
    startTimeText,
    endTimeText,
    clientEmail,
    clientName,
  } = txResult;

  // After the transaction, update Google Calendar (external API) asynchronously
  if (eventId) {
    // Use setImmediate to defer Google Calendar update to next tick
    // This prevents blocking the response and reduces transaction time
    setImmediate(async () => {
      try {
        const businessTimeZone = 'Asia/Dhaka'; // TODO: move to config

        // Get the appointment date (same as in payment service)
        const appointmentDateObj = new Date(appointmentDate);

        // Parse the time strings and create proper datetime objects in the business timezone
        const startTimeMatch = (startTimeText as string).match(
          /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
        );
        const endTimeMatch = (endTimeText as string).match(
          /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
        );

        if (!startTimeMatch || !endTimeMatch) {
          console.error(
            'Invalid time format in time slot for Google Calendar update',
          );
          return;
        }

        // Parse start time
        let startHour = parseInt(startTimeMatch[1]);
        const startMinute = parseInt(startTimeMatch[2]);
        const startPeriod = startTimeMatch[3].toUpperCase();

        if (startPeriod === 'PM' && startHour !== 12) {
          startHour += 12;
        } else if (startPeriod === 'AM' && startHour === 12) {
          startHour = 0;
        }

        // Parse end time
        let endHour = parseInt(endTimeMatch[1]);
        const endMinute = parseInt(endTimeMatch[2]);
        const endPeriod = endTimeMatch[3].toUpperCase();

        if (endPeriod === 'PM' && endHour !== 12) {
          endHour += 12;
        } else if (endPeriod === 'AM' && endHour === 12) {
          endHour = 0;
        }

        // Create the date string in YYYY-MM-DD format
        const year = appointmentDateObj.getFullYear();
        const month = String(appointmentDateObj.getMonth() + 1).padStart(
          2,
          '0',
        );
        const day = String(appointmentDateObj.getDate()).padStart(2, '0');

        // Create datetime strings in ISO format with explicit timezone offset (UTC+6)
        const startTimeStr = `${year}-${month}-${day}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00+06:00`;
        const endTimeStr = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00+06:00`;

        // Convert to UTC Date objects
        const utcStartTime = new Date(startTimeStr);
        const utcEndTime = new Date(endTimeStr);

        console.log('=== RESCHEDULE TIMEZONE DEBUG ===');
        console.log('Original time slot:', startTimeText, '-', endTimeText);
        console.log('Created time strings:', startTimeStr, '-', endTimeStr);
        console.log(
          'Converted to UTC:',
          utcStartTime.toISOString(),
          '-',
          utcEndTime.toISOString(),
        );
        console.log('Business timezone:', businessTimeZone);

        await GoogleCalendarService.rescheduleCalendarEvent(
          eventId,
          counselorId,
          {
            appointmentId,
            clientEmail,
            clientName,
            startDateTime: utcStartTime,
            endDateTime: utcEndTime,
            timeZone: businessTimeZone,
          },
        );
      } catch (calendarError) {
        console.error(
          'Failed to reschedule Google Calendar event (async):',
          calendarError,
        );
        // Do not throw - DB changes already committed
      }
    });
  }

  return updatedAppointment;
};

const AppointmentService = {
  GetCounselorAppointmentsById,
  GetCounselorAppointmentDetailsById,
  CompleteAppointmentById,
  CancelAppointmentById,
  RescheduleAppointmentById,
};

export default AppointmentService;
