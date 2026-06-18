import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { SupportTicketEmailService } from '../supportTicketEmailService';
import type {
  AdminKnowledgeArticleCreateResult,
  AdminKnowledgeArticleMutationResult,
  AdminLiveChatJoinResult,
  AdminSupportAnalyticsPayload,
  AdminSupportStatsPayload,
  AdminSupportTicketCreateResult,
  AdminSupportTicketMutationResult,
} from './adminServiceContracts';
import { logSupportTicketAudit } from './adminAuditService';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from './adminAuditTaxonomy';

export interface SupportTicketFilters { status?: string; priority?: string; category?: string; dateRange?: string; }
export interface SupportTicketData { title: string; description: string; priority: string; category: string; userId?: string; customerId?: string; tags?: string[]; metadata?: Record<string, unknown>; }
export interface SupportTicket { id: string; title: string; description: string; status: string; priority: string; category: string; customer: { id: string; name: string; email: string; plan: string }; assignedTo?: { id: string; name: string; email: string }; createdAt: string; updatedAt: string; responseTime: number; satisfaction?: number; tags: string[]; attachments: string[]; }
interface KnowledgeArticleData { title: string; content: string; category: string; tags: string[]; authorId: string; status: 'draft' | 'published' | 'archived'; metadata?: Record<string, unknown>; }
export interface KnowledgeArticle { id: string; title: string; content: string; category: string; status: string; tags: string[]; author: { id: string; name: string; email: string }; createdAt: string; updatedAt: string; views: number; helpful: number; notHelpful: number; }
export interface LiveChat { id: string; customer: { id: string; name: string; email: string }; status: string; startedAt: string; lastMessageAt: string; messageCount: number; agent?: { id: string; name: string; email: string }; duration?: number; }

  // Customer Support Methods
