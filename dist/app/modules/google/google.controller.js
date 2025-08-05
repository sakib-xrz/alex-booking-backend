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
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const google_services_1 = __importDefault(require("./google.services"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
// Get Google OAuth URL for doctor to connect calendar
const getGoogleAuthUrl = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id; // Get user ID from auth middleware
    const authUrl = google_services_1.default.generateAuthUrl(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Google OAuth URL generated successfully',
        data: { authUrl },
    });
}));
// Handle Google OAuth callback
const handleGoogleCallback = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code, state } = req.query;
    const userId = state; // Get user ID from state parameter
    if (!code) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Authorization code is required');
    }
    if (!userId) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'User ID not found in state parameter');
    }
    const result = yield google_services_1.default.handleOAuthCallback(code, userId);
    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?calendar=connected`);
}));
// Get Google Calendar connection status
const getCalendarStatus = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const isConnected = yield google_services_1.default.isCalendarConnected(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Calendar connection status retrieved successfully',
        data: { isConnected },
    });
}));
// Disconnect Google Calendar
const disconnectCalendar = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user.id;
    const result = yield google_services_1.default.disconnectCalendar(userId);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Google Calendar disconnected successfully',
        data: result,
    });
}));
const GoogleController = {
    getGoogleAuthUrl,
    handleGoogleCallback,
    getCalendarStatus,
    disconnectCalendar,
};
exports.default = GoogleController;
