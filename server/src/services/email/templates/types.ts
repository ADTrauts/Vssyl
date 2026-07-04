export interface BrandedEmailContent {
  subject: string;
  html: string;
  text: string;
}

export interface BrandedLayoutParams {
  /** Email `<title>` and visible heading context */
  title: string;
  /** Hidden preview text for inbox clients */
  preheader?: string;
  /** Inner card HTML (already escaped where needed) */
  bodyHtml: string;
  /** Plain-text body (footer appended by layout) */
  textBody: string;
  /** “You received this because…” line */
  contextLine: string;
}
