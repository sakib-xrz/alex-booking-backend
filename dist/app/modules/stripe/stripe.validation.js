"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const connectStripeAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        stripe_public_key: zod_1.z.string({
            required_error: 'Stripe public key is required',
            invalid_type_error: 'Stripe public key must be a string',
        }).startsWith('pk_', 'Invalid Stripe public key format'),
        stripe_secret_key: zod_1.z.string({
            required_error: 'Stripe secret key is required',
            invalid_type_error: 'Stripe secret key must be a string',
        }).startsWith('sk_', 'Invalid Stripe secret key format'),
    }),
});
const updateStripeAccountSchema = zod_1.z.object({
    body: zod_1.z.object({
        stripe_public_key: zod_1.z.string()
            .startsWith('pk_', 'Invalid Stripe public key format')
            .optional(),
        stripe_secret_key: zod_1.z.string()
            .startsWith('sk_', 'Invalid Stripe secret key format')
            .optional(),
    }).refine((data) => {
        return data.stripe_public_key || data.stripe_secret_key;
    }, {
        message: 'At least one field (public key or secret key) must be provided',
    }),
});
exports.default = {
    connectStripeAccountSchema,
    updateStripeAccountSchema,
};
