import { getAppBaseUrl } from '../config';
import { renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { displayName, escapeHtml, VSSYL_BLUE, VSSYL_SLATE } from './utils';

export interface SupportTicketEmailParams {
  ticketTitle: string;
  ticketPriority: string;
  ticketCategory: string;
  customerName: string | null;
  assignedToName: string;
  createdAt?: Date;
  resolvedAt?: Date | null;
  ticketId?: string;
}

function ticketDetailsTable(params: SupportTicketEmailParams, extraRows = ''): string {
  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;width:120px;">Title</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};font-weight:600;">${escapeHtml(params.ticketTitle)}</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Priority</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.ticketPriority)}</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Category</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.ticketCategory)}</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Assigned to</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.assignedToName)}</td></tr>
  ${extraRows}
</table>`;
}

export function buildSupportTicketAssignedEmail(params: SupportTicketEmailParams): BrandedEmailContent {
  const supportUrl = `${getAppBaseUrl()}/support`;
  const greeting = escapeHtml(displayName(params.customerName));
  const created = params.createdAt
    ? params.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const extraRows = created
    ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Created</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(created)}</td></tr>`
    : '';

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  Your support ticket was assigned
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Hi ${greeting}, your ticket has been assigned to <strong>${escapeHtml(params.assignedToName)}</strong>. We will follow up as we make progress.
</p>
<div style="padding:20px;background-color:#eff6ff;border-radius:8px;border-left:4px solid ${VSSYL_BLUE};">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${VSSYL_BLUE};text-transform:uppercase;letter-spacing:0.5px;">Ticket details</p>
  ${ticketDetailsTable(params, extraRows)}
</div>
${renderPrimaryButton({ href: supportUrl, label: 'View support center' })}`;

  const textBody = `Your support ticket was assigned

Hi ${displayName(params.customerName)},

Your ticket "${params.ticketTitle}" was assigned to ${params.assignedToName}.

View support center: ${supportUrl}`;

  return buildBrandedEmail(`Your support ticket has been assigned — ${params.ticketTitle}`, {
    title: 'Support ticket assigned',
    preheader: `Your ticket "${params.ticketTitle}" is now assigned to ${params.assignedToName}.`,
    bodyHtml,
    textBody,
    contextLine: 'You received this email because you opened a support ticket with Vssyl.',
  });
}

export function buildSupportTicketInProgressEmail(params: SupportTicketEmailParams): BrandedEmailContent {
  const supportUrl = `${getAppBaseUrl()}/support`;
  const greeting = escapeHtml(displayName(params.customerName));

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  We&rsquo;re working on your ticket
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Hi ${greeting}, <strong>${escapeHtml(params.assignedToName)}</strong> has started working on your support request.
</p>
<div style="padding:20px;background-color:#ecfdf5;border-radius:8px;border-left:4px solid #10b981;">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">Status: In progress</p>
  ${ticketDetailsTable(params)}
</div>
${renderPrimaryButton({ href: supportUrl, label: 'View support center' })}`;

  const textBody = `We're working on your ticket

Hi ${displayName(params.customerName)},

${params.assignedToName} has started working on "${params.ticketTitle}".

View support center: ${supportUrl}`;

  return buildBrandedEmail(`We're working on your support ticket — ${params.ticketTitle}`, {
    title: 'Support ticket in progress',
    preheader: `We're actively working on your ticket: ${params.ticketTitle}`,
    bodyHtml,
    textBody,
    contextLine: 'You received this email because you opened a support ticket with Vssyl.',
  });
}

export function buildSupportTicketResolvedEmail(params: SupportTicketEmailParams): BrandedEmailContent {
  const supportUrl = `${getAppBaseUrl()}/support`;
  const feedbackUrl = params.ticketId ? `${getAppBaseUrl()}/support/feedback/${params.ticketId}` : supportUrl;
  const greeting = escapeHtml(displayName(params.customerName));
  const resolved = params.resolvedAt
    ? params.resolvedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Recently';

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  Your support ticket is resolved
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Hi ${greeting}, <strong>${escapeHtml(params.assignedToName)}</strong> marked your ticket as resolved on ${escapeHtml(resolved)}.
</p>
<div style="padding:20px;background-color:#ecfdf5;border-radius:8px;border-left:4px solid #059669;">
  ${ticketDetailsTable(params, `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Resolved</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(resolved)}</td></tr>`)}
</div>
<p style="margin:20px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#475569;">
  If the issue persists, reply to this email or open a new ticket.
</p>
${renderPrimaryButton({ href: feedbackUrl, label: 'Rate your experience' })}`;

  const textBody = `Your support ticket is resolved

Hi ${displayName(params.customerName)},

"${params.ticketTitle}" was resolved by ${params.assignedToName} on ${resolved}.

Rate your experience: ${feedbackUrl}
Open a new ticket: ${supportUrl}`;

  return buildBrandedEmail(`Your support ticket has been resolved — ${params.ticketTitle}`, {
    title: 'Support ticket resolved',
    preheader: `Your ticket "${params.ticketTitle}" has been resolved.`,
    bodyHtml,
    textBody,
    contextLine: 'You received this email because you opened a support ticket with Vssyl.',
  });
}
