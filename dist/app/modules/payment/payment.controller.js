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
exports.PaymentController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const payment_services_1 = require("./payment.services");
const payment_utils_1 = require("./payment.utils");
const createPaymentIntent = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield payment_services_1.PaymentService.createPaymentIntent(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: 'Payment intent created successfully',
        data: result,
    });
}));
const getPaymentByAppointment = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { appointment_id } = req.params;
    const result = yield payment_services_1.PaymentService.getPaymentByAppointment(appointment_id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Payment retrieved successfully',
        data: result,
    });
}));
// Stripe webhook handler
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        console.error('Missing stripe-signature header');
        return res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: 'Missing stripe-signature header',
        });
    }
    try {
        // Ensure we have the raw body
        if (!req.body) {
            throw new Error('No request body received');
        }
        const event = (0, payment_utils_1.constructWebhookEvent)(req.body, signature);
        console.log(`✅ Webhook signature verified for event: ${event.type}`);
        yield payment_services_1.PaymentService.handleWebhookEvent(event);
        res.status(http_status_1.default.OK).json({
            success: true,
            message: 'Webhook processed successfully',
        });
    }
    catch (error) {
        console.error('Webhook error:', error);
        res.status(http_status_1.default.BAD_REQUEST).json({
            success: false,
            message: error instanceof Error ? error.message : 'Webhook processing failed',
        });
    }
});
exports.PaymentController = {
    createPaymentIntent,
    getPaymentByAppointment,
    handleWebhook,
};
