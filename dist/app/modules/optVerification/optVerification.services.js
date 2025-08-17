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
var optVerification_services_exports = {};
__export(optVerification_services_exports, {
  default: () => optVerification_services_default
});
module.exports = __toCommonJS(optVerification_services_exports);
var import_date_fns = require("date-fns");
var import_prisma = __toESM(require("../../utils/prisma"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_http_status = __toESM(require("http-status"));
var import_mailer = __toESM(require("../../utils/mailer"));
var import_optVerification = __toESM(require("./optVerification.utils"));
var import_optVerification2 = require("./optVerification.constant");
const CreateOpt = async ({ email }) => {
  const existingOTPRecord = await import_prisma.default.emailOTPVerification.findFirst({
    where: {
      email
    },
    orderBy: {
      created_at: "desc"
    }
  });
  if (existingOTPRecord) {
    const secondsSinceLastOTP = (0, import_date_fns.differenceInSeconds)(
      /* @__PURE__ */ new Date(),
      existingOTPRecord.created_at
    );
    if (secondsSinceLastOTP < import_optVerification2.OTP_RATE_LIMIT_SECONDS) {
      const remainingTime = import_optVerification2.OTP_RATE_LIMIT_SECONDS - secondsSinceLastOTP;
      throw new import_AppError.default(
        import_http_status.default.TOO_MANY_REQUESTS,
        `Please wait ${remainingTime} seconds before requesting a new OTP`
      );
    }
  }
  const otp = import_optVerification.default.generateOTP();
  const expires_at = (0, import_date_fns.addMinutes)(/* @__PURE__ */ new Date(), import_optVerification2.OTP_EXPIRY_MINUTES);
  const result = await import_prisma.default.emailOTPVerification.create({
    data: {
      email,
      otp,
      expires_at
    }
  });
  try {
    const emailTemplate = import_optVerification.default.createOTPEmailTemplate(otp);
    await (0, import_mailer.default)(email, "Email Verification - Your OTP Code", emailTemplate);
  } catch (error) {
    console.log(error);
    await import_prisma.default.emailOTPVerification.delete({
      where: { id: result.id }
    });
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Failed to send OTP email. Please try again."
    );
  }
  return {
    email: result.email,
    expires_at: result.expires_at,
    is_verified: result.is_verified
  };
};
const VerifyOpt = async ({ email, otp }) => {
  const otpNumber = parseInt(otp, 10);
  const isVerifiedEmail = await import_prisma.default.emailOTPVerification.findFirst({
    where: {
      email,
      otp: otpNumber,
      expires_at: { gt: /* @__PURE__ */ new Date() },
      is_verified: false
    }
  });
  if (!isVerifiedEmail) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Invalid OTP or OTP has expired"
    );
  }
  const result = await import_prisma.default.emailOTPVerification.update({
    where: { id: isVerifiedEmail.id },
    data: { is_verified: true }
  });
  return {
    email: result.email,
    is_verified: result.is_verified
  };
};
const OptVerificationService = { VerifyOpt, CreateOpt };
var optVerification_services_default = OptVerificationService;
