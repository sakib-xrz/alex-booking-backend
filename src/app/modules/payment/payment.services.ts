import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import { stripe, dollarsToCents } from './payment.utils';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import Stripe from 'stripe';

interface CreatePaymentIntentData {
  appointment_id: string;
  amount: number;
  currency?: string;
}

// Create payment intent - Stripe handles everything after this
const createPaymentIntent = async (
  data: CreatePaymentIntentData,
): Promise<{ client_secret: string; payment_id: string }> => {
  // Get appointment details
  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointment_id },
    include: { client: true },
  });

  if (!appointment) {
    throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found');
  }

  // Check if payment already exists
  const existingPayment = await prisma.payment.findFirst({
    where: {
      appointment_id: data.appointment_id,
      status: { in: ['PAID'] },
    },
  });

  if (existingPayment) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment already exists for this appointment',
    );
  }

  const currency = data.currency || 'AUD';
  const amountInCents = dollarsToCents(data.amount);

  try {
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
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

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        appointment_id: data.appointment_id,
        client_id: appointment.client_id,
        amount: data.amount,
        currency: currency,
        status: 'PENDING' as PaymentStatus,
        payment_method: 'stripe',
        transaction_id: paymentIntent.id,
      },
    });

    return {
      client_secret: paymentIntent.client_secret!,
      payment_id: payment.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to create payment intent',
    );
  }
};

// Get payment by appointment
const getPaymentByAppointment = async (
  appointment_id: string,
): Promise<Payment | null> => {
  return await prisma.payment.findFirst({
    where: { appointment_id },
    include: { appointment: true },
  });
};

// Webhook handler - the main payment processor
const handleWebhookEvent = async (event: Stripe.Event): Promise<void> => {
  console.log(`Processing webhook: ${event.type}`);

  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;

    case 'payment_intent.canceled':
      await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
      break;

    default:
      console.log(`Unhandled event: ${event.type}`);
  }
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.$transaction(async (tx) => {
    // Update payment
    const payment = await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: 'PAID' as PaymentStatus,
        processed_at: new Date(),
        payment_gateway_data: paymentIntent as any,
      },
    });

    // Confirm appointment
    await tx.appointment.update({
      where: { id: payment.appointment_id },
      data: { status: 'CONFIRMED' },
    });
  });

  console.log(`Payment successful: ${paymentIntent.id}`);
};

const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.payment.update({
    where: { transaction_id: paymentIntent.id },
    data: {
      status: 'FAILED' as PaymentStatus,
      payment_gateway_data: paymentIntent as any,
    },
  });

  console.log(`Payment failed: ${paymentIntent.id}`);
};

const handlePaymentCanceled = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.payment.update({
    where: { transaction_id: paymentIntent.id },
    data: {
      status: 'CANCELLED' as PaymentStatus,
      payment_gateway_data: paymentIntent as any,
    },
  });

  console.log(`Payment canceled: ${paymentIntent.id}`);
};

export const PaymentService = {
  createPaymentIntent,
  getPaymentByAppointment,
  handleWebhookEvent,
};
