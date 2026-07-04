import { EmailNotificationService, EmailTemplate } from './emailNotificationService';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import {
  buildSupportTicketAssignedEmail,
  buildSupportTicketInProgressEmail,
  buildSupportTicketResolvedEmail,
} from './email/templates';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}

type TicketWithRelations = {
  id: string;
  title: string;
  priority: string;
  category: string;
  createdAt: Date;
  resolvedAt: Date | null;
  customer: { name: string | null; email: string } | null;
  assignedTo: { name: string | null } | null;
};

function toSupportParams(ticket: TicketWithRelations) {
  return {
    ticketTitle: ticket.title,
    ticketPriority: ticket.priority,
    ticketCategory: ticket.category,
    customerName: ticket.customer?.name ?? null,
    assignedToName: ticket.assignedTo?.name ?? 'our support team',
    createdAt: ticket.createdAt,
    resolvedAt: ticket.resolvedAt,
    ticketId: ticket.id,
  };
}

export class SupportTicketEmailService {
  private emailService: EmailNotificationService;

  constructor() {
    this.emailService = EmailNotificationService.getInstance();
  }

  async sendTicketAssignedEmail(ticketId: string, assignedToId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { customer: true, assignedTo: true },
      });

      if (!ticket || !ticket.customer) {
        logSrvErr(
          'supportticketemailservice_assignment_missing_ticket_or_customer',
          'Ticket or customer not found for assignment email',
          new Error('Ticket or customer not found'),
          { ticketId, assignedToId }
        );
        return false;
      }

      const template = buildSupportTicketAssignedEmail(toSupportParams(ticket));
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      logSrvErr('supportticketemailservice_error_sending_ticket_assigned_email', 'Error sending ticket assigned email:', error);
      return false;
    }
  }

  async sendTicketInProgressEmail(ticketId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { customer: true, assignedTo: true },
      });

      if (!ticket || !ticket.customer) {
        logSrvErr(
          'supportticketemailservice_in_progress_missing_ticket_or_customer',
          'Ticket or customer not found for in-progress email',
          new Error('Ticket or customer not found'),
          { ticketId }
        );
        return false;
      }

      const template = buildSupportTicketInProgressEmail(toSupportParams(ticket));
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      logSrvErr('supportticketemailservice_error_sending_ticket_in_progress_email', 'Error sending ticket in-progress email:', error);
      return false;
    }
  }

  async sendTicketResolvedEmail(ticketId: string): Promise<boolean> {
    try {
      const ticket = await prisma.supportTicket.findUnique({
        where: { id: ticketId },
        include: { customer: true, assignedTo: true },
      });

      if (!ticket || !ticket.customer) {
        logSrvErr(
          'supportticketemailservice_resolved_missing_ticket_or_customer',
          'Ticket or customer not found for resolved email',
          new Error('Ticket or customer not found'),
          { ticketId }
        );
        return false;
      }

      const template = buildSupportTicketResolvedEmail(toSupportParams(ticket));
      return await this.emailService.sendEmail({
        to: ticket.customer.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });
    } catch (error) {
      logSrvErr('supportticketemailservice_error_sending_ticket_resolved_email', 'Error sending ticket resolved email:', error);
      return false;
    }
  }
}
