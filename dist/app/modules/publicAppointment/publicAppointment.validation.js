"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const createPublicAppointmentZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        firstName: zod_1.z.string({
            required_error: 'First name is required',
        }),
        lastName: zod_1.z.string({
            required_error: 'Last name is required',
        }),
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email('Invalid email format'),
        phone: zod_1.z.string({
            required_error: 'Phone is required',
        }),
        dateOfBirth: zod_1.z.string({
            required_error: 'Date of birth is required',
        }),
        gender: zod_1.z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
        sessionType: zod_1.z.enum(['ONLINE', 'IN_PERSON'], {
            required_error: 'Session type is required',
        }),
        date: zod_1.z.string({
            required_error: 'Date is required',
        }),
        timeSlotId: zod_1.z.string({
            required_error: 'Time slot ID is required',
        }),
        notes: zod_1.z.string().optional(),
        counselorId: zod_1.z.string({
            required_error: 'Counselor ID is required',
        }),
    }),
});
const PublicAppointmentValidation = {
    createPublicAppointmentZodSchema,
};
exports.default = PublicAppointmentValidation;
