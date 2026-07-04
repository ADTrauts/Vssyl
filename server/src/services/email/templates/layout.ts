import type { BrandedEmailContent, BrandedLayoutParams } from './types';
import { escapeHtml, getEmailFooterLinks, VSSYL_BLUE, VSSYL_BORDER, VSSYL_MUTED, VSSYL_SLATE } from './utils';

export function renderBrandedEmail(params: BrandedLayoutParams): Pick<BrandedEmailContent, 'html' | 'text'> {
  const links = getEmailFooterLinks();
  const year = new Date().getFullYear();
  const preheader = params.preheader ? escapeHtml(params.preheader) : escapeHtml(params.title);
  const contextLine = escapeHtml(params.contextLine);

  const footerLinksHtml = `
<p style="margin:0 0 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:13px;line-height:1.8;">
  <a href="${links.supportUrl}" style="color:${VSSYL_BLUE};text-decoration:none;">Support</a>
  &nbsp;&middot;&nbsp;
  <a href="mailto:${escapeHtml(links.supportEmail)}" style="color:${VSSYL_BLUE};text-decoration:none;">${escapeHtml(links.supportEmail)}</a>
  &nbsp;&middot;&nbsp;
  <a href="${links.privacyUrl}" style="color:${VSSYL_BLUE};text-decoration:none;">Privacy</a>
  &nbsp;&middot;&nbsp;
  <a href="${links.termsUrl}" style="color:${VSSYL_BLUE};text-decoration:none;">Terms</a>
  &nbsp;&middot;&nbsp;
  <a href="${links.securityUrl}" style="color:${VSSYL_BLUE};text-decoration:none;">Security</a>
</p>`.trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(params.title)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#eef2f7;">
    ${preheader}
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <span style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;color:${VSSYL_BLUE};">Vssyl</span>
            </td>
          </tr>
          <tr>
            <td style="background-color:#ffffff;border-radius:12px;border:1px solid ${VSSYL_BORDER};padding:32px 28px;">
              ${params.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 8px 0;text-align:center;">
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:${VSSYL_MUTED};">
                ${contextLine}
              </p>
              ${footerLinksHtml}
              <p style="margin:12px 0 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;font-size:12px;line-height:1.6;color:${VSSYL_MUTED};">
                &copy; ${year} <span style="color:${VSSYL_SLATE};font-weight:600;">Vssyl</span>. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${params.textBody}

---
${params.contextLine}

Vssyl
Support: ${links.supportEmail} (${links.supportUrl})
Privacy: ${links.privacyUrl}
Terms: ${links.termsUrl}
Security: ${links.securityUrl}

© ${year} Vssyl. All rights reserved.`;

  return { html, text };
}

export function buildBrandedEmail(
  subject: string,
  layoutParams: BrandedLayoutParams
): BrandedEmailContent {
  const { html, text } = renderBrandedEmail(layoutParams);
  return { subject, html, text };
}
