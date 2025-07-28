"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = __importDefault(require("../../utils/prisma"));
const GetCalenders = (counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    const calenderDates = yield prisma_1.default.calendar.findMany({
        where: {
            counselor_id: counselorId,
        },
        select: {
            id: true,
            date: true,
            _count: {
                select: {
                    time_slots: true,
                },
            },
        },
    });
    const calender = calenderDates.map((item) => ({
        id: item.id,
        iso_date: item.date,
        date: item.date.toISOString().split('T')[0],
        available_slots: item._count.time_slots,
        have_slots: !!item._count.time_slots,
    }));
    return { calender };
});
const CreateCalenderDate = (counselorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const createdCalenderDate = yield prisma_1.default.calendar.create({
        data: {
            counselor_id: counselorId,
            date,
        },
    });
    return createdCalenderDate;
});
const GetDateSlots = (calendarId, type) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {
        calendar_id: calendarId,
    };
    if (type) {
        where.type = type;
    }
    const result = yield prisma_1.default.timeSlot.findMany({
        where,
        select: {
            id: true,
            start_time: true,
            end_time: true,
            type: true,
            status: true,
            created_at: true,
            updated_at: true,
        },
    });
    return result;
});
const CreateDateSlots = (calendarId, slots) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.timeSlot.createMany({
        data: slots.data.map((item) => ({
            calendar_id: calendarId,
            start_time: item.start_time,
            end_time: item.end_time,
            type: item.type,
        })),
    });
    return result;
});
const CalendarService = {
    GetCalenders,
    CreateCalenderDate,
    GetDateSlots,
    CreateDateSlots,
};
exports.default = CalendarService;
