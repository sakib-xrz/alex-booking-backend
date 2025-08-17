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
var appointment_validation_exports = {};
__export(appointment_validation_exports, {
  default: () => appointment_validation_default
});
module.exports = __toCommonJS(appointment_validation_exports);
var import_zod = require("zod");
const getAppointmentsQuerySchema = import_zod.z.object({
  query: import_zod.z.object({
    search: import_zod.z.string().optional(),
    session_type: import_zod.z.enum(["ONLINE", "IN_PERSON"]).optional(),
    status: import_zod.z.enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "DELETED"]).optional(),
    date: import_zod.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    page: import_zod.z.string().transform((val) => parseInt(val)).pipe(import_zod.z.number().min(1)).optional(),
    limit: import_zod.z.string().transform((val) => parseInt(val)).pipe(import_zod.z.number().min(1).max(100)).optional(),
    sort_by: import_zod.z.string().optional(),
    sort_order: import_zod.z.enum(["asc", "desc"]).optional()
  }).optional(),
  body: import_zod.z.object({}).optional(),
  params: import_zod.z.object({}).optional(),
  cookies: import_zod.z.object({}).optional()
});
const AppointmentValidation = {
  getAppointmentsQuerySchema
};
var appointment_validation_default = AppointmentValidation;
