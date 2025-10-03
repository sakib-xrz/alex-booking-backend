import { z } from 'zod';
import { PayoutStatus } from '@prisma/client';

const createPayoutRequestSchema = z.object({
  body: z.object({
    amount: z
      .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
      })
      .positive('Amount must be positive')
      .max(10000, 'Amount cannot exceed $10,000'),
    notes: z.string().max(500, 'Notes too long').optional(),
  }),
});

const processPayoutRequestSchema = z.object({
  body: z
    .object({
      action: z.enum(['approve', 'reject'], {
        required_error: 'Action is required',
        invalid_type_error: 'Action must be either approve or reject',
      }),
      rejection_reason: z
        .string()
        .max(500, 'Rejection reason too long')
        .optional(),
    })
    .refine(
      (data) => {
        if (data.action === 'reject' && !data.rejection_reason) {
          return false;
        }
        return true;
      },
      {
        message: 'Rejection reason is required when rejecting a payout request',
        path: ['rejection_reason'],
      },
    ),
});

const payoutFiltersSchema = z.object({
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
    status: z.nativeEnum(PayoutStatus).optional(),
    counsellor_id: z.string().uuid().optional(),
    sort_by: z
      .enum([
        'requested_at',
        'amount',
        'status',
        'name',
        'email',
        'processed_at',
      ])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

const counsellorPayoutFiltersSchema = z.object({
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
    status: z.nativeEnum(PayoutStatus).optional(),
    sort_by: z
      .enum(['requested_at', 'amount', 'status', 'processed_at'])
      .optional(),
    sort_order: z.enum(['asc', 'desc']).optional(),
  }),
});

export default {
  createPayoutRequestSchema,
  processPayoutRequestSchema,
  payoutFiltersSchema,
  counsellorPayoutFiltersSchema,
};
