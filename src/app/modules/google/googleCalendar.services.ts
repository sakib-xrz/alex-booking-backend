import { calendar_v3 } from 'googleapis';
import GoogleOAuthService from './google.services';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';
import { format } from 'date-fns';

interface CreateEventData {
  appointmentId: string;
  counselorId: string;
  clientEmail: string;
  clientName: string;
  startDateTime: Date;
  endDateTime: Date;
  timeZone?: string;
}

// Create Google Calendar event with Google Meet
const createCalendarEvent = async (data: CreateEventData) => {
  try {
    // Get appointment details
    const appointment = await prisma.appointment.findUnique({
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
      throw new AppError(httpStatus.NOT_FOUND, 'Appointment not found');
    }

    // Check if counselor has Google Calendar connected
    const isConnected = await GoogleOAuthService.isCalendarConnected(
      data.counselorId,
    );
    if (!isConnected) {
      console.warn(
        `Google Calendar not connected for counselor ${data.counselorId}`,
      );
      return null; // Don't fail the payment, just skip calendar creation
    }

    // Get authenticated calendar client
    const calendar = await GoogleOAuthService.getCalendarClient(
      data.counselorId,
    );

    // Create event details
    const eventTitle = `Counseling Session - ${data.clientName}`;
    const eventDescription = `
Counseling session with ${data.clientName}
Date: ${format(data.startDateTime, 'PPPP')}
Time: ${format(data.startDateTime, 'p')} - ${format(data.endDateTime, 'p')}
Session Type: ${appointment.session_type}
${appointment.notes ? `Notes: ${appointment.notes}` : ''}

Appointment ID: ${data.appointmentId}
    `.trim();

    const event: calendar_v3.Schema$Event = {
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
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all', // Send email invitations to all attendees
    });

    const createdEvent = response.data;
    const meetingLink =
      createdEvent.hangoutLink ||
      createdEvent.conferenceData?.entryPoints?.[0]?.uri;

    if (!meetingLink) {
      console.warn('No Google Meet link was created for the event');
    }

    // Save meeting details to database
    const meeting = await prisma.meeting.create({
      data: {
        appointment_id: data.appointmentId,
        platform: 'GOOGLE_MEET',
        link: meetingLink || '',
      },
    });

    console.log(
      `Google Calendar event created successfully for appointment ${data.appointmentId}`,
    );
    console.log(`Event ID: ${createdEvent.id}`);
    console.log(`Meeting Link: ${meetingLink}`);

    return {
      eventId: createdEvent.id,
      meetingLink: meetingLink,
      meetingId: meeting.id,
      htmlLink: createdEvent.htmlLink,
    };
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);

    // If it's a Google API error, provide more specific error message
    if (error instanceof Error && 'code' in error) {
      const googleError = error as any;
      if (googleError.code === 401) {
        throw new AppError(
          httpStatus.UNAUTHORIZED,
          'Google Calendar access expired. Please reconnect your calendar.',
        );
      } else if (googleError.code === 403) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'Insufficient permissions for Google Calendar. Please reconnect with proper permissions.',
        );
      }
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Failed to create Google Calendar event: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// Update calendar event
const updateCalendarEvent = async (
  eventId: string,
  counselorId: string,
  updates: Partial<calendar_v3.Schema$Event>,
) => {
  try {
    const calendar = await GoogleOAuthService.getCalendarClient(counselorId);

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: updates,
      sendUpdates: 'all',
    });

    return response.data;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to update Google Calendar event',
    );
  }
};

// Cancel calendar event
const cancelCalendarEvent = async (eventId: string, counselorId: string) => {
  try {
    const calendar = await GoogleOAuthService.getCalendarClient(counselorId);

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all',
    });

    console.log(`Google Calendar event ${eventId} cancelled successfully`);
  } catch (error) {
    console.error('Error cancelling Google Calendar event:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to cancel Google Calendar event',
    );
  }
};

// Get calendar event details
const getCalendarEvent = async (eventId: string, counselorId: string) => {
  try {
    const calendar = await GoogleOAuthService.getCalendarClient(counselorId);

    const response = await calendar.events.get({
      calendarId: 'primary',
      eventId: eventId,
    });

    return response.data;
  } catch (error) {
    console.error('Error getting Google Calendar event:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to get Google Calendar event',
    );
  }
};

const GoogleCalendarService = {
  createCalendarEvent,
  updateCalendarEvent,
  cancelCalendarEvent,
  getCalendarEvent,
};

export default GoogleCalendarService;
