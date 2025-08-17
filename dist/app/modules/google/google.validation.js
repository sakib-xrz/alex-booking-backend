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
var google_validation_exports = {};
__export(google_validation_exports, {
  default: () => google_validation_default
});
module.exports = __toCommonJS(google_validation_exports);
var import_zod = require("zod");
const googleCallbackSchema = import_zod.z.object({
  query: import_zod.z.object({
    code: import_zod.z.string({
      required_error: "Authorization code is required"
    }),
    state: import_zod.z.string().optional(),
    error: import_zod.z.string().optional()
  })
});
const GoogleValidation = {
  googleCallbackSchema
};
var google_validation_default = GoogleValidation;
