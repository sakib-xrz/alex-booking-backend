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
var googleCalendar_services_exports = {};
__export(googleCalendar_services_exports, {
  default: () => googleCalendar_services_default
});
module.exports = __toCommonJS(googleCalendar_services_exports);
var import_google = __toESM(require("./google.services"));
var import_prisma = __toESM(require("../../utils/prisma"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_http_status = __toESM(require("http-status"));
var import_date_fns = require("date-fns");
const createCalendarEvent = async (data) => {
  var _a, _b, _c;
  console.log("Creating Google Calendar event for appointment:", data);
  if (!data.startDateTime || !data.endDateTime || isNaN(data.startDateTime.getTime()) || isNaN(data.endDateTime.getTime())) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      `Invalid date values: startDateTime=${data.startDateTime}, endDateTime=${data.endDateTime}`
    );
  }
  try {
    const appointment = await import_prisma.default.appointment.findUnique({
      where: { id: data.appointmentId },
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
      throw new import_AppError.default(import_http_status.default.NOT_FOUND, "Appointment not found");
    }
    const isConnected = await import_google.default.isCalendarConnected(
      data.counselorId
    );
    if (!isConnected) {
      console.warn(
        `Google Calendar not connected for counselor ${data.counselorId}`
      );
      return null;
    }
    const calendar = await import_google.default.getCalendarClient(
      data.counselorId
    );
    const eventTitle = `Counseling Session - ${data.clientName}`;
    let formattedDate, formattedStartTime, formattedEndTime;
    try {
      formattedDate = (0, import_date_fns.format)(data.startDateTime, "PPPP");
      formattedStartTime = (0, import_date_fns.format)(data.startDateTime, "p");
      formattedEndTime = (0, import_date_fns.format)(data.endDateTime, "p");
    } catch (error) {
      throw new import_AppError.default(
        import_http_status.default.BAD_REQUEST,
        `Failed to format dates: ${error instanceof Error ? error.message : String(error)}`
      );
    }
    const eventDescription = `
Counseling session with ${data.clientName}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime}
Session Type: ${appointment.session_type}
${appointment.notes ? `Notes: ${appointment.notes}` : ""}

Appointment ID: ${data.appointmentId}
    `.trim();
    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: data.startDateTime.toISOString(),
        timeZone: data.timeZone || "Australia/Sydney"
      },
      end: {
        dateTime: data.endDateTime.toISOString(),
        timeZone: data.timeZone || "Australia/Sydney"
      },
      attendees: [
        {
          email: appointment.counselor.email,
          displayName: appointment.counselor.name,
          responseStatus: "accepted",
          organizer: true
        },
        {
          email: data.clientEmail,
          displayName: data.clientName,
          responseStatus: "needsAction",
          optional: false
        }
      ],
      conferenceData: {
        createRequest: {
          requestId: `${data.appointmentId}-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          // 24 hours before
          { method: "email", minutes: 60 },
          // 1 hour before
          { method: "popup", minutes: 15 }
          // 15 minutes before
        ]
      },
      guestsCanSeeOtherGuests: true,
      guestsCanInviteOthers: false,
      guestsCanModify: false,
      visibility: "public",
      status: "confirmed"
    };
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
      // Send email invitations to all attendees
      sendNotifications: true
      // Ensure notifications are sent
    });
    const createdEvent = response.data;
    const meetingLink = createdEvent.hangoutLink || ((_c = (_b = (_a = createdEvent.conferenceData) == null ? void 0 : _a.entryPoints) == null ? void 0 : _b[0]) == null ? void 0 : _c.uri);
    if (!meetingLink) {
      console.warn("No Google Meet link was created for the event");
    }
    const meeting = await import_prisma.default.meeting.create({
      data: {
        appointment_id: data.appointmentId,
        platform: "GOOGLE_MEET",
        link: meetingLink || ""
      }
    });
    console.log(
      `Google Calendar event created successfully for appointment ${data.appointmentId}`
    );
    console.log(`Event ID: ${createdEvent.id}`);
    console.log(`Meeting Link: ${meetingLink}`);
    console.log(`Event HTML Link: ${createdEvent.htmlLink}`);
    console.log(`Event attendees:`, createdEvent.attendees);
    try {
      const verifyEvent = await calendar.events.get({
        calendarId: "primary",
        eventId: createdEvent.id
      });
      console.log(
        `Event verification - Status: ${verifyEvent.data.status}, Visibility: ${verifyEvent.data.visibility}`
      );
      await calendar.events.patch({
        calendarId: "primary",
        eventId: createdEvent.id,
        requestBody: {
          attendees: event.attendees
        },
        sendUpdates: "all"
      });
      console.log("Event attendees updated to ensure visibility");
    } catch (verifyError) {
      console.warn("Failed to verify/update created event:", verifyError);
    }
    return {
      eventId: createdEvent.id,
      meetingLink,
      meetingId: meeting.id,
      htmlLink: createdEvent.htmlLink
    };
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    if (error instanceof Error && "code" in error) {
      const googleError = error;
      if (googleError.code === 401) {
        throw new import_AppError.default(
          import_http_status.default.UNAUTHORIZED,
          "Google Calendar access expired. Please reconnect your calendar."
        );
      } else if (googleError.code === 403) {
        throw new import_AppError.default(
          import_http_status.default.FORBIDDEN,
          "Insufficient permissions for Google Calendar. Please reconnect with proper permissions."
        );
      }
    }
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      `Failed to create Google Calendar event: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
const updateCalendarEvent = async (eventId, counselorId, updates) => {
  try {
    const calendar = await import_google.default.getCalendarClient(counselorId);
    const response = await calendar.events.patch({
      calendarId: "primary",
      eventId,
      requestBody: updates,
      sendUpdates: "all"
    });
    return response.data;
  } catch (error) {
    console.error("Error updating Google Calendar event:", error);
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to update Google Calendar event"
    );
  }
};
const cancelCalendarEvent = async (eventId, counselorId) => {
  try {
    const calendar = await import_google.default.getCalendarClient(counselorId);
    await calendar.events.delete({
      calendarId: "primary",
      eventId,
      sendUpdates: "all"
    });
    console.log(`Google Calendar event ${eventId} cancelled successfully`);
  } catch (error) {
    console.error("Error cancelling Google Calendar event:", error);
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to cancel Google Calendar event"
    );
  }
};
const getCalendarEvent = async (eventId, counselorId) => {
  try {
    const calendar = await import_google.default.getCalendarClient(counselorId);
    const response = await calendar.events.get({
      calendarId: "primary",
      eventId
    });
    return response.data;
  } catch (error) {
    console.error("Error getting Google Calendar event:", error);
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to get Google Calendar event"
    );
  }
};
const GoogleCalendarService = {
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  getCalendarEvent
};
var googleCalendar_services_default = GoogleCalendarService;
