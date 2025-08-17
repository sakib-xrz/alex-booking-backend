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
            name: 'Gmail_587',
            config: {
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                auth: {
                    user: config_1.default.emailSender.email,
                    pass: config_1.default.emailSender.app_pass,
                },
                tls: {
                    rejectUnauthorized: false,
                    ciphers: 'SSLv3',
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                pool: false,
                debug: true,
            },
        },
        {
            name: 'Gmail_465',
            config: {
                host: 'smtp.gmail.com',
                port: 465,
                secure: true,
                auth: {
                    user: config_1.default.emailSender.email,
                    pass: config_1.default.emailSender.app_pass,
                },
                tls: {
                    rejectUnauthorized: false,
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                pool: false,
                debug: true,
            },
        },
        {
            name: 'Gmail_25',
            config: {
                host: 'smtp.gmail.com',
                port: 25,
                secure: false,
                auth: {
                    user: config_1.default.emailSender.email,
                    pass: config_1.default.emailSender.app_pass,
                },
                tls: {
                    rejectUnauthorized: false,
                },
                connectionTimeout: 15000,
                greetingTimeout: 10000,
                socketTimeout: 15000,
                pool: false,
                debug: true,
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
            console.log(`Attempting to send email using ${name}`);
            const emailPromise = transporter.sendMail(mailOptions);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`${name} timeout`)), 20000));
            yield Promise.race([emailPromise, timeoutPromise]);
            console.log(`Email sent successfully to ${to} using ${name}`);
            return;
        }
        catch (error) {
            lastError = error;
            console.error(`Failed to send email using ${name}:`, error);
            if (error instanceof Error &&
                (error.message.includes('Invalid login') ||
                    error.message.includes('authentication'))) {
                console.error('Authentication failed, stopping retry attempts');
                break;
            }
            continue;
        }
    }
    console.error('All email transporters failed');
    throw new Error(`Failed to send email with all transporters. Last error: ${(lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Unknown error'}`);
});
exports.default = sendMail;
