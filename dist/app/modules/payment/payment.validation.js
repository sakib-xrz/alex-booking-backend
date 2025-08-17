"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentValidation = void 0;
const zod_1 = require("zod");
const createPaymentIntentSchema = zod_1.z.object({
    body: zod_1.z.object({
        appointment_id: zod_1.z.string().uuid('Invalid appointment ID'),
        amount: zod_1.z
            .number()
            .min(1, 'Amount must be at least $1')
            .max(10000, 'Amount cannot exceed $10,000'),
        currency: zod_1.z.string().length(3).optional(),
    }),
});
exports.PaymentValidation = {
    createPaymentIntentSchema,
};
