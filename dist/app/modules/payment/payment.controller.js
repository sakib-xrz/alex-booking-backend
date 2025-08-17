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
var payment_controller_exports = {};
__export(payment_controller_exports, {
  PaymentController: () => PaymentController
});
module.exports = __toCommonJS(payment_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_payment = require("./payment.services");
var import_payment2 = require("./payment.utils");
const createPaymentIntent = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_payment.PaymentService.createPaymentIntent(req.body);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.CREATED,
    message: "Payment intent created successfully",
    data: result
  });
});
const getPaymentByAppointment = (0, import_catchAsync.default)(async (req, res) => {
  const { appointment_id } = req.params;
  const result = await import_payment.PaymentService.getPaymentByAppointment(appointment_id);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Payment retrieved successfully",
    data: result
  });
});
const handleWebhook = async (req, res) => {
  const signature = req.headers["stripe-signature"];
  if (!signature) {
    console.error("Missing stripe-signature header");
    return res.status(import_http_status.default.BAD_REQUEST).json({
      success: false,
      message: "Missing stripe-signature header"
    });
  }
  try {
    if (!req.body) {
      throw new Error("No request body received");
    }
    const event = (0, import_payment2.constructWebhookEvent)(req.body, signature);
    console.log(`\u2705 Webhook signature verified for event: ${event.type}`);
    await import_payment.PaymentService.handleWebhookEvent(event);
    res.status(import_http_status.default.OK).json({
      success: true,
      message: "Webhook processed successfully"
    });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(import_http_status.default.BAD_REQUEST).json({
      success: false,
      message: error instanceof Error ? error.message : "Webhook processing failed"
    });
  }
};
const PaymentController = {
  createPaymentIntent,
  getPaymentByAppointment,
  handleWebhook
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaymentController
});
