"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const config_1 = __importDefault(require("../config"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const transporter = nodemailer_1.default.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: config_1.default.emailSender.email,
        pass: config_1.default.emailSender.app_pass,
    },
    tls: {
        rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
});
const sendMail = (to, subject, body, attachmentPath) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const attachment = attachmentPath
            ? {
                filename: path_1.default.basename(attachmentPath),
                content: fs_1.default.readFileSync(attachmentPath),
                encoding: 'base64',
            }
            : undefined;
        const mailOptions = {
            from: `"Alexander Rodriguez" <${config_1.default.emailSender.email}>`,
            to,
            subject,
            html: body,
            attachments: attachment ? [attachment] : [],
        };
        const emailPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Email sending timeout')), 15000));
        yield Promise.race([emailPromise, timeoutPromise]);
        console.log(`Email sent successfully to ${to}`);
    }
    catch (error) {
        console.error('Email sending failed:', error);
        throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
});
exports.default = sendMail;
