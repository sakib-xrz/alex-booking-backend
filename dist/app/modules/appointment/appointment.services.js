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
var appointment_services_exports = {};
__export(appointment_services_exports, {
  default: () => appointment_services_default
});
module.exports = __toCommonJS(appointment_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
var import_pagination = __toESM(require("../../utils/pagination"));
var import_appointment = require("./appointment.constant");
const GetCounselorAppointmentsById = async (counselor_id, filters, paginationOptions) => {
  const { page, limit, skip, sort_by, sort_order } = (0, import_pagination.default)(paginationOptions);
  const { search, session_type, status, date } = filters;
  const whereConditions = {
    counselor_id,
    status: {
      not: "PENDING"
    }
  };
  if (search) {
    whereConditions.OR = import_appointment.appointmentSearchableFields.map((field) => ({
      client: {
        [field]: {
          contains: search,
          mode: "insensitive"
        }
      }
    }));
  }
  if (session_type) {
    whereConditions.session_type = session_type;
  }
  if (status) {
    whereConditions.status = status;
  }
  if (date) {
    whereConditions.date = new Date(date);
  }
  const orderBy = {};
  if (sort_by === "client_name") {
    orderBy.client = {
      first_name: sort_order
    };
  } else if (sort_by === "client_email") {
    orderBy.client = {
      email: sort_order
    };
  } else if (sort_by === "session_type") {
    orderBy.session_type = sort_order;
  } else if (sort_by === "status") {
    orderBy.status = sort_order;
  } else if (sort_by === "date") {
    orderBy.date = sort_order;
  } else {
    orderBy.created_at = sort_order;
  }
  const total = await import_prisma.default.appointment.count({
    where: whereConditions
  });
  const appointments = await import_prisma.default.appointment.findMany({
    where: whereConditions,
    select: {
      id: true,
      date: true,
      session_type: true,
      status: true,
      time_slot: {
        select: {
          start_time: true,
          end_time: true
        }
      },
      client: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone: true
        }
      },
      meeting: {
        select: {
          platform: true,
          link: true
        }
      },
      created_at: true
    },
    orderBy,
    skip,
    take: limit
  });
  const formattedAppointments = appointments.map((appointment) => ({
    id: appointment.id,
    sessionType: appointment.session_type,
    appointmentDate: appointment.date,
    startTime: appointment.time_slot.start_time,
    endTime: appointment.time_slot.end_time,
    status: appointment.status,
    client: {
      firstName: appointment.client.first_name,
      lastName: appointment.client.last_name,
      email: appointment.client.email,
      phone: appointment.client.phone
    },
    createdAt: appointment.created_at
  }));
  return {
    data: formattedAppointments,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};
const GetCounselorAppointmentDetailsById = async (id) => {
  const appointment = await import_prisma.default.appointment.findUnique({
    where: {
      id
    },
    select: {
      id: true,
      date: true,
      session_type: true,
      status: true,
      time_slot: {
        select: {
          start_time: true,
          end_time: true
        }
      },
      client: {
        select: {
          first_name: true,
          last_name: true,
          email: true,
          phone: true,
          date_of_birth: true,
          gender: true
        }
      },
      meeting: {
        select: {
          platform: true,
          link: true
        }
      },
      payment: {
        select: {
          amount: true,
          currency: true,
          status: true,
          transaction_id: true
        }
      },
      notes: true,
      created_at: true
    }
  });
  return appointment;
};
const CompleteAppointmentById = async (id) => {
  const appointment = await import_prisma.default.appointment.update({
    where: {
      id
    },
    data: {
      status: "COMPLETED"
    }
  });
  return appointment;
};
const AppointmentService = {
  GetCounselorAppointmentsById,
  GetCounselorAppointmentDetailsById,
  CompleteAppointmentById
};
var appointment_services_default = AppointmentService;
