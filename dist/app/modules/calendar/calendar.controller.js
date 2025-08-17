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
var calendar_controller_exports = {};
__export(calendar_controller_exports, {
  default: () => calendar_controller_default
});
module.exports = __toCommonJS(calendar_controller_exports);
var import_http_status = __toESM(require("http-status"));
var import_catchAsync = __toESM(require("../../utils/catchAsync"));
var import_sendResponse = __toESM(require("../../utils/sendResponse"));
var import_calendar = __toESM(require("./calendar.services"));
const GetCalendar = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_calendar.default.GetCalenders(req.user.id);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "All calendar dates retrieved successfully",
    data: result
  });
});
const PostCalendarDate = (0, import_catchAsync.default)(async (req, res) => {
  const date = req.body.date;
  const result = await import_calendar.default.CreateCalenderDate(req.user.id, date);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.CREATED,
    message: "Calendar date created successfully",
    data: result
  });
});
const GetDateSlots = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_calendar.default.GetDateSlots(req.params.id);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.OK,
    message: "Calendar slots retrieved successfully",
    data: result
  });
});
const PostDateSlots = (0, import_catchAsync.default)(async (req, res) => {
  const result = await import_calendar.default.CreateDateSlots(req.params.id, req.body);
  (0, import_sendResponse.default)(res, {
    success: true,
    statusCode: import_http_status.default.CREATED,
    message: "Calendar slots created successfully",
    data: result
  });
});
const CalendarController = {
  GetCalendar,
  PostCalendarDate,
  GetDateSlots,
  PostDateSlots
};
var calendar_controller_default = CalendarController;
