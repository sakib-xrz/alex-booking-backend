"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const createOTPValidation = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({
            message: 'Please provide a valid email address',
        }),
    }),
});
const verifyOTPValidation = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
        })
            .email({
            message: 'Please provide a valid email address',
        }),
        otp: zod_1.z
            .string({
            required_error: 'OTP is required',
        })
            .length(6, {
            message: 'OTP must be exactly 6 digits',
        })
            .regex(/^\d{6}$/, {
            message: 'OTP must contain only numbers',
        }),
    }),
});
const OptVerificationValidation = {
    createOTPValidation,
    verifyOTPValidation,
};
exports.default = OptVerificationValidation;
