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
var google_controller_exports = {};
__export(google_controller_exports, {
  default: () => google_controller_default
});
module.exports = __toCommonJS(google_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_google = __toESM(require("./google.services"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_config = __toESM(require("../../config"));
const getGoogleAuthUrl = (0, import_catchAsync.default)(async (req, res) => {
  const userId = req.user.id;
  const authUrl = import_google.default.generateAuthUrl(userId);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Google OAuth URL generated successfully",
    data: { authUrl }
  });
});
const handleGoogleCallback = (0, import_catchAsync.default)(async (req, res) => {
  const { code, state } = req.query;
  const userId = state;
  if (!code) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Authorization code is required"
    );
  }
  if (!userId) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "User ID not found in state parameter"
    );
  }
  await import_google.default.handleOAuthCallback(code, userId);
  const frontendUrl = import_config.default.base_url.admin_frontend;
  res.redirect(`${frontendUrl}/dashboard?calendar=connected`);
});
const getCalendarStatus = (0, import_catchAsync.default)(async (req, res) => {
  const userId = req.user.id;
  const isConnected = await import_google.default.isCalendarConnected(userId);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Calendar connection status retrieved successfully",
    data: { isConnected }
  });
});
const disconnectCalendar = (0, import_catchAsync.default)(async (req, res) => {
  const userId = req.user.id;
  const result = await import_google.default.disconnectCalendar(userId);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Google Calendar disconnected successfully",
    data: result
  });
});
const GoogleController = {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getCalendarStatus,
  disconnectCalendar
};
var google_controller_default = GoogleController;
