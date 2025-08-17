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
var publicAppointment_controller_exports = {};
__export(publicAppointment_controller_exports, {
  default: () => publicAppointment_controller_default
});
module.exports = __toCommonJS(publicAppointment_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_publicAppointment = __toESM(require("./publicAppointment.services"));
const PostAppointment = (0, import_catchAsync.default)(async (req, res) => {
  const data = req.body;
  const clientData = {
    first_name: data.firstName,
    last_name: data.lastName,
    email: data.email,
    phone: data.phone,
    date_of_birth: data.dateOfBirth,
    gender: data.gender || "OTHER"
  };
  const appointmentData = {
    session_type: data.sessionType,
    date: data.date,
    time_slot_id: data.timeSlotId,
    notes: data.notes || "N/A",
    counselor_id: data.counselorId
  };
  const result = await import_publicAppointment.default.CreateAppointment(
    clientData,
    appointmentData
  );
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.CREATED,
    message: "Appointment created successfully",
    data: result
  });
});
const getAppointment = (0, import_catchAsync.default)(async (req, res) => {
  const { id } = req.params;
  const result = await import_publicAppointment.default.getAppointment(id);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Appointment fetched successfully",
    data: result
  });
});
const PublicAppointmentController = { PostAppointment, getAppointment };
var publicAppointment_controller_default = PublicAppointmentController;
