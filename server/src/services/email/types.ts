import type { Attachment } from 'nodemailer/lib/mailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  /** Overrides default from address (EMAIL_FROM / SMTP_FROM). */
  from?: string;
  /** Overrides default reply-to (EMAIL_REPLY_TO). */
  replyTo?: string;
  attachments?: Attachment[];
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
}

export interface EmailAddressDefaults {
  from: string;
  replyTo: string;
  support: string;
  billing: string;
}
