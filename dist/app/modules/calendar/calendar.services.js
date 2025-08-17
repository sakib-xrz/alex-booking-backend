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
var calendar_services_exports = {};
__export(calendar_services_exports, {
  default: () => calendar_services_default
});
module.exports = __toCommonJS(calendar_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
const GetCalenders = async (counselorId) => {
  const calenderDates = await import_prisma.default.calendar.findMany({
    where: {
      counselor_id: counselorId
    },
    select: {
      id: true,
      date: true,
      _count: {
        select: {
          time_slots: true
        }
      }
    }
  });
  const calender = calenderDates.map((item) => ({
    id: item.id,
    isoDate: item.date,
    date: item.date.toISOString().split("T")[0],
    availableSlots: item._count.time_slots,
    haveSlots: !!item._count.time_slots
  }));
  return { calender };
};
const CreateCalenderDate = async (counselorId, date) => {
  const createdCalenderDate = await import_prisma.default.calendar.create({
    data: {
      counselor_id: counselorId,
      date
    }
  });
  return createdCalenderDate;
};
const GetDateSlots = async (calendarId) => {
  const where = {
    calendar_id: calendarId
  };
  const result = await import_prisma.default.timeSlot.findMany({
    where,
    select: {
      id: true,
      start_time: true,
      end_time: true,
      type: true,
      status: true,
      created_at: true,
      updated_at: true
    }
  });
  const formattedResult = result.map((slot) => ({
    id: slot.id,
    startTime: slot.start_time,
    endTime: slot.end_time,
    type: slot.type,
    status: slot.status,
    createdAt: slot.created_at,
    updatedAt: slot.updated_at
  }));
  return formattedResult;
};
const CreateDateSlots = async (calendarId, slots) => {
  const result = await import_prisma.default.timeSlot.createMany({
    data: slots.data.map((item) => ({
      calendar_id: calendarId,
      start_time: item.start_time,
      end_time: item.end_time,
      type: item.type
    }))
  });
  return result;
};
const CalendarService = {
  GetCalenders,
  CreateCalenderDate,
  GetDateSlots,
  CreateDateSlots
};
var calendar_services_default = CalendarService;
