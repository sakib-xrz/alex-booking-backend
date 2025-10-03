import { z } from 'zod';

const adjustBalanceSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
      })
      .refine((val) => val !== 0, {
        message: 'Amount cannot be zero',
      }),
    description: z
      .string({
        required_error: 'Description is required',
        invalid_type_error: 'Description must be a string',
      })
      .min(1, 'Description cannot be empty')
      .max(500, 'Description too long'),
  }),
});

const balanceFiltersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sort_by: z.enum(['created_at', 'amount', 'type']).optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

const counsellorBalanceFiltersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : undefined)),
    sort_by: z
      .enum([
        'name',
        'email',
        'current_balance',
        'total_earned',
        'total_withdrawn',
        'updated_at',
      ])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

export default {
  adjustBalanceSchema,
  balanceFiltersSchema,
  counsellorBalanceFiltersSchema,
};
