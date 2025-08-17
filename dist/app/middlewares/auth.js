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
var auth_exports = {};
__export(auth_exports, {
  default: () => auth_default
});
module.exports = __toCommonJS(auth_exports);
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_catchAsync = __toESM(require("../utils/catchAsync"));
var import_http_status = __toESM(require("http-status"));
var import_config = __toESM(require("../config"));
var import_AppError = __toESM(require("../errors/AppError"));
var import_prisma = __toESM(require("../utils/prisma"));
const auth = (...roles) => {
  return (0, import_catchAsync.default)(
    async (req, _res, next) => {
      const bearerToken = req.headers.authorization;
      if (!bearerToken || !bearerToken.startsWith("Bearer ")) {
        throw new import_AppError.default(
          import_http_status.default.UNAUTHORIZED,
          "Invalid or missing authorization header"
        );
      }
      const token = bearerToken.split(" ")[1];
      if (!token) {
        throw new import_AppError.default(
          import_http_status.default.UNAUTHORIZED,
          "You're not authorized to access this route"
        );
      }
      const decoded = import_jsonwebtoken.default.verify(
        token,
        import_config.default.jwt_access_token_secret
      );
      const { email } = decoded;
      const user = await import_prisma.default.user.findUnique({
        where: { email, is_deleted: false }
      });
      if (!user) {
        throw new import_AppError.default(
          import_http_status.default.UNAUTHORIZED,
          "You're not authorized to access this route"
        );
      }
      if (roles.length && !roles.includes(user.role)) {
        throw new import_AppError.default(
          import_http_status.default.FORBIDDEN,
          "You don't have permission to access this route"
        );
      }
      req.user = user;
      next();
    }
  );
};
var auth_default = auth;
