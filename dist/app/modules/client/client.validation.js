"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createClientSchema = zod_1.z.object({
    body: zod_1.z.object({
        first_name: zod_1.z.string().min(1, 'First name is required'),
        last_name: zod_1.z.string().min(1, 'Last name is required'),
        email: zod_1.z.string().email('Valid email is required'),
        phone: zod_1.z.string().min(1, 'Phone number is required'),
        date_of_birth: zod_1.z.string().datetime().or(zod_1.z.date()),
        gender: zod_1.z.nativeEnum(client_1.Gender, {
            required_error: 'Gender is required',
        }),
    }),
});
const getClientDetailsSchema = zod_1.z.object({
    params: zod_1.z.object({
        clientId: zod_1.z.string().uuid('Valid client ID is required'),
    }),
});
const getClientsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        search: zod_1.z.string().optional(),
        gender: zod_1.z.nativeEnum(client_1.Gender).optional(),
        page: zod_1.z.string().optional(),
        limit: zod_1.z.string().optional(),
        sort_by: zod_1.z
            .enum([
            'first_name',
            'last_name',
            'email',
            'gender',
            'date_of_birth',
            'created_at',
        ])
            .optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    }),
});
const ClientValidation = {
    createClientSchema,
    getClientDetailsSchema,
    getClientsQuerySchema,
};
exports.default = ClientValidation;
