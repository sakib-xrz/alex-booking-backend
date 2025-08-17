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
var user_services_exports = {};
__export(user_services_exports, {
  UserService: () => UserService
});
module.exports = __toCommonJS(user_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
var import_path = __toESM(require("path"));
var import_handelFile = require("../../utils/handelFile");
var import_http_status = __toESM(require("http-status"));
var import_AppError = __toESM(require("../../errors/AppError"));
const UpdateProfilePicture = async (id, file) => {
  const user = await import_prisma.default.user.findUnique({
    where: { id, is_deleted: false }
  });
  if (!user) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "User not found");
  }
  let profilePicture = user.profile_picture || null;
  try {
    if (user.profile_picture) {
      const key = (0, import_handelFile.extractKeyFromUrl)(user.profile_picture);
      if (key) {
        await (0, import_handelFile.deleteFromSpaces)(key);
      }
    }
    const uploadResult = await (0, import_handelFile.uploadToSpaces)(file, {
      folder: "profile-pictures",
      filename: `profile_picture_${Date.now()}${import_path.default.extname(file.originalname)}`
    });
    profilePicture = (uploadResult == null ? void 0 : uploadResult.url) || null;
  } catch (error) {
    console.log(
      "Error from DigitalOcean Spaces while uploading profile picture",
      error
    );
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Failed to upload profile picture"
    );
  }
  const result = await import_prisma.default.user.update({
    where: { id },
    data: { profile_picture: profilePicture },
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      role: true,
      created_at: true,
      updated_at: true
    }
  });
  return result;
};
const UpdateUserProfile = async (id, data) => {
  const user = await import_prisma.default.user.findUnique({
    where: { id, is_deleted: false }
  });
  if (!user) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "User not found");
  }
  const result = await import_prisma.default.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      profile_picture: true,
      role: true,
      created_at: true,
      updated_at: true
    }
  });
  return result;
};
const UserService = {
  UpdateProfilePicture,
  UpdateUserProfile
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserService
});
