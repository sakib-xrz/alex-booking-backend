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
var publicCalendar_routes_exports = {};
__export(publicCalendar_routes_exports, {
  PublicCalendarRoutes: () => PublicCalendarRoutes
});
module.exports = __toCommonJS(publicCalendar_routes_exports);
var import_express = __toESM(require("express"));
var import_validateRequest = __toESM(require("../../middlewares/validateRequest"));
var import_publicCalendar = __toESM(require("./publicCalendar.controller"));
var import_publicCalendar2 = __toESM(require("./publicCalendar.validation"));
const router = import_express.default.Router();
router.get(
  "/:counselorId",
  (0, import_validateRequest.default)(import_publicCalendar2.default.getCounselorCalendarSchema),
  import_publicCalendar.default.GetCounselorCalendar
);
router.get(
  "/:counselorId/slots/:date",
  // validateRequest(PublicCalendarValidation.getCounselorCalendarSchema),
  import_publicCalendar.default.GetCounselorDateSlots
);
router.get(
  "/slots/:calenderId",
  (0, import_validateRequest.default)(import_publicCalendar2.default.getCounselorSlotsSchema),
  import_publicCalendar.default.GetCounselorDateSlots
);
const PublicCalendarRoutes = router;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  PublicCalendarRoutes
});
