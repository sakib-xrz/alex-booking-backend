import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../utils/prisma';

// Utility function to retry transactions with exponential backoff
const retryTransaction = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;

      // Check if it's a transaction-related error that we should retry
      const isRetryableError =
        error?.code === 'P2028' || // Transaction not found
        error?.code === 'P2034' || // Transaction failed due to write conflict
        error?.message?.includes('Transaction') ||
        error?.message?.includes('timeout');

      if (!isRetryableError || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(
        `Transaction attempt ${attempt} failed, retrying in ${delay}ms...`,
        error.message,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

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

  const appointment = await retryTransaction(
    () =>
      prisma.$transaction(
        async (transaction) => {
          let client_id;

          try {
            // 1. Use upsert to handle client creation/update in a single operation
            const client = await transaction.client.upsert({
              where: {
                email: clientData.email,
              },
              update: {
                first_name: clientData.first_name,
                last_name: clientData.last_name,
                phone: clientData.phone,
                date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                gender: clientData.gender,
              },
              create: {
                first_name: clientData.first_name,
                last_name: clientData.last_name,
                email: clientData.email,
                phone: clientData.phone,
                date_of_birth: new Date(clientData.date_of_birth).toISOString(),
                gender: clientData.gender,
              },
            });

            client_id = client.id;

            console.log('Appointment data from line 102:', appointmentData);

            // 2. Perform time slot update and appointment creation in parallel
            const [, newAppointment] = await Promise.all([
              // Mark the time slot as PROCESSING to prevent double booking
              transaction.timeSlot.update({
                where: { id: expectedSlot.id },
                data: { status: 'PROCESSING' },
              }),
              // Create Appointment with PENDING status
              transaction.appointment.create({
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
              }),
            ]);

            console.log(
              'Appointment created data from line 128:',
              newAppointment,
            );

            return newAppointment;
          } catch (error) {
            console.error('Transaction error in CreateAppointment:', error);
            throw error;
          }
        },
        {
          // Explicit timeout configuration for serverless environments
          timeout: 8000, // Reduced to 8 seconds to allow for retries
          maxWait: 3000, // Reduced to 3 seconds max wait for connection
        },
      ),
    3, // Max 3 retries
    500, // Start with 500ms base delay
  );

  // Return appointment with payment required status
  return {
    ...appointment,
    requires_payment: true,
  };
};

const getAppointment = async (id: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: {
      client: true,
      counselor: true,
      time_slot: true,
      payment: true,
    },
  });

  if (!appointment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  return appointment;
};

const PublicAppointmentService = { CreateAppointment, getAppointment };

export default PublicAppointmentService;
