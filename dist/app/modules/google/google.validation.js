"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const googleCallbackSchema = zod_1.z.object({
    query: zod_1.z.object({
        code: zod_1.z.string({
            required_error: 'Authorization code is required',
        }),
        state: zod_1.z.string().optional(),
        error: zod_1.z.string().optional(),
    }),
});
const GoogleValidation = {
    googleCallbackSchema,
};
exports.default = GoogleValidation;
