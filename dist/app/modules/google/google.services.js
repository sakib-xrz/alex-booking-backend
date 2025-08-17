"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var google_services_exports = {};
__export(google_services_exports, {
  default: () => google_services_default
});
module.exports = __toCommonJS(google_services_exports);
var import_googleapis = require("googleapis");
var import_config = __toESM(require("../../config"));
var import_prisma = __toESM(require("../../utils/prisma"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_http_status = __toESM(require("http-status"));
const oauth2Client = new import_googleapis.google.auth.OAuth2(
  import_config.default.google.client_id,
  import_config.default.google.client_secret,
  import_config.default.google.redirect_uri
);
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events"
];
const generateAuthUrl = (userId) => {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
    state: userId
    // Pass user ID in state parameter
  });
};
const handleOAuthCallback = async (code, userId) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.access_token) {
      throw new import_AppError.default(
        import_http_status.default.BAD_REQUEST,
        "Failed to obtain access token from Google"
      );
    }
    const updatedUser = await import_prisma.default.user.update({
      where: { id: userId },
      data: {
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        google_token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_calendar_connected: true
      }
    });
    return updatedUser;
  } catch (error) {
    console.error("Error handling OAuth callback:", error);
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to process Google OAuth callback"
    );
  }
};
const refreshAccessToken = async (userId) => {
  try {
    const user = await import_prisma.default.user.findUnique({
      where: { id: userId },
      select: {
        google_refresh_token: true,
        google_access_token: true
      }
    });
    if (!(user == null ? void 0 : user.google_refresh_token)) {
      throw new import_AppError.default(
        import_http_status.default.UNAUTHORIZED,
        "No refresh token found. Please reconnect Google Calendar."
      );
    }
    oauth2Client.setCredentials({
      refresh_token: user.google_refresh_token
    });
    const { credentials } = await oauth2Client.refreshAccessToken();
    if (!credentials.access_token) {
      throw new import_AppError.default(
        import_http_status.default.UNAUTHORIZED,
        "Failed to refresh Google access token"
      );
    }
    await import_prisma.default.user.update({
      where: { id: userId },
      data: {
        google_access_token: credentials.access_token,
        google_token_expiry: credentials.expiry_date ? new Date(credentials.expiry_date) : null
      }
    });
    return credentials.access_token;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    throw new import_AppError.default(
      import_http_status.default.UNAUTHORIZED,
      "Failed to refresh Google access token. Please reconnect Google Calendar."
    );
  }
};
const getValidAccessToken = async (userId) => {
  const user = await import_prisma.default.user.findUnique({
    where: { id: userId },
    select: {
      google_access_token: true,
      google_refresh_token: true,
      google_token_expiry: true,
      is_calendar_connected: true
    }
  });
  if (!(user == null ? void 0 : user.is_calendar_connected) || !user.google_access_token) {
    throw new import_AppError.default(
      import_http_status.default.UNAUTHORIZED,
      "Google Calendar not connected. Please connect your calendar first."
    );
  }
  const now = /* @__PURE__ */ new Date();
  const expiryWithBuffer = user.google_token_expiry ? new Date(user.google_token_expiry.getTime() - 5 * 60 * 1e3) : null;
  if (expiryWithBuffer && now > expiryWithBuffer) {
    return await refreshAccessToken(userId);
  }
  return user.google_access_token;
};
const getCalendarClient = async (userId) => {
  const accessToken = await getValidAccessToken(userId);
  oauth2Client.setCredentials({
    access_token: accessToken
  });
  return import_googleapis.google.calendar({ version: "v3", auth: oauth2Client });
};
const isCalendarConnected = async (userId) => {
  const user = await import_prisma.default.user.findUnique({
    where: { id: userId },
    select: { is_calendar_connected: true }
  });
  return (user == null ? void 0 : user.is_calendar_connected) || false;
};
const disconnectCalendar = async (userId) => {
  await import_prisma.default.user.update({
    where: { id: userId },
    data: {
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      is_calendar_connected: false
    }
  });
  return { message: "Google Calendar disconnected successfully" };
};
const GoogleOAuthService = {
  generateAuthUrl,
  handleOAuthCallback,
  refreshAccessToken,
  getValidAccessToken,
  getCalendarClient,
  isCalendarConnected,
  disconnectCalendar
};
var google_services_default = GoogleOAuthService;
