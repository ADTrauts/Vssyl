/**
 * Render branded email previews to server/tmp/email-previews/ for visual QA.
 * Does not send mail or require SMTP.
 *
 * Usage: pnpm --dir server email:previews
 */
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  buildBusinessInvitationEmail,
  buildCalendarEventEmail,
  buildContactFormEmail,
  buildNotificationEmail,
  buildPasswordResetEmail,
  buildPriceChangeEmail,
  buildSupportTicketAssignedEmail,
  buildSupportTicketInProgressEmail,
  buildSupportTicketResolvedEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
} from '../src/services/email/templates';

const OUT_DIR = join(__dirname, '..', 'tmp', 'email-previews');
const SAMPLE_TOKEN = 'preview-token-not-for-production';

interface PreviewSpec {
  filename: string;
  render: () => { subject: string; html: string; text: string };
}

const previews: PreviewSpec[] = [
  {
    filename: 'verification',
    render: () => buildVerificationEmail(SAMPLE_TOKEN),
  },
  {
    filename: 'password-reset',
    render: () => buildPasswordResetEmail(SAMPLE_TOKEN),
  },
  {
    filename: 'welcome',
    render: () => buildWelcomeEmail('Andrew'),
  },
  {
    filename: 'business-invitation',
    render: () =>
      buildBusinessInvitationEmail({
        businessName: 'Acme Workspace',
        invitedByName: 'Jane Doe',
        role: 'MANAGER',
        title: 'Operations Lead',
        department: 'Operations',
        token: SAMPLE_TOKEN,
        message: 'Excited to have you on the team!',
        inviterBlockId: 'BLOCK-PREVIEW',
      }),
  },
  {
    filename: 'contact-form',
    render: () =>
      buildContactFormEmail({
        name: 'Preview User',
        email: 'preview@example.com',
        subject: 'Product question',
        message: 'Tell me more about business workspaces.',
        company: 'Preview Co',
      }),
  },
  {
    filename: 'support-assigned',
    render: () =>
      buildSupportTicketAssignedEmail({
        ticketTitle: 'Cannot access billing',
        ticketPriority: 'HIGH',
        ticketCategory: 'BILLING',
        customerName: 'Preview User',
        assignedToName: 'Support Agent',
        createdAt: new Date(),
        ticketId: 'ticket-preview',
      }),
  },
  {
    filename: 'support-in-progress',
    render: () =>
      buildSupportTicketInProgressEmail({
        ticketTitle: 'Cannot access billing',
        ticketPriority: 'HIGH',
        ticketCategory: 'BILLING',
        customerName: 'Preview User',
        assignedToName: 'Support Agent',
      }),
  },
  {
    filename: 'support-resolved',
    render: () =>
      buildSupportTicketResolvedEmail({
        ticketTitle: 'Cannot access billing',
        ticketPriority: 'HIGH',
        ticketCategory: 'BILLING',
        customerName: 'Preview User',
        assignedToName: 'Support Agent',
        resolvedAt: new Date(),
        ticketId: 'ticket-preview',
      }),
  },
  {
    filename: 'billing-price-change',
    render: () =>
      buildPriceChangeEmail({
        tier: 'business_pro',
        billingCycle: 'monthly',
        oldPrice: 49,
        newPrice: 59,
        effectiveDate: new Date('2026-08-01'),
        userName: 'Preview User',
      }),
  },
  {
    filename: 'calendar-invite',
    render: () =>
      buildCalendarEventEmail({
        eventTitle: 'Quarterly planning',
        organizerName: 'Jane Doe',
        startAt: new Date('2026-07-10T14:00:00Z'),
        endAt: new Date('2026-07-10T15:00:00Z'),
        location: 'Conference Room A',
        action: 'invite',
      }),
  },
  {
    filename: 'notification-chat',
    render: () =>
      buildNotificationEmail({
        type: 'chat',
        title: 'New message in Project Alpha',
        body: 'Jane sent you a message.',
        data: { conversationId: 'preview-conv' },
      }),
  },
];

function main(): void {
  mkdirSync(OUT_DIR, { recursive: true });
  const indexLines: string[] = ['# Vssyl email previews', ''];

  for (const spec of previews) {
    const { subject, html, text } = spec.render();
    const htmlPath = join(OUT_DIR, `${spec.filename}.html`);
    const textPath = join(OUT_DIR, `${spec.filename}.txt`);
    writeFileSync(htmlPath, html, 'utf8');
    writeFileSync(textPath, text, 'utf8');
    indexLines.push(`- [${subject}](./${spec.filename}.html)`);
    console.log(`Wrote ${htmlPath}`);
  }

  writeFileSync(join(OUT_DIR, 'README.md'), `${indexLines.join('\n')}\n`, 'utf8');
  console.log(`\nPreview index: ${join(OUT_DIR, 'README.md')}`);
}

main();
