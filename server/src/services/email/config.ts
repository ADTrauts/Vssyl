import type { EmailAddressDefaults } from './types';

const DEFAULT_FROM = 'no-reply@vssyl.com';
const DEFAULT_FROM_NAME = 'Vssyl';
const DEFAULT_REPLY_TO = 'support@vssyl.com';
const DEFAULT_SUPPORT = 'support@vssyl.com';
const DEFAULT_BILLING = 'billing@vssyl.com';

export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/** Format `Display Name <email@domain>` unless already formatted. */
export function formatFromHeader(email: string, name?: string): string {
  const trimmed = email.trim();
  if (trimmed.includes('<') && trimmed.includes('>')) {
    return trimmed;
  }
  const displayName = (name ?? readEnv('EMAIL_FROM_NAME') ?? DEFAULT_FROM_NAME).trim();
  return `${displayName} <${trimmed}>`;
}

/** Resolved sender / destination addresses (no secrets). */
export function getEmailAddressDefaults(): EmailAddressDefaults {
  const fromEmail = readEnv('EMAIL_FROM') ?? readEnv('SMTP_FROM') ?? DEFAULT_FROM;
  const fromName = readEnv('EMAIL_FROM_NAME') ?? DEFAULT_FROM_NAME;
  const from = formatFromHeader(fromEmail, fromName);
  const replyTo = readEnv('EMAIL_REPLY_TO') ?? DEFAULT_REPLY_TO;
  const support = readEnv('SUPPORT_EMAIL') ?? replyTo ?? DEFAULT_SUPPORT;
  const billing = readEnv('BILLING_EMAIL') ?? DEFAULT_BILLING;
  return { from, fromEmail, fromName, replyTo, support, billing };
}

export function getAppBaseUrl(): string {
  return readEnv('NEXT_PUBLIC_APP_URL') ?? 'https://vssyl.com';
}

/** True when SMTP host and credentials are present. */
export function isEmailConfigured(): boolean {
  return getSmtpConfig() !== null;
}

/** Returns SMTP settings or null when required vars are missing. */
export function getSmtpConfig(): SmtpConfig | null {
  const host = readEnv('SMTP_HOST');
  const user = readEnv('SMTP_USER');
  const pass = readEnv('SMTP_PASS');

  if (!host || !user || !pass) {
    return null;
  }

  const portRaw = readEnv('SMTP_PORT');
  const port = portRaw ? parseInt(portRaw, 10) : 587;
  if (!Number.isFinite(port) || port <= 0) {
    return null;
  }

  return {
    host,
    port,
    secure: readEnv('SMTP_SECURE') === 'true',
    auth: { user, pass },
  };
}
