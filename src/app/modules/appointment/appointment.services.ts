import prisma from '../../utils/prisma';

const GetCounselorAppointmentsById = async (counselor_id: string) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      counselor_id,
    },

    select: {
      id: true,
      session_type: true,
      date: true,
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

const AppointmentService = { GetCounselorAppointmentsById };

export default AppointmentService;
