"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTP_LENGTH = exports.OTP_RATE_LIMIT_SECONDS = exports.OTP_EXPIRY_MINUTES = void 0;
exports.OTP_EXPIRY_MINUTES = 10; // 10 minutes
exports.OTP_RATE_LIMIT_SECONDS = 120; // 2 minutes
exports.OTP_LENGTH = 6;
const OptVerificationConstants = {
    OTP_EXPIRY_MINUTES: exports.OTP_EXPIRY_MINUTES,
    OTP_RATE_LIMIT_SECONDS: exports.OTP_RATE_LIMIT_SECONDS,
    OTP_LENGTH: exports.OTP_LENGTH,
};
exports.default = OptVerificationConstants;
