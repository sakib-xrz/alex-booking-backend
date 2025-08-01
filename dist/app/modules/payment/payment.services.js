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
// Create payment intent - Stripe handles everything after this
const createPaymentIntent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    // Get appointment details
    const appointment = yield prisma_1.default.appointment.findUnique({
        where: { id: data.appointment_id },
        include: { client: true },
    });
    if (!appointment) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
    }
    // Check if payment already exists and is paid
    const existingPayment = yield prisma_1.default.payment.findFirst({
        where: {
            appointment_id: data.appointment_id,
            status: { in: ['PAID', 'PENDING'] },
        },
    });
    if ((existingPayment === null || existingPayment === void 0 ? void 0 : existingPayment.status) === 'PAID') {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Payment already completed for this appointment');
    }
    // If pending payment exists, return existing payment info
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
        // Create Stripe payment intent
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
            // Update existing payment record
            payment = yield prisma_1.default.payment.update({
                where: { id: existingPayment.id },
                data: {
                    amount: data.amount,
                    currency: currency,
                    status: 'PENDING',
                    payment_method: 'stripe',
                    transaction_id: paymentIntent.id,
                    payment_gateway_data: {}, // Reset gateway data for new payment intent
                },
            });
        }
        else {
            // Create new payment record
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
// Get payment by appointment
const getPaymentByAppointment = (appointment_id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.payment.findFirst({
        where: { appointment_id },
        include: { appointment: true },
    });
});
// Webhook handler - the main payment processor
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
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Find the payment record by transaction_id
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            throw new Error(`Payment record not found for transaction: ${paymentIntent.id}`);
        }
        // Update payment status
        const payment = yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'PAID',
                processed_at: new Date(),
                payment_gateway_data: paymentIntent,
            },
        });
        // Confirm appointment
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
        // Update time slot status to BOOKED
        yield tx.timeSlot.update({
            where: { id: appointment === null || appointment === void 0 ? void 0 : appointment.time_slot_id },
            data: { status: 'BOOKED' },
        });
    }));
    console.log(`Payment successful: ${paymentIntent.id}`);
});
const handlePaymentFailed = (paymentIntent) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // Find the payment record
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            return;
        }
        // Update payment status
        yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'FAILED',
                payment_gateway_data: paymentIntent,
            },
        });
        // Reset time slot to AVAILABLE
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
        // Find the payment record
        const existingPayment = yield tx.payment.findUnique({
            where: { transaction_id: paymentIntent.id },
        });
        if (!existingPayment) {
            console.error(`Payment record not found for transaction: ${paymentIntent.id}`);
            return;
        }
        // Update payment status
        yield tx.payment.update({
            where: { transaction_id: paymentIntent.id },
            data: {
                status: 'CANCELLED',
                payment_gateway_data: paymentIntent,
            },
        });
        // Reset time slot to AVAILABLE
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
exports.PaymentService = {
    createPaymentIntent,
    getPaymentByAppointment,
    handleWebhookEvent,
};
