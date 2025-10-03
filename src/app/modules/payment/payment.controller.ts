import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { PaymentService } from './payment.services';
import { constructWebhookEvent } from './payment.utils';
import { Request, Response } from 'express';

const createPaymentIntent = catchAsync(async (req, res) => {
  const result = await PaymentService.createPaymentIntent(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Payment intent created successfully',
    data: result,
  });
});

const getPaymentByAppointment = catchAsync(async (req, res) => {
  const { appointment_id } = req.params;
  const result = await PaymentService.getPaymentByAppointment(appointment_id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Payment retrieved successfully',
    data: result,
  });
});

// Stripe webhook handler
const handleWebhook = async (req: Request, res: Response) => {
  console.log('********** Webhook received from Stripe **********');
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    console.error('Missing stripe-signature header');
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: 'Missing stripe-signature header',
    });
  }

  try {
    // Ensure we have the raw body
    if (!req.body) {
      throw new Error('No request body received');
    }

    const event = constructWebhookEvent(req.body, signature);
    console.log(`✅ Webhook signature verified for event: ${event.type}`);

    await PaymentService.handleWebhookEvent(event);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message:
        error instanceof Error ? error.message : 'Webhook processing failed',
    });
  }
};

export const PaymentController = {
  createPaymentIntent,
  getPaymentByAppointment,
  handleWebhook,
};
