import nodemailer from 'nodemailer';
import config from '../config';
import fs from 'fs';
import path from 'path';

// Create multiple transporter configurations for fallback
const createTransporter = () => {
  const transporters = [
    // Primary: Gmail SMTP with port 587
    {
      name: 'Gmail_587',
      config: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: config.emailSender.email,
          pass: config.emailSender.app_pass,
        },
        tls: {
          rejectUnauthorized: false,
          ciphers: 'SSLv3',
        },
        connectionTimeout: 15000, // 15 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 15000, // 15 seconds
        pool: false, // Disable pooling for production debugging
        debug: true, // Enable debug logging
      },
    },
    // Fallback 1: Gmail SMTP with port 465 (SSL)
    {
      name: 'Gmail_465',
      config: {
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: config.emailSender.email,
          pass: config.emailSender.app_pass,
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
    // Fallback 2: Gmail SMTP with port 25 (if available)
    {
      name: 'Gmail_25',
      config: {
        host: 'smtp.gmail.com',
        port: 25,
        secure: false,
        auth: {
          user: config.emailSender.email,
          pass: config.emailSender.app_pass,
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

  // Try each transporter until one succeeds
  let lastError: Error | null = null;

  for (const { name, transporter } of transporters) {
    try {
      console.log(`Attempting to send email using ${name}`);

      // Add a Promise-based timeout wrapper for each attempt
      const emailPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error(`${name} timeout`)), 20000), // 20 seconds timeout per attempt
      );

      await Promise.race([emailPromise, timeoutPromise]);
      console.log(`Email sent successfully to ${to} using ${name}`);
      return; // Success, exit the function
    } catch (error) {
      lastError = error as Error;
      console.error(`Failed to send email using ${name}:`, error);

      // If this is a connection timeout, try next transporter immediately
      // If it's auth error, stop trying (no point in retrying with same credentials)
      if (
        error instanceof Error &&
        (error.message.includes('Invalid login') ||
          error.message.includes('authentication'))
      ) {
        console.error('Authentication failed, stopping retry attempts');
        break;
      }

      // Continue to next transporter
      continue;
    }
  }

  // If we get here, all transporters failed
  console.error('All email transporters failed');
  throw new Error(
    `Failed to send email with all transporters. Last error: ${lastError?.message || 'Unknown error'}`,
  );
};

export default sendMail;
