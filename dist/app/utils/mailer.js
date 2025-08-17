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
const createTransporter = () => {
    const transporters = [
        {
            name: 'Gmail_TLS_587',
            config: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: config_1.default.emailSender.email,
                    pass: config_1.default.emailSender.app_pass,
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                logger: true,
            },
        },
        {
            name: 'Gmail_SSL_465',
            config: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: config_1.default.emailSender.email,
                    pass: config_1.default.emailSender.app_pass,
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                logger: true,
            },
        },
    ];
    return transporters.map((t) => ({
        name: t.name,
        transporter: nodemailer_1.default.createTransport(t.config),
    }));
};
const transporters = createTransporter();
const sendMail = (to, subject, body, attachmentPath) => __awaiter(void 0, void 0, void 0, function* () {
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
    let lastError = null;
    for (const { name, transporter } of transporters) {
        try {
            console.log(`:incoming_envelope: Attempting to send email using ${name}`);
            const info = yield transporter.sendMail(mailOptions);
            console.log(`:white_tick: Email sent to ${to} using ${name}: ${info.messageId}`);
            return info;
        }
        catch (error) {
            lastError = error;
            console.error(`:x: Failed with ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (error instanceof Error &&
                (error.message.includes('Invalid login') ||
                    error.message.includes('authentication'))) {
                console.error(':no_entry_symbol: Authentication failed, stopping retries.');
                break;
            }
        }
    }
    throw new Error(`All transporters failed. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown'}`);
});
exports.default = sendMail;
