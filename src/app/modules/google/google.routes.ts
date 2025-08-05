import express from 'express';
import GoogleController from './google.controller';
import auth from '../../middlewares/auth';
import { Role } from '@prisma/client';

const router = express.Router();

// Get Google OAuth URL (only for counselors/doctors)
router.get(
  '/auth-url',
  auth(Role.COUNSELOR, Role.SUPER_ADMIN),
  GoogleController.getGoogleAuthUrl,
);

// Handle Google OAuth callback (no auth required - Google redirects here)
router.get('/callback', GoogleController.handleGoogleCallback);

// Get calendar connection status (only for counselors/doctors)
router.get(
  '/status',
  auth(Role.COUNSELOR, Role.SUPER_ADMIN),
  GoogleController.getCalendarStatus,
);

// Disconnect Google Calendar (only for counselors/doctors)
router.delete(
  '/disconnect',
  auth(Role.COUNSELOR, Role.SUPER_ADMIN),
  GoogleController.disconnectCalendar,
);

export const GoogleRoutes = router;
