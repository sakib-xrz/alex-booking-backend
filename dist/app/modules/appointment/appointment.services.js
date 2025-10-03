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
    const appointment = yield prisma_1.default.appointment.findUnique({
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
    const updatedAppointment = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield tx.timeSlot.update({
                where: { id: appointment.time_slot_id },
                data: { status: 'AVAILABLE' },
            });
            const updated = yield tx.appointment.update({
                where: { id },
                data: { status: 'CANCELLED' },
            });
            if (appointment.meeting) {
                yield tx.meeting.delete({
                    where: { id: appointment.meeting.id },
                });
            }
            return updated;
        }
        catch (error) {
            console.error('Error during appointment cancellation:', error);
            throw error;
        }
    }));
    if (appointment.event_id) {
        try {
            yield googleCalendar_services_1.default.cancelCalendarEvent(appointment.event_id, counselorId);
        }
        catch (calendarError) {
            console.error('Failed to cancel Google Calendar event:', calendarError);
        }
    }
    return updatedAppointment;
});
const RescheduleAppointmentById = (appointmentId, counselorId, newTimeSlotId) => __awaiter(void 0, void 0, void 0, function* () {
    const txResult = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const currentAppointment = yield tx.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                time_slot: {
                    include: {
                        calendar: true,
                    },
                },
                client: true,
                counselor: true,
                meeting: true,
            },
        });
        if (!currentAppointment) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
        }
        if (currentAppointment.counselor_id !== counselorId) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'You are not authorized to reschedule this appointment');
        }
        if (currentAppointment.status === 'CANCELLED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot reschedule a cancelled appointment');
        }
        if (currentAppointment.status === 'COMPLETED') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Cannot reschedule a completed appointment');
        }
        const newTimeSlot = yield tx.timeSlot.findUnique({
            where: { id: newTimeSlotId },
            include: {
                calendar: true,
            },
        });
        if (!newTimeSlot) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'New time slot not found');
        }
        if (newTimeSlot.status !== 'AVAILABLE') {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Selected time slot is not available');
        }
        const newCalendar = yield tx.calendar.findUnique({
            where: { id: newTimeSlot.calendar_id },
        });
        if (!newCalendar || newCalendar.counselor_id !== counselorId) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'New time slot must belong to the same counselor');
        }
        yield tx.timeSlot.update({
            where: { id: currentAppointment.time_slot_id },
            data: { status: 'AVAILABLE' },
        });
        yield tx.timeSlot.update({
            where: { id: newTimeSlotId },
            data: { status: 'BOOKED', is_rescheduled: true },
        });
        const updatedAppointment = yield tx.appointment.update({
            where: { id: appointmentId },
            data: {
                time_slot_id: newTimeSlotId,
                date: newTimeSlot.calendar.date,
                status: 'CONFIRMED',
                is_rescheduled: true,
            },
            include: {
                time_slot: {
                    include: {
                        calendar: true,
                    },
                },
                client: true,
                counselor: true,
                meeting: true,
            },
        });
        return {
            updatedAppointment,
            eventId: currentAppointment.event_id,
            appointmentDate: newTimeSlot.calendar.date,
            startTimeText: newTimeSlot.start_time,
            endTimeText: newTimeSlot.end_time,
            clientEmail: currentAppointment.client.email,
            clientName: `${currentAppointment.client.first_name} ${currentAppointment.client.last_name}`,
        };
    }), {
        timeout: 10000,
        maxWait: 5000,
    });
    const { updatedAppointment, eventId, appointmentDate, startTimeText, endTimeText, clientEmail, clientName, } = txResult;
    if (eventId) {
        setImmediate(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const businessTimeZone = 'Asia/Dhaka';
                const appointmentDateObj = new Date(appointmentDate);
                const startTimeMatch = startTimeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                const endTimeMatch = endTimeText.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
                if (!startTimeMatch || !endTimeMatch) {
                    console.error('Invalid time format in time slot for Google Calendar update');
                    return;
                }
                let startHour = parseInt(startTimeMatch[1]);
                const startMinute = parseInt(startTimeMatch[2]);
                const startPeriod = startTimeMatch[3].toUpperCase();
                if (startPeriod === 'PM' && startHour !== 12) {
                    startHour += 12;
                }
                else if (startPeriod === 'AM' && startHour === 12) {
                    startHour = 0;
                }
                let endHour = parseInt(endTimeMatch[1]);
                const endMinute = parseInt(endTimeMatch[2]);
                const endPeriod = endTimeMatch[3].toUpperCase();
                if (endPeriod === 'PM' && endHour !== 12) {
                    endHour += 12;
                }
                else if (endPeriod === 'AM' && endHour === 12) {
                    endHour = 0;
                }
                const year = appointmentDateObj.getFullYear();
                const month = String(appointmentDateObj.getMonth() + 1).padStart(2, '0');
                const day = String(appointmentDateObj.getDate()).padStart(2, '0');
                const startTimeStr = `${year}-${month}-${day}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00+06:00`;
                const endTimeStr = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00+06:00`;
                const utcStartTime = new Date(startTimeStr);
                const utcEndTime = new Date(endTimeStr);
                console.log('=== RESCHEDULE TIMEZONE DEBUG ===');
                console.log('Original time slot:', startTimeText, '-', endTimeText);
                console.log('Created time strings:', startTimeStr, '-', endTimeStr);
                console.log('Converted to UTC:', utcStartTime.toISOString(), '-', utcEndTime.toISOString());
                console.log('Business timezone:', businessTimeZone);
                yield googleCalendar_services_1.default.rescheduleCalendarEvent(eventId, counselorId, {
                    appointmentId,
                    clientEmail,
                    clientName,
                    startDateTime: utcStartTime,
                    endDateTime: utcEndTime,
                    timeZone: businessTimeZone,
                });
            }
            catch (calendarError) {
                console.error('Failed to reschedule Google Calendar event (async):', calendarError);
            }
        }));
    }
    return updatedAppointment;
});
const AppointmentService = {
    GetCounselorAppointmentsById,
    GetCounselorAppointmentDetailsById,
    CompleteAppointmentById,
    CancelAppointmentById,
    RescheduleAppointmentById,
};
exports.default = AppointmentService;
