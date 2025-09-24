import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import GoogleOAuthService from './google.services';
import AppError from '../../errors/AppError';
import config from '../../config';

// Get Google OAuth URL for doctor to connect calendar
const getGoogleAuthUrl = catchAsync(async (req, res) => {
  const userId = req.user.id; // Get user ID from auth middleware
  const authUrl = GoogleOAuthService.generateAuthUrl(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google OAuth URL generated successfully',
    data: { authUrl },
  });
});

// Handle Google OAuth callback
const handleGoogleCallback = catchAsync(async (req, res) => {
  const { code, state } = req.query;
  const userId = state as string; // Get user ID from state parameter

  if (!code) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Authorization code is required',
    );
  }

  if (!userId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'User ID not found in state parameter',
    );
  }

  await GoogleOAuthService.handleOAuthCallback(code as string, userId);

  // Redirect to frontend with success message
  const frontendUrl = config.base_url.admin_frontend;
  res.redirect(`${frontendUrl}/settings?calendar=connected`);
});

// Get Google Calendar connection status
const getCalendarStatus = catchAsync(async (req, res) => {
  const userId = req.user.id;

  console.log(`Getting calendar status for user: ${userId}`);

  const connectionInfo =
    await GoogleOAuthService.getCalendarConnectionInfo(userId);

  console.log('Calendar connection info:', {
    isConnected: connectionInfo.isConnected,
    hasConnectedAccount: !!connectionInfo.connectedAccount,
    accountName: connectionInfo.connectedAccount?.name,
    accountEmail: connectionInfo.connectedAccount?.email,
  });

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Calendar connection status retrieved successfully',
    data: connectionInfo,
  });
});

// Debug: Get current user's Google data from database
const debugUserGoogleData = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await GoogleOAuthService.getUserGoogleData(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User Google data retrieved',
    data: user,
  });
});

// Force refresh Google account info
const refreshGoogleAccountInfo = catchAsync(async (req, res) => {
  const userId = req.user.id;

  console.log(`Force refreshing Google account info for user: ${userId}`);

  const result = await GoogleOAuthService.forceRefreshGoogleAccountInfo(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google account info refreshed successfully',
    data: result,
  });
});

// Disconnect Google Calendar
const disconnectCalendar = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await GoogleOAuthService.disconnectCalendar(userId);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google Calendar disconnected successfully',
    data: result,
  });
});

const GoogleController = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getCalendarStatus,
  debugUserGoogleData,
  refreshGoogleAccountInfo,
  disconnectCalendar,
};

export default GoogleController;
