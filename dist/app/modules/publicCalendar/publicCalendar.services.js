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
const GetCounselorCalendar = (counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    const calendarDates = yield prisma_1.default.calendar.findMany({
        where: {
            counselor_id: counselorId,
            counselor: {
                is_deleted: false,
            },
        },
        select: {
            id: true,
            date: true,
            counselor: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profile_picture: true,
                },
            },
            _count: {
                select: {
                    time_slots: {
                        where: {
                            status: 'AVAILABLE',
                        },
                    },
                },
            },
        },
        orderBy: {
            date: 'asc',
        },
    });
    const calendar = calendarDates.map((item) => ({
        id: item.id,
        date: item.date.toISOString().split('T')[0],
        counselor: item.counselor,
        availableSlots: item._count.time_slots,
        hasAvailableSlots: item._count.time_slots > 0,
    }));
    return { calendar };
});
const GetCounselorDateSlots = (calendarId, date, type) => __awaiter(void 0, void 0, void 0, function* () {
    const where = {
        calendar: {
            date: new Date(date).toISOString(),
            counselor_id: calendarId,
        },
        status: 'AVAILABLE',
    };
    if (type) {
        where.type = type;
    }
    const slots = yield prisma_1.default.timeSlot.findMany({
        where,
    });
    const sortedSlots = slots.sort((a, b) => {
        const aTime = new Date(`1970-01-01T${a.start_time}`);
        const bTime = new Date(`1970-01-01T${b.start_time}`);
        return aTime.getTime() - bTime.getTime();
    });
    return { slots: sortedSlots };
});
const PublicCalendarService = {
    GetCounselorCalendar,
    GetCounselorDateSlots,
};
exports.default = PublicCalendarService;
