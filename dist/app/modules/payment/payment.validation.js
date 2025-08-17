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
var payment_validation_exports = {};
__export(payment_validation_exports, {
  PaymentValidation: () => PaymentValidation
});
module.exports = __toCommonJS(payment_validation_exports);
var import_zod = require("zod");
const createPaymentIntentSchema = import_zod.z.object({
  body: import_zod.z.object({
    appointment_id: import_zod.z.string().uuid("Invalid appointment ID"),
    amount: import_zod.z.number().min(1, "Amount must be at least $1").max(1e4, "Amount cannot exceed $10,000"),
    currency: import_zod.z.string().length(3).optional()
  })
});
const PaymentValidation = {
  createPaymentIntentSchema
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PaymentValidation
});
