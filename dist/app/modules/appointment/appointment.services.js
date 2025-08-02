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
const GetCounselorAppointmentsById = (counselor_id) => __awaiter(void 0, void 0, void 0, function* () {
    const appointments = yield prisma_1.default.appointment.findMany({
        where: {
            counselor_id,
            status: {
                not: 'PENDING',
            },
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
                },
            },
            created_at: true,
        },
        orderBy: {
            created_at: 'asc',
        },
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
    return formattedAppointments;
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
