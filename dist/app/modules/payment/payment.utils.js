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
var payment_utils_exports = {};
__export(payment_utils_exports, {
  centsToDollars: () => centsToDollars,
  constructWebhookEvent: () => constructWebhookEvent,
  dollarsToCents: () => dollarsToCents,
  stripe: () => stripe
});
module.exports = __toCommonJS(payment_utils_exports);
var import_stripe = __toESM(require("stripe"));
var import_config = __toESM(require("../../config"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_http_status = __toESM(require("http-status"));
const stripe = new import_stripe.default(import_config.default.stripe_secret_key);
const dollarsToCents = (dollars) => {
  return Math.round(dollars * 100);
};
const centsToDollars = (cents) => {
  return cents / 100;
};
const constructWebhookEvent = (payload, signature) => {
  if (!import_config.default.stripe_webhook_secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    throw new import_AppError.default(
      import_http_status.default.INTERNAL_SERVER_ERROR,
      "Webhook secret not configured"
    );
  }
  try {
    const body = typeof payload === "string" ? Buffer.from(payload) : payload;
    console.log("Webhook verification attempt:", {
      payloadType: typeof payload,
      payloadLength: body.length,
      hasSignature: !!signature,
      signatureFormat: signature.substring(0, 20) + "..."
    });
    return stripe.webhooks.constructEvent(
      body,
      signature,
      import_config.default.stripe_webhook_secret
    );
  } catch (error) {
    console.error("Webhook signature verification failed:", {
      error: error instanceof Error ? error.message : "Unknown error",
      payloadType: typeof payload,
      payloadPreview: typeof payload === "string" ? payload.substring(0, 100) : payload.toString().substring(0, 100),
      signature: signature.substring(0, 50) + "..."
    });
    if (import_config.default.node_env === "development" && process.env.SKIP_WEBHOOK_VERIFICATION === "true") {
      console.warn("\u26A0\uFE0F  DEVELOPMENT: Skipping webhook signature verification");
      try {
        return JSON.parse(payload.toString());
      } catch (parseError) {
        console.error("JSON parsing error:", parseError);
        throw new import_AppError.default(import_http_status.default.BAD_REQUEST, "Invalid JSON payload");
      }
    }
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      `Invalid webhook signature: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  centsToDollars,
  constructWebhookEvent,
  dollarsToCents,
  stripe
});
