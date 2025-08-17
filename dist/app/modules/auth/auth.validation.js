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
var auth_validation_exports = {};
__export(auth_validation_exports, {
  default: () => auth_validation_default
});
module.exports = __toCommonJS(auth_validation_exports);
var import_zod = require("zod");
const RegisterSchema = import_zod.z.object({
  body: import_zod.z.object({
    name: import_zod.z.string({
      required_error: "Name is required",
      invalid_type_error: "Name must be a string"
    }),
    email: import_zod.z.string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string"
    }),
    password: import_zod.z.string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string"
    })
  })
});
const LoginSchema = import_zod.z.object({
  body: import_zod.z.object({
    email: import_zod.z.string({
      required_error: "Email is required",
      invalid_type_error: "Email must be a string"
    }).email("Invalid email format"),
    password: import_zod.z.string({
      required_error: "Password is required",
      invalid_type_error: "Password must be a string"
    })
  })
});
const ChangePasswordSchema = import_zod.z.object({
  body: import_zod.z.object({
    old_password: import_zod.z.string({
      required_error: "Old password is required",
      invalid_type_error: "Old password must be a string"
    }),
    new_password: import_zod.z.string({
      required_error: "New password is required",
      invalid_type_error: "New password must be a string"
    })
  })
});
const AuthValidation = { LoginSchema, ChangePasswordSchema, RegisterSchema };
var auth_validation_default = AuthValidation;
