import { z } from 'zod';
import { Gender } from '@prisma/client';

const createClientSchema = z.object({
  body: z.object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Valid email is required'),
    phone: z.string().min(1, 'Phone number is required'),
    date_of_birth: z.string().datetime().or(z.date()),
    gender: z.nativeEnum(Gender, {
      required_error: 'Gender is required',
    }),
  }),
});

const getClientDetailsSchema = z.object({
  params: z.object({
    clientId: z.string().uuid('Valid client ID is required'),
  }),
});

const getClientsQuerySchema = z.object({
  query: z.object({
    search: z.string().optional(),
    gender: z.nativeEnum(Gender).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    sort_by: z
      .enum([
        'first_name',
        'last_name',
        'email',
        'gender',
        'date_of_birth',
        'created_at',
      ])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

const ClientValidation = {
  createClientSchema,
  getClientDetailsSchema,
  getClientsQuerySchema,
};

export default ClientValidation;
