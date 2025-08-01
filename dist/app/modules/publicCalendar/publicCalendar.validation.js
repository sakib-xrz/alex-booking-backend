"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const getCounselorCalendarSchema = zod_1.z.object({
    params: zod_1.z.object({
        counselorId: zod_1.z.string().uuid('Valid counselor ID is required'),
    }),
});
const getCounselorSlotsSchema = zod_1.z.object({
    params: zod_1.z.object({
        calenderId: zod_1.z.string().uuid('Valid calendar ID is required'),
    }),
    query: zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.SessionType).optional(),
    }),
});
const PublicCalendarValidation = {
    getCounselorCalendarSchema,
    getCounselorSlotsSchema,
};
exports.default = PublicCalendarValidation;
