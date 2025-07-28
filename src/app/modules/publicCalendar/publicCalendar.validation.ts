import { z } from 'zod';
import { SessionType } from '@prisma/client';

const getCounselorCalendarSchema = z.object({
  params: z.object({
    counselorId: z.string().uuid('Valid counselor ID is required'),
  }),
});

const getCounselorSlotsSchema = z.object({
  params: z.object({
    calenderId: z.string().uuid('Valid calendar ID is required'),
  }),
  query: z.object({
    type: z.nativeEnum(SessionType).optional(),
  }),
});

const PublicCalendarValidation = {
  getCounselorCalendarSchema,
  getCounselorSlotsSchema,
};

export default PublicCalendarValidation;
