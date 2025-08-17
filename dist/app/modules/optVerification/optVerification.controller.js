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
var optVerification_controller_exports = {};
__export(optVerification_controller_exports, {
  default: () => optVerification_controller_default
});
module.exports = __toCommonJS(optVerification_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_optVerification = __toESM(require("./optVerification.services"));
const PostOtp = (0, import_catchAsync.default)(async (req, res) => {
  const data = req.body;
  const result = await import_optVerification.default.CreateOpt(data);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.CREATED,
    message: "OTP sent successfully",
    data: result
  });
});
const VerifyOtp = (0, import_catchAsync.default)(async (req, res) => {
  const data = req.body;
  const result = await import_optVerification.default.VerifyOpt(data);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "OTP verified successfully",
    data: result
  });
});
const OptVerificationController = { PostOtp, VerifyOtp };
var optVerification_controller_default = OptVerificationController;
