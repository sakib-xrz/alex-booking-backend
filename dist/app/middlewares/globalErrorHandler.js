"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var globalErrorHandler_exports = {};
__export(globalErrorHandler_exports, {
  default: () => globalErrorHandler_default
});
module.exports = __toCommonJS(globalErrorHandler_exports);
var import_http_status = __toESM(require("http-status"));
var import_zod = require("zod");
var import_handelZodError = __toESM(require("../errors/handelZodError"));
var import_AppError = __toESM(require("../errors/AppError"));
const globalErrorHandler = (err, _req, res, next) => {
  var _a, _b;
  let statusCode = err.statusCode || import_http_status.default.INTERNAL_SERVER_ERROR;
  let message = err.message || "Something went wrong!";
  let errorSources = [
    {
      message: err.message || "Something went wrong!",
      path: (err == null ? void 0 : err.path) || ""
    }
  ];
  if (err.code) {
    switch (err.code) {
      case "P2002":
        statusCode = import_http_status.default.CONFLICT;
        message = `It looks like the "${getUniqueField((_a = err.meta) == null ? void 0 : _a.target)}" you provided is already in use.`;
        errorSources = [
          {
            message,
            path: getUniqueField((_b = err.meta) == null ? void 0 : _b.target)
          }
        ];
        break;
      case "P2025":
        statusCode = import_http_status.default.NOT_FOUND;
        message = "The item you are trying to access no longer exists or could not be found.";
        errorSources = [
          {
            message,
            path: ""
          }
        ];
        break;
      default:
        message = "An error occurred while processing your request.";
        errorSources = [
          {
            message,
            path: ""
          }
        ];
        break;
    }
  } else if (err.isValidationError) {
    statusCode = import_http_status.default.BAD_REQUEST;
    message = "There seems to be an issue with the data you provided.";
    errorSources = [
      {
        message: err.message,
        path: ""
      }
    ];
  } else if (err instanceof import_zod.ZodError) {
    const simplifiedError = (0, import_handelZodError.default)(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  } else if (err instanceof import_AppError.default) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        message: err.message,
        path: ""
      }
    ];
  } else if (err instanceof Error) {
    errorSources = [
      {
        message: err.message,
        path: ""
      }
    ];
  }
  console.error("Detailed Error:", err);
  res.status(statusCode).json({
    success: false,
    message,
    error: errorSources,
    stack: process.env.NODE_ENV === "development" ? err.stack : void 0
  });
};
const getUniqueField = (target) => {
  if (!target) return "field";
  if (Array.isArray(target)) return target.join(", ");
  return String(target);
};
var globalErrorHandler_default = globalErrorHandler;
