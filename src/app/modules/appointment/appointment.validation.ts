import { z } from 'zod';

const getAppointmentsQuerySchema = z.object({
  query: z
    .object({
      search: z.string().optional(),
      session_type: z.enum(['ONLINE', 'IN_PERSON']).optional(),
      status: z
        .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'DELETED'])
        .optional(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .optional(),
      page: z
        .string()
        .transform((val) => parseInt(val))
        .pipe(z.number().min(1))
        .optional(),
      limit: z
        .string()
        .transform((val) => parseInt(val))
        .pipe(z.number().min(1).max(100))
        .optional(),
      sort_by: z.string().optional(),
      sort_order: z.enum(['asc', 'desc']).optional(),
    })
    .optional(),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

const cancelAppointmentSchema = z.object({
  params: z.object({
    appointmentId: z.string().uuid('Invalid appointment ID format'),
  }),
  body: z.object({}).optional(),
  query: z.object({}).optional(),
  cookies: z.object({}).optional(),
});

const AppointmentValidation = {
  getAppointmentsQuerySchema,
  cancelAppointmentSchema,
};

export default AppointmentValidation;
