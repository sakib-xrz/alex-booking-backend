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
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
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
    var _a, _b, _c;
    try {
        console.log('Starting OAuth callback for user:', userId);
        console.log('Google config validation:', {
            hasClientId: !!config_1.default.google.client_id,
            hasClientSecret: !!config_1.default.google.client_secret,
            hasRedirectUri: !!config_1.default.google.redirect_uri,
            redirectUri: config_1.default.google.redirect_uri,
        });
        const callbackOauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.google.client_id, config_1.default.google.client_secret, config_1.default.google.redirect_uri);
        const { tokens } = yield callbackOauth2Client.getToken(code);
        console.log('OAuth tokens received:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            accessTokenLength: ((_a = tokens.access_token) === null || _a === void 0 ? void 0 : _a.length) || 0,
            refreshTokenLength: ((_b = tokens.refresh_token) === null || _b === void 0 ? void 0 : _b.length) || 0,
            expiryDate: tokens.expiry_date,
            scope: tokens.scope,
            tokenType: tokens.token_type,
        });
        if (!tokens.access_token) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Failed to obtain access token from Google');
        }
        const credentials = {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
        };
        console.log('Setting OAuth credentials:', {
            hasAccessToken: !!credentials.access_token,
            hasRefreshToken: !!credentials.refresh_token,
            accessTokenFirst10: ((_c = tokens.access_token) === null || _c === void 0 ? void 0 : _c.substring(0, 10)) + '...',
            tokenType: tokens.token_type,
        });
        callbackOauth2Client.setCredentials(credentials);
        const setCredentials = callbackOauth2Client.credentials;
        console.log('Verification - credentials actually set:', {
            hasAccessToken: !!setCredentials.access_token,
            hasRefreshToken: !!setCredentials.refresh_token,
            accessTokenMatch: setCredentials.access_token === tokens.access_token,
        });
        let googleAccountInfo = null;
        try {
            console.log('Attempting to fetch Google account info with fresh OAuth client...');
            const oauth2 = googleapis_1.google.oauth2({
                version: 'v2',
                auth: callbackOauth2Client,
            });
            console.log('OAuth2 client created, making userinfo request...');
            const { data } = yield oauth2.userinfo.get();
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
        }
        catch (accountError) {
            console.error('Failed to fetch Google account info during OAuth:', accountError);
            if (accountError && typeof accountError === 'object') {
                const error = accountError;
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
            console.warn('Proceeding with OAuth flow despite account info fetch failure');
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: {
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: tokens.expiry_date
                    ? new Date(tokens.expiry_date)
                    : null,
                google_account_name: googleAccountInfo === null || googleAccountInfo === void 0 ? void 0 : googleAccountInfo.name,
                google_account_email: googleAccountInfo === null || googleAccountInfo === void 0 ? void 0 : googleAccountInfo.email,
                google_account_picture: googleAccountInfo === null || googleAccountInfo === void 0 ? void 0 : googleAccountInfo.picture,
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
        const refreshOauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.google.client_id, config_1.default.google.client_secret, config_1.default.google.redirect_uri);
        refreshOauth2Client.setCredentials({
            refresh_token: user.google_refresh_token,
        });
        const { credentials } = yield refreshOauth2Client.refreshAccessToken();
        if (!credentials.access_token) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Failed to refresh Google access token');
        }
        const updateData = {
            google_access_token: credentials.access_token,
            google_token_expiry: credentials.expiry_date
                ? new Date(credentials.expiry_date)
                : null,
        };
        if (credentials.refresh_token) {
            updateData.google_refresh_token = credentials.refresh_token;
        }
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: updateData,
        });
        console.log(`Successfully refreshed access token for user ${userId}`);
        return credentials.access_token;
    }
    catch (error) {
        console.error('Error refreshing access token:', error);
        if (error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 400) {
            console.warn(`Refresh token invalid for user ${userId}, marking as disconnected`);
            yield prisma_1.default.user.update({
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
    const calendarOauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.google.client_id, config_1.default.google.client_secret, config_1.default.google.redirect_uri);
    calendarOauth2Client.setCredentials({
        access_token: accessToken,
    });
    return googleapis_1.google.calendar({ version: 'v3', auth: calendarOauth2Client });
});
const isCalendarConnected = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { is_calendar_connected: true },
    });
    return (user === null || user === void 0 ? void 0 : user.is_calendar_connected) || false;
});
const getGoogleAccountInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accessToken = yield getValidAccessToken(userId);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                google_refresh_token: true,
            },
        });
        if (!(user === null || user === void 0 ? void 0 : user.google_refresh_token)) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google refresh token not found. Please reconnect Google Calendar.');
        }
        const accountInfoOauth2Client = new googleapis_1.google.auth.OAuth2(config_1.default.google.client_id, config_1.default.google.client_secret, config_1.default.google.redirect_uri);
        accountInfoOauth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: user.google_refresh_token,
        });
        const oauth2 = googleapis_1.google.oauth2({
            version: 'v2',
            auth: accountInfoOauth2Client,
        });
        const { data } = yield oauth2.userinfo.get();
        return {
            name: data.name,
            email: data.email,
            picture: data.picture,
        };
    }
    catch (error) {
        console.error('Error fetching Google account info:', error);
        if (error instanceof AppError_1.default && error.statusCode === 401) {
            throw error;
        }
        if (error &&
            typeof error === 'object' &&
            'code' in error &&
            error.code === 401) {
            throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, 'Google authentication failed. Please reconnect Google Calendar.');
        }
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to fetch Google account information');
    }
});
const getCalendarConnectionInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
        where: { id: userId },
        select: {
            is_calendar_connected: true,
            google_account_name: true,
            google_account_email: true,
            google_account_picture: true,
        },
    });
    if (!user) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    let connectedAccount = null;
    if (user.is_calendar_connected) {
        if (user.google_account_name && user.google_account_email) {
            connectedAccount = {
                name: user.google_account_name,
                email: user.google_account_email,
                picture: user.google_account_picture,
            };
        }
        else {
            try {
                connectedAccount = yield getGoogleAccountInfo(userId);
                if (connectedAccount) {
                    yield prisma_1.default.user.update({
                        where: { id: userId },
                        data: {
                            google_account_name: connectedAccount.name,
                            google_account_email: connectedAccount.email,
                            google_account_picture: connectedAccount.picture,
                        },
                    });
                }
            }
            catch (error) {
                console.error('Failed to fetch Google account info:', error);
                if (error instanceof AppError_1.default && error.statusCode === 401) {
                    console.warn(`Google authentication failed for user ${userId}, marking calendar as disconnected`);
                    yield prisma_1.default.user.update({
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
});
const disconnectCalendar = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma_1.default.user.update({
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
});
const getUserGoogleData = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.default.user.findUnique({
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
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return Object.assign(Object.assign({}, user), { google_access_token: user.google_access_token ? '[REDACTED]' : null, google_refresh_token: user.google_refresh_token ? '[REDACTED]' : null });
});
const forceRefreshGoogleAccountInfo = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Force refreshing Google account info for user: ${userId}`);
        const user = yield prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                is_calendar_connected: true,
            },
        });
        if (!(user === null || user === void 0 ? void 0 : user.is_calendar_connected)) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Google Calendar is not connected');
        }
        const accountInfo = yield getGoogleAccountInfo(userId);
        yield prisma_1.default.user.update({
            where: { id: userId },
            data: {
                google_account_name: accountInfo.name,
                google_account_email: accountInfo.email,
                google_account_picture: accountInfo.picture,
            },
        });
        console.log(`Successfully refreshed account info for user ${userId}: ${accountInfo.name} (${accountInfo.email})`);
        return {
            success: true,
            accountInfo,
            message: 'Google account information refreshed successfully',
        };
    }
    catch (error) {
        console.error(`Failed to refresh Google account info for user ${userId}:`, error);
        if (error instanceof AppError_1.default && error.statusCode === 401) {
            yield prisma_1.default.user.update({
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
                message: 'Google authentication failed. Calendar has been disconnected.',
            };
        }
        throw error;
    }
});
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
exports.default = GoogleOAuthService;
