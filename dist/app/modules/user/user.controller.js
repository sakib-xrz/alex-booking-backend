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
var user_controller_exports = {};
__export(user_controller_exports, {
  UserController: () => UserController
});
module.exports = __toCommonJS(user_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_user = require("./user.services");
var import_AppError = __toESM(require("../../errors/AppError"));
const UpdateProfilePicture = (0, import_catchAsync.default)(async (req, res) => {
  if (!req.file) {
    throw new import_AppError.default(import_http_status.default.BAD_REQUEST, "Image is required");
  }
  const result = await import_user.UserService.UpdateProfilePicture(req.user.id, req.file);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Profile picture updated successfully",
    data: result
  });
});
const UpdateProfile = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_user.UserService.UpdateUserProfile(req.user.id, req.body);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Profile updated successfully",
    data: result
  });
});
const UserController = {
  UpdateProfilePicture,
  UpdateProfile
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserController
});
