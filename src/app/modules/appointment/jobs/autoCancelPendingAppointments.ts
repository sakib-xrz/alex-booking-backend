import { subMinutes } from 'date-fns';

import cron from 'node-cron';
import prisma from '../../../utils/prisma';

const autoCancelPendingAppointments = async () => {
  const fifteenMinutesAgo = subMinutes(new Date(), 15);

  const pendingAppointments = await prisma.appointment.findMany({
    where: {
      created_at: {
        lt: fifteenMinutesAgo,
      },
      AND: {
        status: 'PENDING',
      },
    },
  });

  pendingAppointments.map(async (appointment) => {
    const result = await prisma.appointment.update({
      data: {
        status: 'DELETED',
        notes: 'Appointment canceled automatically lack of payment!',
        time_slot: {
          update: {
            status: 'AVAILABLE',
          },
        },
        payment: {
          update: {
            status: 'DELETED',
          },
        },
      },
      where: {
        id: appointment.id,
      },
    });

    return result;
  });
};

export const scheduledAutoCancelPendingJobs = () => {
  cron.schedule('*/15 * * * *', async () => {
    await autoCancelPendingAppointments();
  });
};
