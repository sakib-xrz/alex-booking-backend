import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '../../utils/prisma';
import { stripe, dollarsToCents } from './payment.utils';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import GoogleCalendarService from '../google/googleCalendar.services';

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

    // Define your business timezone - make this configurable
    const businessTimeZone = 'Asia/Dhaka';

    // Get the appointment date
    const appointmentDate = new Date(appointment.date);

    // Parse the time strings and create proper datetime objects in the business timezone
    const startTimeMatch = appointment.time_slot.start_time.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    );
    const endTimeMatch = appointment.time_slot.end_time.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM)/i,
    );

    if (!startTimeMatch || !endTimeMatch) {
      throw new Error('Invalid time format in time slot');
    }

    // Parse start time
    let startHour = parseInt(startTimeMatch[1]);
    const startMinute = parseInt(startTimeMatch[2]);
    const startPeriod = startTimeMatch[3].toUpperCase();

    if (startPeriod === 'PM' && startHour !== 12) {
      startHour += 12;
    } else if (startPeriod === 'AM' && startHour === 12) {
      startHour = 0;
    }

    // Parse end time
    let endHour = parseInt(endTimeMatch[1]);
    const endMinute = parseInt(endTimeMatch[2]);
    const endPeriod = endTimeMatch[3].toUpperCase();

    if (endPeriod === 'PM' && endHour !== 12) {
      endHour += 12;
    } else if (endPeriod === 'AM' && endHour === 12) {
      endHour = 0;
    }

    // Create the date string in YYYY-MM-DD format
    const year = appointmentDate.getFullYear();
    const month = String(appointmentDate.getMonth() + 1).padStart(2, '0');
    const day = String(appointmentDate.getDate()).padStart(2, '0');

    // Create datetime strings in ISO format with explicit timezone offset
    // Asia/Dhaka is UTC+6
    const startTimeStr = `${year}-${month}-${day}T${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}:00+06:00`;
    const endTimeStr = `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}:00+06:00`;

    // Now these are explicitly in Asia/Dhaka timezone and will be automatically converted to UTC
    const startDateTimeUTC = new Date(startTimeStr);
    const endDateTimeUTC = new Date(endTimeStr);

    console.log('=== TIMEZONE DEBUG ===');
    console.log(
      'Original time slot:',
      appointment.time_slot.start_time,
      '-',
      appointment.time_slot.end_time,
    );
    console.log('Created time strings:', startTimeStr, '-', endTimeStr);
    console.log(
      'Converted to UTC:',
      startDateTimeUTC.toISOString(),
      '-',
      endDateTimeUTC.toISOString(),
    );
    console.log('Business timezone:', businessTimeZone);

    // Create Google Calendar event
    const calendarResult = await GoogleCalendarService.createCalendarEvent({
      appointmentId: appointment.id,
      counselorId: appointment.counselor_id,
      clientEmail: appointment.client.email,
      clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
      startDateTime: startDateTimeUTC,
      endDateTime: endDateTimeUTC,
      timeZone: businessTimeZone,
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
