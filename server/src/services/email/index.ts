export {
  getAppBaseUrl,
  getEmailAddressDefaults,
  getSmtpConfig,
  isEmailConfigured,
} from './config';
export { sendEmail } from './sendEmail';
export { getEmailTransport, resetEmailTransportForTests } from './transport';
export type { EmailAddressDefaults, SendEmailOptions, SendEmailResult } from './types';
export {
  sendBusinessInvitationEmail,
  sendCalendarCancelEmail,
  sendCalendarInviteEmail,
  sendCalendarUpdateEmail,
  sendContactFormEmail,
  sendPasswordResetEmail,
  sendPriceChangeNotification,
  sendSupportInboundEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from './transactional';
