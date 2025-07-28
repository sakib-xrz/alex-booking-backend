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

const verifyClientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Valid client ID is required'),
  }),
});

const ClientValidation = {
  createClientSchema,
  verifyClientSchema,
};

export default ClientValidation;
