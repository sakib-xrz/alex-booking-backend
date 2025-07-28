"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const createCalendarSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime().or(zod_1.z.date()),
    }),
});
const createSlotsSchema = zod_1.z.object({
    body: zod_1.z.object({
        data: zod_1.z.array(zod_1.z.object({
            start_time: zod_1.z.string(),
            end_time: zod_1.z.string(),
            type: zod_1.z.nativeEnum(client_1.SessionType),
        })),
    }),
});
const getSlotsSchema = zod_1.z.object({
    query: zod_1.z.object({
        type: zod_1.z.nativeEnum(client_1.SessionType).optional(),
    }),
});
const CalendarValidation = {
    createCalendarSchema,
    createSlotsSchema,
    getSlotsSchema,
};
exports.default = CalendarValidation;
