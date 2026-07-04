import { getAppBaseUrl } from '../config';
import { renderFallbackLink, renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { escapeHtml, VSSYL_SLATE } from './utils';

export function buildVerificationEmail(token: string): BrandedEmailContent {
  const verificationUrl = `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  Verify your email address
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Thanks for signing up for Vssyl. Confirm your email to activate your account and start using your workspace.
</p>
${renderPrimaryButton({ href: verificationUrl, label: 'Verify email address' })}
${renderFallbackLink({ href: verificationUrl, label: 'If the button does not work, copy and paste this link into your browser:' })}
<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
  This link expires in <strong>24 hours</strong>. If you did not create a Vssyl account, you can safely ignore this email.
</p>`;

  const textBody = `Verify your email address

Thanks for signing up for Vssyl. Confirm your email to activate your account.

Verify: ${verificationUrl}

This link expires in 24 hours. If you did not create a Vssyl account, you can safely ignore this email.`;

  return buildBrandedEmail('Verify your email address', {
    title: 'Verify your email address',
    preheader: 'Confirm your Vssyl account in one click.',
    bodyHtml,
    textBody,
    contextLine: 'You received this email because someone signed up for Vssyl using this address.',
  });
}
