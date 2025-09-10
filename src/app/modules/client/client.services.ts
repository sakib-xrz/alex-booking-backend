import prisma from '../../utils/prisma';
import calculatePagination, {
  IPaginationOptions,
} from '../../utils/pagination';
import { clientSearchableFields } from './client.constant';
import { Prisma } from '@prisma/client';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

interface IClientFilters {
  search?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

const GetCounselorClientsById = async (
  counselor_id: string,
  filters: IClientFilters,
  paginationOptions: IPaginationOptions,
) => {
  const { page, limit, skip, sort_by, sort_order } =
    calculatePagination(paginationOptions);
  const { search, gender } = filters;

  // Build where clause - clients who have appointments with this counselor
  const whereConditions: Prisma.ClientWhereInput = {
    appointments: {
      some: {
        counselor_id,
        status: {
          not: 'PENDING',
        },
      },
    },
    is_deleted: false,
  };

  // Add search functionality across client fields
  if (search) {
    whereConditions.OR = clientSearchableFields.map((field) => ({
      [field]: {
        contains: search,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    }));
  }

  // Add gender filter
  if (gender) {
    whereConditions.gender = gender;
  }

  // Build order by clause
  const orderBy: Prisma.ClientOrderByWithRelationInput = {};

  if (sort_by === 'first_name') {
    orderBy.first_name = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'last_name') {
    orderBy.last_name = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'email') {
    orderBy.email = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'gender') {
    orderBy.gender = sort_order as Prisma.SortOrder;
  } else if (sort_by === 'date_of_birth') {
    orderBy.date_of_birth = sort_order as Prisma.SortOrder;
  } else {
    orderBy.created_at = sort_order as Prisma.SortOrder;
  }

  // Get total count for pagination
  const total = await prisma.client.count({
    where: whereConditions,
  });

  // Get clients with pagination
  const clients = await prisma.client.findMany({
    where: whereConditions,
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      gender: true,
      date_of_birth: true,
      created_at: true,
      _count: {
        select: {
          appointments: {
            where: {
              counselor_id,
              status: {
                not: 'PENDING',
              },
            },
          },
        },
      },
    },
    orderBy,
    skip,
    take: limit,
  });

  const formattedClients = clients.map((client) => ({
    id: client.id,
    firstName: client.first_name,
    lastName: client.last_name,
    email: client.email,
    phone: client.phone,
    gender: client.gender,
    dateOfBirth: client.date_of_birth,
    totalAppointments: client._count.appointments,
    createdAt: client.created_at,
  }));

  return {
    data: formattedClients,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const GetClientDetailsWithHistory = async (
  clientId: string,
  counselorId: string,
) => {
  // First verify that the client has appointments with this counselor
  const clientExists = await prisma.client.findFirst({
    where: {
      id: clientId,
      is_deleted: false,
      appointments: {
        some: {
          counselor_id: counselorId,
          status: {
            not: 'PENDING',
          },
        },
      },
    },
  });

  if (!clientExists) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Client not found or not associated with this counselor',
    );
  }

  // Get client details with appointment history
  const client = await prisma.client.findUnique({
    where: {
      id: clientId,
    },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      email: true,
      phone: true,
      date_of_birth: true,
      gender: true,
      is_verified: true,
      created_at: true,
      appointments: {
        where: {
          counselor_id: counselorId,
          status: {
            not: 'PENDING',
          },
        },
        select: {
          id: true,
          date: true,
          session_type: true,
          status: true,
          notes: true,
          is_rescheduled: true,
          time_slot: {
            select: {
              start_time: true,
              end_time: true,
            },
          },
          payment: {
            select: {
              amount: true,
              currency: true,
              status: true,
              transaction_id: true,
              processed_at: true,
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
        orderBy: {
          date: 'desc',
        },
      },
      _count: {
        select: {
          appointments: {
            where: {
              counselor_id: counselorId,
              status: 'COMPLETED',
            },
          },
        },
      },
    },
  });

  if (!client) {
    throw new AppError(httpStatus.NOT_FOUND, 'Client not found');
  }

  // Format the response
  const formattedClient = {
    id: client.id,
    firstName: client.first_name,
    lastName: client.last_name,
    email: client.email,
    phone: client.phone,
    dateOfBirth: client.date_of_birth,
    gender: client.gender,
    isVerified: client.is_verified,
    totalCompletedAppointments: client._count.appointments,
    createdAt: client.created_at,
    appointmentHistory: client.appointments.map((appointment) => ({
      id: appointment.id,
      sessionType: appointment.session_type,
      appointmentDate: appointment.date,
      startTime: appointment.time_slot.start_time,
      endTime: appointment.time_slot.end_time,
      status: appointment.status,
      notes: appointment.notes,
      isRescheduled: appointment.is_rescheduled,
      payment: appointment.payment
        ? {
            amount: appointment.payment.amount,
            currency: appointment.payment.currency,
            status: appointment.payment.status,
            transactionId: appointment.payment.transaction_id,
            processedAt: appointment.payment.processed_at,
          }
        : null,
      meeting: appointment.meeting
        ? {
            platform: appointment.meeting.platform,
            link: appointment.meeting.link,
          }
        : null,
      createdAt: appointment.created_at,
    })),
  };

  return formattedClient;
};

const ClientService = {
  GetCounselorClientsById,
  GetClientDetailsWithHistory,
};

export default ClientService;
