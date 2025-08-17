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
const googleapis_1 = require("googleapis");
const config_1 = __importDefault(require("../../config"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const oauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.google.client_id, config_1.default.google.client_secret, config_1.default.google.redirect_uri);
const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];
const generateAuthUrl = (userId) => {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        state: userId,
    });
};
const handleOAuthCallback = (code, userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { tokens } = yield oauth2Client.getToken(code);
        if (!tokens.access_token) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to obtain access token from Google');
        }
        const updatedUser = yield prisma_1.default.user.update({
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
    }
    catch (error) {
        console.error('Error handling OAuth callback:', error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to process Google OAuth callback');
    }
});
const refreshAccessToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                google_refresh_token: true,
                google_access_token: true,
            },
        });
        if (!(user === null || user === void 0 ? void 0 : user.google_refresh_token)) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'No refresh token found. Please reconnect Google Calendar.');
        }
        oauth2Client.setCredentials({
            refresh_token: user.google_refresh_token,
        });
        const { credentials } = yield oauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Failed to refresh Google access token');
        }
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: {
                google_access_token: credentials.access_token,
                google_token_expiry: credentials.expiry_date
                    ? new Date(credentials.expiry_date)
                    : null,
            },
        });
        return credentials.access_token;
    }
    catch (error) {
        console.error('Error refreshing access token:', error);
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Failed to refresh Google access token. Please reconnect Google Calendar.');
    }
});
const getValidAccessToken = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            google_access_token: true,
            google_refresh_token: true,
            google_token_expiry: true,
            is_calendar_connected: true,
        },
    });
    if (!(user === null || user === void 0 ? void 0 : user.is_calendar_connected) || !user.google_access_token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google Calendar not connected. Please connect your calendar first.');
    }
    const now = new Date();
    const expiryWithBuffer = user.google_token_expiry
        ? new Date(user.google_token_expiry.getTime() - 5 * 60 * 1000)
        : null;
    if (expiryWithBuffer && now > expiryWithBuffer) {
        return yield refreshAccessToken(userId);
    }
    return user.google_access_token;
});
const getCalendarClient = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const accessToken = yield getValidAccessToken(userId);
    oauth2Client.setCredentials({
        access_token: accessToken,
    });
    return googleapis_1.google.calendar({ version: 'v3', auth: oauth2Client });
});
const isCalendarConnected = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { is_calendar_connected: true },
    });
    return (user === null || user === void 0 ? void 0 : user.is_calendar_connected) || false;
});
const disconnectCalendar = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.user.update({
        where: { id: userId },
        data: {
            google_access_token: null,
            google_refresh_token: null,
            google_token_expiry: null,
            is_calendar_connected: false,
        },
    });
    return { message: 'Google Calendar disconnected successfully' };
});
const GoogleOAuthService = {
    generateAuthUrl,
    handleOAuthCallback,
    refreshAccessToken,
    getValidAccessToken,
    getCalendarClient,
    isCalendarConnected,
    disconnectCalendar,
};
exports.default = GoogleOAuthService;
