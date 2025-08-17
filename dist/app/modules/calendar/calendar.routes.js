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
var calendar_routes_exports = {};
__export(calendar_routes_exports, {
  CalendarRoutes: () => CalendarRoutes
});
module.exports = __toCommonJS(calendar_routes_exports);
var import_express = __toESM(require("express"));
var import_client = require("@prisma/client");
var import_auth = __toESM(require("../../middlewares/auth"));
var import_validateRequest = __toESM(require("../../middlewares/validateRequest"));
var import_calendar = __toESM(require("./calendar.controller"));
var import_calendar2 = __toESM(require("./calendar.validation"));
const router = import_express.default.Router();
router.use((0, import_auth.default)(import_client.Role.SUPER_ADMIN, import_client.Role.COUNSELOR));
router.route("/").get(import_calendar.default.GetCalendar).post(
  (0, import_validateRequest.default)(import_calendar2.default.CreateCalendarSchema),
  import_calendar.default.PostCalendarDate
);
router.route("/:id/slots").get(import_calendar.default.GetDateSlots).post(
  (0, import_validateRequest.default)(import_calendar2.default.CreateSlotsSchema),
  import_calendar.default.PostDateSlots
);
const CalendarRoutes = router;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CalendarRoutes
});
