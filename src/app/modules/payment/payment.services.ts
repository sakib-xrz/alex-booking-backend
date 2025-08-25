import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import { stripe, dollarsToCents } from './payment.utils';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import GoogleCalendarService from '../google/googleCalendar.services';
import { parse } from 'date-fns';

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

  // Check if payment already exists and is paid
  const existingPayment = await prisma.payment.findFirst({
    where: {
      appointment_id: data.appointment_id,
      status: { in: ['PAID', 'PENDING'] },
    },
  });

  if (existingPayment?.status === 'PAID') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Payment already completed for this appointment',
    );
  }

  // If pending payment exists, return existing payment info
  if (existingPayment?.status === 'PENDING' && existingPayment.transaction_id) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        existingPayment.transaction_id,
      );

      if (paymentIntent.client_secret) {
        return {
          client_secret: paymentIntent.client_secret,
          payment_id: existingPayment.id,
        };
      }
    } catch (error) {
      console.log('Error retrieving payment intent:', error);
    }
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
      description: `Counselling session payment - ${appointment.date.toISOString().split('T')[0]}`,
    });

    let payment: Payment;

    if (existingPayment) {
      // Update existing payment record
      payment = await prisma.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: data.amount,
          currency: currency,
          status: 'PENDING' as PaymentStatus,
          payment_method: 'stripe',
          transaction_id: paymentIntent.id,
          payment_gateway_data: {}, // Reset gateway data for new payment intent
        },
      });
    } else {
      // Create new payment record
      payment = await prisma.payment.create({
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
    }

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

  try {
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
  } catch (error) {
    console.error(`Webhook error for ${event.type}:`, error);
    throw error;
  }
};

const handlePaymentSuccess = async (paymentIntent: Stripe.PaymentIntent) => {
  let appointmentId: string = '';

  await prisma.$transaction(async (tx) => {
    // Find the payment record by transaction_id
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id },
    });

    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`,
      );
      throw new Error(
        `Payment record not found for transaction: ${paymentIntent.id}`,
      );
    }

    appointmentId = existingPayment.appointment_id;

    // Update payment status
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

    const appointment = await tx.appointment.findUnique({
      where: { id: payment.appointment_id },
      select: {
        time_slot_id: true,
      },
    });

    // Update time slot status to BOOKED
    await tx.timeSlot.update({
      where: { id: appointment?.time_slot_id },
      data: { status: 'BOOKED' },
    });
  });

  console.log(`Payment successful: ${paymentIntent.id}`);

  // Create Google Calendar event after successful transaction
  try {
    await createGoogleCalendarEvent(appointmentId);
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    // Don't fail the payment process if calendar creation fails
    // The appointment is still confirmed, but without calendar integration
  }
};

const handlePaymentFailed = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.$transaction(async (tx) => {
    // Find the payment record
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id },
    });

    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`,
      );
      return;
    }

    // Update payment status
    await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: 'FAILED' as PaymentStatus,
        payment_gateway_data: paymentIntent as any,
      },
    });

    // Reset time slot to AVAILABLE
    const appointment = await tx.appointment.findUnique({
      where: { id: existingPayment.appointment_id },
      select: {
        time_slot_id: true,
      },
    });

    if (appointment) {
      await tx.timeSlot.update({
        where: { id: appointment.time_slot_id },
        data: { status: 'AVAILABLE' },
      });
    }
  });

  console.log(`Payment failed: ${paymentIntent.id}`);
};

const handlePaymentCanceled = async (paymentIntent: Stripe.PaymentIntent) => {
  await prisma.$transaction(async (tx) => {
    // Find the payment record
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id },
    });

    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`,
      );
      return;
    }

    // Update payment status
    await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: 'CANCELLED' as PaymentStatus,
        payment_gateway_data: paymentIntent as any,
      },
    });

    // Reset time slot to AVAILABLE
    const appointment = await tx.appointment.findUnique({
      where: { id: existingPayment.appointment_id },
      select: {
        time_slot_id: true,
      },
    });

    if (appointment) {
      await tx.timeSlot.update({
        where: { id: appointment.time_slot_id },
        data: { status: 'AVAILABLE' },
      });
    }
  });

  console.log(`Payment canceled: ${paymentIntent.id}`);
};

// Helper function to create Google Calendar event
const createGoogleCalendarEvent = async (appointmentId: string) => {
  try {
    // Get full appointment details
    const appointment = await prisma.appointment.findUnique({
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
    // Ensure we have a valid date by setting it to the beginning of the day
    appointmentDate.setHours(0, 0, 0, 0);

    const startTime = parse(
      appointment.time_slot.start_time,
      'h:mm a',
      appointmentDate,
    );
    const endTime = parse(
      appointment.time_slot.end_time,
      'h:mm a',
      appointmentDate,
    );

    // Debug logging
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

    // Validate dates before proceeding
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error(
        `Invalid date parsing: startTime=${startTime}, endTime=${endTime}, originalDate=${appointment.date}`,
      );
    }

    // Create Google Calendar event
    const calendarResult = await GoogleCalendarService.createCalendarEvent({
      appointmentId: appointment.id,
      counselorId: appointment.counselor_id,
      clientEmail: appointment.client.email,
      clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
      startDateTime: startTime,
      endDateTime: endTime,
      timeZone: 'Asia/Dhaka', // Adjust based on your timezone
    });

    if (calendarResult) {
      console.log(
        `Google Calendar event created for appointment ${appointmentId}`,
      );
      console.log(`Meeting link: ${calendarResult.meetingLink}`);
    }

    return calendarResult;
  } catch (error) {
    console.error(
      `Failed to create Google Calendar event for appointment ${appointmentId}:`,
      error,
    );
    throw error;
  }
};

export const PaymentService = {
  createPaymentIntent,
  getPaymentByAppointment,
  handleWebhookEvent,
};
