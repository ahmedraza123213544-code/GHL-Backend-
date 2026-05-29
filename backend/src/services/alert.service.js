import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const RETRY_DELAYS_MS = 5000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTransporter() {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

/**
 * Sends a failure alert email when a daily post job fails for a location.
 */
export async function sendFailureAlert(locationId, businessName, error) {
  const timestamp = new Date().toISOString();
  const subject = `GBP Post Failed - ${businessName}`;
  const text = [
    'A Google Business Profile post failed during the daily job.',
    '',
    `Location ID: ${locationId}`,
    `Business: ${businessName}`,
    `Error: ${error}`,
    `Timestamp: ${timestamp}`,
  ].join('\n');

  if (env.MOCK_MODE) {
    console.info(
      JSON.stringify({
        event: 'failure_alert_mock',
        locationId,
        businessName,
        error,
        timestamp,
        subject,
      }),
    );
    return { mock: true };
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS || !env.ALERT_EMAIL_FROM || !env.ALERT_EMAIL_TO) {
    console.warn(
      JSON.stringify({
        event: 'failure_alert_skipped',
        reason: 'SMTP or alert email env not configured',
        locationId,
        businessName,
        error,
      }),
    );
    return { skipped: true };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: env.ALERT_EMAIL_FROM,
    to: env.ALERT_EMAIL_TO,
    subject,
    text,
  });

  console.info(
    JSON.stringify({
      event: 'failure_alert_sent',
      locationId,
      businessName,
      messageId: info.messageId,
    }),
  );

  return info;
}

export { sleep, RETRY_DELAYS_MS };
