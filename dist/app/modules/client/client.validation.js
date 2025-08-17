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
var client_validation_exports = {};
__export(client_validation_exports, {
  default: () => client_validation_default
});
module.exports = __toCommonJS(client_validation_exports);
var import_zod = require("zod");
var import_client = require("@prisma/client");
const createClientSchema = import_zod.z.object({
  body: import_zod.z.object({
    first_name: import_zod.z.string().min(1, "First name is required"),
    last_name: import_zod.z.string().min(1, "Last name is required"),
    email: import_zod.z.string().email("Valid email is required"),
    phone: import_zod.z.string().min(1, "Phone number is required"),
    date_of_birth: import_zod.z.string().datetime().or(import_zod.z.date()),
    gender: import_zod.z.nativeEnum(import_client.Gender, {
      required_error: "Gender is required"
    })
  })
});
const verifyClientSchema = import_zod.z.object({
  params: import_zod.z.object({
    id: import_zod.z.string().uuid("Valid client ID is required")
  })
});
const ClientValidation = {
  createClientSchema,
  verifyClientSchema
};
var client_validation_default = ClientValidation;
