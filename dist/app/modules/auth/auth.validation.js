"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const RegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            required_error: 'Name is required',
            invalid_type_error: 'Name must be a string',
        }),
        email: zod_1.z.string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        }),
        password: zod_1.z.string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be a string',
        }),
    }),
});
const LoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z
            .string({
            required_error: 'Email is required',
            invalid_type_error: 'Email must be a string',
        })
            .email('Invalid email format'),
        password: zod_1.z.string({
            required_error: 'Password is required',
            invalid_type_error: 'Password must be a string',
        }),
    }),
});
const ChangePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        old_password: zod_1.z.string({
            required_error: 'Old password is required',
            invalid_type_error: 'Old password must be a string',
        }),
        new_password: zod_1.z.string({
            required_error: 'New password is required',
            invalid_type_error: 'New password must be a string',
        }),
    }),
});
const UpdateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({
            invalid_type_error: 'Name must be a string',
        }).optional(),
        specialization: zod_1.z.string({
            invalid_type_error: 'Specialization must be a string',
        }).optional(),
    }),
});
const AuthValidation = { LoginSchema, ChangePasswordSchema, RegisterSchema, UpdateProfileSchema };
exports.default = AuthValidation;
