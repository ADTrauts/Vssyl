import { describe, expect, it } from 'vitest';
import {
  buildBusinessInvitationEmail,
  buildCalendarEventEmail,
  buildContactFormEmail,
  buildNotificationEmail,
  buildPasswordResetEmail,
  buildPriceChangeEmail,
  buildSupportTicketAssignedEmail,
  buildVerificationEmail,
  buildWelcomeEmail,
  containsLikelySecret,
} from '..';

const SAMPLE_TOKEN = 'sample-token-for-tests-only';

describe('email templates', () => {
  it('verification email has html, text, action link, footer, and no secrets', () => {
    const email = buildVerificationEmail(SAMPLE_TOKEN);
    expect(email.html.length).toBeGreaterThan(100);
    expect(email.text.length).toBeGreaterThan(50);
    expect(email.html).toContain('Vssyl');
    expect(email.html).toContain('/auth/verify-email?token=');
    expect(email.text).toContain('/auth/verify-email?token=');
    expect(email.html).toContain('/privacy');
    expect(email.html).toContain('/terms');
    expect(email.html).toContain('/security');
    expect(email.html).toContain('support@vssyl.com');
    expect(email.html).not.toContain('undefined');
    expect(email.html).not.toContain('null');
    expect(containsLikelySecret(email.html)).toBe(false);
    expect(containsLikelySecret(email.text)).toBe(false);
  });

  it('password reset email includes reset link and expiry context', () => {
    const email = buildPasswordResetEmail(SAMPLE_TOKEN);
    expect(email.subject.toLowerCase()).toContain('password');
    expect(email.html).toContain('/auth/reset-password?token=');
    expect(email.text).toContain('/auth/reset-password?token=');
    expect(email.html).toContain('1 hour');
    expect(email.html).toContain('You received this email because');
  });

  it('welcome email greets user and links to dashboard', () => {
    const email = buildWelcomeEmail('Andrew');
    expect(email.html).toContain('Andrew');
    expect(email.text).toContain('Andrew');
    expect(email.html).toContain('/dashboard');
    expect(email.html).not.toContain('undefined');
  });

  it('business invitation includes accept link and details', () => {
    const email = buildBusinessInvitationEmail({
      businessName: 'Acme Corp',
      invitedByName: 'Jane Doe',
      role: 'ADMIN',
      title: 'Engineer',
      department: 'Platform',
      token: SAMPLE_TOKEN,
      message: 'Join us!',
      inviterBlockId: 'BLOCK-123',
    });
    expect(email.html).toContain('Acme Corp');
    expect(email.html).toContain('Jane Doe');
    expect(email.html).toContain('/auth/accept-invitation?token=');
    expect(email.html).toContain('Administrator');
    expect(email.text).toContain('Join us!');
  });

  it('contact form email escapes html in message body', () => {
    const email = buildContactFormEmail({
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Hello',
      message: '<script>alert(1)</script>\nLine two',
      company: 'Co & Co',
    });
    expect(email.html).toContain('&lt;script&gt;');
    expect(email.html).not.toContain('<script>alert');
    expect(email.text).toContain('Line two');
    expect(email.html).toContain('Co &amp; Co');
  });

  it('support ticket assigned email includes support center link', () => {
    const email = buildSupportTicketAssignedEmail({
      ticketTitle: 'Login issue',
      ticketPriority: 'HIGH',
      ticketCategory: 'ACCOUNT',
      customerName: 'Pat',
      assignedToName: 'Support Agent',
      createdAt: new Date('2026-01-15'),
    });
    expect(email.html).toContain('Login issue');
    expect(email.html).toContain('/support');
    expect(email.text).toContain('/support');
  });

  it('billing price change email includes billing link and amounts', () => {
    const email = buildPriceChangeEmail({
      tier: 'pro_plan',
      billingCycle: 'monthly',
      oldPrice: 29,
      newPrice: 39,
      effectiveDate: new Date('2026-08-01'),
      userName: 'Alex',
    });
    expect(email.html).toContain('$29.00');
    expect(email.html).toContain('$39.00');
    expect(email.html).toContain('/billing');
    expect(email.html).toContain('Pro Plan');
  });

  it('calendar invite email includes event title and ics note', () => {
    const email = buildCalendarEventEmail({
      eventTitle: 'Team standup',
      organizerName: 'Organizer',
      startAt: new Date('2026-07-04T15:00:00Z'),
      endAt: new Date('2026-07-04T15:30:00Z'),
      location: 'Zoom',
      action: 'invite',
    });
    expect(email.html).toContain('Team standup');
    expect(email.html).toContain('.ics');
    expect(email.subject).toContain('Invitation');
  });

  it('notification email includes preferences link', () => {
    const email = buildNotificationEmail({
      type: 'chat',
      title: 'New message',
      body: 'You have a new chat message.',
      data: { conversationId: 'conv-1' },
    });
    expect(email.html).toContain('/chat/conv-1');
    expect(email.html).toContain('/notifications/settings');
    expect(email.text).toContain('New message');
  });
});
