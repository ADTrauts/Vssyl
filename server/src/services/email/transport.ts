import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { getSmtpConfig } from './config';
import { logger } from '../../lib/logger';

let transporter: Transporter | null = null;
let initAttempted = false;

/**
 * Lazy singleton SMTP transport. Returns null when SMTP is not configured.
 */
export function getEmailTransport(): Transporter | null {
  if (initAttempted) {
    return transporter;
  }

  initAttempted = true;
  const config = getSmtpConfig();

  if (!config) {
    void logger.warn('Email SMTP not configured; outbound email disabled', {
      operation: 'email_transport_init',
    });
    return null;
  }

  try {
    transporter = nodemailer.createTransport(config);
    void logger.debug('Email SMTP transport initialized', {
      operation: 'email_transport_init',
      context: { host: config.host, port: config.port, secure: config.secure },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('Failed to initialize email SMTP transport', {
      operation: 'email_transport_init',
      error: { message: err.message, stack: err.stack },
    });
    transporter = null;
  }

  return transporter;
}

/** Reset transport (for tests). */
export function resetEmailTransportForTests(): void {
  transporter = null;
  initAttempted = false;
}
