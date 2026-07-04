import { getAppBaseUrl, getEmailAddressDefaults } from '../config';

/** Vssyl brand blue — matches product UI accents */
export const VSSYL_BLUE = '#2563eb';
export const VSSYL_BLUE_DARK = '#1d4ed8';
export const VSSYL_SLATE = '#1e293b';
export const VSSYL_MUTED = '#64748b';
export const VSSYL_BORDER = '#e2e8f0';
export const VSSYL_BG = '#f8fafc';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatMultilineHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />');
}

export function displayName(name: string | null | undefined, fallback = 'there'): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export interface EmailFooterLinks {
  appUrl: string;
  supportEmail: string;
  supportUrl: string;
  privacyUrl: string;
  termsUrl: string;
  securityUrl: string;
  contactUrl: string;
}

export function getEmailFooterLinks(): EmailFooterLinks {
  const appUrl = getAppBaseUrl().replace(/\/$/, '');
  const { support } = getEmailAddressDefaults();
  return {
    appUrl,
    supportEmail: support,
    supportUrl: `${appUrl}/contact`,
    privacyUrl: `${appUrl}/privacy`,
    termsUrl: `${appUrl}/terms`,
    securityUrl: `${appUrl}/security`,
    contactUrl: `${appUrl}/contact`,
  };
}

/** Detect accidental secret leakage in rendered output */
export function containsLikelySecret(value: string): boolean {
  const patterns = [
    /sk_(live|test)_[A-Za-z0-9]+/,
    /whsec_[A-Za-z0-9]+/,
    /Bearer\s+[A-Za-z0-9._-]+/,
    /password\s*[:=]\s*\S+/i,
    /api[_-]?key\s*[:=]\s*\S+/i,
  ];
  return patterns.some((p) => p.test(value));
}
