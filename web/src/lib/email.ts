import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

const templates = {
  'module-submission': (data: any) => `
    <h1>Module Submission Confirmation</h1>
    <p>Your module "${data.moduleName}" (version ${data.version}) has been submitted successfully.</p>
    <p>Submission ID: ${data.submissionId}</p>
    <p>Security Score: ${data.securityScore}/100</p>
    <p>Our team will review your submission and notify you once it's approved.</p>
    <p>Thank you for contributing to our marketplace!</p>
  `
};

export async function sendEmail({ to, subject, template, data }: EmailData) {
  try {
    const html = templates[template](data);

    await resend.emails.send({
      from: 'marketplace@yourdomain.com',
      to,
      subject,
      html
    });

  } catch (error) {
    console.error('Error sending email:', error);
    // Don't throw the error as this is a non-critical operation
  }
} 