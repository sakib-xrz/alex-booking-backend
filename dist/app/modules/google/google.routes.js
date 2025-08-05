"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleRoutes = void 0;
const express_1 = __importDefault(require("express"));
const google_controller_1 = __importDefault(require("./google.controller"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
// Get Google OAuth URL (only for counselors/doctors)
router.get('/auth-url', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.getGoogleAuthUrl);
// Handle Google OAuth callback (no auth required - Google redirects here)
router.get('/callback', google_controller_1.default.handleGoogleCallback);
// Get calendar connection status (only for counselors/doctors)
router.get('/status', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.getCalendarStatus);
// Disconnect Google Calendar (only for counselors/doctors)
router.delete('/disconnect', (0, auth_1.default)(client_1.Role.COUNSELOR, client_1.Role.SUPER_ADMIN), google_controller_1.default.disconnectCalendar);
exports.GoogleRoutes = router;
