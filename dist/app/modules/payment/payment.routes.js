"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const payment_controller_1 = require("./payment.controller");
const payment_validation_1 = require("./payment.validation");
const router = express_1.default.Router();
router.post('/create-intent', (0, validateRequest_1.default)(payment_validation_1.PaymentValidation.createPaymentIntentSchema), payment_controller_1.PaymentController.createPaymentIntent);
router.get('/appointment/:appointment_id', payment_controller_1.PaymentController.getPaymentByAppointment);
exports.PaymentRoutes = router;
