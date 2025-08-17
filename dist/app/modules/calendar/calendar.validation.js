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
var calendar_validation_exports = {};
__export(calendar_validation_exports, {
  default: () => calendar_validation_default
});
module.exports = __toCommonJS(calendar_validation_exports);
var import_zod = require("zod");
var import_client = require("@prisma/client");
const CreateCalendarSchema = import_zod.z.object({
  body: import_zod.z.object({
    date: import_zod.z.string().datetime().or(import_zod.z.date())
  })
});
const CreateSlotsSchema = import_zod.z.object({
  body: import_zod.z.object({
    data: import_zod.z.array(
      import_zod.z.object({
        start_time: import_zod.z.string(),
        end_time: import_zod.z.string(),
        type: import_zod.z.nativeEnum(import_client.SessionType)
      })
    )
  })
});
const CalendarValidation = {
  CreateCalendarSchema,
  CreateSlotsSchema
};
var calendar_validation_default = CalendarValidation;
