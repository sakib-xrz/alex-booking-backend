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
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});
module.exports = __toCommonJS(app_exports);
var import_express = __toESM(require("express"));
var import_morgan = __toESM(require("morgan"));
var import_cors = __toESM(require("cors"));
var import_body_parser = __toESM(require("body-parser"));
var import_cookie_parser = __toESM(require("cookie-parser"));
var import_notFound = __toESM(require("./app/middlewares/notFound"));
var import_routes = __toESM(require("./app/routes"));
var import_globalErrorHandler = __toESM(require("./app/middlewares/globalErrorHandler"));
var import_payment = require("./app/modules/payment/payment.controller");
const app = (0, import_express.default)();
app.use(
  "/api/v1/payments/webhook",
  import_express.default.raw({ type: "application/json" }),
  import_payment.PaymentController.handleWebhook
);
app.use((0, import_morgan.default)("dev"));
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use(import_body_parser.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((0, import_cookie_parser.default)());
app.use(
  (0, import_cors.default)({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://admin-alexrodriguez.vercel.app",
      "https://alex-rodriguez.vercel.app"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type, Authorization, Origin, X-Requested-With, Accept",
    credentials: true
  })
);
app.use("/api/v1", import_routes.default);
app.use(import_globalErrorHandler.default);
app.use(import_notFound.default);
var app_default = app;
