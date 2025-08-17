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
var routes_exports = {};
__export(routes_exports, {
  default: () => routes_default
});
module.exports = __toCommonJS(routes_exports);
var import_express = __toESM(require("express"));
var import_auth = require("../modules/auth/auth.routes");
var import_user = require("../modules/user/user.routes");
var import_calendar = require("../modules/calendar/calendar.routes");
var import_client = require("../modules/client/client.routes");
var import_appointment = require("../modules/appointment/appointment.routes");
var import_publicCalendar = require("../modules/publicCalendar/publicCalendar.routes");
var import_publicAppointment = require("../modules/publicAppointment/publicAppointment.routes");
var import_optVerification = require("../modules/optVerification/optVerification.routes");
var import_payment = require("../modules/payment/payment.routes");
var import_google = require("../modules/google/google.routes");
const router = import_express.default.Router();
const routes = [
  { path: "/auth", route: import_auth.AuthRoutes },
  { path: "/users", route: import_user.UserRoutes },
  { path: "/calendars", route: import_calendar.CalendarRoutes },
  { path: "/clients", route: import_client.ClientRoutes },
  { path: "/appointments", route: import_appointment.AppointmentRoutes },
  { path: "/public-calenders", route: import_publicCalendar.PublicCalendarRoutes },
  { path: "/public-appointments", route: import_publicAppointment.PublicAppointmentRoutes },
  { path: "/otp", route: import_optVerification.OptVerificationRoutes },
  { path: "/payments", route: import_payment.PaymentRoutes },
  { path: "/google", route: import_google.GoogleRoutes }
];
routes.forEach((route) => {
  router.use(route.path, route.route);
});
var routes_default = router;
