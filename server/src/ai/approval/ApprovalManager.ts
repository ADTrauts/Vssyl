import { PrismaClient } from '@prisma/client';
import { AutonomyDecision } from '../autonomy/AutonomyManager';

export interface ApprovalRequest {
  id: string;
  userId: string;
  actionType: string;
  actionData: any;
  affectedUsers: string[];
  reasoning: string;
  riskAssessment: any;
  autonomyDecision: AutonomyDecision;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'executed';
  responses: ApprovalResponse[];
  createdAt: Date;
}

export interface ApprovalResponse {
  userId: string;
  userName: string;
  response: 'approve' | 'reject' | 'modify';
  reasoning?: string;
  modifications?: any;
  timestamp: Date;
}

export interface ApprovalNotification {
  type: 'request' | 'response' | 'expired' | 'executed';
  requestId: string;
  userId: string;
  message: string;
  actionType: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export class ApprovalManager {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create a new approval request
   */
  async createApprovalRequest(
    userId: string,
    actionType: string,
    actionData: any,
    affectedUsers: string[],
    reasoning: string,
    autonomyDecision: AutonomyDecision
  ): Promise<ApprovalRequest> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const request = await this.prisma.aIApprovalRequest.create({
      data: {
        userId,
        requestType: actionType,
        actionData: JSON.parse(JSON.stringify(actionData)),
        affectedUsers,
        reasoning,
        expiresAt,
        status: 'PENDING'
      }
    });

    // Send notifications to affected users
    await this.notifyAffectedUsers(request.id, affectedUsers, actionType, reasoning);

    return this.formatApprovalRequest(request, autonomyDecision);
  }

