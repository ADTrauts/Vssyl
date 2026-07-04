import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { escapeHtml, formatMultilineHtml, VSSYL_SLATE } from './utils';

export interface ContactFormEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
  company?: string;
}

export function buildContactFormEmail(params: ContactFormEmailParams): BrandedEmailContent {
  const companyRow = params.company
    ? `<tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Company</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.company)}</td></tr>`
    : '';

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  New contact form submission
</h1>
<p style="margin:0 0 20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#475569;">
  A visitor submitted the Vssyl contact form. Reply directly to reach them.
</p>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:20px;">
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;width:100px;">From</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};font-weight:600;">${escapeHtml(params.name)} &lt;${escapeHtml(params.email)}&gt;</td></tr>
  ${companyRow}
  <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Subject</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(params.subject)}</td></tr>
</table>
<div style="padding:20px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
  <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.7;color:#334155;">
    ${formatMultilineHtml(params.message)}
  </p>
</div>`;

  const textBody = `New contact form submission

From: ${params.name} <${params.email}>
${params.company ? `Company: ${params.company}\n` : ''}Subject: ${params.subject}

Message:
${params.message}`;

  return buildBrandedEmail(`[Contact] ${params.subject}`, {
    title: 'Contact form submission',
    preheader: `New message from ${params.name}: ${params.subject}`,
    bodyHtml,
    textBody,
    contextLine: 'You received this email because someone submitted the Vssyl contact form.',
  });
}
