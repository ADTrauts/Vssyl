import {
  getEmailAddressDefaults,
  getSmtpConfig,
  isEmailConfigured,
} from '../email/config';
import { getEmailTransport } from '../email/transport';
import {
  buildVerificationEmail,
  buildWelcomeEmail,
  buildBusinessInvitationEmail,
  buildPasswordResetEmail,
  buildContactFormEmail,
  buildSupportTicketAssignedEmail,
  buildPriceChangeEmail,
  buildNotificationEmail,
} from '../email/templates';
import { prisma } from '../../lib/prisma';

export interface EmailTemplateCatalogEntry {
  id: string;
  name: string;
  category: 'auth' | 'business' | 'billing' | 'support' | 'notification';
  description: string;
}

const TEMPLATE_CATALOG: EmailTemplateCatalogEntry[] = [
  { id: 'verification', name: 'Email verification', category: 'auth', description: 'Account verification link' },
  { id: 'password-reset', name: 'Password reset', category: 'auth', description: 'Password reset link' },
  { id: 'welcome', name: 'Welcome', category: 'auth', description: 'New user welcome' },
  { id: 'business-invitation', name: 'Business invitation', category: 'business', description: 'Workspace invite' },
  { id: 'contact-form', name: 'Contact form', category: 'support', description: 'Public contact submission' },
  { id: 'support-assigned', name: 'Support ticket assigned', category: 'support', description: 'Ticket assignment notice' },
  { id: 'billing-price-change', name: 'Price change', category: 'billing', description: 'Subscription price update' },
  { id: 'notification', name: 'In-app notification', category: 'notification', description: 'Generic notification email' },
];

function detectProvider(host: string | undefined): string {
  if (!host) return 'unconfigured';
  if (host.includes('postmark')) return 'Postmark';
  if (host.includes('sendgrid')) return 'SendGrid';
  if (host.includes('mailgun')) return 'Mailgun';
  return host;
}

function buildTemplatePreview(templateId: string): { subject: string; html: string; text: string } | null {
  switch (templateId) {
    case 'verification':
      return buildVerificationEmail('preview-token');
    case 'password-reset':
      return buildPasswordResetEmail('preview-token');
    case 'welcome':
      return buildWelcomeEmail('Preview User');
    case 'business-invitation':
      return buildBusinessInvitationEmail({
        businessName: 'Acme Workspace',
        invitedByName: 'Alex Operator',
        role: 'EMPLOYEE',
        title: 'Operations Lead',
        department: 'Operations',
        token: 'preview-token',
      });
    case 'contact-form':
      return buildContactFormEmail({
        name: 'Preview User',
        email: 'preview@example.com',
        subject: 'Product question',
        message: 'Sample contact form message for operator preview.',
      });
    case 'support-assigned':
      return buildSupportTicketAssignedEmail({
        ticketTitle: 'Cannot access billing',
        ticketId: 'preview-ticket',
        ticketPriority: 'HIGH',
        ticketCategory: 'billing',
        customerName: 'Preview Customer',
        assignedToName: 'Support Team',
      });
    case 'billing-price-change':
      return buildPriceChangeEmail({
        tier: 'business_pro',
        billingCycle: 'monthly',
        oldPrice: 39.99,
        newPrice: 49.99,
        effectiveDate: new Date('2026-08-01'),
        userName: 'Preview Customer',
      });
    case 'notification':
      return buildNotificationEmail({
        title: 'New message in Project Alpha',
        body: 'You have a new chat message waiting in your workspace.',
        type: 'chat',
      });
    default:
      return null;
  }
}

export async function getEmailOperationsStatus() {
  const smtp = getSmtpConfig();
  const addresses = getEmailAddressDefaults();
  const transportReady = getEmailTransport() !== null;

  let lastSuccessfulSend: string | null = null;
  let recentFailures = 0;

  try {
    const recentLogs = await prisma.log.findMany({
      where: {
        OR: [
          { operation: 'send_email' },
          { operation: 'email_status' },
          { message: { contains: 'email', mode: 'insensitive' } },
        ],
      },
      orderBy: { timestamp: 'desc' },
      take: 30,
      select: { level: true, message: true, timestamp: true, operation: true },
    });

    for (const log of recentLogs) {
      if (log.level === 'error' && log.operation === 'send_email') {
        recentFailures += 1;
      }
      if (!lastSuccessfulSend && log.level !== 'error' && log.operation === 'send_email') {
        lastSuccessfulSend = log.timestamp.toISOString();
      }
    }
  } catch {
    // logs optional
  }

  return {
    configured: isEmailConfigured(),
    transportReady,
    provider: detectProvider(smtp?.host),
    smtp: smtp
      ? { host: smtp.host, port: smtp.port, secure: smtp.secure, user: smtp.auth.user }
      : null,
    addresses: {
      from: addresses.from,
      fromEmail: addresses.fromEmail,
      replyTo: addresses.replyTo,
      support: addresses.support,
      billing: addresses.billing,
    },
    lastSuccessfulSend,
    recentFailureCount: recentFailures,
    templates: TEMPLATE_CATALOG,
  };
}

export function listEmailTemplateCatalog() {
  return TEMPLATE_CATALOG;
}

export function getEmailTemplatePreview(templateId: string) {
  const entry = TEMPLATE_CATALOG.find((t) => t.id === templateId);
  if (!entry) return null;
  const content = buildTemplatePreview(templateId);
  if (!content) return null;
  return { ...entry, preview: content };
}
