import { getAppBaseUrl } from '../config';
import { renderFallbackLink, renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { escapeHtml, VSSYL_BLUE, VSSYL_SLATE } from './utils';

export interface BusinessInvitationParams {
  businessName: string;
  invitedByName: string;
  role: string;
  title: string | null;
  department: string | null;
  token: string;
  message?: string;
  inviterBlockId?: string;
}

function formatRole(role: string): string {
  if (role === 'ADMIN') return 'Administrator';
  if (role === 'MANAGER') return 'Manager';
  return 'Employee';
}

export function buildBusinessInvitationEmail(params: BusinessInvitationParams): BrandedEmailContent {
  const invitationUrl = `${getAppBaseUrl()}/auth/accept-invitation?token=${encodeURIComponent(params.token)}`;
  const roleDisplay = formatRole(params.role);
  const safeBusiness = escapeHtml(params.businessName);
  const safeInviter = escapeHtml(params.invitedByName);

  const detailRows = [
    `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;width:120px;">Role</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};font-weight:600;">${escapeHtml(roleDisplay)}</td></tr>`,
    params.title
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Title</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.title)}</td></tr>`
      : '',
    params.department
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Department</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.department)}</td></tr>`
      : '',
    `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Invited by</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${safeInviter}</td></tr>`,
    params.inviterBlockId
      ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Inviter Block ID</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};font-family:monospace;">${escapeHtml(params.inviterBlockId)}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('');

  const messageBlock = params.message
    ? `<div style="margin:20px 0;padding:16px;background-color:#fffbeb;border-left:4px solid #f59e0b;border-radius:6px;">
         <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#92400e;font-style:italic;">
           &ldquo;${escapeHtml(params.message)}&rdquo;
         </p>
       </div>`
    : '';

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  You&rsquo;re invited to join ${safeBusiness}
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  <strong>${safeInviter}</strong> invited you to collaborate on Vssyl as part of <strong>${safeBusiness}</strong>.
</p>
<div style="margin:20px 0;padding:20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
  <p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;font-weight:600;color:${VSSYL_BLUE};text-transform:uppercase;letter-spacing:0.5px;">
    Invitation details
  </p>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${detailRows}</table>
</div>
${messageBlock}
${renderPrimaryButton({ href: invitationUrl, label: 'Accept invitation' })}
${renderFallbackLink({ href: invitationUrl, label: 'If the button does not work, copy and paste this link into your browser:' })}
<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
  This invitation expires in <strong>7 days</strong>.
</p>`;

  const textBody = `You're invited to join ${params.businessName}

${params.invitedByName} invited you to collaborate on Vssyl.

Role: ${roleDisplay}
${params.title ? `Title: ${params.title}\n` : ''}${params.department ? `Department: ${params.department}\n` : ''}${params.message ? `\nMessage: "${params.message}"\n` : ''}
Accept invitation: ${invitationUrl}

This invitation expires in 7 days.`;

  return buildBrandedEmail(`You've been invited to join ${params.businessName} on Vssyl`, {
    title: `Invitation to ${params.businessName}`,
    preheader: `${params.invitedByName} invited you to join ${params.businessName} on Vssyl.`,
    bodyHtml,
    textBody,
    contextLine: `You received this email because ${params.invitedByName} invited you to join ${params.businessName} on Vssyl.`,
  });
}
