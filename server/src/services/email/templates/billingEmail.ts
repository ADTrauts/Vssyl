import { getAppBaseUrl, getEmailAddressDefaults } from '../config';
import { renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { displayName, escapeHtml, VSSYL_SLATE } from './utils';

export interface PriceChangeEmailParams {
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  oldPrice: number;
  newPrice: number;
  effectiveDate: Date;
  userName?: string;
}

function formatTierName(tier: string): string {
  return tier
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function buildPriceChangeEmail(params: PriceChangeEmailParams): BrandedEmailContent {
  const tierName = formatTierName(params.tier);
  const priceChange = params.newPrice - params.oldPrice;
  const priceChangePercent = ((priceChange / params.oldPrice) * 100).toFixed(1);
  const isIncrease = priceChange > 0;
  const billingUrl = `${getAppBaseUrl()}/billing`;
  const { billing } = getEmailAddressDefaults();
  const greeting = escapeHtml(displayName(params.userName));
  const effective = params.effectiveDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const changeColor = isIncrease ? '#dc2626' : '#16a34a';
  const headerBg = isIncrease ? '#fffbeb' : '#eff6ff';
  const headerBorder = isIncrease ? '#f59e0b' : '#2563eb';

  const bodyHtml = `
<h1 style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  ${isIncrease ? 'Your plan pricing is changing' : 'Good news about your plan pricing'}
</h1>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">
  Hi ${greeting}, we&rsquo;re writing about your <strong>${escapeHtml(tierName)}</strong> (${escapeHtml(params.billingCycle)}) subscription.
</p>
<div style="margin:20px 0;padding:20px;background-color:${headerBg};border-radius:8px;border-left:4px solid ${headerBorder};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Previous price</td><td style="padding:6px 0;font-size:16px;color:#94a3b8;text-decoration:line-through;">$${params.oldPrice.toFixed(2)}</td></tr>
    <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">New price</td><td style="padding:6px 0;font-size:22px;font-weight:700;color:${changeColor};">$${params.newPrice.toFixed(2)}</td></tr>
    <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Change</td><td style="padding:6px 0;font-size:16px;font-weight:600;color:${changeColor};">${isIncrease ? '+' : ''}$${Math.abs(priceChange).toFixed(2)} (${isIncrease ? '+' : ''}${priceChangePercent}%)</td></tr>
    <tr><td style="padding:6px 0;font-size:14px;color:#64748b;">Effective date</td><td style="padding:6px 0;font-size:14px;color:${VSSYL_SLATE};">${escapeHtml(effective)}</td></tr>
  </table>
</div>
<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:15px;line-height:1.6;color:#475569;">
  ${
    isIncrease
      ? `This change takes effect on your next billing cycle. Questions? Contact us at ${escapeHtml(billing)}.`
      : 'The reduced price will apply on your next billing cycle.'
  }
</p>
${renderPrimaryButton({ href: billingUrl, label: 'View billing settings' })}`;

  const textBody = `${isIncrease ? 'Your plan pricing is changing' : 'Good news about your plan pricing'}

Hi ${displayName(params.userName)},

Plan: ${tierName} (${params.billingCycle})
Previous price: $${params.oldPrice.toFixed(2)}
New price: $${params.newPrice.toFixed(2)}
Change: ${isIncrease ? '+' : ''}$${Math.abs(priceChange).toFixed(2)} (${isIncrease ? '+' : ''}${priceChangePercent}%)
Effective: ${effective}

View billing: ${billingUrl}
Billing questions: ${billing}`;

  return buildBrandedEmail(`Important: ${tierName} plan price update`, {
    title: `${tierName} plan price update`,
    preheader: `Your ${tierName} plan price is changing effective ${effective}.`,
    bodyHtml,
    textBody,
    contextLine: 'You received this email because you have an active Vssyl subscription.',
  });
}
