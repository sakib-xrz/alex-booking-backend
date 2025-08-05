import { z } from 'zod';

const googleCallbackSchema = z.object({
  query: z.object({
    code: z.string({
      required_error: 'Authorization code is required',
    }),
    state: z.string().optional(),
    error: z.string().optional(),
  }),
});

const GoogleValidation = {
  googleCallbackSchema,
};

export default GoogleValidation;
