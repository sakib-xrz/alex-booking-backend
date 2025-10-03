"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createPayoutRequestSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number({
            required_error: 'Amount is required',
            invalid_type_error: 'Amount must be a number',
        })
            .positive('Amount must be positive')
            .max(10000, 'Amount cannot exceed $10,000'),
        notes: zod_1.z.string().max(500, 'Notes too long').optional(),
    }),
});
const processPayoutRequestSchema = zod_1.z.object({
    body: zod_1.z
        .object({
        action: zod_1.z.enum(['approve', 'reject'], {
            required_error: 'Action is required',
            invalid_type_error: 'Action must be either approve or reject',
        }),
        rejection_reason: zod_1.z
            .string()
            .max(500, 'Rejection reason too long')
            .optional(),
    })
        .refine((data) => {
        if (data.action === 'reject' && !data.rejection_reason) {
            return false;
        }
        return true;
    }, {
        message: 'Rejection reason is required when rejecting a payout request',
        path: ['rejection_reason'],
    }),
});
const payoutFiltersSchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().optional(),
        page: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined)),
        limit: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined)),
        status: zod_1.z.nativeEnum(client_1.PayoutStatus).optional(),
        counsellor_id: zod_1.z.string().uuid().optional(),
        sort_by: zod_1.z
            .enum([
            'requested_at',
            'amount',
            'status',
            'name',
            'email',
            'processed_at',
        ])
            .optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
const counsellorPayoutFiltersSchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().optional(),
        page: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined)),
        limit: zod_1.z
            .string()
            .optional()
            .transform((val) => (val ? parseInt(val, 10) : undefined)),
        status: zod_1.z.nativeEnum(client_1.PayoutStatus).optional(),
        sort_by: zod_1.z
            .enum(['requested_at', 'amount', 'status', 'processed_at'])
            .optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
exports.default = {
    createPayoutRequestSchema,
    processPayoutRequestSchema,
    payoutFiltersSchema,
    counsellorPayoutFiltersSchema,
};
