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
var optVerification_validation_exports = {};
__export(optVerification_validation_exports, {
  default: () => optVerification_validation_default
});
module.exports = __toCommonJS(optVerification_validation_exports);
var import_zod = require("zod");
const createOTPValidation = import_zod.z.object({
  body: import_zod.z.object({
    email: import_zod.z.string({
      required_error: "Email is required"
    }).email({
      message: "Please provide a valid email address"
    })
  })
});
const verifyOTPValidation = import_zod.z.object({
  body: import_zod.z.object({
    email: import_zod.z.string({
      required_error: "Email is required"
    }).email({
      message: "Please provide a valid email address"
    }),
    otp: import_zod.z.string({
      required_error: "OTP is required"
    }).length(6, {
      message: "OTP must be exactly 6 digits"
    }).regex(/^\d{6}$/, {
      message: "OTP must contain only numbers"
    })
  })
});
const OptVerificationValidation = {
  createOTPValidation,
  verifyOTPValidation
};
var optVerification_validation_default = OptVerificationValidation;
