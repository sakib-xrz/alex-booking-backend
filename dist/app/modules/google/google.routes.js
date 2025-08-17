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
var google_routes_exports = {};
__export(google_routes_exports, {
  GoogleRoutes: () => GoogleRoutes
});
module.exports = __toCommonJS(google_routes_exports);
var import_express = __toESM(require("express"));
var import_google = __toESM(require("./google.controller"));
var import_auth = __toESM(require("../../middlewares/auth"));
var import_client = require("@prisma/client");
const router = import_express.default.Router();
router.get(
  "/auth-url",
  (0, import_auth.default)(import_client.Role.COUNSELOR, import_client.Role.SUPER_ADMIN),
  import_google.default.getGoogleAuthUrl
);
router.get("/callback", import_google.default.handleGoogleCallback);
router.get(
  "/status",
  (0, import_auth.default)(import_client.Role.COUNSELOR, import_client.Role.SUPER_ADMIN),
  import_google.default.getCalendarStatus
);
router.delete(
  "/disconnect",
  (0, import_auth.default)(import_client.Role.COUNSELOR, import_client.Role.SUPER_ADMIN),
  import_google.default.disconnectCalendar
);
const GoogleRoutes = router;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GoogleRoutes
});
