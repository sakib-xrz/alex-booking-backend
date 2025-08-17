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
var mailer_exports = {};
__export(mailer_exports, {
  default: () => mailer_default
});
module.exports = __toCommonJS(mailer_exports);
var import_nodemailer = __toESM(require("nodemailer"));
var import_config = __toESM(require("../config"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
const transporter = import_nodemailer.default.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  // Use `true` for port 465, `false` for all other ports
  auth: {
    user: import_config.default.emailSender.email,
    pass: import_config.default.emailSender.app_pass
  },
  tls: {
    rejectUnauthorized: false
  }
});
const sendMail = async (to, subject, body, attachmentPath) => {
  const attachment = attachmentPath ? {
    filename: import_path.default.basename(attachmentPath),
    content: import_fs.default.readFileSync(attachmentPath),
    encoding: "base64"
  } : void 0;
  const mailOptions = {
    from: `"Alexander Rodriguez" <${import_config.default.emailSender.email}>`,
    to,
    subject,
    html: body,
    attachments: attachment ? [attachment] : []
  };
  await transporter.sendMail(mailOptions);
};
var mailer_default = sendMail;
