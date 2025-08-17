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
var client_services_exports = {};
__export(client_services_exports, {
  default: () => client_services_default
});
module.exports = __toCommonJS(client_services_exports);
var import_prisma = __toESM(require("../../utils/prisma"));
const GetCounselorClientsById = async (counselor_id) => {
  const clients = await import_prisma.default.client.findMany({
    where: {
      appointments: {
        every: {
          counselor_id
        }
      }
    },
    select: {
      first_name: true,
      last_name: true,
      email: true,
      gender: true,
      date_of_birth: true,
      phone: true,
      id: true,
      created_at: true,
      _count: {
        select: {
          appointments: {
            where: {
              status: {
                not: "PENDING"
              }
            }
          }
        }
      }
    },
    orderBy: {
      created_at: "asc"
    }
  });
  const formattedClients = clients.map((client) => ({
    id: client.id,
    firstName: client.first_name,
    lastName: client.last_name,
    email: client.email,
    phone: client.phone,
    gender: client.gender,
    totalAppointments: client._count.appointments,
    dateOfBirth: client.date_of_birth,
    createdAt: client.created_at
  }));
  return formattedClients;
};
const ClientService = {
  GetCounselorClientsById
};
var client_services_default = ClientService;
