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
        isoDate: item.date,
        date: item.date.toISOString().split('T')[0],
        availableSlots: item._count.time_slots,
        haveSlots: !!item._count.time_slots,
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
const GetDateSlots = (calendarId) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {
        calendar_id: calendarId,
    };
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
    const formattedResult = result.map((slot) => ({
        id: slot.id,
        startTime: slot.start_time,
        endTime: slot.end_time,
        type: slot.type,
        status: slot.status,
        createdAt: slot.created_at,
        updatedAt: slot.updated_at,
    }));
    return formattedResult;
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
const CreateSlotsWithCalendarDate = (counselorId, slots) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const allSlots = [];
        for (const day of slots.data) {
            const calendarDate = new Date(day.date);
            calendarDate.setUTCHours(0, 0, 0, 0);
            let calendar = yield tx.calendar.findUnique({
                where: {
                    counselor_id_date: {
                        counselor_id: counselorId,
                        date: calendarDate,
                    },
                },
            });
            if (!calendar) {
                calendar = yield tx.calendar.create({
                    data: {
                        counselor_id: counselorId,
                        date: calendarDate,
                    },
                });
            }
            for (const slot of day.slots) {
                allSlots.push({
                    calendar_id: calendar.id,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    type: slot.type,
                    status: 'AVAILABLE',
                });
            }
        }
        const createdSlots = yield tx.timeSlot.createMany({
            data: allSlots,
            skipDuplicates: true,
        });
        return createdSlots;
    }));
    return result;
});
const GetSlotsWithCalendarDate = (counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    const calendars = yield prisma_1.default.calendar.findMany({
        where: { counselor_id: counselorId },
        include: { time_slots: true },
    });
    return calendars;
});
const CalendarService = {
    GetCalenders,
    CreateCalenderDate,
    GetDateSlots,
    CreateDateSlots,
    CreateSlotsWithCalendarDate,
    GetSlotsWithCalendarDate,
};
exports.default = CalendarService;
