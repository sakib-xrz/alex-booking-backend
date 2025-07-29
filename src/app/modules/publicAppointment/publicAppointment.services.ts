import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';

export interface IClientData {
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
}

interface IAppointmentData {
  session_type: 'ONLINE' | 'IN_PERSON';
  date: string;
  time_slot_id: string;
  notes: string;
  counselor_id: string;
}

const CreateAppointment = async (
  clientData: IClientData,
  appointmentDate: IAppointmentData,
) => {
  console.log(clientData, appointmentDate);
  // Check expected slot is available
  const expectedSlot = await prisma.timeSlot.findFirst({
    where: {
      id: appointmentDate.time_slot_id,
      status: 'AVAILABLE',
    },
  });

  if (!expectedSlot) {
    throw new AppError(
      httpStatus.UNPROCESSABLE_ENTITY,
      'Slot is not Available.',
    );
  }

  const appointment = await prisma.$transaction(async (transaction) => {
    let client_id;
    // 1. Check If the the client exist
    const existingClient = await transaction.client.findUnique({
      where: {
        email: clientData.email,
      },
    });

    if (existingClient?.id) {
      client_id = existingClient.id;
    } else {
      // 2. Create new client
      const newClient = await transaction.client.create({
        data: clientData,
      });

      client_id = newClient.id;
    }

    // 3. Create Appointment on PENDING status
    const newAppointment = await transaction.appointment.create({
      data: {
        client_id,
        time_slot_id: expectedSlot.id,
        counselor_id: appointmentDate.counselor_id,
        date: appointmentDate.date,
        session_type: expectedSlot.type,
        notes: appointmentDate.notes,
        status: 'PENDING',
      },
    });

    // TODO:: May be payment related stuff @Sakib vai

    return newAppointment;
  });

  // TODO:: Do the payment related stuff @Sakib vai

  const confirmedAppointment = await prisma.$transaction(
    async (transaction) => {
      // 1. Update slot status
      await transaction.timeSlot.update({
        where: {
          id: expectedSlot.id,
        },
        data: {
          status: 'BOOKED',
        },
      });

      // 2. Update Appointment Status to CONFIRMED
      const updatedAppointment = await transaction.appointment.update({
        where: {
          id: appointment.id,
        },
        data: {
          status: 'CONFIRMED',
        },
      });

      return updatedAppointment;
    },
  );

  appointment.status = confirmedAppointment.status;

  return appointment;
};

const PublicAppointmentService = { CreateAppointment };

export default PublicAppointmentService;
