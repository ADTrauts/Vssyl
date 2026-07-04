import { getAppBaseUrl } from '../config';
import { renderPrimaryButton } from './buttons';
import { buildBrandedEmail } from './layout';
import type { BrandedEmailContent } from './types';
import { escapeHtml, VSSYL_SLATE } from './utils';

export interface NotificationEmailParams {
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
}

function notificationIcon(type: string): string {
  switch (type) {
    case 'chat':
    case 'mentions':
      return '💬';
    case 'drive':
      return '📁';
    case 'business':
      return '🏢';
    case 'system':
      return '🔔';
    default:
      return '📧';
  }
}

function actionUrl(type: string, data: Record<string, unknown>): string {
  const appUrl = getAppBaseUrl().replace(/\/$/, '');
  switch (type) {
    case 'chat':
    case 'mentions':
      return typeof data.conversationId === 'string'
        ? `${appUrl}/chat/${data.conversationId}`
        : `${appUrl}/notifications`;
    case 'drive':
      return typeof data.fileId === 'string' ? `${appUrl}/drive/file/${data.fileId}` : `${appUrl}/drive`;
    case 'business':
      return typeof data.businessId === 'string'
        ? `${appUrl}/business/${data.businessId}`
        : `${appUrl}/business`;
    default:
      return `${appUrl}/notifications`;
  }
}

export function buildNotificationEmail(params: NotificationEmailParams): BrandedEmailContent {
  const icon = notificationIcon(params.type);
  const url = actionUrl(params.type, params.data ?? {});
  const safeTitle = escapeHtml(params.title);
  const bodyBlock = params.body
    ? `<p style="margin:0 0 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;line-height:1.6;color:#475569;">${escapeHtml(params.body)}</p>`
    : '';
  const settingsUrl = `${getAppBaseUrl()}/notifications/settings`;

  const bodyHtml = `
<h1 style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:24px;line-height:1.3;color:${VSSYL_SLATE};">
  ${icon} ${safeTitle}
</h1>
${bodyBlock}
${renderPrimaryButton({ href: url, label: 'View details' })}
<p style="margin:16px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
  <a href="${settingsUrl}" style="color:#2563eb;text-decoration:none;">Manage notification preferences</a>
</p>`;

  const textBody = `${params.title}

${params.body ?? ''}

View details: ${url}
Manage preferences: ${settingsUrl}`;

  return buildBrandedEmail(`${icon} ${params.title}`, {
    title: params.title,
    preheader: params.body ?? params.title,
    bodyHtml,
    textBody,
    contextLine: `You received this email because you have email notifications enabled for ${params.type} events on Vssyl.`,
  });
}
