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
            counselorId,
        },
        select: {
            id: true,
            date: true,
            _count: {
                select: {
                    TimeSlot: true,
                },
            },
        },
    });
    const calender = calenderDates.map((item) => ({
        id: item.id,
        isoDate: item.date,
        date: item.date.toISOString().split('T')[0],
        availableSlots: item._count.TimeSlot,
        haveSlots: !!item._count.TimeSlot,
    }));
    return { calender };
});
const CreateCalenderDate = (counselorId, date) => __awaiter(void 0, void 0, void 0, function* () {
    const createdCalenderDate = yield prisma_1.default.calendar.create({
        data: {
            counselorId,
            date,
        },
    });
    return createdCalenderDate;
});
const GetDateSlots = (calendarId, type) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.timeSlot.findMany({
        where: {
            calendarId,
            type,
        },
    });
    return result;
});
const CreateDateSlots = (calendarId, slots) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.timeSlot.createMany({
        data: slots.data.map((item) => ({
            calendarId,
            startTime: item.startTime,
            endTime: item.endTime,
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
