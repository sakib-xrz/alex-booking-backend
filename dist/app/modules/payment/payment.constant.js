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
var payment_constant_exports = {};
__export(payment_constant_exports, {
  PAYMENT_STATUS: () => PAYMENT_STATUS,
  WEBHOOK_EVENTS: () => WEBHOOK_EVENTS
});
module.exports = __toCommonJS(payment_constant_exports);
const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED"
};
const WEBHOOK_EVENTS = {
  PAYMENT_SUCCEEDED: "payment_intent.succeeded",
  PAYMENT_FAILED: "payment_intent.payment_failed",
  PAYMENT_CANCELED: "payment_intent.canceled"
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PAYMENT_STATUS,
  WEBHOOK_EVENTS
});
