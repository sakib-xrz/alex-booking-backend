"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var import_app = __toESM(require("./app"));
var import_config = __toESM(require("./app/config"));
var import_autoCancelPendingAppointments = require("./app/modules/appointment/jobs/autoCancelPendingAppointments");
process.on("uncaughtException", (err) => {
  console.error(err);
  process.exit(1);
});
let server = null;
async function startServer() {
  server = import_app.default.listen(import_config.default.port, () => {
    console.log(`\u{1F3AF} Server listening on port: ${import_config.default.port}`);
  });
  process.on("unhandledRejection", (error) => {
    if (server) {
      server.close(() => {
        console.log(error);
        process.exit(1);
      });
    } else {
      process.exit(1);
    }
  });
}
(0, import_autoCancelPendingAppointments.scheduledAutoCancelPendingJobs)();
startServer();
process.on("SIGTERM", () => {
  if (server) {
    server.close();
  }
});
