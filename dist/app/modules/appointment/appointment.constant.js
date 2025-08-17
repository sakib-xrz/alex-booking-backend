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
var appointment_constant_exports = {};
__export(appointment_constant_exports, {
  appointmentFilterableFields: () => appointmentFilterableFields,
  appointmentSearchableFields: () => appointmentSearchableFields,
  default: () => appointment_constant_default
});
module.exports = __toCommonJS(appointment_constant_exports);
const appointmentSearchableFields = [
  "first_name",
  "last_name",
  "email",
  "phone"
];
const appointmentFilterableFields = [
  "session_type",
  "status",
  "date",
  "page",
  "limit",
  "sort_by",
  "sort_order",
  "search"
];
const AppointmentConstants = {
  appointmentSearchableFields,
  appointmentFilterableFields
};
var appointment_constant_default = AppointmentConstants;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  appointmentFilterableFields,
  appointmentSearchableFields
});
