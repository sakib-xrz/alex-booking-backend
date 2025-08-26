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
const pagination_1 = __importDefault(require("../../utils/pagination"));
const appointment_constant_1 = require("./appointment.constant");
const googleCalendar_services_1 = __importDefault(require("../google/googleCalendar.services"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const GetCounselorAppointmentsById = (counselor_id, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const { search, session_type, status, date } = filters;
    const whereConditions = {
        counselor_id,
        status: {
            not: 'PENDING',
        },
    };
    if (search) {
        whereConditions.OR = appointment_constant_1.appointmentSearchableFields.map((field) => ({
            client: {
                [field]: {
                    contains: search,
                    mode: 'insensitive',
                },
            },
        }));
    }
    if (session_type) {
        whereConditions.session_type = session_type;
    }
    if (status) {
        whereConditions.status = status;
    }
    if (date) {
        whereConditions.date = new Date(date);
    }
    const orderBy = {};
    if (sort_by === 'client_name') {
        orderBy.client = {
            first_name: sort_order,
        };
    }
    else if (sort_by === 'client_email') {
        orderBy.client = {
            email: sort_order,
        };
    }
    else if (sort_by === 'session_type') {
        orderBy.session_type = sort_order;
    }
    else if (sort_by === 'status') {
        orderBy.status = sort_order;
    }
    else if (sort_by === 'date') {
        orderBy.date = sort_order;
    }
    else {
        orderBy.created_at = sort_order;
    }
    const total = yield prisma_1.default.appointment.count({
        where: whereConditions,
    });
    const appointments = yield prisma_1.default.appointment.findMany({
        where: whereConditions,
        select: {
            id: true,
            date: true,
            session_type: true,
            status: true,
            time_slot: {
                select: {
                    start_time: true,
                    end_time: true,
                },
            },
            client: {
                select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                },
            },
            meeting: {
                select: {
                    platform: true,
                    link: true,
                },
            },
            created_at: true,
        },
        orderBy,
        skip,
        take: limit,
    });
    const formattedAppointments = appointments.map((appointment) => ({
        id: appointment.id,
        sessionType: appointment.session_type,
        appointmentDate: appointment.date,
        startTime: appointment.time_slot.start_time,
        endTime: appointment.time_slot.end_time,
        status: appointment.status,
        client: {
            firstName: appointment.client.first_name,
            lastName: appointment.client.last_name,
            email: appointment.client.email,
            phone: appointment.client.phone,
        },
        createdAt: appointment.created_at,
    }));
    return {
        data: formattedAppointments,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const GetCounselorAppointmentDetailsById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield prisma_1.default.appointment.findUnique({
        where: {
            id,
        },
        select: {
            id: true,
            date: true,
            session_type: true,
            status: true,
            time_slot: {
                select: {
                    start_time: true,
                    end_time: true,
                },
            },
            client: {
                select: {
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone: true,
                    date_of_birth: true,
                    gender: true,
                },
            },
            meeting: {
                select: {
                    platform: true,
                    link: true,
                },
            },
            payment: {
                select: {
                    amount: true,
                    currency: true,
                    status: true,
                    transaction_id: true,
                },
            },
            notes: true,
            created_at: true,
        },
    });
    return appointment;
});
const CompleteAppointmentById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield prisma_1.default.appointment.update({
        where: {
            id,
        },
        data: {
            status: 'COMPLETED',
        },
    });
    return appointment;
});
const CancelAppointmentById = (id, counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const appointment = yield tx.appointment.findUnique({
            where: { id },
            include: {
                time_slot: true,
                counselor: true,
                meeting: true,
            },
        });
        if (!appointment) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
        }
        if (appointment.counselor_id !== counselorId) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to cancel this appointment');
        }
        if (appointment.status === 'CANCELLED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Appointment is already cancelled');
        }
        if (appointment.status === 'COMPLETED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot cancel a completed appointment');
        }
        try {
            yield tx.timeSlot.update({
                where: { id: appointment.time_slot_id },
                data: { status: 'AVAILABLE' },
            });
            const updatedAppointment = yield tx.appointment.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            if (appointment.meeting) {
                yield tx.meeting.delete({
                    where: { id: appointment.meeting.id },
                });
            }
            if (appointment.event_id) {
                try {
                    yield googleCalendar_services_1.default.cancelCalendarEvent(appointment.event_id, counselorId);
                }
                catch (calendarError) {
                    console.error('Failed to cancel Google Calendar event:', calendarError);
                }
            }
            return updatedAppointment;
        }
        catch (error) {
            console.error('Error during appointment cancellation:', error);
            throw error;
        }
    }));
});
const AppointmentService = {
    GetCounselorAppointmentsById,
    GetCounselorAppointmentDetailsById,
    CompleteAppointmentById,
    CancelAppointmentById,
};
exports.default = AppointmentService;
