import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { Logger } from '@nestjs/common';
import { sendPasswordResetEmail } from './password-reset-mailer.js';

const mockSendMail = vi.fn().mockResolvedValue({ messageId: 'msg-1' });

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: mockSendMail,
    })),
  },
}));

describe('PasswordResetMailer', () => {
  let originalEnv: NodeJS.ProcessEnv;
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});

  beforeEach(() => {
    originalEnv = { ...process.env };
    mockSendMail.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('logs error when SMTP_FROM is not configured', async () => {
    delete process.env.SMTP_FROM;
    await expect(
      sendPasswordResetEmail('user@riwi.com', 'http://reset'),
    ).resolves.toBeUndefined();
    expect(mockSendMail).not.toHaveBeenCalled();
  });

  it('sends email successfully when SMTP is configured', async () => {
    process.env.SMTP_FROM = 'noreply@riwi.com';
    process.env.SMTP_HOST = 'smtp.riwi.com';
    process.env.SMTP_USER = 'smtp-user';
    process.env.SMTP_PASSWORD = 'smtp-pass';
    process.env.SMTP_PORT = '587';

    await sendPasswordResetEmail('user@riwi.com', 'http://reset-link');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'noreply@riwi.com',
        to: 'user@riwi.com',
        subject: expect.stringContaining('Reset'),
        html: expect.stringContaining('http://reset-link'),
      }),
    );
  });
});
