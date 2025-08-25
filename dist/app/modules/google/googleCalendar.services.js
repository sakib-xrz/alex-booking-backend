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
const date_fns_tz_1 = require("date-fns-tz");
const createCalendarEvent = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log('Creating Google Calendar event for appointment:', data);
    if (!data.startDateTime ||
        !data.endDateTime ||
        isNaN(data.startDateTime.getTime()) ||
        isNaN(data.endDateTime.getTime())) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Invalid date values: startDateTime=${data.startDateTime}, endDateTime=${data.endDateTime}`);
    }
    try {
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
        const isConnected = yield google_services_1.default.isCalendarConnected(data.counselorId);
        if (!isConnected) {
            console.warn(`Google Calendar not connected for counselor ${data.counselorId}`);
            return null;
        }
        const calendar = yield google_services_1.default.getCalendarClient(data.counselorId);
        const eventTitle = `Counselling Session - ${data.clientName}`;
        const businessTimeZone = data.timeZone || 'Asia/Dhaka';
        const localStartTime = (0, date_fns_tz_1.toZonedTime)(data.startDateTime, businessTimeZone);
        const localEndTime = (0, date_fns_tz_1.toZonedTime)(data.endDateTime, businessTimeZone);
        console.log('=== GOOGLE CALENDAR DEBUG ===');
        console.log('Received UTC times:', data.startDateTime.toISOString(), '-', data.endDateTime.toISOString());
        console.log('Converted to local for display:', localStartTime.toLocaleString(), '-', localEndTime.toLocaleString());
        console.log('Business timezone:', businessTimeZone);
        let formattedDate, formattedStartTime, formattedEndTime;
        try {
            formattedDate = (0, date_fns_1.format)(localStartTime, 'PPPP');
            formattedStartTime = (0, date_fns_1.format)(localStartTime, 'p');
            formattedEndTime = (0, date_fns_1.format)(localEndTime, 'p');
        }
        catch (error) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, `Failed to format dates: ${error instanceof Error ? error.message : String(error)}`);
        }
        const eventDescription = `
Counselling session with ${data.clientName}
Date: ${formattedDate}
Time: ${formattedStartTime} - ${formattedEndTime} (${businessTimeZone})
Session Type: ${appointment.session_type}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}

Appointment ID: ${data.appointmentId}
    `.trim();
        const event = {
            summary: eventTitle,
            description: eventDescription,
            start: {
                dateTime: data.startDateTime.toISOString(),
                timeZone: businessTimeZone,
            },
            end: {
                dateTime: data.endDateTime.toISOString(),
                timeZone: businessTimeZone,
            },
            attendees: [
                {
                    email: appointment.counselor.email,
                    displayName: appointment.counselor.name,
                    responseStatus: 'accepted',
                    organizer: true,
                },
                {
                    email: data.clientEmail,
                    displayName: data.clientName,
                    responseStatus: 'needsAction',
                    optional: false,
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
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'email', minutes: 60 },
                    { method: 'popup', minutes: 15 },
                ],
            },
            guestsCanSeeOtherGuests: true,
            guestsCanInviteOthers: false,
            guestsCanModify: false,
            visibility: 'public',
            status: 'confirmed',
        };
        const response = yield calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all',
            sendNotifications: true,
        });
        const createdEvent = response.data;
        const meetingLink = createdEvent.hangoutLink ||
            ((_c = (_b = (_a = createdEvent.conferenceData) === null || _a === void 0 ? void 0 : _a.entryPoints) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.uri);
        if (!meetingLink) {
            console.warn('No Google Meet link was created for the event');
        }
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
        console.log(`Event HTML Link: ${createdEvent.htmlLink}`);
        console.log(`Event attendees:`, createdEvent.attendees);
        try {
            const verifyEvent = yield calendar.events.get({
                calendarId: 'primary',
                eventId: createdEvent.id,
            });
            console.log(`Event verification - Status: ${verifyEvent.data.status}, Visibility: ${verifyEvent.data.visibility}`);
            yield calendar.events.patch({
                calendarId: 'primary',
                eventId: createdEvent.id,
                requestBody: {
                    attendees: event.attendees,
                },
                sendUpdates: 'all',
            });
            console.log('Event attendees updated to ensure visibility');
        }
        catch (verifyError) {
            console.warn('Failed to verify/update created event:', verifyError);
        }
        return {
            eventId: createdEvent.id,
            meetingLink: meetingLink,
            meetingId: meeting.id,
            htmlLink: createdEvent.htmlLink,
        };
    }
    catch (error) {
        console.error('Error creating Google Calendar event:', error);
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
const updateCalendarEvent = (eventId, counselorId, updates) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const calendar = yield google_services_1.default.getCalendarClient(counselorId);
        const response = yield calendar.events.patch({
            calendarId: 'primary',
            eventId: eventId,
            requestBody: updates,
            sendUpdates: 'all',
        });
        return response.data;
    }
    catch (error) {
        console.error('Error updating Google Calendar event:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to update Google Calendar event');
    }
});
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
