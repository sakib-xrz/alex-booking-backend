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
var auth_controller_exports = {};
__export(auth_controller_exports, {
  default: () => auth_controller_default
});
module.exports = __toCommonJS(auth_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_auth = __toESM(require("./auth.services"));
const Register = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_auth.default.Register(req.body);
  const { access_token } = result;
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Account created successfully",
    data: {
      access_token
    }
  });
});
const Login = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_auth.default.Login(req.body);
  const { access_token } = result;
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Login successful",
    data: {
      access_token
    }
  });
});
const ChangePassword = (0, import_catchAsync.default)(async (req, res) => {
  await import_auth.default.ChangePassword(req.body, req.user);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Password changed successfully"
  });
});
const GetMyProfile = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_auth.default.GetMyProfile(req.user);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "User profile retrieved successfully",
    data: result
  });
});
const AuthController = {
  Login,
  ChangePassword,
  GetMyProfile,
  Register
};
var auth_controller_default = AuthController;
