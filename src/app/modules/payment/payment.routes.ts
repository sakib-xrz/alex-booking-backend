import express from 'express';
import validateRequest from '../../middlewares/validateRequest';
import { PaymentController } from './payment.controller';
import { PaymentValidation } from './payment.validation';

const router = express.Router();

// Note: Webhook is handled directly in app.ts before JSON parsing

// Create payment intent
router.post(
  '/create-intent',
  validateRequest(PaymentValidation.createPaymentIntentSchema),
  PaymentController.createPaymentIntent,
);

// Get payment by appointment
router.get(
  '/appointment/:appointment_id',
  PaymentController.getPaymentByAppointment,
);

export const PaymentRoutes = router;
