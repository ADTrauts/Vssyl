import { VSSYL_BLUE, VSSYL_BLUE_DARK, escapeHtml } from './utils';

export interface ButtonParams {
  href: string;
  label: string;
}

export function renderPrimaryButton({ href, label }: ButtonParams): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px auto;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${VSSYL_BLUE};">
      <a href="${safeHref}" target="_blank" rel="noopener noreferrer"
         style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:${VSSYL_BLUE};">
        ${safeLabel}
      </a>
    </td>
  </tr>
</table>`.trim();
}

export function renderFallbackLink({ href, label }: ButtonParams): string {
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `
<p style="margin:24px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.6;color:#64748b;">
  ${safeLabel}<br />
  <a href="${safeHref}" style="color:${VSSYL_BLUE_DARK};word-break:break-all;">${safeHref}</a>
</p>`.trim();
}
