import { z } from 'zod';

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').optional(),
  }),
});

const UserValidation = {
  updateProfileSchema,
};

export default UserValidation;
