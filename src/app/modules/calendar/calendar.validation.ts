import { z } from 'zod';
import { SessionType } from '@prisma/client';

const CreateCalendarSchema = z.object({
  body: z.object({
    date: z.string().datetime().or(z.date()),
  }),
});

const CreateSlotsSchema = z.object({
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

const CalendarValidation = {
  CreateCalendarSchema,
  CreateSlotsSchema,
};

export default CalendarValidation;
