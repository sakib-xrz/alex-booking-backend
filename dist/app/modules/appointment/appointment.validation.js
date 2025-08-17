"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const getAppointmentsQuerySchema = zod_1.z.object({
    query: zod_1.z
        .object({
        search: zod_1.z.string().optional(),
        session_type: zod_1.z.enum(['ONLINE', 'IN_PERSON']).optional(),
        status: zod_1.z
            .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'DELETED'])
            .optional(),
        date: zod_1.z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
            .optional(),
        page: zod_1.z
            .string()
            .transform((val) => parseInt(val))
            .pipe(zod_1.z.number().min(1))
            .optional(),
        limit: zod_1.z
            .string()
            .transform((val) => parseInt(val))
            .pipe(zod_1.z.number().min(1).max(100))
            .optional(),
        sort_by: zod_1.z.string().optional(),
        sort_order: zod_1.z.enum(['asc', 'desc']).optional(),
    })
        .optional(),
    body: zod_1.z.object({}).optional(),
    params: zod_1.z.object({}).optional(),
    cookies: zod_1.z.object({}).optional(),
});
const AppointmentValidation = {
    getAppointmentsQuerySchema,
};
exports.default = AppointmentValidation;
