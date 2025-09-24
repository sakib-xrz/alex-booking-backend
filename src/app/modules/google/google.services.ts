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

// Required scopes for Google Calendar, Meet, and userinfo
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
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
    console.log('Starting OAuth callback for user:', userId);
    console.log('Google config validation:', {
      hasClientId: !!config.google.client_id,
      hasClientSecret: !!config.google.client_secret,
      hasRedirectUri: !!config.google.redirect_uri,
      redirectUri: config.google.redirect_uri,
    });

    // Create a fresh OAuth client instance for this specific callback
    const callbackOauth2Client = new google.auth.OAuth2(
      config.google.client_id,
      config.google.client_secret,
      config.google.redirect_uri,
    );

    const { tokens } = await callbackOauth2Client.getToken(code);

    console.log('OAuth tokens received:', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      accessTokenLength: tokens.access_token?.length || 0,
      refreshTokenLength: tokens.refresh_token?.length || 0,
      expiryDate: tokens.expiry_date,
      scope: tokens.scope,
      tokenType: tokens.token_type,
    });

    if (!tokens.access_token) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Failed to obtain access token from Google',
      );
    }

    // Set credentials to fetch account info
    const credentials = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };

    console.log('Setting OAuth credentials:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token,
      accessTokenFirst10: tokens.access_token?.substring(0, 10) + '...',
      tokenType: tokens.token_type,
    });

    callbackOauth2Client.setCredentials(credentials);

    // Verify credentials are properly set
    const setCredentials = callbackOauth2Client.credentials;
    console.log('Verification - credentials actually set:', {
      hasAccessToken: !!setCredentials.access_token,
      hasRefreshToken: !!setCredentials.refresh_token,
      accessTokenMatch: setCredentials.access_token === tokens.access_token,
    });

    // Fetch Google account information
    let googleAccountInfo = null;
    try {
      console.log(
        'Attempting to fetch Google account info with fresh OAuth client...',
      );

      const oauth2 = google.oauth2({
        version: 'v2',
        auth: callbackOauth2Client,
      });

      console.log('OAuth2 client created, making userinfo request...');
      const { data } = await oauth2.userinfo.get();

      console.log('Successfully fetched Google account info:', {
        hasName: !!data.name,
        hasEmail: !!data.email,
        hasPicture: !!data.picture,
      });

      googleAccountInfo = {
        name: data.name,
        email: data.email,
        picture: data.picture,
      };
    } catch (accountError) {
      console.error(
        'Failed to fetch Google account info during OAuth:',
        accountError,
      );

      // Log more details about the error
      if (accountError && typeof accountError === 'object') {
        const error = accountError as any;
        console.error('Error details:', {
          message: error.message || 'Unknown error',
          code: error.code || 'No code',
          status: error.status || 'No status',
          config: error.config
            ? {
                url: error.config.url,
                method: error.config.method,
              }
            : 'No config',
        });
      }

      // Don't throw error here - we can still save the tokens and connect calendar
      // Account info can be fetched later when needed
      console.warn(
        'Proceeding with OAuth flow despite account info fetch failure',
      );
    }

    // Save tokens and account info to database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : null,
        google_account_name: googleAccountInfo?.name,
        google_account_email: googleAccountInfo?.email,
        google_account_picture: googleAccountInfo?.picture,
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

    // Create a fresh OAuth client instance for this refresh operation
    const refreshOauth2Client = new google.auth.OAuth2(
      config.google.client_id,
      config.google.client_secret,
      config.google.redirect_uri,
    );

    // Set credentials for refresh
    refreshOauth2Client.setCredentials({
      refresh_token: user.google_refresh_token,
    });

    // Get new access token
    const { credentials } = await refreshOauth2Client.refreshAccessToken();

    if (!credentials.access_token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Failed to refresh Google access token',
      );
    }

    // Update database with new token (and refresh token if provided)
    const updateData: any = {
      google_access_token: credentials.access_token,
      google_token_expiry: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    };

    // Google sometimes provides a new refresh token
    if (credentials.refresh_token) {
      updateData.google_refresh_token = credentials.refresh_token;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    console.log(`Successfully refreshed access token for user ${userId}`);
    return credentials.access_token;
  } catch (error) {
    console.error('Error refreshing access token:', error);

    // If the refresh token is invalid, mark calendar as disconnected
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 400
    ) {
      console.warn(
        `Refresh token invalid for user ${userId}, marking as disconnected`,
      );
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_calendar_connected: false,
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
          google_account_name: null,
          google_account_email: null,
          google_account_picture: null,
        },
      });
    }

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

  // Create a fresh OAuth client instance for this calendar client
  const calendarOauth2Client = new google.auth.OAuth2(
    config.google.client_id,
    config.google.client_secret,
    config.google.redirect_uri,
  );

  calendarOauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({ version: 'v3', auth: calendarOauth2Client });
};

// Check if user has calendar connected
const isCalendarConnected = async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { is_calendar_connected: true },
  });

  return user?.is_calendar_connected || false;
};

