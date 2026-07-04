import { getAppBaseUrl } from '../config';
import { renderFallbackLink, renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { VSSYL_SLATE } from './utils';

export function buildPasswordResetEmail(token: string): BrandedEmailContent {
  const resetUrl = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  Reset your password
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  We received a request to reset the password for your Vssyl account. Choose a new password using the button below.
</p>
${renderPrimaryButton({ href: resetUrl, label: 'Reset password' })}
${renderFallbackLink({ href: resetUrl, label: 'If the button does not work, copy and paste this link into your browser:' })}
<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
  This link expires in <strong>1 hour</strong>. If you did not request a password reset, you can ignore this email — your password will stay the same.
</p>`;

  const textBody = `Reset your password

We received a request to reset the password for your Vssyl account.

Reset: ${resetUrl}

This link expires in 1 hour. If you did not request a password reset, you can ignore this email.`;

  return buildBrandedEmail('Reset your Vssyl password', {
    title: 'Reset your password',
    preheader: 'Reset your Vssyl password securely.',
    bodyHtml,
    textBody,
    contextLine: 'You received this email because a password reset was requested for your Vssyl account.',
  });
}
