import prisma from '../../utils/prisma';

const GetCounselorAppointmentsById = async (counselor_id: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      counselor_id,
      status: {
        not: 'PENDING',
      },
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
        },
      },
      created_at: true,
    },

    orderBy: {
      created_at: 'asc',
    },
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

  return formattedAppointments;
};

const GetCounselorAppointmentDetailsById = async (id: string) => {
  const appointment = await prisma.appointment.findUniqueOrThrow({
    where: {
      id,
    },
    include: {
      client: true,
      time_slot: true,
      payment: true,
    },
  });

  const formattedAppointment = {
    id: appointment.id,
    appointmentDate: appointment.date,
    sessionType: appointment.session_type,
    notes: appointment.notes,
    status: appointment.status,
    createdAt: appointment.created_at,
    client: {
      firstName: appointment.client.first_name,
      lastName: appointment.client.last_name,
      email: appointment.client.email,
      phone: appointment.client.phone,
      dateOfBirth: appointment.client.date_of_birth,
      gender: appointment.client.gender,
      isVerified: appointment.client.is_verified,
      createdAt: appointment.client.created_at,
    },
    timeSlot: {
      id: appointment.time_slot.id,
      startTime: appointment.time_slot.start_time,
      endTime: appointment.time_slot.end_time,
    },
    payment: {
      id: appointment.payment?.id,
      amount: appointment.payment?.amount,
      status: appointment.payment?.status,
      paymentMethod: appointment.payment?.payment_method,
      transactionId: appointment.payment?.transaction_id,
      refundAmount: appointment.payment?.refund_amount,
      refundReason: appointment.payment?.refund_reason,
      createdAt: appointment.payment?.created_at,
    },
  };

  return formattedAppointment;
};

const AppointmentService = {
  GetCounselorAppointmentsById,
  GetCounselorAppointmentDetailsById,
};

export default AppointmentService;
