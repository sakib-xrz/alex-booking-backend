import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { appointmentSearchableFields } from './appointment.constant';
import { Prisma } from '@prisma/client';

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

const AppointmentService = {
  GetCounselorAppointmentsById,
  GetCounselorAppointmentDetailsById,
  CompleteAppointmentById,
};

export default AppointmentService;
