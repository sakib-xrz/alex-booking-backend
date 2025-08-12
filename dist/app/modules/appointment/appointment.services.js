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
const GetCounselorAppointmentsById = (counselor_id, filters, paginationOptions) => __awaiter(void 0, void 0, void 0, function* () {
    const { page, limit, skip, sort_by, sort_order } = (0, pagination_1.default)(paginationOptions);
    const { search, session_type, status, date } = filters;
    // Build where clause
    const whereConditions = {
        counselor_id,
        status: {
            not: 'PENDING',
        },
    };
    // Add search functionality across client fields
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
    // Add session_type filter
    if (session_type) {
        whereConditions.session_type = session_type;
    }
    // Add status filter
    if (status) {
        whereConditions.status = status;
    }
    // Add date filter
    if (date) {
        whereConditions.date = new Date(date);
    }
    // Build order by clause
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
    // Get total count for pagination
    const total = yield prisma_1.default.appointment.count({
        where: whereConditions,
    });
    // Get appointments with pagination
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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    const appointment = yield prisma_1.default.appointment.findUniqueOrThrow({
        where: {
            id,
        },
        include: {
            client: true,
            time_slot: true,
            payment: true,
        },
    });
    const formattedAppointment = {
        id: appointment.id,
        appointmentDate: appointment.date,
        sessionType: appointment.session_type,
        notes: appointment.notes,
        status: appointment.status,
        createdAt: appointment.created_at,
        client: {
            firstName: appointment.client.first_name,
            lastName: appointment.client.last_name,
            email: appointment.client.email,
            phone: appointment.client.phone,
            dateOfBirth: appointment.client.date_of_birth,
            gender: appointment.client.gender,
            isVerified: appointment.client.is_verified,
            createdAt: appointment.client.created_at,
        },
        timeSlot: {
            id: appointment.time_slot.id,
            startTime: appointment.time_slot.start_time,
            endTime: appointment.time_slot.end_time,
        },
        payment: {
            id: (_a = appointment.payment) === null || _a === void 0 ? void 0 : _a.id,
            amount: (_b = appointment.payment) === null || _b === void 0 ? void 0 : _b.amount,
            status: (_c = appointment.payment) === null || _c === void 0 ? void 0 : _c.status,
            paymentMethod: (_d = appointment.payment) === null || _d === void 0 ? void 0 : _d.payment_method,
            transactionId: (_e = appointment.payment) === null || _e === void 0 ? void 0 : _e.transaction_id,
            refundAmount: (_f = appointment.payment) === null || _f === void 0 ? void 0 : _f.refund_amount,
            refundReason: (_g = appointment.payment) === null || _g === void 0 ? void 0 : _g.refund_reason,
            createdAt: (_h = appointment.payment) === null || _h === void 0 ? void 0 : _h.created_at,
        },
    };
    return formattedAppointment;
});
const AppointmentService = {
    GetCounselorAppointmentsById,
    GetCounselorAppointmentDetailsById,
};
exports.default = AppointmentService;
