import nodemailer from 'nodemailer';
import config from '../config';
import fs from 'fs';
import path from 'path';

// Create Gmail transporters (587 TLS + 465 SSL fallback)
const createTransporter = () => {
  const transporters = [
    {
      name: 'Gmail_TLS_587',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false, // STARTTLS
        auth: {
          user: config.emailSender.email,
          pass: config.emailSender.app_pass, // must be App Password
        },
        connectionTimeout: 15000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        logger: true, // enable Nodemailer logs
      },
    },
    {
      name: 'Gmail_SSL_465',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // SSL
        auth: {
          user: config.emailSender.email,
          pass: config.emailSender.app_pass,
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
    transporter: nodemailer.createTransport(t.config),
  }));
};
const transporters = createTransporter();
const sendMail = async (
  to: string,
  subject: string,
  body: string,
  attachmentPath?: string,
) => {
  const attachment = attachmentPath
    ? {
        filename: path.basename(attachmentPath),
        content: fs.readFileSync(attachmentPath),
        encoding: 'base64',
      }
    : undefined;
  const mailOptions = {
    from: `"Alexander Rodriguez" <${config.emailSender.email}>`,
    to,
    subject,
    html: body,
    attachments: attachment ? [attachment] : [],
  };
  let lastError = null;
  for (const { name, transporter } of transporters) {
    try {
      console.log(`:incoming_envelope: Attempting to send email using ${name}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(
        `:white_tick: Email sent to ${to} using ${name}: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      lastError = error;
      console.error(
        `:x: Failed with ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      if (
        error instanceof Error &&
        (error.message.includes('Invalid login') ||
          error.message.includes('authentication'))
      ) {
        console.error(
          ':no_entry_symbol: Authentication failed, stopping retries.',
        );
        break;
      }
    }
  }
  throw new Error(
    `All transporters failed. Last error: ${lastError instanceof Error ? lastError.message : 'Unknown'}`,
  );
};
export default sendMail;
