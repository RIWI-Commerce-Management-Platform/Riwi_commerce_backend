import { Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';

const logger = new Logger('PasswordResetMailer');
let transporter: Transporter | undefined;

function getTransporter(): Transporter {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) {
    throw new Error(
      'SMTP_HOST, SMTP_USER, and SMTP_PASSWORD must be configured to send password reset emails',
    );
  }

  transporter ??= nodemailer.createTransport({
    host,
    port: Number.parseInt(process.env.SMTP_PORT ?? '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user, pass: password },
  });
  return transporter;
}

export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
): Promise<void> {
  try {
    const from = process.env.SMTP_FROM;
    if (!from) {
      throw new Error(
        'SMTP_FROM must be configured to send password reset emails',
      );
    }
    await getTransporter().sendMail({
      from,
      to: email,
      subject: 'Reset your RIWI Commerce password',
      text: `Use this link to reset your password. It expires soon and can only be used once:\n\n${resetUrl}`,
      html: `<p>Use the link below to reset your password. It expires soon and can only be used once.</p><p><a href="${resetUrl}">Reset password</a></p>`,
    });
  } catch (error) {
    logger.error(
      'Failed to send password reset email',
      error instanceof Error ? error.stack : String(error),
    );
  }
}
