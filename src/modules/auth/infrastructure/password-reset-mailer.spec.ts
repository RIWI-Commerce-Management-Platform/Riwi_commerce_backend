import { afterEach, describe, expect, it, vi } from 'vitest';
import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2';
import { sendPasswordResetEmail } from './password-reset-mailer.js';

describe('sendPasswordResetEmail', () => {
  const mail = {
    to: 'ana@example.com',
    name: 'Ana',
    url: 'http://localhost:3015/api/auth/reset-password/abc',
  };

  afterEach(() => {
    delete process.env.AWS_SES_FROM_EMAIL;
  });

  it('only logs the link when no sender is configured', async () => {
    const client = { send: vi.fn() };

    await sendPasswordResetEmail(mail, client as any);

    expect(client.send).not.toHaveBeenCalled();
  });

  it('sends the link through SES when a sender is configured', async () => {
    process.env.AWS_SES_FROM_EMAIL = 'no-reply@comercial360.co';
    const client = { send: vi.fn().mockResolvedValue({}) };

    await sendPasswordResetEmail(mail, client as any);

    const command = client.send.mock.calls[0][0] as SendEmailCommand;
    expect(command).toBeInstanceOf(SendEmailCommand);
    expect(command.input.FromEmailAddress).toBe('no-reply@comercial360.co');
    expect(command.input.Destination?.ToAddresses).toEqual(['ana@example.com']);
    expect(command.input.Content?.Simple?.Body?.Text?.Data).toContain(mail.url);
  });

  it('only logs the link with the default client when no sender is set', async () => {
    await expect(sendPasswordResetEmail(mail)).resolves.toBeUndefined();
  });

  it('builds a default SES client when a sender is configured', async () => {
    process.env.AWS_SES_FROM_EMAIL = 'no-reply@comercial360.co';
    const send = vi
      .spyOn(SESv2Client.prototype, 'send')
      .mockResolvedValue({} as never);

    await sendPasswordResetEmail(mail);

    expect(send).toHaveBeenCalledTimes(1);
    send.mockRestore();
  });
});
