"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var optVerification_utils_exports = {};
__export(optVerification_utils_exports, {
  default: () => optVerification_utils_default
});
module.exports = __toCommonJS(optVerification_utils_exports);
var import_optVerification = require("./optVerification.constant");
const generateOTP = () => {
  const min = Math.pow(10, import_optVerification.OTP_LENGTH - 1);
  const max = Math.pow(10, import_optVerification.OTP_LENGTH) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};
const createOTPEmailTemplate = (otp) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Email Verification</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #007bff; text-align: center; letter-spacing: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>Email Verification</h2>
            </div>
            <p>Hello,</p>
            <p>You have requested an email verification. Please use the following OTP code to verify your email address:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>This OTP will expire in 10 minutes.</strong></p>
            <p>If you didn't request this verification, please ignore this email.</p>
            <div class="footer">
                <p>This is an automated message, please do not reply to this email.</p>
                <p>&copy; Alexander Rodriguez Booking System</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
const OptVerificationUtils = {
  generateOTP,
  createOTPEmailTemplate
};
var optVerification_utils_default = OptVerificationUtils;
