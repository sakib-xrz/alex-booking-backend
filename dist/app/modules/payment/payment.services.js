"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var payment_services_exports = {};
__export(payment_services_exports, {
  PaymentService: () => PaymentService
});
module.exports = __toCommonJS(payment_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
var import_payment = require("./payment.utils");
var import_AppError = __toESM(require("../../errors/AppError"));
var import_http_status = __toESM(require("http-status"));
var import_googleCalendar = __toESM(require("../google/googleCalendar.services"));
var import_date_fns = require("date-fns");
const createPaymentIntent = async (data) => {
  const appointment = await import_prisma.default.appointment.findUnique({
    where: { id: data.appointment_id },
    include: { client: true }
  });
  if (!appointment) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "Appointment not found");
  }
  const existingPayment = await import_prisma.default.payment.findFirst({
    where: {
      appointment_id: data.appointment_id,
      status: { in: ["PAID", "PENDING"] }
    }
  });
  if ((existingPayment == null ? void 0 : existingPayment.status) === "PAID") {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Payment already completed for this appointment"
    );
  }
  if ((existingPayment == null ? void 0 : existingPayment.status) === "PENDING" && existingPayment.transaction_id) {
    try {
      const paymentIntent = await import_payment.stripe.paymentIntents.retrieve(
        existingPayment.transaction_id
      );
      if (paymentIntent.client_secret) {
        return {
          client_secret: paymentIntent.client_secret,
          payment_id: existingPayment.id
        };
      }
    } catch (error) {
      console.log("Error retrieving payment intent:", error);
    }
  }
  const currency = data.currency || "AUD";
  const amountInCents = (0, import_payment.dollarsToCents)(data.amount);
  try {
    const paymentIntent = await import_payment.stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      payment_method_types: ["card"],
      metadata: {
        appointment_id: data.appointment_id,
        client_id: appointment.client_id
      },
      receipt_email: appointment.client.email,
      description: `Counseling session payment - ${appointment.date.toISOString().split("T")[0]}`
    });
    let payment;
    if (existingPayment) {
      payment = await import_prisma.default.payment.update({
        where: { id: existingPayment.id },
        data: {
          amount: data.amount,
          currency,
          status: "PENDING",
          payment_method: "stripe",
          transaction_id: paymentIntent.id,
          payment_gateway_data: {}
          // Reset gateway data for new payment intent
        }
      });
    } else {
      payment = await import_prisma.default.payment.create({
        data: {
          appointment_id: data.appointment_id,
          client_id: appointment.client_id,
          amount: data.amount,
          currency,
          status: "PENDING",
          payment_method: "stripe",
          transaction_id: paymentIntent.id
        }
      });
    }
    return {
      client_secret: paymentIntent.client_secret,
      payment_id: payment.id
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to create payment intent"
    );
  }
};
const getPaymentByAppointment = async (appointment_id) => {
  return await import_prisma.default.payment.findFirst({
    where: { appointment_id },
    include: { appointment: true }
  });
};
const handleWebhookEvent = async (event) => {
  console.log(`Processing webhook: ${event.type}`);
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentFailed(event.data.object);
        break;
      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled event: ${event.type}`);
    }
  } catch (error) {
    console.error(`Webhook error for ${event.type}:`, error);
    throw error;
  }
};
const handlePaymentSuccess = async (paymentIntent) => {
  let appointmentId = "";
  await import_prisma.default.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id }
    });
    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`
      );
      throw new Error(
        `Payment record not found for transaction: ${paymentIntent.id}`
      );
    }
    appointmentId = existingPayment.appointment_id;
    const payment = await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: "PAID",
        processed_at: /* @__PURE__ */ new Date(),
        payment_gateway_data: paymentIntent
      }
    });
    await tx.appointment.update({
      where: { id: payment.appointment_id },
      data: { status: "CONFIRMED" }
    });
    const appointment = await tx.appointment.findUnique({
      where: { id: payment.appointment_id },
      select: {
        time_slot_id: true
      }
    });
    await tx.timeSlot.update({
      where: { id: appointment == null ? void 0 : appointment.time_slot_id },
      data: { status: "BOOKED" }
    });
  });
  console.log(`Payment successful: ${paymentIntent.id}`);
  try {
    await createGoogleCalendarEvent(appointmentId);
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
  }
};
const handlePaymentFailed = async (paymentIntent) => {
  await import_prisma.default.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id }
    });
    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`
      );
      return;
    }
    await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: "FAILED",
        payment_gateway_data: paymentIntent
      }
    });
    const appointment = await tx.appointment.findUnique({
      where: { id: existingPayment.appointment_id },
      select: {
        time_slot_id: true
      }
    });
    if (appointment) {
      await tx.timeSlot.update({
        where: { id: appointment.time_slot_id },
        data: { status: "AVAILABLE" }
      });
    }
  });
  console.log(`Payment failed: ${paymentIntent.id}`);
};
const handlePaymentCanceled = async (paymentIntent) => {
  await import_prisma.default.$transaction(async (tx) => {
    const existingPayment = await tx.payment.findUnique({
      where: { transaction_id: paymentIntent.id }
    });
    if (!existingPayment) {
      console.error(
        `Payment record not found for transaction: ${paymentIntent.id}`
      );
      return;
    }
    await tx.payment.update({
      where: { transaction_id: paymentIntent.id },
      data: {
        status: "CANCELLED",
        payment_gateway_data: paymentIntent
      }
    });
    const appointment = await tx.appointment.findUnique({
      where: { id: existingPayment.appointment_id },
      select: {
        time_slot_id: true
      }
    });
    if (appointment) {
      await tx.timeSlot.update({
        where: { id: appointment.time_slot_id },
        data: { status: "AVAILABLE" }
      });
    }
  });
  console.log(`Payment canceled: ${paymentIntent.id}`);
};
const createGoogleCalendarEvent = async (appointmentId) => {
  try {
    const appointment = await import_prisma.default.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        client: true,
        counselor: true,
        time_slot: {
          include: {
            calendar: true
          }
        }
      }
    });
    if (!appointment) {
      throw new Error("Appointment not found");
    }
    console.log("Appointment before parsing:", appointment);
    const appointmentDate = appointment.date;
    appointmentDate.setHours(0, 0, 0, 0);
    const startTime = (0, import_date_fns.parse)(
      appointment.time_slot.start_time,
      "h:mm a",
      appointmentDate
    );
    const endTime = (0, import_date_fns.parse)(
      appointment.time_slot.end_time,
      "h:mm a",
      appointmentDate
    );
    console.log("Date parsing debug:", {
      originalDate: appointment.date,
      appointmentDate,
      startTimeString: appointment.time_slot.start_time,
      endTimeString: appointment.time_slot.end_time,
      parsedStartTime: startTime,
      parsedEndTime: endTime,
      isStartTimeValid: !isNaN(startTime.getTime()),
      isEndTimeValid: !isNaN(endTime.getTime())
    });
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      throw new Error(
        `Invalid date parsing: startTime=${startTime}, endTime=${endTime}, originalDate=${appointment.date}`
      );
    }
    const calendarResult = await import_googleCalendar.default.createCalendarEvent({
      appointmentId: appointment.id,
      counselorId: appointment.counselor_id,
      clientEmail: appointment.client.email,
      clientName: `${appointment.client.first_name} ${appointment.client.last_name}`,
      startDateTime: startTime,
      endDateTime: endTime,
      timeZone: "Australia/Sydney"
      // Adjust based on your timezone
    });
    if (calendarResult) {
      console.log(
        `Google Calendar event created for appointment ${appointmentId}`
      );
      console.log(`Meeting link: ${calendarResult.meetingLink}`);
    }
    return calendarResult;
  } catch (error) {
    console.error(
      `Failed to create Google Calendar event for appointment ${appointmentId}:`,
      error
    );
    throw error;
  }
};
const PaymentService = {
  createPaymentIntent,
  getPaymentByAppointment,
  handleWebhookEvent
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaymentService
});
