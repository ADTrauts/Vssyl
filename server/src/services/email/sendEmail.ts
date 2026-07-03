import { getEmailAddressDefaults } from './config';
import { getEmailTransport } from './transport';
import { logger } from '../../lib/logger';
import type { SendEmailOptions, SendEmailResult } from './types';

/**
 * Send an email via the centralized SMTP transport.
 * Returns `{ sent: false }` when SMTP is not configured or delivery fails.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const transport = getEmailTransport();
  if (!transport) {
    void logger.warn('Email not sent: SMTP not configured', {
      operation: 'send_email',
      context: { to: options.to, subject: options.subject },
    });
    return { sent: false };
  }

  const defaults = getEmailAddressDefaults();

  try {
    const result = await transport.sendMail({
      from: options.from ?? defaults.from,
      replyTo: options.replyTo ?? defaults.replyTo,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    });

    void logger.debug('Email sent', {
      operation: 'send_email',
      context: { to: options.to, subject: options.subject, messageId: result.messageId },
    });

    return { sent: true, messageId: result.messageId };
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Email delivery failed', {
      operation: 'send_email',
      error: { message: err.message, stack: err.stack },
      context: { to: options.to, subject: options.subject },
    });
    return { sent: false };
  }
}
