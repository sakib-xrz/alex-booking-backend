import { z } from 'zod';
import { SessionType } from '@prisma/client';

const createCalendarSchema = z.object({
  body: z.object({
    date: z.string().datetime().or(z.date()),
  }),
});

const createSlotsSchema = z.object({
  body: z.object({
    data: z.array(
      z.object({
        start_time: z.string(),
        end_time: z.string(),
        type: z.nativeEnum(SessionType),
      }),
    ),
  }),
});

const getSlotsSchema = z.object({
  query: z.object({
    type: z.nativeEnum(SessionType).optional(),
  }),
});

const CalendarValidation = {
  createCalendarSchema,
  createSlotsSchema,
  getSlotsSchema,
};

export default CalendarValidation;
