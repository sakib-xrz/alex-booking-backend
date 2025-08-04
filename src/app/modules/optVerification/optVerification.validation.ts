import { z } from 'zod';

const createOTPValidation = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Please provide a valid email address',
      }),
  }),
});

const verifyOTPValidation = z.object({
  body: z.object({
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Please provide a valid email address',
      }),
    otp: z
      .string({
        required_error: 'OTP is required',
      })
      .length(6, {
        message: 'OTP must be exactly 6 digits',
      })
      .regex(/^\d{6}$/, {
        message: 'OTP must contain only numbers',
      }),
  }),
});

const OptVerificationValidation = {
  createOTPValidation,
  verifyOTPValidation,
};

export default OptVerificationValidation;
