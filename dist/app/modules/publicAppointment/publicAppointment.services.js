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
var publicAppointment_services_exports = {};
__export(publicAppointment_services_exports, {
  default: () => publicAppointment_services_default
});
module.exports = __toCommonJS(publicAppointment_services_exports);
var import_http_status = __toESM(require("http-status"));
var import_AppError = __toESM(require("../../errors/AppError"));
var import_prisma = __toESM(require("../../utils/prisma"));
const CreateAppointment = async (clientData, appointmentData) => {
  const expectedSlot = await import_prisma.default.timeSlot.findFirst({
    where: {
      id: appointmentData.time_slot_id,
      status: "AVAILABLE"
    },
    include: {
      calendar: {
        include: {
          counselor: true
        }
      }
    }
  });
  if (!expectedSlot) {
    throw new import_AppError.default(
      import_http_status.default.UNPROCESSABLE_ENTITY,
      "Slot is not available."
    );
  }
  if (expectedSlot.type !== appointmentData.session_type) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Session type does not match the selected time slot type."
    );
  }
  if (expectedSlot.calendar.counselor_id !== appointmentData.counselor_id) {
    throw new import_AppError.default(
      import_http_status.default.BAD_REQUEST,
      "Counselor does not match the selected time slot."
    );
  }
  const appointment = await import_prisma.default.$transaction(async (transaction) => {
    let client_id;
    const existingClient = await transaction.client.findUnique({
      where: {
        email: clientData.email
      }
    });
    if (existingClient == null ? void 0 : existingClient.id) {
      client_id = existingClient.id;
      await transaction.client.update({
        where: { id: client_id },
        data: {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          phone: clientData.phone,
          date_of_birth: new Date(clientData.date_of_birth).toISOString(),
          gender: clientData.gender
        }
      });
    } else {
      const newClient = await transaction.client.create({
        data: {
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          email: clientData.email,
          phone: clientData.phone,
          date_of_birth: new Date(clientData.date_of_birth).toISOString(),
          gender: clientData.gender
        }
      });
      client_id = newClient.id;
    }
    await transaction.timeSlot.update({
      where: { id: expectedSlot.id },
      data: { status: "PROCESSING" }
    });
    console.log("Appointment data from line 102:", appointmentData);
    const newAppointment = await transaction.appointment.create({
      data: {
        client_id,
        time_slot_id: expectedSlot.id,
        counselor_id: appointmentData.counselor_id,
        date: new Date(appointmentData.date).toISOString(),
        session_type: appointmentData.session_type,
        notes: appointmentData.notes,
        status: "PENDING"
      },
      include: {
        client: true,
        counselor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        time_slot: true
      }
    });
    console.log("Appointment created data from line 128:", newAppointment);
    return newAppointment;
  });
  return {
    ...appointment,
    requires_payment: true
  };
};
const getAppointment = async (id) => {
  const appointment = await import_prisma.default.appointment.findUnique({
    where: { id },
    include: {
      client: true,
      counselor: true,
      time_slot: true,
      payment: true
    }
  });
  if (!appointment) {
    throw new import_AppError.default(import_http_status.default.NOT_FOUND, "Appointment not found");
  }
  return appointment;
};
const PublicAppointmentService = { CreateAppointment, getAppointment };
var publicAppointment_services_default = PublicAppointmentService;
