/**
 * Live SMTP smoke test — reads credentials from environment only (never logs secrets).
 *
 * Usage (Postmark):
 *   SMTP_HOST=smtp.postmarkapp.com SMTP_PORT=587 \
 *   SMTP_USER=<server-api-token> SMTP_PASS=<server-api-token> \
 *   EMAIL_FROM=no-reply@vssyl.com EMAIL_REPLY_TO=support@vssyl.com \
 *   SUPPORT_EMAIL=support@vssyl.com BILLING_EMAIL=billing@vssyl.com \
 *   NEXT_PUBLIC_APP_URL=https://vssyl.com \
 *   pnpm exec tsx scripts/smtp-smoke-test.ts andrew.trautman@vssyl.com
 *
 * Optional: --env-file <path> loads non-secret defaults; SMTP_USER/SMTP_PASS must still be set in env.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { resetEmailTransportForTests, getEmailTransport } from '../src/services/email/transport';
import {
  isEmailConfigured,
  sendBusinessInvitationEmail,
  sendContactFormEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from '../src/services/email';

function parseRecipient(argv: string[]): string {
  const toFlag = argv.indexOf('--to');
  if (toFlag >= 0 && argv[toFlag + 1]?.includes('@')) {
    return argv[toFlag + 1];
  }
  const emailArg = [...argv].reverse().find((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a));
  return emailArg ?? 'andrew.trautman@vssyl.com';
}

const TEST_RECIPIENT = parseRecipient(process.argv.slice(2));
const SMOKE_TOKEN = 'smtp-smoke-test-token-not-for-production-use';

interface TestCaseResult {
  name: string;
  function: string;
  sent: boolean;
  messageId?: string;
  error?: string;
}

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function applyPostmarkProductionDefaults(): void {
  process.env.SMTP_HOST = 'smtp.postmarkapp.com';
  process.env.SMTP_PORT = process.env.SMTP_PORT ?? '587';
  process.env.SMTP_SECURE = process.env.SMTP_SECURE ?? 'false';
  process.env.EMAIL_FROM = 'no-reply@vssyl.com';
  process.env.EMAIL_REPLY_TO = 'support@vssyl.com';
  process.env.SUPPORT_EMAIL = 'support@vssyl.com';
  process.env.BILLING_EMAIL = 'billing@vssyl.com';
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vssyl.com';

  const postmarkToken = process.env.POSTMARK_SERVER_TOKEN?.trim();
  if (postmarkToken) {
    process.env.SMTP_USER = postmarkToken;
    process.env.SMTP_PASS = postmarkToken;
  }
}

async function runTest(
  name: string,
  fn: string,
  run: () => Promise<{ sent: boolean; messageId?: string }>
): Promise<TestCaseResult> {
  resetEmailTransportForTests();
  try {
    const result = await run();
    return {
      name,
      function: fn,
      sent: result.sent,
      messageId: result.messageId,
      error: result.sent ? undefined : 'sendEmail returned sent:false',
    };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    return { name, function: fn, sent: false, error: err.message };
  }
}

async function main(): Promise<void> {
  const envFileArg = process.argv.indexOf('--env-file');
  if (envFileArg >= 0 && process.argv[envFileArg + 1]) {
    loadEnvFile(resolve(process.cwd(), process.argv[envFileArg + 1]));
  }

  applyPostmarkProductionDefaults();
  resetEmailTransportForTests();

  const host = process.env.SMTP_HOST ?? '';
  const configured = isEmailConfigured();

  const summary: {
    timestamp: string;
    recipient: string;
    smtpHost: string;
    smtpPort: string;
    emailFrom?: string;
    emailReplyTo?: string;
    supportEmail?: string;
    configured: boolean;
    postmarkTarget: boolean;
    smtpVerify?: string;
    smtpVerifyError?: string;
    results: TestCaseResult[];
    passed?: number;
    failed?: number;
  } = {
    timestamp: new Date().toISOString(),
    recipient: TEST_RECIPIENT,
    smtpHost: host,
    smtpPort: process.env.SMTP_PORT ?? '587',
    emailFrom: process.env.EMAIL_FROM,
    emailReplyTo: process.env.EMAIL_REPLY_TO,
    supportEmail: process.env.SUPPORT_EMAIL,
    configured,
    postmarkTarget: host.includes('postmarkapp.com'),
    results: [] as TestCaseResult[],
  };

  if (!configured) {
    console.log(JSON.stringify({ ...summary, error: 'SMTP not configured (missing host/user/pass)' }, null, 2));
    process.exit(1);
  }

  const transport = getEmailTransport();
  if (transport) {
    try {
      await transport.verify();
      summary.smtpVerify = 'ok';
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      summary.smtpVerify = 'failed';
      summary.smtpVerifyError = err.message;
    }
  }

  summary.results.push(
    await runTest('Contact form (to support)', 'sendContactFormEmail', () =>
      sendContactFormEmail({
        name: 'SMTP Smoke Test',
        email: TEST_RECIPIENT,
        subject: `[Smoke] Contact ${new Date().toISOString()}`,
        message: 'Automated contact form smoke test.',
        company: 'Vssyl',
      })
    )
  );

  summary.results.push(
    await runTest('Password reset', 'sendPasswordResetEmail', () =>
      sendPasswordResetEmail(TEST_RECIPIENT, SMOKE_TOKEN)
    )
  );

  summary.results.push(
    await runTest('Business invitation', 'sendBusinessInvitationEmail', () =>
      sendBusinessInvitationEmail(
        TEST_RECIPIENT,
        'Smoke Test Business',
        'Vssyl Operator',
        'EMPLOYEE',
        'Engineer',
        'Platform',
        SMOKE_TOKEN,
        'Automated invitation smoke test.',
        'BLOCK-SMOKE-001'
      )
    )
  );

  summary.results.push(
    await runTest('Email verification', 'sendVerificationEmail', () =>
      sendVerificationEmail(TEST_RECIPIENT, SMOKE_TOKEN)
    )
  );

  const passed = summary.results.filter((r) => r.sent).length;
  const failed = summary.results.length - passed;

  console.log(JSON.stringify({ ...summary, passed, failed }, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error: unknown) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(JSON.stringify({ error: err.message }, null, 2));
  process.exit(1);
});