// Get Google account profile information
const getGoogleAccountInfo = async (userId: string) => {
  try {
    // Use the existing getValidAccessToken function which handles refresh automatically
    const accessToken = await getValidAccessToken(userId);

    // Get fresh user data after potential token refresh
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        google_refresh_token: true,
      },
    });

    if (!user?.google_refresh_token) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Google refresh token not found. Please reconnect Google Calendar.',
      );
    }

    // Create a fresh OAuth client instance for this account info request
    const accountInfoOauth2Client = new google.auth.OAuth2(
      config.google.client_id,
      config.google.client_secret,
      config.google.redirect_uri,
    );

    // Set credentials with fresh access token and refresh token
    accountInfoOauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: user.google_refresh_token,
    });

    const oauth2 = google.oauth2({
      version: 'v2',
      auth: accountInfoOauth2Client,
    });
    const { data } = await oauth2.userinfo.get();

    return {
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
  } catch (error) {
    console.error('Error fetching Google account info:', error);

    // If it's an authentication error, throw it up to be handled by the caller
    if (error instanceof AppError && error.statusCode === 401) {
      throw error;
    }

    // For Google API errors, check if it's an auth issue
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === 401
    ) {
      throw new AppError(
        httpStatus.UNAUTHORIZED,
        'Google authentication failed. Please reconnect Google Calendar.',
      );
    }

    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Failed to fetch Google account information',
    );
  }
};

// Get calendar connection status with Google account info
const getCalendarConnectionInfo = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      is_calendar_connected: true,
      google_account_name: true,
      google_account_email: true,
      google_account_picture: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  let connectedAccount = null;
  if (user.is_calendar_connected) {
    if (user.google_account_name && user.google_account_email) {
      // Use stored account info from database
      connectedAccount = {
        name: user.google_account_name,
        email: user.google_account_email,
        picture: user.google_account_picture,
      };
    } else {
      // Fallback: fetch from Google API if not stored
      try {
        connectedAccount = await getGoogleAccountInfo(userId);

        // Update database with fetched info for future use
        if (connectedAccount) {
          await prisma.user.update({
            where: { id: userId },
            data: {
              google_account_name: connectedAccount.name,
              google_account_email: connectedAccount.email,
              google_account_picture: connectedAccount.picture,
            },
          });
        }
      } catch (error) {
        // If we can't fetch Google account info, still return connection status
        console.error('Failed to fetch Google account info:', error);

        // For authentication errors, mark as disconnected
        if (error instanceof AppError && error.statusCode === 401) {
          console.warn(
            `Google authentication failed for user ${userId}, marking calendar as disconnected`,
          );
          await prisma.user.update({
            where: { id: userId },
            data: {
              is_calendar_connected: false,
              google_access_token: null,
              google_refresh_token: null,
              google_token_expiry: null,
              google_account_name: null,
              google_account_email: null,
              google_account_picture: null,
            },
          });

          return {
            isConnected: false,
            connectedAccount: null,
          };
        }
      }
    }
  }

  return {
    isConnected: user.is_calendar_connected,
    connectedAccount,
  };
};

// Disconnect Google Calendar
const disconnectCalendar = async (userId: string) => {
  await prisma.user.update({
    where: { id: userId },
    data: {
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      google_account_name: null,
      google_account_email: null,
      google_account_picture: null,
      is_calendar_connected: false,
    },
  });

  return { message: 'Google Calendar disconnected successfully' };
};

// Debug: Get user's Google data from database
const getUserGoogleData = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      is_calendar_connected: true,
      google_access_token: true,
      google_refresh_token: true,
      google_token_expiry: true,
      google_account_name: true,
      google_account_email: true,
      google_account_picture: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Don't expose the actual tokens in debug info
  return {
    ...user,
    google_access_token: user.google_access_token ? '[REDACTED]' : null,
    google_refresh_token: user.google_refresh_token ? '[REDACTED]' : null,
  };
};

// Force refresh Google account info (bypass cache)
const forceRefreshGoogleAccountInfo = async (userId: string) => {
  try {
    console.log(`Force refreshing Google account info for user: ${userId}`);

    // First check if user has calendar connected
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        is_calendar_connected: true,
      },
    });

    if (!user?.is_calendar_connected) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Google Calendar is not connected',
      );
    }

    // Try to get fresh account info from Google
    const accountInfo = await getGoogleAccountInfo(userId);

    // Update database with fresh info
    await prisma.user.update({
      where: { id: userId },
      data: {
        google_account_name: accountInfo.name,
        google_account_email: accountInfo.email,
        google_account_picture: accountInfo.picture,
      },
    });

    console.log(
      `Successfully refreshed account info for user ${userId}: ${accountInfo.name} (${accountInfo.email})`,
    );

    return {
      success: true,
      accountInfo,
      message: 'Google account information refreshed successfully',
    };
  } catch (error) {
    console.error(
      `Failed to refresh Google account info for user ${userId}:`,
      error,
    );

    // If it's an auth error, mark as disconnected
    if (error instanceof AppError && error.statusCode === 401) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          is_calendar_connected: false,
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
          google_account_name: null,
          google_account_email: null,
          google_account_picture: null,
        },
      });

      return {
        success: false,
        disconnected: true,
        message:
          'Google authentication failed. Calendar has been disconnected.',
      };
    }

    throw error;
  }
};

const GoogleOAuthService = {
  generateAuthUrl,
  handleOAuthCallback,
  refreshAccessToken,
  getValidAccessToken,
  getCalendarClient,
  isCalendarConnected,
  getGoogleAccountInfo,
  getCalendarConnectionInfo,
  disconnectCalendar,
  getUserGoogleData,
  forceRefreshGoogleAccountInfo,
};

export default GoogleOAuthService;
