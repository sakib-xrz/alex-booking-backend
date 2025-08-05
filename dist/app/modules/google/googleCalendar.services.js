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
const google_services_1 = __importDefault(require("./google.services"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const date_fns_1 = require("date-fns");
// Create Google Calendar event with Google Meet
const createCalendarEvent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        // Get appointment details
        const appointment = yield prisma_1.default.appointment.findUnique({
            where: { id: data.appointmentId },
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
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Appointment not found');
        }
        // Check if counselor has Google Calendar connected
        const isConnected = yield google_services_1.default.isCalendarConnected(data.counselorId);
        if (!isConnected) {
            console.warn(`Google Calendar not connected for counselor ${data.counselorId}`);
            return null; // Don't fail the payment, just skip calendar creation
        }
        // Get authenticated calendar client
        const calendar = yield google_services_1.default.getCalendarClient(data.counselorId);
        // Create event details
        const eventTitle = `Counseling Session - ${data.clientName}`;
        const eventDescription = `
Counseling session with ${data.clientName}
Date: ${(0, date_fns_1.format)(data.startDateTime, 'PPPP')}
Time: ${(0, date_fns_1.format)(data.startDateTime, 'p')} - ${(0, date_fns_1.format)(data.endDateTime, 'p')}
Session Type: ${appointment.session_type}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}

Appointment ID: ${data.appointmentId}
    `.trim();
        const event = {
            summary: eventTitle,
            description: eventDescription,
            start: {
                dateTime: data.startDateTime.toISOString(),
                timeZone: data.timeZone || 'Australia/Sydney',
            },
            end: {
                dateTime: data.endDateTime.toISOString(),
                timeZone: data.timeZone || 'Australia/Sydney',
            },
            attendees: [
                {
                    email: appointment.counselor.email,
                    displayName: appointment.counselor.name,
                    responseStatus: 'accepted',
                },
                {
                    email: data.clientEmail,
                    displayName: data.clientName,
                    responseStatus: 'needsAction',
                },
            ],
            conferenceData: {
                createRequest: {
                    requestId: `${data.appointmentId}-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 }, // 24 hours before
                    { method: 'email', minutes: 60 }, // 1 hour before
                    { method: 'popup', minutes: 15 }, // 15 minutes before
                ],
            },
            visibility: 'private',
            status: 'confirmed',
        };
        // Create the event
        const response = yield calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all', // Send email invitations to all attendees
        });
        const createdEvent = response.data;
        const meetingLink = createdEvent.hangoutLink ||
            ((_c = (_b = (_a = createdEvent.conferenceData) === null || _a === void 0 ? void 0 : _a.entryPoints) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.uri);
        if (!meetingLink) {
            console.warn('No Google Meet link was created for the event');
        }
        // Save meeting details to database
        const meeting = yield prisma_1.default.meeting.create({
            data: {
                appointment_id: data.appointmentId,
                platform: 'GOOGLE_MEET',
                link: meetingLink || '',
            },
        });
        console.log(`Google Calendar event created successfully for appointment ${data.appointmentId}`);
        console.log(`Event ID: ${createdEvent.id}`);
        console.log(`Meeting Link: ${meetingLink}`);
        return {
            eventId: createdEvent.id,
            meetingLink: meetingLink,
            meetingId: meeting.id,
            htmlLink: createdEvent.htmlLink,
        };
    }
    catch (error) {
        console.error('Error creating Google Calendar event:', error);
        // If it's a Google API error, provide more specific error message
        if (error instanceof Error && 'code' in error) {
            const googleError = error;
            if (googleError.code === 401) {
                throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google Calendar access expired. Please reconnect your calendar.');
            }
            else if (googleError.code === 403) {
                throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Insufficient permissions for Google Calendar. Please reconnect with proper permissions.');
            }
        }
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, `Failed to create Google Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
// Update calendar event
const updateCalendarEvent = (eventId, counselorId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calendar = yield google_services_1.default.getCalendarClient(counselorId);
        const response = yield calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            resource: updates,
            sendUpdates: 'all',
        });
        return response.data;
    }
    catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to update Google Calendar event');
    }
});
// Cancel calendar event
const cancelCalendarEvent = (eventId, counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calendar = yield google_services_1.default.getCalendarClient(counselorId);
        yield calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
            sendUpdates: 'all',
        });
        console.log(`Google Calendar event ${eventId} cancelled successfully`);
    }
    catch (error) {
        console.error('Error cancelling Google Calendar event:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to cancel Google Calendar event');
    }
});
// Get calendar event details
const getCalendarEvent = (eventId, counselorId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calendar = yield google_services_1.default.getCalendarClient(counselorId);
        const response = yield calendar.events.get({
            calendarId: 'primary',
            eventId: eventId,
        });
        return response.data;
    }
    catch (error) {
        console.error('Error getting Google Calendar event:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to get Google Calendar event');
    }
});
const GoogleCalendarService = {
    createCalendarEvent,
    updateCalendarEvent,
    cancelCalendarEvent,
    getCalendarEvent,
};
exports.default = GoogleCalendarService;
