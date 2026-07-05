import { afterEach, describe, expect, it } from 'vitest';
import {
  getEmailAddressDefaults,
  getSmtpConfig,
  isEmailConfigured,
  resetEmailTransportForTests,
} from '..';

const ENV_KEYS = [
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'SMTP_SECURE',
  'EMAIL_FROM',
  'SMTP_FROM',
  'EMAIL_REPLY_TO',
  'SUPPORT_EMAIL',
  'BILLING_EMAIL',
] as const;

function saveEnv(): Record<string, string | undefined> {
  const saved: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    saved[key] = process.env[key];
  }
  return saved;
}

function restoreEnv(saved: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = saved[key];
    }
  }
  resetEmailTransportForTests();
}

describe('email config', () => {
  let savedEnv: Record<string, string | undefined>;

  afterEach(() => {
    restoreEnv(savedEnv);
  });

  it('reports not configured when SMTP credentials are missing', () => {
    savedEnv = saveEnv();
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    expect(isEmailConfigured()).toBe(false);
    expect(getSmtpConfig()).toBeNull();
  });

  it('reports configured when Postmark-style SMTP vars are set', () => {
    savedEnv = saveEnv();
    process.env.SMTP_HOST = 'smtp.postmarkapp.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test-token';
    process.env.SMTP_PASS = 'test-token';
    process.env.SMTP_SECURE = 'false';

    expect(isEmailConfigured()).toBe(true);
    const config = getSmtpConfig();
    expect(config).toMatchObject({
      host: 'smtp.postmarkapp.com',
      port: 587,
      secure: false,
      auth: { user: 'test-token', pass: 'test-token' },
    });
  });

  it('centralizes from, reply-to, support, and billing addresses', () => {
    savedEnv = saveEnv();
    process.env.EMAIL_FROM = 'no-reply@vssyl.com';
    process.env.EMAIL_REPLY_TO = 'support@vssyl.com';
    process.env.SUPPORT_EMAIL = 'support@vssyl.com';
    process.env.BILLING_EMAIL = 'billing@vssyl.com';

    expect(getEmailAddressDefaults()).toEqual({
      from: 'Vssyl <no-reply@vssyl.com>',
      fromEmail: 'no-reply@vssyl.com',
      fromName: 'Vssyl',
      replyTo: 'support@vssyl.com',
      support: 'support@vssyl.com',
      billing: 'billing@vssyl.com',
    });
  });

  it('falls back SMTP_FROM to EMAIL_FROM and uses vssyl defaults', () => {
    savedEnv = saveEnv();
    delete process.env.EMAIL_FROM;
    process.env.SMTP_FROM = 'legacy@vssyl.com';

    expect(getEmailAddressDefaults().from).toBe('Vssyl <legacy@vssyl.com>');
    expect(getEmailAddressDefaults().fromEmail).toBe('legacy@vssyl.com');
  });

  it('uses safe defaults when address env vars are unset', () => {
    savedEnv = saveEnv();
    for (const key of ['EMAIL_FROM', 'SMTP_FROM', 'EMAIL_REPLY_TO', 'SUPPORT_EMAIL', 'BILLING_EMAIL']) {
      delete process.env[key];
    }

    expect(getEmailAddressDefaults()).toEqual({
      from: 'Vssyl <no-reply@vssyl.com>',
      fromEmail: 'no-reply@vssyl.com',
      fromName: 'Vssyl',
      replyTo: 'support@vssyl.com',
      support: 'support@vssyl.com',
      billing: 'billing@vssyl.com',
    });
  });
});
