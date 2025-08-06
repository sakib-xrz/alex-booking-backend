import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';

export interface IClientData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: Date;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface IAppointmentData {
  session_type: 'ONLINE' | 'IN_PERSON';
  date: Date | string;
  time_slot_id: string;
  notes: string;
  counselor_id: string;
}

const CreateAppointment = async (
  clientData: IClientData,
  appointmentData: IAppointmentData,
) => {
  // Check expected slot is available
  const expectedSlot = await prisma.timeSlot.findFirst({
    where: {
      id: appointmentData.time_slot_id,
      status: 'AVAILABLE',
    },
    include: {
      calendar: {
        include: {
          counselor: true,
        },
      },
    },
  });

  if (!expectedSlot) {
    throw new AppError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'Slot is not available.',
    );
  }

  // Verify the session type matches the slot type
  if (expectedSlot.type !== appointmentData.session_type) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Session type does not match the selected time slot type.',
    );
  }

  // Verify the counselor matches
  if (expectedSlot.calendar.counselor_id !== appointmentData.counselor_id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Counselor does not match the selected time slot.',
    );
  }

  const appointment = await prisma.$transaction(async (transaction) => {
    let client_id;

    // 1. Check if the client exists
    const existingClient = await transaction.client.findUnique({
      where: {
        email: clientData.email,
      },
    });

    if (existingClient?.id) {
      client_id = existingClient.id;

      // Update existing client data if needed
      await transaction.client.update({
        where: { id: client_id },
        data: {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          date_of_birth: new Date(clientData.date_of_birth).toISOString(),
          gender: clientData.gender,
        },
      });
    } else {
      // 2. Create new client
      const newClient = await transaction.client.create({
        data: {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          phone: clientData.phone,
          date_of_birth: new Date(clientData.date_of_birth).toISOString(),
          gender: clientData.gender,
        },
      });
      client_id = newClient.id;
    }

    // 3. Mark the time slot as PROCESSING to prevent double booking
    await transaction.timeSlot.update({
      where: { id: expectedSlot.id },
      data: { status: 'PROCESSING' },
    });

    console.log('Appointment data from line 102:', appointmentData);

    // 4. Create Appointment with PENDING status
    const newAppointment = await transaction.appointment.create({
      data: {
        client_id,
        time_slot_id: expectedSlot.id,
        counselor_id: appointmentData.counselor_id,
        date: new Date(appointmentData.date).toISOString(),
        session_type: appointmentData.session_type,
        notes: appointmentData.notes,
        status: 'PENDING',
      },
      include: {
        client: true,
        counselor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        time_slot: true,
      },
    });

    console.log('Appointment created data from line 128:', newAppointment);

    return newAppointment;
  });

  // Return appointment with payment required status
  return {
    ...appointment,
    requires_payment: true,
  };
};

const PublicAppointmentService = { CreateAppointment };

export default PublicAppointmentService;
