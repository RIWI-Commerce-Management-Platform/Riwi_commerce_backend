import { Logger } from '@nestjs/common';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';

const logger = new Logger('PasswordResetMailer');

export interface PasswordResetMail {
  to: string;
  name: string;
  url: string;
}

/**
 * Sends the Better Auth reset link (HU-09). Uses Amazon SES when
 * AWS_SES_FROM_EMAIL is set (the sender must be verified in SES); otherwise
 * the link is only logged, which is enough for local development.
 */
export async function sendPasswordResetEmail(
  mail: PasswordResetMail,
  client: Pick<SESv2Client, 'send'> | null = defaultClient(),
): Promise<void> {
  const from = process.env.AWS_SES_FROM_EMAIL;
  if (!from || !client) {
    logger.warn(
      `AWS_SES_FROM_EMAIL is not set; password reset link for ${mail.to}: ${mail.url}`,
    );
    return;
  }

  await client.send(
    new SendEmailCommand({
      FromEmailAddress: from,
      Destination: { ToAddresses: [mail.to] },
      Content: {
        Simple: {
          Subject: { Data: 'Comercial 360 - Reset your password' },
          Body: {
            Text: {
              Data: [
                `Hi ${mail.name},`,
                '',
                'We received a request to reset your Comercial 360 password.',
                `Open this link within the next hour to choose a new one: ${mail.url}`,
                '',
                'If you did not request it, you can ignore this email.',
              ].join('\n'),
            },
          },
        },
      },
    }),
  );
}

function defaultClient(): SESv2Client | null {
  if (!process.env.AWS_SES_FROM_EMAIL) {
    return null;
  }
  return new SESv2Client({ region: process.env.AWS_REGION ?? 'us-east-1' });
}
