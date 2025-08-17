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
var auth_services_exports = {};
__export(auth_services_exports, {
  default: () => auth_services_default
});
module.exports = __toCommonJS(auth_services_exports);
var import_bcrypt = __toESM(require("bcrypt"));
var import_config = __toESM(require("../../config"));
var import_http_status = __toESM(require("http-status"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_prisma = __toESM(require("../../utils/prisma"));
var import_auth = __toESM(require("./auth.utils"));
const Register = async (payload) => {
  const { email, password, name } = payload;
  const existingUser = await import_prisma.default.user.findUnique({
    where: { email }
  });
  if (existingUser) {
    throw new import_AppError.default(import_http_status.default.CONFLICT, "User already exists");
  }
  const hashedPassword = await import_bcrypt.default.hash(
    password,
    Number(import_config.default.bcrypt_salt_rounds)
  );
  const result = await import_prisma.default.user.create({
    data: {
      email,
      name,
      password: hashedPassword
    }
  });
  const jwtPayload = {
    id: result.id,
    name: result.name,
    profile_picture: result.profile_picture,
    email: result.email,
    role: result.role
  };
  const access_token = import_auth.default.CreateToken(
    jwtPayload,
    import_config.default.jwt_access_token_secret,
    import_config.default.jwt_access_token_expires_in
  );
  return { access_token };
};
const Login = async (payload) => {
  const user = await import_prisma.default.user.findFirst({
    where: { email: payload.email }
  });
  if (!user) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "No user found with this email");
  }
  const isPasswordMatched = await import_bcrypt.default.compare(
    payload.password,
    user.password
  );
  if (!isPasswordMatched) {
    throw new import_AppError.default(import_http_status.default.UNAUTHORIZED, "Invalid email or password");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    profile_picture: user.profile_picture,
    email: user.email,
    role: user.role
  };
  const access_token = import_auth.default.CreateToken(
    jwtPayload,
    import_config.default.jwt_access_token_secret,
    import_config.default.jwt_access_token_expires_in
  );
  return { access_token };
};
const ChangePassword = async (payload, user) => {
  const isUserValid = await import_prisma.default.user.findFirst({
    where: { id: user.id }
  });
  if (!isUserValid) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "No user found");
  }
  const isPasswordMatched = await import_bcrypt.default.compare(
    payload.old_password,
    isUserValid.password
  );
  if (!isPasswordMatched) {
    throw new import_AppError.default(import_http_status.default.UNAUTHORIZED, "Invalid password");
  }
  const hashedPassword = await import_bcrypt.default.hash(
    payload.new_password,
    Number(import_config.default.bcrypt_salt_rounds)
  );
  await import_prisma.default.user.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });
};
const GetMyProfile = async (user) => {
  const userProfile = await import_prisma.default.user.findUnique({
    where: { id: user.id, email: user.email },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      profile_picture: true,
      created_at: true
    }
  });
  if (!userProfile) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "User not found");
  }
  return userProfile;
};
const AuthService = {
  Register,
  Login,
  ChangePassword,
  GetMyProfile
};
var auth_services_default = AuthService;
