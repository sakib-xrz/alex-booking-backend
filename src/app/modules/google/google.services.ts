import { google } from 'googleapis';
import config from '../../config';
import prisma from '../../utils/prisma';
import AppError from '../../errors/AppError';
import httpStatus from 'http-status';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  config.google.client_id,
  config.google.client_secret,
  config.google.redirect_uri,
);

// Required scopes for Google Calendar and Meet
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// Generate Google OAuth URL for doctor authentication
const generateAuthUrl = (userId: string) => {
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: userId, // Pass user ID in state parameter
  });
};

// Handle OAuth callback and save tokens
const handleOAuthCallback = async (code: string, userId: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to obtain access token from Google',
      );
    }

    // Save tokens to database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        is_calendar_connected: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to process Google OAuth callback',
    );
  }
};

// Refresh expired access token
const refreshAccessToken = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        google_refresh_token: true,
        google_access_token: true,
      },
    });

    if (!user?.google_refresh_token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'No refresh token found. Please reconnect Google Calendar.',
      );
    }

    // Set credentials for refresh
    oauth2Client.setCredentials({
      refresh_token: user.google_refresh_token,
    });

    // Get new access token
    const { credentials } = await oauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Failed to refresh Google access token',
      );
    }

    // Update database with new token
    await prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : null,
      },
    });

    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Failed to refresh Google access token. Please reconnect Google Calendar.',
    );
  }
};

// Get valid access token (refresh if needed)
const getValidAccessToken = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      google_access_token: true,
      google_refresh_token: true,
      google_token_expiry: true,
      is_calendar_connected: true,
    },
  });

  if (!user?.is_calendar_connected || !user.google_access_token) {
    throw new AppError(
      httpStatus.UNAUTHORIZED,
      'Google Calendar not connected. Please connect your calendar first.',
    );
  }

  // Check if token is expired (with 5-minute buffer)
  const now = new Date();
  const expiryWithBuffer = user.google_token_expiry
    ? new Date(user.google_token_expiry.getTime() - 5 * 60 * 1000)
    : null;

  if (expiryWithBuffer && now > expiryWithBuffer) {
    // Token is expired, refresh it
    return await refreshAccessToken(userId);
  }

  return user.google_access_token;
};

// Set up authenticated Google Calendar client
const getCalendarClient = async (userId: string) => {
  const accessToken = await getValidAccessToken(userId);

  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

// Check if user has calendar connected
const isCalendarConnected = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_calendar_connected: true },
  });

  return user?.is_calendar_connected || false;
};

// Disconnect Google Calendar
const disconnectCalendar = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      is_calendar_connected: false,
    },
  });

  return { message: 'Google Calendar disconnected successfully' };
};

const GoogleOAuthService = {
  generateAuthUrl,
  handleOAuthCallback,
  refreshAccessToken,
  getValidAccessToken,
  getCalendarClient,
  isCalendarConnected,
  disconnectCalendar,
};

export default GoogleOAuthService;
