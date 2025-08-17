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
var publicCalendar_validation_exports = {};
__export(publicCalendar_validation_exports, {
  default: () => publicCalendar_validation_default
});
module.exports = __toCommonJS(publicCalendar_validation_exports);
var import_zod = require("zod");
var import_client = require("@prisma/client");
const getCounselorCalendarSchema = import_zod.z.object({
  params: import_zod.z.object({
    counselorId: import_zod.z.string().uuid("Valid counselor ID is required")
  })
});
const getCounselorSlotsSchema = import_zod.z.object({
  params: import_zod.z.object({
    calenderId: import_zod.z.string().uuid("Valid calendar ID is required")
  }),
  query: import_zod.z.object({
    type: import_zod.z.nativeEnum(import_client.SessionType).optional()
  })
});
const PublicCalendarValidation = {
  getCounselorCalendarSchema,
  getCounselorSlotsSchema
};
var publicCalendar_validation_default = PublicCalendarValidation;
