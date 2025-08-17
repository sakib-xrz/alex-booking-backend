import nodemailer from 'nodemailer';
import config from '../config';
import fs from 'fs';
import path from 'path';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use `true` for port 465, `false` for all other ports
  auth: {
    user: config.emailSender.email,
    pass: config.emailSender.app_pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  // Add timeout configurations
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 5000, // 5 seconds
  socketTimeout: 10000, // 10 seconds
  // Add pool configuration for better connection management
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

const sendMail = async (
  to: string,
  subject: string,
  body: string,
  attachmentPath?: string,
) => {
  try {
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

    // Add a Promise-based timeout wrapper
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise(
      (_, reject) =>
        setTimeout(() => reject(new Error('Email sending timeout')), 15000), // 15 seconds timeout
    );

    await Promise.race([emailPromise, timeoutPromise]);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(
      `Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

export default sendMail;
