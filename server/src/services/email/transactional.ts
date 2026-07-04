import { getEmailAddressDefaults } from './config';
import { sendEmail } from './sendEmail';
import {
  buildBusinessInvitationEmail,
  buildCalendarEventEmail,
  buildContactFormEmail,
  buildPasswordResetEmail,
  buildPriceChangeEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
} from './templates';
import type { SendEmailResult } from './types';

export async function sendVerificationEmail(email: string, token: string): Promise<SendEmailResult> {
  const template = buildVerificationEmail(token);
  return sendEmail({ to: email, ...template });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<SendEmailResult> {
  const template = buildPasswordResetEmail(token);
  return sendEmail({ to: email, ...template });
}

export async function sendWelcomeEmail(email: string, name: string): Promise<SendEmailResult> {
  const template = buildWelcomeEmail(name);
  return sendEmail({ to: email, ...template });
}

export async function sendContactFormEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
}): Promise<SendEmailResult> {
  const { support } = getEmailAddressDefaults();
  const template = buildContactFormEmail(params);
  return sendEmail({
    to: support,
    replyTo: params.email,
    ...template,
  });
}

export async function sendSupportInboundEmail(params: {
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  const { support } = getEmailAddressDefaults();
  return sendEmail({
    to: support,
    subject: params.subject,
    html: params.html,
    text: params.text,
    replyTo: params.replyTo,
  });
}

export async function sendCalendarInviteEmail(params: {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  icsContent?: string;
  eventTitle?: string;
  organizerName?: string | null;
  startAt?: Date;
  endAt?: Date;
  location?: string | null;
}): Promise<SendEmailResult> {
  const template =
    params.eventTitle !== undefined
      ? buildCalendarEventEmail({
          eventTitle: params.eventTitle,
          organizerName: params.organizerName,
          startAt: params.startAt,
          endAt: params.endAt,
          location: params.location,
          action: 'invite',
        })
      : { subject: params.subject, html: params.bodyHtml, text: undefined };

  return sendEmail({
    to: params.toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: params.icsContent
      ? [
          {
            filename: 'invite.ics',
            content: params.icsContent,
            contentType: 'text/calendar; charset=utf-8; method=REQUEST',
          },
        ]
      : [],
  });
}

export async function sendCalendarUpdateEmail(params: {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  icsContent?: string;
  eventTitle?: string;
  organizerName?: string | null;
  startAt?: Date;
  endAt?: Date;
  location?: string | null;
}): Promise<SendEmailResult> {
  const template =
    params.eventTitle !== undefined
      ? buildCalendarEventEmail({
          eventTitle: params.eventTitle,
          organizerName: params.organizerName,
          startAt: params.startAt,
          endAt: params.endAt,
          location: params.location,
          action: 'update',
        })
      : { subject: params.subject, html: params.bodyHtml, text: undefined };

  return sendEmail({
    to: params.toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: params.icsContent
      ? [
          {
            filename: 'invite.ics',
            content: params.icsContent,
            contentType: 'text/calendar; charset=utf-8; method=UPDATE',
          },
        ]
      : [],
  });
}

export async function sendCalendarCancelEmail(params: {
  toEmail: string;
  subject: string;
  bodyHtml: string;
  icsContent?: string;
  eventTitle?: string;
  organizerName?: string | null;
  startAt?: Date;
  endAt?: Date;
  location?: string | null;
}): Promise<SendEmailResult> {
  const template =
    params.eventTitle !== undefined
      ? buildCalendarEventEmail({
          eventTitle: params.eventTitle,
          organizerName: params.organizerName,
          startAt: params.startAt,
          endAt: params.endAt,
          location: params.location,
          action: 'cancel',
        })
      : { subject: params.subject, html: params.bodyHtml, text: undefined };

  return sendEmail({
    to: params.toEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
    attachments: params.icsContent
      ? [
          {
            filename: 'invite.ics',
            content: params.icsContent,
            contentType: 'text/calendar; charset=utf-8; method=CANCEL',
          },
        ]
      : [],
  });
}

export async function sendPriceChangeNotification(params: {
  toEmail: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  oldPrice: number;
  newPrice: number;
  effectiveDate: Date;
  userName?: string;
}): Promise<SendEmailResult> {
  const { billing } = getEmailAddressDefaults();
  const template = buildPriceChangeEmail({
    tier: params.tier,
    billingCycle: params.billingCycle,
    oldPrice: params.oldPrice,
    newPrice: params.newPrice,
    effectiveDate: params.effectiveDate,
    userName: params.userName,
  });

  return sendEmail({
    to: params.toEmail,
    replyTo: billing,
    ...template,
  });
}

export async function sendBusinessInvitationEmail(
  email: string,
  businessName: string,
  invitedByName: string,
  role: string,
  title: string | null,
  department: string | null,
  token: string,
  message?: string,
  inviterBlockId?: string
): Promise<SendEmailResult> {
  const template = buildBusinessInvitationEmail({
    businessName,
    invitedByName,
    role,
    title,
    department,
    token,
    message,
    inviterBlockId,
  });

  return sendEmail({ to: email, ...template });
}
