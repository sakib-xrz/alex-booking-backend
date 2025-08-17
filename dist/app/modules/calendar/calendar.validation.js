"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
const CreateCalendarSchema = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().datetime().or(zod_1.z.date()),
    }),
});
const CreateSlotsSchema = zod_1.z.object({
    body: zod_1.z.object({
        data: zod_1.z.array(zod_1.z.object({
            start_time: zod_1.z.string(),
            end_time: zod_1.z.string(),
            type: zod_1.z.nativeEnum(client_1.SessionType),
        })),
    }),
});
const CalendarValidation = {
    CreateCalendarSchema,
    CreateSlotsSchema,
};
exports.default = CalendarValidation;
