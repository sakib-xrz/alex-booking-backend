"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const adjustBalanceSchema = zod_1.z.object({
    body: zod_1.z.object({
        amount: zod_1.z
            .number({
            required_error: 'Amount is required',
            invalid_type_error: 'Amount must be a number',
        })
            .refine((val) => val !== 0, {
            message: 'Amount cannot be zero',
        }),
        description: zod_1.z
            .string({
            required_error: 'Description is required',
            invalid_type_error: 'Description must be a string',
        })
            .min(1, 'Description cannot be empty')
            .max(500, 'Description too long'),
    }),
});
const setBalanceValuesSchema = zod_1.z.object({
    body: zod_1.z.object({
        current_balance: zod_1.z
            .number({
            invalid_type_error: 'Current balance must be a number',
        })
            .min(0, 'Current balance cannot be negative')
            .optional(),
        total_earned: zod_1.z
            .number({
            invalid_type_error: 'Total earned must be a number',
        })
            .min(0, 'Total earned cannot be negative')
            .optional(),
        total_withdrawn: zod_1.z
            .number({
            invalid_type_error: 'Total withdrawn must be a number',
        })
            .min(0, 'Total withdrawn cannot be negative')
            .optional(),
    }).refine((data) => data.current_balance !== undefined ||
        data.total_earned !== undefined ||
        data.total_withdrawn !== undefined, {
        message: 'At least one balance field must be provided',
    }),
});
const balanceFiltersSchema = zod_1.z.object({
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
        sort_by: zod_1.z.enum(['created_at', 'amount', 'type']).optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
const counsellorBalanceFiltersSchema = zod_1.z.object({
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
        sort_by: zod_1.z
            .enum([
            'name',
            'email',
            'current_balance',
            'total_earned',
            'total_withdrawn',
            'updated_at',
        ])
            .optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
exports.default = {
    adjustBalanceSchema,
    setBalanceValuesSchema,
    balanceFiltersSchema,
    counsellorBalanceFiltersSchema,
};
