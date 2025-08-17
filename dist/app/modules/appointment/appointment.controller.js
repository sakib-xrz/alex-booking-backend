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
var appointment_controller_exports = {};
__export(appointment_controller_exports, {
  default: () => appointment_controller_default
});
module.exports = __toCommonJS(appointment_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_pick = __toESM(require("../../utils/pick"));
var import_appointment = __toESM(require("./appointment.services"));
const GetCounselorAppointments = (0, import_catchAsync.default)(async (req, res) => {
  const filters = (0, import_pick.default)(req.query, ["search", "session_type", "status", "date"]);
  const paginationOptions = (0, import_pick.default)(req.query, [
    "page",
    "limit",
    "sort_by",
    "sort_order"
  ]);
  const result = await import_appointment.default.GetCounselorAppointmentsById(
    req.user.id,
    filters,
    paginationOptions
  );
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Appointments retrieved successfully",
    data: result.data,
    meta: result.meta
  });
});
const GetCounselorAppointmentDetailsById = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_appointment.default.GetCounselorAppointmentDetailsById(
    req.params.appointmentId
  );
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Appointment details retrieved successfully",
    data: result
  });
});
const CompleteCounselorAppointmentById = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_appointment.default.CompleteAppointmentById(
    req.params.appointmentId
  );
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Appointment details retrieved successfully",
    data: result
  });
});
const AppointmentController = {
  GetCounselorAppointments,
  GetCounselorAppointmentDetailsById,
  CompleteCounselorAppointmentById
};
var appointment_controller_default = AppointmentController;
