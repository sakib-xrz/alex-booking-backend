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
exports.PaymentService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const payment_utils_1 = require("./payment.utils");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const googleCalendar_services_1 = __importDefault(require("../google/googleCalendar.services"));
const date_fns_1 = require("date-fns");
const createPaymentIntent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    const appointment = yield prisma_1.default.appointment.findUnique({
        where: { id: data.appointment_id },
        include: { client: true },
    });
    if (!appointment) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
    }
    const existingPayment = yield prisma_1.default.payment.findFirst({
        where: {
            appointment_id: data.appointment_id,
            status: { in: ['PAID', 'PENDING'] },
        },
    });
    if ((existingPayment === null || existingPayment === void 0 ? void 0 : existingPayment.status) === 'PAID') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already completed for this appointment');
    }
    if ((existingPayment === null || existingPayment === void 0 ? void 0 : existingPayment.status) === 'PENDING' && existingPayment.transaction_id) {
        try {
            const paymentIntent = yield payment_utils_1.stripe.paymentIntents.retrieve(existingPayment.transaction_id);
            if (paymentIntent.client_secret) {
                return {
                    client_secret: paymentIntent.client_secret,
                    payment_id: existingPayment.id,
                };
            }
        }
        catch (error) {
            console.log('Error retrieving payment intent:', error);
        }
    }
    const currency = data.currency || 'AUD';
    const amountInCents = (0, payment_utils_1.dollarsToCents)(data.amount);
    try {
        const paymentIntent = yield payment_utils_1.stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            payment_method_types: ['card'],
            metadata: {
                appointment_id: data.appointment_id,
                client_id: appointment.client_id,
            },
            receipt_email: appointment.client.email,
            description: `Counseling session payment - ${appointment.date.toISOString().split('T')[0]}`,
        });
        let payment;
        if (existingPayment) {
            payment = yield prisma_1.default.payment.update({
                where: { id: existingPayment.id },
                data: {
                    amount: data.amount,
                    currency: currency,
                    status: 'PENDING',
                    payment_method: 'stripe',
                    transaction_id: paymentIntent.id,
                    payment_gateway_data: {},
                },
            });
        }
        else {
            payment = yield prisma_1.default.payment.create({
                data: {
                    appointment_id: data.appointment_id,
                    client_id: appointment.client_id,
                    amount: data.amount,
                    currency: currency,
                    status: 'PENDING',
                    payment_method: 'stripe',
                    transaction_id: paymentIntent.id,
                },
            });
        }
        return {
            client_secret: paymentIntent.client_secret,
            payment_id: payment.id,
        };
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to create payment intent');
    }
});
const getPaymentByAppointment = (appointment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.payment.findFirst({
        where: { appointment_id },
        include: { appointment: true },
    });
});
const handleWebhookEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`Processing webhook: ${event.type}`);
    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                yield handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                yield handlePaymentFailed(event.data.object);
                break;
            case 'payment_intent.canceled':
                yield handlePaymentCanceled(event.data.object);
                break;
            default:
                console.log(`Unhandled event: ${event.type}`);
        }
    }
    catch (error) {
        console.error(`Webhook error for ${event.type}:`, error);
        throw error;
    }
});
const handlePaymentSuccess = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    let appointmentId = '';
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            throw new Error(`Payment record not found for transaction: ${paymentIntent.id}`);
        }
        appointmentId = existingPayment.appointment_id;
        const payment = yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'PAID',
                processed_at: new Date(),
                payment_gateway_data: paymentIntent,
            },
        });
        yield tx.appointment.update({
            where: { id: payment.appointment_id },
            data: { status: 'CONFIRMED' },
        });
        const appointment = yield tx.appointment.findUnique({
            where: { id: payment.appointment_id },
            select: {
                time_slot_id: true,
            },
        });
        yield tx.timeSlot.update({
            where: { id: appointment === null || appointment === void 0 ? void 0 : appointment.time_slot_id },
            data: { status: 'BOOKED' },
        });
    }));
    console.log(`Payment successful: ${paymentIntent.id}`);
    try {
        yield createGoogleCalendarEvent(appointmentId);
    }
    catch (error) {
        console.error('Error creating Google Calendar event:', error);
    }
});
const handlePaymentFailed = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            return;
        }
        yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'FAILED',
                payment_gateway_data: paymentIntent,
            },
        });
        const appointment = yield tx.appointment.findUnique({
            where: { id: existingPayment.appointment_id },
            select: {
                time_slot_id: true,
            },
        });
        if (appointment) {
            yield tx.timeSlot.update({
                where: { id: appointment.time_slot_id },
                data: { status: 'AVAILABLE' },
            });
        }
    }));
    console.log(`Payment failed: ${paymentIntent.id}`);
});
const handlePaymentCanceled = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            return;
        }
        yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'CANCELLED',
                payment_gateway_data: paymentIntent,
            },
        });
        const appointment = yield tx.appointment.findUnique({
            where: { id: existingPayment.appointment_id },
            select: {
                time_slot_id: true,
            },
        });
        if (appointment) {
            yield tx.timeSlot.update({
                where: { id: appointment.time_slot_id },
                data: { status: 'AVAILABLE' },
            });
        }
    }));
    console.log(`Payment canceled: ${paymentIntent.id}`);
});
const createGoogleCalendarEvent = (appointmentId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const appointment = yield prisma_1.default.appointment.findUnique({
            where: { id: appointmentId },
            include: {
                client: true,
                counselor: true,
                time_slot: {
                    include: {
                        calendar: true,
                    },
                },
            },
        });
        if (!appointment) {
            throw new Error('Appointment not found');
        }
        console.log('Appointment before parsing:', appointment);
        const appointmentDate = appointment.date;
        appointmentDate.setHours(0, 0, 0, 0);
        const startTime = (0, date_fns_1.parse)(appointment.time_slot.start_time, 'h:mm a', appointmentDate);
        const endTime = (0, date_fns_1.parse)(appointment.time_slot.end_time, 'h:mm a', appointmentDate);
        console.log('Date parsing debug:', {
            originalDate: appointment.date,
            appointmentDate: appointmentDate,
            startTimeString: appointment.time_slot.start_time,
            endTimeString: appointment.time_slot.end_time,
            parsedStartTime: startTime,
            parsedEndTime: endTime,
            isStartTimeValid: !isNaN(startTime.getTime()),
            isEndTimeValid: !isNaN(endTime.getTime()),
        });
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
            throw new Error(`Invalid date parsing: startTime=${startTime}, endTime=${endTime}, originalDate=${appointment.date}`);
        }
        const calendarResult = yield googleCalendar_services_1.default.createCalendarEvent({
            appointmentId: appointment.id,
            counselorId: appointment.counselor_id,
            clientEmail: appointment.client.email,
            clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
            startDateTime: startTime,
            endDateTime: endTime,
            timeZone: 'Australia/Sydney',
        });
        if (calendarResult) {
            console.log(`Google Calendar event created for appointment ${appointmentId}`);
            console.log(`Meeting link: ${calendarResult.meetingLink}`);
        }
        return calendarResult;
    }
    catch (error) {
        console.error(`Failed to create Google Calendar event for appointment ${appointmentId}:`, error);
        throw error;
    }
});
exports.PaymentService = {
    createPaymentIntent,
    getPaymentByAppointment,
    handleWebhookEvent,
};
