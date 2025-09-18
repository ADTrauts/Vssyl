import { EmailNotificationService, EmailTemplate } from './emailNotificationService';
import { prisma } from '../lib/prisma';

export class SupportTicketEmailService {
  private emailService: EmailNotificationService;

  constructor() {
    this.emailService = EmailNotificationService.getInstance();
  }

  /**
   * Send email notification when ticket is assigned
   */
  async sendTicketAssignedEmail(ticketId: string, assignedToId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          customer: true,
          assignedTo: true
        }
      });

      if (!ticket || !ticket.customer) {
        console.error('Ticket or customer not found for assignment email');
        return false;
      }

      const template = this.getTicketAssignedTemplate(ticket);
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    } catch (error) {
      console.error('Error sending ticket assigned email:', error);
      return false;
    }
  }

  /**
   * Send email notification when work starts on ticket
   */
  async sendTicketInProgressEmail(ticketId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          customer: true,
          assignedTo: true
        }
      });

      if (!ticket || !ticket.customer) {
        console.error('Ticket or customer not found for in-progress email');
        return false;
      }

      const template = this.getTicketInProgressTemplate(ticket);
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    } catch (error) {
      console.error('Error sending ticket in-progress email:', error);
      return false;
    }
  }

  /**
   * Send email notification when ticket is resolved
   */
  async sendTicketResolvedEmail(ticketId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: {
          customer: true,
          assignedTo: true
        }
      });

      if (!ticket || !ticket.customer) {
        console.error('Ticket or customer not found for resolved email');
        return false;
      }

      const template = this.getTicketResolvedTemplate(ticket);
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text
      });
    } catch (error) {
      console.error('Error sending ticket resolved email:', error);
      return false;
    }
  }

  /**
   * Get ticket assigned email template
   */
  private getTicketAssignedTemplate(ticket: any): EmailTemplate {
    const assignedToName = ticket.assignedTo?.name || 'our support team';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vssyl.com';
    
    return {
      subject: `Your support ticket has been assigned - ${ticket.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Ticket Assigned</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎫 Support Ticket Assigned</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.customer.name || 'there'},</p>
              
              <p>Great news! Your support ticket has been assigned to <strong>${assignedToName}</strong> who will be working on your request.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details:</h3>
                <p><strong>Title:</strong> ${ticket.title}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Assigned To:</strong> ${assignedToName}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleDateString()}</p>
              </div>
              
              <p>You can expect to hear from us soon. If you have any additional information or questions, please don't hesitate to reach out.</p>
              
              <a href="${appUrl}/support" class="button">View Support Center</a>
            </div>
            <div class="footer">
              <p>Thank you for using our service!</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Support Ticket Assigned
        
        Hello ${ticket.customer.name || 'there'},
        
        Great news! Your support ticket has been assigned to ${assignedToName} who will be working on your request.
        
        Ticket Details:
        - Title: ${ticket.title}
        - Priority: ${ticket.priority}
        - Category: ${ticket.category}
        - Assigned To: ${assignedToName}
        - Created: ${new Date(ticket.createdAt).toLocaleDateString()}
        
        You can expect to hear from us soon. If you have any additional information or questions, please don't hesitate to reach out.
        
        View Support Center: ${appUrl}/support
        
        Thank you for using our service!
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  /**
   * Get ticket in progress email template
   */
  private getTicketInProgressTemplate(ticket: any): EmailTemplate {
    const assignedToName = ticket.assignedTo?.name || 'our support team';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vssyl.com';
    
    return {
      subject: `We're working on your support ticket - ${ticket.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Ticket In Progress</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔧 Working on Your Ticket</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.customer.name || 'there'},</p>
              
              <p>We wanted to let you know that <strong>${assignedToName}</strong> has started working on your support ticket. We're actively investigating and working to resolve your issue.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details:</h3>
                <p><strong>Title:</strong> ${ticket.title}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Status:</strong> In Progress</p>
                <p><strong>Assigned To:</strong> ${assignedToName}</p>
              </div>
              
              <p>We'll keep you updated on our progress. If you have any additional information that might help us resolve your issue, please let us know.</p>
              
              <a href="${appUrl}/support" class="button">View Support Center</a>
            </div>
            <div class="footer">
              <p>Thank you for your patience!</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Working on Your Ticket
        
        Hello ${ticket.customer.name || 'there'},
        
        We wanted to let you know that ${assignedToName} has started working on your support ticket. We're actively investigating and working to resolve your issue.
        
        Ticket Details:
        - Title: ${ticket.title}
        - Priority: ${ticket.priority}
        - Category: ${ticket.category}
        - Status: In Progress
        - Assigned To: ${assignedToName}
        
        We'll keep you updated on our progress. If you have any additional information that might help us resolve your issue, please let us know.
        
        View Support Center: ${appUrl}/support
        
        Thank you for your patience!
        This is an automated message. Please do not reply to this email.
      `
    };
  }

  /**
   * Get ticket resolved email template
   */
  private getTicketResolvedTemplate(ticket: any): EmailTemplate {
    const assignedToName = ticket.assignedTo?.name || 'our support team';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vssyl.com';
    const resolvedAt = ticket.resolvedAt ? new Date(ticket.resolvedAt).toLocaleDateString() : 'Recently';
    
    return {
      subject: `Your support ticket has been resolved - ${ticket.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Support Ticket Resolved</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #059669; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
            .button { display: inline-block; background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .satisfaction { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Ticket Resolved</h1>
            </div>
            <div class="content">
              <p>Hello ${ticket.customer.name || 'there'},</p>
              
              <p>Great news! Your support ticket has been resolved by <strong>${assignedToName}</strong>. We hope this resolves your issue completely.</p>
              
              <div class="ticket-info">
                <h3>Ticket Details:</h3>
                <p><strong>Title:</strong> ${ticket.title}</p>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Category:</strong> ${ticket.category}</p>
                <p><strong>Status:</strong> Resolved</p>
                <p><strong>Resolved By:</strong> ${assignedToName}</p>
                <p><strong>Resolved On:</strong> ${resolvedAt}</p>
              </div>
              
              <div class="satisfaction">
                <h4>📝 How was your experience?</h4>
                <p>We'd love to hear about your experience with our support team. Your feedback helps us improve our service.</p>
                <a href="${appUrl}/support/feedback/${ticket.id}" class="button">Rate Your Experience</a>
              </div>
              
              <p>If you have any follow-up questions or if this issue persists, please don't hesitate to create a new support ticket.</p>
              
              <a href="${appUrl}/support" class="button">Create New Ticket</a>
            </div>
            <div class="footer">
              <p>Thank you for using our service!</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Ticket Resolved
        
        Hello ${ticket.customer.name || 'there'},
        
        Great news! Your support ticket has been resolved by ${assignedToName}. We hope this resolves your issue completely.
        
        Ticket Details:
        - Title: ${ticket.title}
        - Priority: ${ticket.priority}
        - Category: ${ticket.category}
        - Status: Resolved
        - Resolved By: ${assignedToName}
        - Resolved On: ${resolvedAt}
        
        How was your experience?
        We'd love to hear about your experience with our support team. Your feedback helps us improve our service.
        Rate Your Experience: ${appUrl}/support/feedback/${ticket.id}
        
        If you have any follow-up questions or if this issue persists, please don't hesitate to create a new support ticket.
        Create New Ticket: ${appUrl}/support
        
        Thank you for using our service!
        This is an automated message. Please do not reply to this email.
      `
    };
  }
}