export async function getSupportTickets(filters: SupportTicketFilters = {}): Promise<SupportTicket[]> {
    try {
      const whereClause: any = {};
      
      // Apply filters
      if (filters.status && filters.status !== 'all') {
        whereClause.status = filters.status;
      }
      
      if (filters.priority && filters.priority !== 'all') {
        whereClause.priority = filters.priority;
      }
      
      if (filters.category && filters.category !== 'all') {
        whereClause.category = filters.category;
      }

      const tickets = await prisma.supportTicket.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          attachments: true,
          messages: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // Transform to match the expected interface
      return tickets.map(ticket => ({
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status.toLowerCase() as 'open' | 'pending' | 'resolved' | 'closed',
        priority: ticket.priority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
        category: ticket.category,
        customer: {
          id: ticket.customer.id,
          name: ticket.customer.name || 'Unknown',
          email: ticket.customer.email,
          plan: 'premium' // TODO: Get actual plan from subscription
        },
        assignedTo: ticket.assignedTo ? {
          id: ticket.assignedTo.id,
          name: ticket.assignedTo.name || 'Unknown',
          email: ticket.assignedTo.email
        } : undefined,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        responseTime: ticket.responseTime || 0,
        satisfaction: ticket.satisfaction || undefined,
        tags: ticket.tags,
        attachments: ticket.attachments.map(att => att.filename)
      }));
    } catch (error) {
      await logger.error('Failed to get support tickets', {
        operation: 'admin_get_support_tickets',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get support tickets');
    }
  }

export async function getSupportStats(): Promise<AdminSupportStatsPayload> {
    try {
      // Get real ticket counts
      const [totalTickets, openTickets, resolvedToday] = await Promise.all([
        prisma.supportTicket.count(),
        prisma.supportTicket.count({
          where: { status: 'OPEN' }
        }),
        prisma.supportTicket.count({
          where: {
            status: 'RESOLVED',
            resolvedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      ]);

      // Get average response time
      const ticketsWithResponseTime = await prisma.supportTicket.findMany({
        where: {
          responseTime: { not: null }
        },
        select: { responseTime: true }
      });
      
      const averageResponseTime = ticketsWithResponseTime.length > 0
        ? ticketsWithResponseTime.reduce((sum, ticket) => sum + (ticket.responseTime || 0), 0) / ticketsWithResponseTime.length
        : 0;

      // Get average satisfaction
      const ticketsWithSatisfaction = await prisma.supportTicket.findMany({
        where: {
          satisfaction: { not: null }
        },
        select: { satisfaction: true }
      });
      
      const customerSatisfaction = ticketsWithSatisfaction.length > 0
        ? ticketsWithSatisfaction.reduce((sum, ticket) => sum + (ticket.satisfaction || 0), 0) / ticketsWithSatisfaction.length
        : 0;

      // Get top categories
      const categoryStats = await prisma.supportTicket.groupBy({
        by: ['category'],
        _count: { id: true }
      });

      const topCategories = categoryStats
        .map(stat => ({
          category: stat.category,
          count: stat._count.id,
          percentage: Math.round((stat._count.id / totalTickets) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        totalTickets,
        openTickets,
        resolvedToday,
        averageResponseTime: Math.round(averageResponseTime * 10) / 10,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
        activeAgents: 5, // TODO: Get real agent count
        averageResolutionTime: 8.5, // TODO: Calculate from resolved tickets
        topCategories
      };
    } catch (error) {
      await logger.error('Failed to get support statistics', {
        operation: 'admin_get_support_stats',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get support stats');
    }
  }

export async function updateSupportTicket(ticketId: string, action: string, data?: Record<string, unknown>, adminId?: string): Promise<AdminSupportTicketMutationResult> {
    try {
      let updateData: any = {
        updatedAt: new Date()
      };

      // Handle different actions
      switch (action) {
        case 'assign':
          updateData.assignedToId = adminId;
          break;
        case 'start_progress':
          updateData.status = 'IN_PROGRESS';
          break;
        case 'resolve':
          updateData.status = 'RESOLVED';
          updateData.resolvedAt = new Date();
          break;
        case 'close':
          updateData.status = 'CLOSED';
          updateData.closedAt = new Date();
          break;
        case 'update_priority':
          updateData.priority = data?.priority;
          break;
        case 'update_category':
          updateData.category = data?.category;
          break;
        case 'add_response_time':
          updateData.responseTime = data?.responseTime;
          break;
        case 'add_satisfaction':
          updateData.satisfaction = data?.satisfaction;
          break;
        default:
          // For any other action, just update the data
          if (data) {
            Object.assign(updateData, data);
          }
      }

      const ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data: updateData,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log the action
      await logSupportTicketAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_UPDATE,
        ticketId,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SUPPORT_TICKET,
        details: { action, data },
      });

      // Send email notifications based on action
      try {
        const emailService = new SupportTicketEmailService();
        
        switch (action) {
          case 'assign':
            await emailService.sendTicketAssignedEmail(ticketId, adminId || '');
            break;
          case 'start_progress':
            await emailService.sendTicketInProgressEmail(ticketId);
            break;
          case 'resolve':
            await emailService.sendTicketResolvedEmail(ticketId);
            break;
        }
      } catch (emailError) {
        await logger.error('Failed to send ticket update email notification', {
          operation: 'admin_send_ticket_email',
          error: {
            message: emailError instanceof Error ? emailError.message : 'Unknown error',
            stack: emailError instanceof Error ? emailError.stack : undefined
          }
        });
        // Don't fail the ticket update if email fails
      }

      return ticket;
    } catch (error) {
      await logger.error('Failed to update support ticket', {
        operation: 'admin_update_support_ticket',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to update support ticket');
    }
  }

export async function getKnowledgeBase(): Promise<KnowledgeArticle[]> {
    try {
      const articles = await prisma.knowledgeBaseArticle.findMany({
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return articles.map(article => ({
        id: article.id,
        title: article.title,
        content: article.content,
        category: article.category,
        tags: article.tags,
        author: {
          id: article.author.id,
          name: article.author.name || 'Unknown',
          email: article.author.email,
        },
        status: article.status.toLowerCase(),
        views: article.views,
        helpful: article.helpful,
        notHelpful: article.notHelpful,
        createdAt: article.createdAt.toISOString(),
        updatedAt: article.updatedAt.toISOString()
      }));
    } catch (error) {
      await logger.error('Failed to get knowledge base', {
        operation: 'admin_get_knowledge_base',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get knowledge base');
    }
  }

export async function updateKnowledgeArticle(articleId: string, action: string, data?: Record<string, unknown>, adminId?: string): Promise<AdminKnowledgeArticleMutationResult> {
    try {
      const article = {
        id: articleId,
        action,
        data,
        updatedBy: adminId,
        updatedAt: new Date()
      };

      // Log the action
      await logSupportTicketAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.KNOWLEDGE_ARTICLE_UPDATE,
        resourceId: articleId,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.KNOWLEDGE_ARTICLE,
        details: { action, data },
      });

      return article;
    } catch (error) {
      await logger.error('Failed to update knowledge article', {
        operation: 'admin_update_knowledge_article',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to update knowledge article');
    }
  }

export async function getLiveChats(): Promise<LiveChat[]> {
    try {
      const chats = await prisma.liveChatSession.findMany({
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          agent: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          messages: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          startedAt: 'desc'
        }
      });

      return chats.map(chat => ({
        id: chat.id,
        customer: {
          id: chat.customer.id,
          name: chat.customer.name || 'Unknown',
          email: chat.customer.email
        },
        agent: chat.agent ? {
          id: chat.agent.id,
          name: chat.agent.name || 'Unknown',
          email: chat.agent.email,
        } : undefined,
        status: chat.status.toLowerCase(),
        startedAt: chat.startedAt.toISOString(),
        lastMessageAt: chat.lastMessageAt.toISOString(),
        messageCount: chat.messageCount,
        duration: chat.duration || 0
      }));
    } catch (error) {
      await logger.error('Failed to get live chats', {
        operation: 'admin_get_live_chats',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get live chats');
    }
  }

export async function joinLiveChat(chatId: string, adminId?: string): Promise<AdminLiveChatJoinResult> {
    try {
      const chat = {
        id: chatId,
        agentId: adminId,
        joinedAt: new Date()
      };

      // Log the action
      await logSupportTicketAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.LIVE_CHAT_JOIN,
        resourceId: chatId,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.LIVE_CHAT,
        details: { chatId },
      });

      return chat;
    } catch (error) {
      await logger.error('Failed to join live chat', {
        operation: 'admin_join_live_chat',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to join live chat');
    }
  }

export async function getSupportAnalytics(): Promise<AdminSupportAnalyticsPayload> {
    try {
      return {
        responseTime: {
          average: 2.3,
          median: 1.8,
          p95: 4.2
        },
        resolutionTime: {
          average: 8.5,
          median: 6.2,
          p95: 15.8
        },
        satisfaction: {
          average: 4.2,
          totalRatings: 145,
          distribution: {
            '5': 89,
            '4': 32,
            '3': 15,
            '2': 6,
            '1': 3
          }
        },
        volume: {
          daily: 12,
          weekly: 84,
          monthly: 342
        },
        categories: [
          { name: 'Technical', count: 45, percentage: 29 },
          { name: 'Billing', count: 32, percentage: 21 },
          { name: 'Account', count: 28, percentage: 18 },
          { name: 'Features', count: 25, percentage: 16 },
          { name: 'Other', count: 26, percentage: 16 }
        ]
      };
    } catch (error) {
      await logger.error('Failed to get support analytics', {
        operation: 'admin_get_support_analytics',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to get support analytics');
    }
  }

export async function createSupportTicket(ticketData: SupportTicketData, adminId?: string): Promise<AdminSupportTicketCreateResult> {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          title: ticketData.title,
          description: ticketData.description,
          status: 'OPEN',
          priority: (ticketData.priority || 'MEDIUM').toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
          category: ticketData.category || 'General',
          tags: ticketData.tags || [],
          customerId: ticketData.customerId || 'unknown',
          assignedToId: adminId || null
        },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      // Log the action
      await logSupportTicketAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.SUPPORT_TICKET_CREATE,
        ticketId: ticket.id,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SUPPORT_TICKET,
        details: { title: ticketData.title, category: ticketData.category },
      });

      // Send email notification for ticket creation (if customer-facing)
      if (!adminId) { // Customer-created ticket
        try {
          const emailService = new SupportTicketEmailService();
          // We could add a "ticket created" email template here
          await logger.info('Customer support ticket created', {
            operation: 'customer_create_support_ticket',
            ticketId: ticket.id
          });
        } catch (emailError) {
          await logger.error('Failed to send ticket creation email', {
            operation: 'customer_send_ticket_email',
            error: {
              message: emailError instanceof Error ? emailError.message : 'Unknown error',
              stack: emailError instanceof Error ? emailError.stack : undefined
            }
          });
        }
      }

      return ticket;
    } catch (error) {
      await logger.error('Failed to create support ticket', {
        operation: 'admin_create_support_ticket',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to create support ticket');
    }
  }

export async function createKnowledgeArticle(articleData: KnowledgeArticleData, adminId?: string): Promise<AdminKnowledgeArticleCreateResult> {
    try {
      const article = await prisma.knowledgeBaseArticle.create({
        data: {
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.content.substring(0, 200) + '...',
          category: articleData.category,
          tags: articleData.tags || [],
          status: (articleData.status || 'DRAFT').toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED',
          slug: articleData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          authorId: adminId || 'unknown',
          views: 0,
          helpful: 0,
          notHelpful: 0,
          publishedAt: articleData.status === 'published' ? new Date() : null
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      // Log the action
      await logSupportTicketAudit({
        adminId: adminId || 'system',
        action: ADMIN_AUDIT_ACTIONS.KNOWLEDGE_ARTICLE_CREATE,
        resourceId: article.id,
        resourceType: ADMIN_AUDIT_RESOURCE_TYPES.KNOWLEDGE_ARTICLE,
        details: { title: articleData.title, category: articleData.category },
      });

      return article;
    } catch (error) {
      await logger.error('Failed to create knowledge article', {
        operation: 'admin_create_knowledge_article',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to create knowledge article');
    }
  }

export async function exportSupportData(filters: SupportTicketFilters = {}): Promise<string> {
    try {
      const tickets = await getSupportTickets(filters);
      const stats = await getSupportStats();

      // Generate CSV content
      const csvHeaders = [
        'Ticket ID',
        'Title',
        'Status',
        'Priority',
        'Category',
        'Customer',
        'Created At',
        'Response Time (hours)',
        'Satisfaction'
      ];

      const csvRows = tickets.map(ticket => [
        ticket.id,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.category,
        ticket.customer.name,
        new Date(ticket.createdAt).toLocaleDateString(),
        ticket.responseTime || 'N/A',
        ticket.satisfaction || 'N/A'
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      await logger.error('Failed to export support data', {
        operation: 'admin_export_support_data',
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
      throw new Error('Failed to export support data');
    }
  }
