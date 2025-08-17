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
const date_fns_1 = require("date-fns");
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const mailer_1 = __importDefault(require("../../utils/mailer"));
const optVerification_utils_1 = __importDefault(require("./optVerification.utils"));
const optVerification_constant_1 = require("./optVerification.constant");
const CreateOpt = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email }) {
    const existingOTPRecord = yield prisma_1.default.emailOTPVerification.findFirst({
        where: {
            email,
        },
        orderBy: {
            created_at: 'desc',
        },
    });
    if (existingOTPRecord) {
        const secondsSinceLastOTP = (0, date_fns_1.differenceInSeconds)(new Date(), existingOTPRecord.created_at);
        if (secondsSinceLastOTP < optVerification_constant_1.OTP_RATE_LIMIT_SECONDS) {
            const remainingTime = optVerification_constant_1.OTP_RATE_LIMIT_SECONDS - secondsSinceLastOTP;
            throw new AppError_1.default(http_status_1.default.TOO_MANY_REQUESTS, `Please wait ${remainingTime} seconds before requesting a new OTP`);
        }
    }
    const otp = optVerification_utils_1.default.generateOTP();
    const expires_at = (0, date_fns_1.addMinutes)(new Date(), optVerification_constant_1.OTP_EXPIRY_MINUTES);
    const result = yield prisma_1.default.emailOTPVerification.create({
        data: {
            email,
            otp,
            expires_at,
        },
    });
    try {
        const emailTemplate = optVerification_utils_1.default.createOTPEmailTemplate(otp);
        yield (0, mailer_1.default)(email, 'Email Verification - Your OTP Code', emailTemplate);
    }
    catch (error) {
        console.log(error);
        yield prisma_1.default.emailOTPVerification.delete({
            where: { id: result.id },
        });
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to send OTP email. Please try again.');
    }
    return {
        email: result.email,
        expires_at: result.expires_at,
        is_verified: result.is_verified,
    };
});
const VerifyOpt = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, otp }) {
    const otpNumber = parseInt(otp, 10);
    const isVerifiedEmail = yield prisma_1.default.emailOTPVerification.findFirst({
        where: {
            email,
            otp: otpNumber,
            expires_at: { gt: new Date() },
            is_verified: false,
        },
    });
    if (!isVerifiedEmail) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Invalid OTP or OTP has expired');
    }
    const result = yield prisma_1.default.emailOTPVerification.update({
        where: { id: isVerifiedEmail.id },
        data: { is_verified: true },
    });
    return {
        email: result.email,
        is_verified: result.is_verified,
    };
});
const OptVerificationService = { VerifyOpt, CreateOpt };
exports.default = OptVerificationService;
