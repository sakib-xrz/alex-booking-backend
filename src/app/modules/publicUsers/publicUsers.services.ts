import { Role } from '@prisma/client';
import prisma from '../../utils/prisma';

const GetPublicCounselors = async () => {
  // Get all counselors and super admin
  const counselors = await prisma.user.findMany({
    where: {
      OR: [{ role: Role.SUPER_ADMIN }, { role: Role.COUNSELOR }],
      is_deleted: false,
    },
    select: {
      id: true,
      name: true,
      role: true,
      specialization: true,
      profile_picture: true,
    },
    orderBy: [
      // Super admin first
      { role: 'asc' }, // SUPER_ADMIN comes before COUNSELOR alphabetically
      { name: 'asc' },
    ],
  });

  // Get next available date for each counselor
  const counselorsWithAvailability = await Promise.all(
    counselors.map(async (counselor) => {
      // Find the next available date for this counselor
      const nextAvailableCalendar = await prisma.calendar.findFirst({
        where: {
          counselor_id: counselor.id,
          date: {
            gte: new Date(),
          },
          time_slots: {
            some: {
              status: 'AVAILABLE',
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          date: true,
        },
      });

      let next_available = null;
      if (nextAvailableCalendar) {
        const today = new Date();
        const availableDate = new Date(nextAvailableCalendar.date);

        // Calculate if it's today, tomorrow, or specific date
        const diffTime = availableDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          next_available = 'Today';
        } else if (diffDays === 1) {
          next_available = 'Tomorrow';
        } else {
          // Format as readable date
          next_available = availableDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          });
        }
      } else {
        next_available = null;
      }

      return {
        ...counselor,
        next_available,
      };
    }),
  );

  return counselorsWithAvailability;
};

const PublicUsersService = {
  GetPublicCounselors,
};

export default PublicUsersService;
