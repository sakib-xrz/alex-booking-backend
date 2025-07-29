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
const CreateOpt = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email }) {
    let result;
    const isExistingEmail = yield prisma_1.default.emailOTPVerification.findFirst({
        where: {
            email,
        },
    });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = (0, date_fns_1.addMinutes)(new Date(), 5);
    if (isExistingEmail && isExistingEmail.is_verified) {
        result = {
            email: isExistingEmail.email,
            isVerified: isExistingEmail.is_verified,
        };
    }
    else if (isExistingEmail && !isExistingEmail.is_verified) {
        const updatedOtp = yield prisma_1.default.emailOTPVerification.update({
            where: {
                id: isExistingEmail.id,
            },
            data: {
                otp,
                expires_at,
            },
        });
        result = {
            email: updatedOtp.email,
            otp: updatedOtp.otp,
            expiresAt: updatedOtp.expires_at,
            isVerified: updatedOtp.is_verified,
        };
    }
    else {
        result = yield prisma_1.default.emailOTPVerification.create({
            data: {
                email,
                otp,
                expires_at,
            },
        });
    }
    // TODO: NEED TO IMPLEMENT EMAIL SENDING FUNCTIONALITY @Sakib Vai
    return result;
});
const VerifyOpt = (_a) => __awaiter(void 0, [_a], void 0, function* ({ email, otp }) {
    const isVerifiedEmail = yield prisma_1.default.emailOTPVerification.findFirst({
        where: {
            email,
            otp,
            expires_at: { gt: new Date() },
            is_verified: false,
        },
    });
    if (!isVerifiedEmail) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, 'Email or OTP is incorrect');
    }
    const result = yield prisma_1.default.emailOTPVerification.update({
        where: { id: isVerifiedEmail.id },
        data: { is_verified: true },
    });
    return result;
});
const OptVerificationService = { VerifyOpt, CreateOpt };
exports.default = OptVerificationService;
