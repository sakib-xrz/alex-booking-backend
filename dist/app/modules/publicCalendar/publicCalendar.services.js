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
var publicCalendar_services_exports = {};
__export(publicCalendar_services_exports, {
  default: () => publicCalendar_services_default
});
module.exports = __toCommonJS(publicCalendar_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
const GetCounselorCalendar = async (counselorId) => {
  const calendarDates = await import_prisma.default.calendar.findMany({
    where: {
      counselor_id: counselorId,
      counselor: {
        is_deleted: false
      }
    },
    select: {
      id: true,
      date: true,
      counselor: {
        select: {
          id: true,
          name: true,
          email: true,
          profile_picture: true
        }
      },
      _count: {
        select: {
          time_slots: {
            where: {
              status: "AVAILABLE"
            }
          }
        }
      }
    },
    orderBy: {
      date: "asc"
    }
  });
  const calendar = calendarDates.map((item) => ({
    id: item.id,
    date: item.date.toISOString().split("T")[0],
    counselor: item.counselor,
    availableSlots: item._count.time_slots,
    hasAvailableSlots: item._count.time_slots > 0
  }));
  return { calendar };
};
const GetCounselorDateSlots = async (calendarId, date, type) => {
  const where = {
    calendar: {
      date: new Date(date).toISOString(),
      counselor_id: calendarId
    },
    status: "AVAILABLE"
  };
  if (type) {
    where.type = type;
  }
  const slots = await import_prisma.default.timeSlot.findMany({
    where
    // select: {
    //   id: true,
    //   start_time: true,
    //   end_time: true,
    //   type: true,
    //   status: true,
    //   calendar: {
    //     select: {
    //       date: true,
    //       counselor: {
    //         select: {
    //           id: true,
    //           name: true,
    //           profile_picture: true,
    //         },
    //       },
    //     },
    //   },
    // },
  });
  const sortedSlots = slots.sort((a, b) => {
    const aTime = /* @__PURE__ */ new Date(`1970-01-01T${a.start_time}`);
    const bTime = /* @__PURE__ */ new Date(`1970-01-01T${b.start_time}`);
    return aTime.getTime() - bTime.getTime();
  });
  return { slots: sortedSlots };
};
const PublicCalendarService = {
  GetCounselorCalendar,
  GetCounselorDateSlots
};
var publicCalendar_services_default = PublicCalendarService;
