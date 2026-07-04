import { getAppBaseUrl } from '../config';
import { renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { displayName, escapeHtml, VSSYL_SLATE } from './utils';

export function buildWelcomeEmail(name: string): BrandedEmailContent {
  const greeting = escapeHtml(displayName(name));
  const dashboardUrl = `${getAppBaseUrl()}/dashboard`;

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  Welcome to Vssyl
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Hi ${greeting},
</p>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Your account is ready. Vssyl brings your team, files, calendar, and AI together in one secure workspace.
</p>
<ul style="margin:0 0 20px;padding-left:20px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.7;color:#475569;">
  <li>Customize your dashboard</li>
  <li>Connect with your team</li>
  <li>Explore modules built for how you work</li>
</ul>
${renderPrimaryButton({ href: dashboardUrl, label: 'Go to your dashboard' })}`;

  const textBody = `Welcome to Vssyl

Hi ${displayName(name)},

Your account is ready. Vssyl brings your team, files, calendar, and AI together in one secure workspace.

Go to your dashboard: ${dashboardUrl}`;

  return buildBrandedEmail('Welcome to Vssyl', {
    title: 'Welcome to Vssyl',
    preheader: 'Your Vssyl account is ready — get started in your dashboard.',
    bodyHtml,
    textBody,
    contextLine: 'You received this email because you created a Vssyl account.',
  });
}
