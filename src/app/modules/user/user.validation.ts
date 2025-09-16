import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
  }),
});

const createCounselorSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
        invalid_type_error: 'Name must be a string',
      })
      .min(1, 'Name cannot be empty'),
    email: z
      .string({
        required_error: 'Email is required',
        invalid_type_error: 'Email must be a string',
      })
      .email('Invalid email format'),
    specialization: z
      .string({
        invalid_type_error: 'Specialization must be a string',
      })
      .min(1, 'Specialization cannot be empty')
      .optional(),
  }),
});

const UserValidation = {
  updateProfileSchema,
  createCounselorSchema,
};

export default UserValidation;