  /**
   * Get approval request by ID
   */
  async getApprovalRequest(requestId: string): Promise<ApprovalRequest | null> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return null;
    }

    return this.formatApprovalRequest(request);
  }

  /**
   * Get pending approvals for a user
   */
  async getPendingApprovals(userId: string): Promise<ApprovalRequest[]> {
    const requests = await this.prisma.aIApprovalRequest.findMany({
      where: {
        OR: [
          { userId },
          { affectedUsers: { has: userId } }
        ],
        status: 'PENDING',
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    return requests.map(request => this.formatApprovalRequest(request));
  }

  /**
   * Respond to an approval request
   */
  async respondToApproval(
    requestId: string,
    responderId: string,
    response: 'approve' | 'reject' | 'modify',
    reasoning?: string,
    modifications?: any
  ): Promise<ApprovalRequest> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new Error('Approval request not found');
    }

    if (request.status !== 'PENDING') {
      throw new Error('Approval request is no longer pending');
    }

    if (request.expiresAt < new Date()) {
      throw new Error('Approval request has expired');
    }

    // Add response to the request
    const responses = request.responses as any[] || [];
    const responder = await this.prisma.user.findUnique({
      where: { id: responderId },
      select: { name: true }
    });

    const newResponse: ApprovalResponse = {
      userId: responderId,
      userName: responder?.name || 'Unknown User',
      response,
      reasoning,
      modifications,
      timestamp: new Date()
    };

    responses.push(newResponse);

    // Update request status based on responses
    let newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED' = request.status as 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'EXECUTED';
    if (response === 'reject') {
      newStatus = 'REJECTED';
    } else if (response === 'approve') {
      // Check if we have enough approvals
      const approvals = responses.filter(r => r.response === 'approve').length;
      const rejections = responses.filter(r => r.response === 'reject').length;
      
      if (rejections > 0) {
        newStatus = 'REJECTED';
      } else if (approvals >= this.getRequiredApprovals(request.affectedUsers.length)) {
        newStatus = 'APPROVED';
      }
    }

    const updatedRequest = await this.prisma.aIApprovalRequest.update({
      where: { id: requestId },
      data: {
        responses: JSON.parse(JSON.stringify(responses)),
        status: newStatus,
        respondedAt: new Date(),
        approvedBy: response === 'approve' ? responderId : undefined,
        rejectedBy: response === 'reject' ? responderId : undefined,
        rejectionReason: response === 'reject' ? reasoning : undefined
      }
    });

    // Notify about the response
    await this.notifyResponse(requestId, newResponse);

    return this.formatApprovalRequest(updatedRequest);
  }

  /**
   * Execute an approved action
   */
  async executeApprovedAction(requestId: string): Promise<boolean> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request || request.status !== 'APPROVED') {
      throw new Error('Request is not approved for execution');
    }

    // Mark as executed
    await this.prisma.aIApprovalRequest.update({
      where: { id: requestId },
      data: {
        status: 'EXECUTED',
        executedAt: new Date()
      }
    });

    // Notify about execution
    await this.notifyExecution(requestId);

    return true;
  }

  /**
   * Check for expired requests and handle them
   */
  async handleExpiredRequests(): Promise<void> {
    const expiredRequests = await this.prisma.aIApprovalRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() }
      }
    });

    for (const request of expiredRequests) {
      await this.prisma.aIApprovalRequest.update({
        where: { id: request.id },
        data: { status: 'EXPIRED' }
      });

      await this.notifyExpiration(request.id);
    }
  }

  /**
   * Get approval statistics for a user
   */
  async getApprovalStats(userId: string): Promise<any> {
    const requests = await this.prisma.aIApprovalRequest.findMany({
      where: { userId }
    });

    const stats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length,
      expired: requests.filter(r => r.status === 'EXPIRED').length,
      executed: requests.filter(r => r.status === 'EXECUTED').length,
      averageResponseTime: 0
    };

    // Calculate average response time
    const respondedRequests = requests.filter(r => r.respondedAt);
    if (respondedRequests.length > 0) {
      const totalTime = respondedRequests.reduce((sum, r) => {
        return sum + (r.respondedAt!.getTime() - r.createdAt.getTime());
      }, 0);
      stats.averageResponseTime = totalTime / respondedRequests.length;
    }

    return stats;
  }

  /**
   * Notify affected users about approval request
   */
  private async notifyAffectedUsers(
    requestId: string,
    affectedUsers: string[],
    actionType: string,
    reasoning: string
  ): Promise<void> {
    for (const userId of affectedUsers) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'ai_approval_request',
          title: 'AI Action Requires Your Approval',
          body: `An AI action (${actionType}) requires your approval. Reason: ${reasoning}`,
          data: {
            requestId,
            actionType,
            reasoning
          }
        }
      });
    }
  }

  /**
   * Notify about approval response
   */
  private async notifyResponse(requestId: string, response: ApprovalResponse): Promise<void> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return;

    // Notify the original requester
    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'ai_approval_response',
        title: `Approval ${response.response === 'approve' ? 'Granted' : 'Denied'}`,
        body: `${response.userName} ${response.response === 'approve' ? 'approved' : 'rejected'} the AI action. ${response.reasoning ? `Reason: ${response.reasoning}` : ''}`,
        data: {
          requestId,
          response: response.response,
          responder: response.userName,
          reasoning: response.reasoning
        }
      }
    });
  }

  /**
   * Notify about request expiration
   */
  private async notifyExpiration(requestId: string): Promise<void> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return;

    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'ai_approval_expired',
        title: 'Approval Request Expired',
        body: 'Your AI action approval request has expired and was automatically cancelled.',
        data: { requestId }
      }
    });
  }

  /**
   * Notify about action execution
   */
  private async notifyExecution(requestId: string): Promise<void> {
    const request = await this.prisma.aIApprovalRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) return;

    await this.prisma.notification.create({
      data: {
        userId: request.userId,
        type: 'ai_action_executed',
        title: 'AI Action Executed',
        body: 'Your approved AI action has been executed successfully.',
        data: { requestId }
      }
    });
  }

  /**
   * Determine required number of approvals based on affected users
   */
  private getRequiredApprovals(affectedUserCount: number): number {
    if (affectedUserCount <= 2) return 1;
    if (affectedUserCount <= 5) return 2;
    if (affectedUserCount <= 10) return 3;
    return Math.ceil(affectedUserCount * 0.3); // 30% of affected users
  }

  /**
   * Format approval request for API response
   */
  private formatApprovalRequest(request: any, autonomyDecision?: AutonomyDecision): ApprovalRequest {
    return {
      id: request.id,
      userId: request.userId,
      actionType: request.requestType,
      actionData: request.actionData,
      affectedUsers: request.affectedUsers,
      reasoning: request.reasoning,
      riskAssessment: autonomyDecision?.riskAssessment || { level: 'low', factors: [], impact: 'minimal' },
      autonomyDecision: autonomyDecision || {
        actionId: request.id,
        canExecute: false,
        requiresApproval: true,
        autonomyLevel: 0,
        confidence: 0,
        riskAssessment: { level: 'low', factors: [], impact: 'minimal' }
      },
      expiresAt: request.expiresAt,
      status: request.status.toLowerCase() as any,
      responses: request.responses || [],
      createdAt: request.createdAt
    };
  }
}

export default ApprovalManager; 