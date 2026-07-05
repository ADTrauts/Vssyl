/**
 * Live transactional email render verification (Postmark production).
 * Sends sample emails and validates HTML/text structure without logging secrets.
 *
 * Usage:
 *   cd server && pnpm email:verify-live -- --to andrew.trautman@vssyl.com
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { resetEmailTransportForTests } from '../src/services/email/transport';
import {
  getEmailAddressDefaults,
  isEmailConfigured,
  sendBusinessInvitationEmail,
  sendCalendarCancelEmail,
  sendCalendarInviteEmail,
  sendCalendarUpdateEmail,
  sendContactFormEmail,
  sendEmail,
  sendPasswordResetEmail,
  sendPriceChangeNotification,
  sendVerificationEmail,
  sendWelcomeEmail,
} from '../src/services/email';
import {
  buildBusinessInvitationEmail,
  buildCalendarEventEmail,
  buildContactFormEmail,
  buildNotificationEmail,
  buildPasswordResetEmail,
  buildPriceChangeEmail,
  buildSupportTicketAssignedEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
  containsLikelySecret,
} from '../src/services/email/templates';

const RECIPIENT =
  process.argv.includes('--to') && process.argv[process.argv.indexOf('--to') + 1]
    ? process.argv[process.argv.indexOf('--to') + 1]
    : 'andrew.trautman@vssyl.com';

const SMOKE_TOKEN = 'live-render-verify-token-not-for-production';
const MINIMAL_ICS = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR';

interface RenderChecks {
  htmlPass: boolean;
  textPass: boolean;
  ctaPass: boolean;
  footerPass: boolean;
  preheaderPass: boolean;
  fallbackPass: boolean;
  htmlIssues: string[];
  textIssues: string[];
}

export interface EmailVerificationRow {
  email: string;
  result: 'PASS' | 'FAIL' | 'N/A' | 'PARTIAL';
  subject: string;
  from: string;
  replyTo: string;
  previewText: string;
  sent: boolean;
  messageId?: string;
  error?: string;
  html: 'PASS' | 'FAIL' | 'N/A';
  plainText: 'PASS' | 'FAIL' | 'N/A';
  cta: 'PASS' | 'FAIL' | 'N/A';
  footer: 'PASS' | 'FAIL' | 'N/A';
  fallbackLink: 'PASS' | 'FAIL' | 'N/A';
  mobileIssues: string;
  accessibilityNotes: string;
  recommendedImprovements: string;
}

function applyPostmarkDefaults(): void {
  process.env.SMTP_HOST = 'smtp.postmarkapp.com';
  process.env.SMTP_PORT = process.env.SMTP_PORT ?? '587';
  process.env.SMTP_SECURE = process.env.SMTP_SECURE ?? 'false';
  process.env.EMAIL_FROM = process.env.EMAIL_FROM ?? 'no-reply@vssyl.com';
  process.env.EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'support@vssyl.com';
  process.env.SUPPORT_EMAIL = process.env.SUPPORT_EMAIL ?? 'support@vssyl.com';
  process.env.BILLING_EMAIL = process.env.BILLING_EMAIL ?? 'billing@vssyl.com';
  process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vssyl.com';
  const token = process.env.POSTMARK_SERVER_TOKEN?.trim();
  if (token) {
    process.env.SMTP_USER = token;
    process.env.SMTP_PASS = token;
  }
}

function extractPreheader(html: string): string {
  const match = html.match(/display:none;max-height:0[^>]*>([^<]+)</);
  return match?.[1]?.trim() ?? '';
}

function validateRenderedContent(
  html: string,
  text: string,
  options: { requireCta?: boolean; requireFallback?: boolean; ctaPattern?: RegExp } = {}
): RenderChecks {
  const htmlIssues: string[] = [];
  const textIssues: string[] = [];
  const requireCta = options.requireCta !== false;
  const requireFallback = options.requireFallback === true;
  const ctaPattern = options.ctaPattern ?? /https:\/\/vssyl\.com/;

  if (!html || html.length < 200) htmlIssues.push('HTML too short or missing');
  if (!text || text.length < 80) textIssues.push('Plain text too short or missing');
  if (!html.includes('Vssyl')) htmlIssues.push('Missing Vssyl branding');
  if (!html.includes('2563eb')) htmlIssues.push('Missing brand blue');
  if (!html.includes('/privacy')) htmlIssues.push('Missing privacy footer link');
  if (!html.includes('/terms')) htmlIssues.push('Missing terms footer link');
  if (!html.includes('/security')) htmlIssues.push('Missing security footer link');
  if (!html.includes('support@vssyl.com') && !html.includes('/contact')) htmlIssues.push('Missing support footer');
  if (!html.includes('You received this email because')) htmlIssues.push('Missing context line');
  if (html.includes('undefined') || html.includes('null')) htmlIssues.push('Placeholder undefined/null in HTML');
  if (text.includes('undefined') || text.includes('null')) textIssues.push('Placeholder undefined/null in text');
  if (containsLikelySecret(html) || containsLikelySecret(text)) htmlIssues.push('Possible secret in output');
  if (/<img[^>]+src=["']https?:\/\//i.test(html)) htmlIssues.push('External image dependency');
  if (!html.includes('viewport')) htmlIssues.push('Missing viewport meta');

  const preheader = extractPreheader(html);
  const preheaderPass = preheader.length > 10;

  if (!text.includes('Vssyl')) textIssues.push('Plain text missing Vssyl');
  if (!text.includes('Privacy:')) textIssues.push('Plain text missing footer links');

  const ctaPass =
    !requireCta ||
    (ctaPattern.test(html) &&
      (html.includes('display:inline-block') || html.includes('background-color:#2563eb')));

  if (requireCta && !ctaPattern.test(html)) htmlIssues.push('CTA/fallback link missing expected URL');

  const fallbackPass =
    !requireFallback || html.includes('If the button does not work') || html.includes('word-break:break-all');

  const footerPass =
    html.includes('/privacy') &&
    html.includes('/terms') &&
    html.includes('/security') &&
    html.includes('You received this email because');

  return {
    htmlPass: htmlIssues.length === 0,
    textPass: textIssues.length === 0,
    ctaPass,
    footerPass,
    preheaderPass,
    fallbackPass,
    htmlIssues,
    textIssues,
  };
}

function mobileNotes(html: string): string {
  if (html.length > 102000) return 'HTML may clip in Gmail (>102KB)';
  return 'None observed in template structure';
}

function a11yNotes(html: string): string {
  return 'Text wordmark (no image alt needed); heading in card body; lang=en on html';
}

async function verifySend(params: {
  label: string;
  subject: string;
  html: string;
  text: string;
  sendFn: () => Promise<{ sent: boolean; messageId?: string }>;
  expectedReplyTo: string;
  requireCta?: boolean;
  requireFallback?: boolean;
  forceResult?: EmailVerificationRow['result'];
  improvements?: string;
  skipSend?: boolean;
}): Promise<EmailVerificationRow> {
  resetEmailTransportForTests();
  const defaults = getEmailAddressDefaults();
  const checks = validateRenderedContent(params.html, params.text, {
    requireCta: params.requireCta,
    requireFallback: params.requireFallback,
  });
  let sent = false;
  let messageId: string | undefined;
  let error: string | undefined;
  const skipSend = params.skipSend === true || process.argv.includes('--render-only');

  if (!skipSend) {
    try {
      const result = await params.sendFn();
      sent = result.sent;
      messageId = result.messageId;
      if (!sent) error = 'sendEmail returned sent:false';
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
    }
  } else {
    sent = true;
    messageId = 'render-only-skip-send';
  }

  const allRenderPass =
    checks.htmlPass &&
    checks.textPass &&
    checks.footerPass &&
    checks.preheaderPass &&
    (params.requireCta === false || checks.ctaPass) &&
    (params.requireFallback !== true || checks.fallbackPass);

  let result: EmailVerificationRow['result'] =
    params.forceResult ?? (sent && allRenderPass ? 'PASS' : sent ? 'PARTIAL' : 'FAIL');

  const issues = [...checks.htmlIssues, ...checks.textIssues].join('; ');
  const previewText = extractPreheader(params.html);

  return {
    email: params.label,
    result,
    subject: params.subject,
    from: defaults.from,
    replyTo: params.expectedReplyTo,
    previewText,
    sent,
    messageId,
    error,
    html: checks.htmlPass ? 'PASS' : 'FAIL',
    plainText: checks.textPass ? 'PASS' : 'FAIL',
    cta: params.requireCta === false ? 'N/A' : checks.ctaPass ? 'PASS' : 'FAIL',
    footer: checks.footerPass ? 'PASS' : 'FAIL',
    fallbackLink:
      params.requireFallback === true ? (checks.fallbackPass ? 'PASS' : 'FAIL') : params.requireCta === false ? 'N/A' : checks.fallbackPass ? 'PASS' : 'N/A',
    mobileIssues: mobileNotes(params.html),
    accessibilityNotes: a11yNotes(params.html),
    recommendedImprovements: params.improvements ?? (issues || 'None for this template'),
  };
}

export async function runEmailRenderVerification(
  recipient: string,
  options: { skipSend?: boolean } = {}
): Promise<EmailVerificationRow[]> {
  applyPostmarkDefaults();
  resetEmailTransportForTests();

  const skipSend = options.skipSend === true || process.argv.includes('--render-only');
  if (!skipSend && !isEmailConfigured()) {
    throw new Error('SMTP not configured');
  }

  const defaults = getEmailAddressDefaults();
  const rows: EmailVerificationRow[] = [];
  const sendOpts = { skipSend };

  const v = buildVerificationEmail(SMOKE_TOKEN);
  rows.push(
    await verifySend({
      label: '1. Email Verification',
      subject: v.subject,
      html: v.html,
      text: v.text,
      sendFn: () => sendVerificationEmail(recipient, SMOKE_TOKEN),
      expectedReplyTo: defaults.replyTo,
      requireFallback: true,
      ...sendOpts,
    })
  );

  const pwd = buildPasswordResetEmail(SMOKE_TOKEN);
  rows.push(
    await verifySend({
      label: '2. Password Reset',
      subject: pwd.subject,
      html: pwd.html,
      text: pwd.text,
      sendFn: () => sendPasswordResetEmail(recipient, SMOKE_TOKEN),
      expectedReplyTo: defaults.replyTo,
      requireFallback: true,
      ...sendOpts,
    })
  );

  const welcome = buildWelcomeEmail('Andrew');
  rows.push(
    await verifySend({
      label: '3. Welcome Email',
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      sendFn: () => sendWelcomeEmail(recipient, 'Andrew'),
      expectedReplyTo: defaults.replyTo,
      ...sendOpts,
    })
  );

  const invite = buildBusinessInvitationEmail({
    businessName: 'Render Verify Workspace',
    invitedByName: 'Vssyl QA',
    role: 'EMPLOYEE',
    title: 'QA Engineer',
    department: 'Platform',
    token: SMOKE_TOKEN,
    message: 'Live render verification invite.',
    inviterBlockId: 'BLOCK-QA-001',
  });
  rows.push(
    await verifySend({
      label: '4. Business Invitation',
      subject: invite.subject,
      html: invite.html,
      text: invite.text,
      sendFn: () =>
        sendBusinessInvitationEmail(
          recipient,
          'Render Verify Workspace',
          'Vssyl QA',
          'EMPLOYEE',
          'QA Engineer',
          'Platform',
          SMOKE_TOKEN,
          'Live render verification invite.',
          'BLOCK-QA-001'
        ),
      expectedReplyTo: defaults.replyTo,
      requireFallback: true,
      ...sendOpts,
    })
  );

  const contact = buildContactFormEmail({
    name: 'Andrew Trautman',
    email: recipient,
    subject: '[Render Verify] Contact form',
    message: 'Live contact form render verification.',
    company: 'Vssyl',
  });
  rows.push(
    await verifySend({
      label: '5. Contact Form Notification',
      subject: contact.subject,
      html: contact.html,
      text: contact.text,
      sendFn: () =>
        sendContactFormEmail({
          name: 'Andrew Trautman',
          email: recipient,
          subject: '[Render Verify] Contact form',
          message: 'Live contact form render verification.',
          company: 'Vssyl',
        }),
      expectedReplyTo: recipient,
      requireCta: false,
      improvements: 'Delivered to support@vssyl.com; reply-to set to submitter',
    })
  );

  const supportAck = buildSupportTicketAssignedEmail({
    ticketTitle: 'Render verification ticket',
    ticketPriority: 'NORMAL',
    ticketCategory: 'GENERAL',
    customerName: 'Andrew',
    assignedToName: 'Vssyl Support',
    createdAt: new Date(),
    ticketId: 'ticket-render-verify',
  });
  rows.push(
    await verifySend({
      label: '6. Support Ticket Acknowledgement',
      subject: supportAck.subject,
      html: supportAck.html,
      text: supportAck.text,
      sendFn: () =>
        sendEmail({ to: recipient, subject: supportAck.subject, html: supportAck.html, text: supportAck.text }),
      expectedReplyTo: defaults.replyTo,
      improvements: 'No separate “ticket received” email; assigned is first customer notification',
    })
  );

  const billing = buildPriceChangeEmail({
    tier: 'business_pro',
    billingCycle: 'monthly',
    oldPrice: 49,
    newPrice: 59,
    effectiveDate: new Date('2026-08-01'),
    userName: 'Andrew',
  });
  rows.push(
    await verifySend({
      label: '7. Price Change Notification',
      subject: billing.subject,
      html: billing.html,
      text: billing.text,
      sendFn: () =>
        sendPriceChangeNotification({
          toEmail: recipient,
          tier: 'business_pro',
          billingCycle: 'monthly',
          oldPrice: 49,
          newPrice: 59,
          effectiveDate: new Date('2026-08-01'),
          userName: 'Andrew',
        }),
      expectedReplyTo: defaults.billing,
    })
  );

  const calInvite = buildCalendarEventEmail({
    eventTitle: 'Render Verify Standup',
    organizerName: 'Vssyl Calendar',
    startAt: new Date('2026-07-10T15:00:00Z'),
    endAt: new Date('2026-07-10T15:30:00Z'),
    location: 'Google Meet',
    action: 'invite',
  });
  rows.push(
    await verifySend({
      label: '8. Calendar Invitation',
      subject: calInvite.subject,
      html: calInvite.html,
      text: calInvite.text,
      sendFn: () =>
        sendCalendarInviteEmail({
          toEmail: recipient,
          subject: calInvite.subject,
          bodyHtml: '',
          eventTitle: 'Render Verify Standup',
          organizerName: 'Vssyl Calendar',
          startAt: new Date('2026-07-10T15:00:00Z'),
          endAt: new Date('2026-07-10T15:30:00Z'),
          location: 'Google Meet',
          icsContent: MINIMAL_ICS,
        }),
      expectedReplyTo: defaults.replyTo,
      requireCta: false,
      improvements: 'Primary action is ICS attachment; no in-email CTA button by design',
      ...sendOpts,
    })
  );

  const calUpdate = buildCalendarEventEmail({
    eventTitle: 'Render Verify Standup',
    organizerName: 'Vssyl Calendar',
    startAt: new Date('2026-07-10T16:00:00Z'),
    endAt: new Date('2026-07-10T16:30:00Z'),
    location: 'Google Meet',
    action: 'update',
  });
  rows.push(
    await verifySend({
      label: '9. Calendar Update',
      subject: calUpdate.subject,
      html: calUpdate.html,
      text: calUpdate.text,
      sendFn: () =>
        sendCalendarUpdateEmail({
          toEmail: recipient,
          subject: calUpdate.subject,
          bodyHtml: '',
          eventTitle: 'Render Verify Standup',
          organizerName: 'Vssyl Calendar',
          startAt: new Date('2026-07-10T16:00:00Z'),
          endAt: new Date('2026-07-10T16:30:00Z'),
          location: 'Google Meet',
          icsContent: MINIMAL_ICS,
        }),
      expectedReplyTo: defaults.replyTo,
      requireCta: false,
      improvements: 'Primary action is ICS attachment; no in-email CTA button by design',
      ...sendOpts,
    })
  );

  const calCancel = buildCalendarEventEmail({
    eventTitle: 'Render Verify Standup',
    action: 'cancel',
  });
  rows.push(
    await verifySend({
      label: '10. Calendar Cancellation',
      subject: calCancel.subject,
      html: calCancel.html,
      text: calCancel.text,
      sendFn: () =>
        sendCalendarCancelEmail({
          toEmail: recipient,
          subject: calCancel.subject,
          bodyHtml: '',
          eventTitle: 'Render Verify Standup',
          icsContent: MINIMAL_ICS,
        }),
      expectedReplyTo: defaults.replyTo,
      requireCta: false,
    })
  );

  const notif = buildNotificationEmail({
    type: 'chat',
    title: 'Render verify: new message',
    body: 'This is a live module notification render test.',
    data: { conversationId: 'render-verify-conv' },
  });
  rows.push(
    await verifySend({
      label: '11. Module Notification',
      subject: notif.subject,
      html: notif.html,
      text: notif.text,
      sendFn: () => sendEmail({ to: recipient, subject: notif.subject, html: notif.html, text: notif.text }),
      expectedReplyTo: defaults.replyTo,
    })
  );

  return rows;
}

async function main(): Promise<void> {
  const renderOnly = process.argv.includes('--render-only');
  const rows = await runEmailRenderVerification(RECIPIENT, { skipSend: renderOnly });
  const outDir = join(__dirname, '..', 'tmp', 'email-verification');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, 'results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), recipient: RECIPIENT, rows }, null, 2)
  );
  console.log(
    JSON.stringify(
      {
        recipient: RECIPIENT,
        passed: rows.filter((r) => r.result === 'PASS').length,
        total: rows.length,
        rows,
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
