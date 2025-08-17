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
var publicAppointment_validation_exports = {};
__export(publicAppointment_validation_exports, {
  default: () => publicAppointment_validation_default
});
module.exports = __toCommonJS(publicAppointment_validation_exports);
var import_zod = require("zod");
const createPublicAppointmentZodSchema = import_zod.z.object({
  body: import_zod.z.object({
    firstName: import_zod.z.string({
      required_error: "First name is required"
    }),
    lastName: import_zod.z.string({
      required_error: "Last name is required"
    }),
    email: import_zod.z.string({
      required_error: "Email is required"
    }).email("Invalid email format"),
    phone: import_zod.z.string({
      required_error: "Phone is required"
    }),
    dateOfBirth: import_zod.z.string({
      required_error: "Date of birth is required"
    }),
    gender: import_zod.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    sessionType: import_zod.z.enum(["ONLINE", "IN_PERSON"], {
      required_error: "Session type is required"
    }),
    date: import_zod.z.string({
      required_error: "Date is required"
    }),
    timeSlotId: import_zod.z.string({
      required_error: "Time slot ID is required"
    }),
    notes: import_zod.z.string().optional(),
    counselorId: import_zod.z.string({
      required_error: "Counselor ID is required"
    })
  })
});
const PublicAppointmentValidation = {
  createPublicAppointmentZodSchema
};
var publicAppointment_validation_default = PublicAppointmentValidation;
