import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../../lib/prisma';
import * as adminAuditService from '../admin/adminAuditService';
import { ADMIN_AUDIT_ACTIONS } from '../admin/adminAuditTaxonomy';
import { SupportTicketEmailService } from '../supportTicketEmailService';
import {
  createSupportTicket,
  getSupportTickets,
  updateSupportTicket,
} from '../admin/adminSupportService';

describe('adminSupportService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSupportTickets applies status and priority filters', async () => {
    vi.spyOn(prisma.supportTicket, 'findMany').mockResolvedValue([] as never);

    await getSupportTickets({ status: 'open', priority: 'high' });

    expect(prisma.supportTicket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: 'open', priority: 'high' },
      }),
    );
  });

  it('updateSupportTicket resolves ticket and emits support audit', async () => {
    vi.spyOn(prisma.supportTicket, 'update').mockResolvedValue({
      id: 'ticket-1',
      status: 'RESOLVED',
      customer: { id: 'cust-1', name: 'Customer', email: 'cust@test.com' },
      assignedTo: null,
    } as never);
    vi.spyOn(adminAuditService, 'logSupportTicketAudit').mockResolvedValue(undefined);
    vi.spyOn(SupportTicketEmailService.prototype, 'sendTicketResolvedEmail').mockResolvedValue(true);

    const result = await updateSupportTicket('ticket-1', 'resolve', undefined, 'admin-1');

    expect(result.id).toBe('ticket-1');
    expect(adminAuditService.logSupportTicketAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 'admin-1',
        action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
        ticketId: 'ticket-1',
      }),
    );
  });

  it('createSupportTicket persists ticket and audits creation', async () => {
    vi.spyOn(prisma.supportTicket, 'create').mockResolvedValue({
      id: 'ticket-new',
      title: 'Help',
      description: 'Need help',
      status: 'OPEN',
      priority: 'MEDIUM',
      category: 'general',
      customer: { id: 'cust-1', name: 'Customer', email: 'cust@test.com' },
      assignedTo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      attachments: [],
    } as never);
    vi.spyOn(adminAuditService, 'logSupportTicketAudit').mockResolvedValue(undefined);

    const result = await createSupportTicket(
      {
        title: 'Help',
        description: 'Need help',
        priority: 'medium',
        category: 'general',
        customerId: 'cust-1',
      },
      'admin-1',
    );

    expect(result.id).toBe('ticket-new');
    expect(adminAuditService.logSupportTicketAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_CREATE,
        adminId: 'admin-1',
      }),
    );
  });
});
