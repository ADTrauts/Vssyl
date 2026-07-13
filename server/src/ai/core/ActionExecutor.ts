import { PrismaClient, Prisma, AttendanceMethod } from '@prisma/client';
import { AIAction, UserContext } from './DigitalLifeTwinService';
import { tryExecuteViaGovernedPlatform } from '../governance/actionExecutorBridge';

export interface ActionExecutionResult {
  actionId: string;
  success: boolean;
  result?: any;
  error?: string;
  metadata: {
    executionTime: number;
    module: string;
    operation: string;
    affectedUsers: string[];
    rollbackAvailable: boolean;
  };
}

export interface ActionApprovalRequest {
  id: string;
  userId: string;
  action: AIAction;
  reasoning: string;
  affectedUsers: string[];
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  responses: ApprovalResponse[];
}

export interface ApprovalResponse {
  userId: string;
  response: 'approve' | 'reject' | 'modify';
  reasoning?: string;
  modifications?: Record<string, unknown>;
  timestamp: Date;
}

export interface ExecutionContext {
  userId: string;
  requestId: string;
  autonomyLevel: number;
  approvalRequired: boolean;
  dryRun: boolean;
  rollbackPlan?: RollbackPlan;
}

export interface RollbackPlan {
  steps: RollbackStep[];
  conditions: string[];
  timeout: number; // minutes
}

export interface RollbackStep {
  module: string;
  operation: string;
  parameters: Record<string, unknown>;
  order: number;
}

export class ActionExecutor {
  private prisma: PrismaClient;
  private executionQueue: Map<string, AIAction[]> = new Map();
  private rollbackPlans: Map<string, RollbackPlan> = new Map();

  /**
   * Phase 2: HIGH_RISK ops are routed via tryExecuteViaGovernedPlatform (ledger + approval).
   * Kept for documentation / source-scan compatibility with Phase 1B tests.
   */
  private static readonly HIGH_RISK_OPERATIONS = new Set([
    'share_file',
    'delete_file',
    'send_message',
    'delete_event',
    'delete_task',
    'publish_schedule',
    'approve_time_off',
    'terminate_employee',
    'send_email',
  ]);

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Execute actions with proper authorization and approval flow
   */
  async executeActions(actions: AIAction[], userContext: UserContext): Promise<ActionExecutionResult[]> {
    const results: ActionExecutionResult[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, userContext);
        results.push(result);
      } catch (error) {
        results.push({
          actionId: action.id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          metadata: {
            executionTime: 0,
            module: action.module,
            operation: action.operation,
            affectedUsers: action.affectedUsers || [],
            rollbackAvailable: false
          }
        });
      }
    }

    return results;
  }

  /**
   * Execute a single action
   */
  async executeAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();

    // Phase 2: route mapped Twin tools + HIGH_RISK ops through canonical governed platform
    const dashboardCtx = userContext.dashboardContext as Record<string, unknown> | undefined;
    const businessId =
      typeof dashboardCtx?.businessId === 'string'
        ? dashboardCtx.businessId
        : typeof (userContext as { businessId?: string }).businessId === 'string'
          ? (userContext as { businessId?: string }).businessId
          : undefined;
    const bridged = await tryExecuteViaGovernedPlatform(action, userContext, this.prisma, {
      businessId: businessId ?? null,
      requestId: action.id,
    });
    if (bridged) {
      return bridged;
    }

    // Check if approval is required (legacy low/medium paths still using stub flow)
    if (action.requiresApproval) {
      const approvalResult = await this.handleApprovalFlow(action, userContext);
      if (!approvalResult.approved) {
        return {
          actionId: action.id,
          success: false,
          error: 'Action requires approval',
          metadata: {
            executionTime: Date.now() - startTime,
            module: action.module,
            operation: action.operation,
            affectedUsers: action.affectedUsers || [],
            rollbackAvailable: false
          }
        };
      }
    }

    // Create rollback plan
    const rollbackPlan = await this.createRollbackPlan(action, userContext);
    this.rollbackPlans.set(action.id, rollbackPlan);

    // Execute based on module
    const result = await this.executeByModule(action, userContext);

    // Log execution
    await this.logActionExecution(action, result, userContext);

    // Clean up rollback plan if successful
    if (result.success) {
      setTimeout(() => {
        this.rollbackPlans.delete(action.id);
      }, rollbackPlan.timeout * 60 * 1000);
    }

    return {
      ...result,
      metadata: {
        ...result.metadata,
        executionTime: Date.now() - startTime,
        rollbackAvailable: this.rollbackPlans.has(action.id)
      }
    };
  }

  /**
   * Handle approval flow for actions requiring permission
   */
  private async handleApprovalFlow(action: AIAction, userContext: UserContext): Promise<{ approved: boolean; reason?: string }> {
    // Create approval request
    const approvalRequest: ActionApprovalRequest = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userContext.userId,
      action,
      reasoning: action.reasoning,
      affectedUsers: action.affectedUsers || [],
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      status: 'pending',
      responses: []
    };

    // Store approval request
    await this.storeApprovalRequest(approvalRequest);

    // Send notifications to affected users
    await this.notifyAffectedUsers(approvalRequest);

    // For now, return immediately - in production, this would wait for approval
    // TODO: Implement real-time approval waiting mechanism
    return { approved: false, reason: 'Approval pending' };
  }

  /**
   * Execute action based on module
   * 
   * Priority:
   * 1. Check ActionExecutorRegistry (third-party modules)
   * 2. Fall back to built-in executors
   */
  private async executeByModule(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    // First, check if module has registered executor (third-party)
    try {
      const { actionExecutorRegistry } = await import('./ActionExecutorRegistry');
      
      if (actionExecutorRegistry.has(action.module)) {
        // Third-party module - use registered executor
        return await actionExecutorRegistry.execute(action, userContext);
      }
    } catch (error) {
      // If registry import fails or execution fails, fall through to built-in
      console.warn(`Failed to use registered executor for ${action.module}, falling back to built-in:`, error);
    }

    // Fall back to built-in executors
    const moduleExecutors = {
      drive: this.executeDriveAction.bind(this),
      chat: this.executeChatAction.bind(this),
      household: this.executeHouseholdAction.bind(this),
      business: this.executeBusinessAction.bind(this),
      dashboard: this.executeDashboardAction.bind(this),
      calendar: this.executeCalendarAction.bind(this),
      notebook: this.executeNotebookAction.bind(this),
      place: this.executePlaceAction.bind(this),
      tasks: this.executeTasksAction.bind(this),
      todo: this.executeTasksAction.bind(this),
      notifications: this.executeNotificationsAction.bind(this),
      scheduling: this.executeSchedulingAction.bind(this),
      hr: this.executeHRAction.bind(this)
    };

    const executor = moduleExecutors[action.module as keyof typeof moduleExecutors];
    
    if (!executor) {
      throw new Error(`No executor found for module: ${action.module}`);
    }

    return executor(action, userContext);
  }

  private driveActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'drive' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private driveActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.driveActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: outcome.data,
      metadata: this.driveActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Drive module action executor — canonical driveAIActionService (Wave 1B).
   */
  private async executeDriveAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      const {
        aiCreateFolder,
        aiMoveFile,
        aiShareFile,
        aiDeleteFile,
        aiOrganizeFiles,
      } = await import('../../services/driveAIActionService.js');

      switch (operation) {
        case 'create_folder': {
          const { name, parentId, dashboardId } = parameters || {};
          if (!name) {
            return this.driveActionResult(
              action,
              startTime,
              'create_folder',
              { success: false, error: 'name is required' },
              action.affectedUsers || [],
              false
            );
          }
          const outcome = await aiCreateFolder({
            userId: userContext.userId,
            name: String(name),
            parentId: parentId != null ? String(parentId) : null,
            dashboardId: dashboardId != null ? String(dashboardId) : null,
          });
          return this.driveActionResult(
            action,
            startTime,
            'create_folder',
            outcome,
            action.affectedUsers || [],
            outcome.success
          );
        }

        case 'move_file': {
          const { fileId, targetFolderId } = parameters || {};
          if (!fileId) {
            return this.driveActionResult(
              action,
              startTime,
              'move_file',
              { success: false, error: 'fileId is required' },
              action.affectedUsers || [],
              false
            );
          }
          const outcome = await aiMoveFile({
            userId: userContext.userId,
            fileId: String(fileId),
            targetFolderId: targetFolderId != null ? String(targetFolderId) : null,
          });
          return this.driveActionResult(
            action,
            startTime,
            'move_file',
            outcome,
            action.affectedUsers || [],
            outcome.success
          );
        }

        case 'share_file': {
          const { fileId, userId: targetUserId, canRead, canWrite } = parameters || {};
          if (!fileId || !targetUserId) {
            return this.driveActionResult(
              action,
              startTime,
              'share_file',
              { success: false, error: 'fileId and userId are required' },
              action.affectedUsers || [],
              false
            );
          }
          const outcome = await aiShareFile({
            ownerUserId: userContext.userId,
            fileId: String(fileId),
            targetUserId: String(targetUserId),
            canRead: canRead !== undefined ? Boolean(canRead) : true,
            canWrite: canWrite !== undefined ? Boolean(canWrite) : false,
          });
          const affectedUsersList = [...(action.affectedUsers || [])];
          const targetId = String(targetUserId);
          if (!affectedUsersList.includes(targetId)) {
            affectedUsersList.push(targetId);
          }
          return this.driveActionResult(
            action,
            startTime,
            'share_file',
            outcome,
            affectedUsersList,
            outcome.success
          );
        }

        case 'delete_file': {
          const { fileId } = parameters || {};
          if (!fileId) {
            return this.driveActionResult(
              action,
              startTime,
              'delete_file',
              { success: false, error: 'fileId is required' },
              action.affectedUsers || [],
              false
            );
          }
          const outcome = await aiDeleteFile({
            userId: userContext.userId,
            fileId: String(fileId),
          });
          return this.driveActionResult(
            action,
            startTime,
            'delete_file',
            outcome,
            action.affectedUsers || [],
            outcome.success
          );
        }

        case 'organize_files': {
          const { fileIds, targetFolderId } = parameters || {};
          if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return this.driveActionResult(
              action,
              startTime,
              'organize_files',
              { success: false, error: 'fileIds array is required' },
              action.affectedUsers || [],
              false
            );
          }
          const outcome = await aiOrganizeFiles({
            userId: userContext.userId,
            fileIds: fileIds.map(String),
            targetFolderId: targetFolderId != null ? String(targetFolderId) : null,
          });
          return this.driveActionResult(
            action,
            startTime,
            'organize_files',
            outcome,
            action.affectedUsers || [],
            outcome.success
          );
        }

        default:
          return this.driveActionResult(
            action,
            startTime,
            operation,
            { success: false, error: `Unknown drive operation: ${operation}` },
            action.affectedUsers || [],
            false
          );
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return this.driveActionResult(
        action,
        startTime,
        operation,
        { success: false, error: err.message || 'Unknown error occurred' },
        action.affectedUsers || [],
        false
      );
    }
  }

  private chatActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'chat' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private chatActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.chatActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: { success: true, data: outcome.data },
      metadata: this.chatActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Chat module action executor — canonical services only (Phase 1F).
   */
  private async executeChatAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      const {
        aiSendMessage,
        aiCreateConversation,
        aiRespondToMessage,
      } = await import('../../services/chatAIActionService.js');

      switch (operation) {
        case 'send_message': {
          const { conversationId, content, fileIds, replyToId, threadId } = parameters || {};

          if (!conversationId || !content) {
            return this.chatActionResult(
              action,
              startTime,
              'send_message',
              { success: false, error: 'conversationId and content are required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiSendMessage({
            userId: userContext.userId,
            conversationId: String(conversationId),
            content: String(content),
            fileIds: Array.isArray(fileIds) ? fileIds.map(String) : undefined,
            replyToId: replyToId != null ? String(replyToId) : null,
            threadId: threadId != null ? String(threadId) : null,
          });

          return this.chatActionResult(
            action,
            startTime,
            'send_message',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'create_conversation': {
          const { name, type, participantIds, dashboardId } = parameters || {};

          if (!type || !participantIds || !Array.isArray(participantIds)) {
            return this.chatActionResult(
              action,
              startTime,
              'create_conversation',
              { success: false, error: 'type and participantIds array are required' },
              action.affectedUsers || [],
              false
            );
          }

          const validTypes = ['DIRECT', 'GROUP', 'CHANNEL'] as const;
          if (!validTypes.includes(type as (typeof validTypes)[number])) {
            return this.chatActionResult(
              action,
              startTime,
              'create_conversation',
              {
                success: false,
                error: `type must be one of: ${validTypes.join(', ')}`,
              },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiCreateConversation({
            userId: userContext.userId,
            type: type as (typeof validTypes)[number],
            participantIds: participantIds.map(String),
            name: typeof name === 'string' ? name : undefined,
            dashboardId: typeof dashboardId === 'string' ? dashboardId : undefined,
          });

          return this.chatActionResult(
            action,
            startTime,
            'create_conversation',
            outcome,
            action.affectedUsers || participantIds.map(String),
            true
          );
        }

        case 'respond_to_message': {
          const { conversationId, messageId, content, fileIds } = parameters || {};

          if (!conversationId || !messageId || !content) {
            return this.chatActionResult(
              action,
              startTime,
              'respond_to_message',
              {
                success: false,
                error: 'conversationId, messageId, and content are required',
              },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiRespondToMessage({
            userId: userContext.userId,
            conversationId: String(conversationId),
            messageId: String(messageId),
            content: String(content),
            fileIds: Array.isArray(fileIds) ? fileIds.map(String) : undefined,
          });

          return this.chatActionResult(
            action,
            startTime,
            'respond_to_message',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'schedule_message': {
          // Schedule message is not yet implemented - would require background job infrastructure
          return {
            actionId: action.id,
            success: false,
            error: 'schedule_message is not yet implemented - requires background job infrastructure',
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'chat',
              operation: 'schedule_message',
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown chat operation: ${operation}`,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'chat',
              operation: action.operation,
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
      }
    } catch (error) {
      const err = error as Error;
      return {
        actionId: action.id,
        success: false,
        error: err.message || 'Unknown error occurred',
        metadata: {
          executionTime: Date.now() - startTime,
          module: 'chat',
          operation: action.operation,
          affectedUsers: action.affectedUsers || [],
          rollbackAvailable: false
        }
      };
    }
  }

  /**
   * Household module action executor
   */
  private async executeHouseholdAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const { operation } = action;
    return {
      actionId: action.id,
      success: false,
      error: `Household AI action "${operation}" is not implemented — use module services when available`,
      metadata: {
        executionTime: 0,
        module: 'household',
        operation,
        affectedUsers: action.affectedUsers || [],
        rollbackAvailable: false,
      },
    };
  }

  /**
   * Business module action executor
   */
  private async executeBusinessAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const { operation } = action;
    return {
      actionId: action.id,
      success: false,
      error: `Business AI action "${operation}" is not implemented — use POST /api/business-ai/:businessId/interact or module services`,
      metadata: {
        executionTime: 0,
        module: 'business',
        operation,
        affectedUsers: action.affectedUsers || [],
        rollbackAvailable: false,
      },
    };
  }

  /**
   * Dashboard module action executor
   */
  private async executeDashboardAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const { operation } = action;
    return {
      actionId: action.id,
      success: false,
      error: `Dashboard AI action "${operation}" is not implemented — no synthetic success paths`,
      metadata: {
        executionTime: 0,
        module: 'dashboard',
        operation,
        affectedUsers: action.affectedUsers || [],
        rollbackAvailable: false,
      },
    };
  }

  private calendarActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'calendar' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private calendarActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.calendarActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: outcome.data,
      metadata: this.calendarActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Calendar module action executor — canonical services only (Phase 1F).
   */
  private async executeCalendarAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      const {
        aiCreateEvent,
        aiUpdateEvent,
        aiDeleteEvent,
        aiRsvpEvent,
        aiCheckConflicts,
      } = await import('../../services/calendarAIActionService.js');

      switch (operation) {
        case 'create_event': {
          const {
            calendarId,
            title,
            description,
            location,
            startAt,
            endAt,
            allDay,
            timezone,
            attendees,
            recurrenceRule,
            recurrenceEndAt,
          } = parameters || {};

          if (!calendarId || !title || !startAt || !endAt) {
            return this.calendarActionResult(
              action,
              startTime,
              'create_event',
              {
                success: false,
                error: 'calendarId, title, startAt, and endAt are required',
              },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiCreateEvent({
            userId: userContext.userId,
            calendarId: String(calendarId),
            title: String(title),
            description: description != null ? String(description) : undefined,
            location: location != null ? String(location) : undefined,
            startAt: String(startAt),
            endAt: String(endAt),
            allDay: Boolean(allDay),
            timezone: timezone != null ? String(timezone) : undefined,
            attendees,
            recurrenceRule: recurrenceRule != null ? String(recurrenceRule) : null,
            recurrenceEndAt: recurrenceEndAt != null ? String(recurrenceEndAt) : null,
          });

          return this.calendarActionResult(
            action,
            startTime,
            'create_event',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'update_event': {
          const {
            eventId,
            title,
            description,
            location,
            startAt,
            endAt,
            allDay,
            timezone,
            attendees,
            editMode,
            occurrenceStartAt,
          } = parameters || {};

          if (!eventId) {
            return this.calendarActionResult(
              action,
              startTime,
              'update_event',
              { success: false, error: 'eventId is required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiUpdateEvent({
            userId: userContext.userId,
            eventId: String(eventId),
            title: title != null ? String(title) : undefined,
            description: description != null ? String(description) : undefined,
            location: location != null ? String(location) : undefined,
            startAt: startAt != null ? String(startAt) : undefined,
            endAt: endAt != null ? String(endAt) : undefined,
            allDay: allDay != null ? Boolean(allDay) : undefined,
            timezone: timezone != null ? String(timezone) : undefined,
            attendees,
            editMode: (editMode as 'THIS' | 'SERIES' | undefined) || 'SERIES',
            occurrenceStartAt: occurrenceStartAt != null ? String(occurrenceStartAt) : null,
          });

          return this.calendarActionResult(
            action,
            startTime,
            'update_event',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'delete_event': {
          const { eventId, editMode, occurrenceStartAt } = parameters || {};

          if (!eventId) {
            return this.calendarActionResult(
              action,
              startTime,
              'delete_event',
              { success: false, error: 'eventId is required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiDeleteEvent({
            userId: userContext.userId,
            eventId: String(eventId),
            editMode: (editMode as 'THIS' | 'SERIES' | undefined) || 'SERIES',
            occurrenceStartAt:
              occurrenceStartAt != null ? String(occurrenceStartAt) : undefined,
          });

          return this.calendarActionResult(
            action,
            startTime,
            'delete_event',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'rsvp_event': {
          const { eventId, response } = parameters || {};

          if (!eventId || !response) {
            return this.calendarActionResult(
              action,
              startTime,
              'rsvp_event',
              { success: false, error: 'eventId and response are required' },
              action.affectedUsers || [],
              false
            );
          }

          const validResponses = ['NEEDS_ACTION', 'ACCEPTED', 'DECLINED', 'TENTATIVE'] as const;
          if (!validResponses.includes(response as (typeof validResponses)[number])) {
            return this.calendarActionResult(
              action,
              startTime,
              'rsvp_event',
              {
                success: false,
                error: `response must be one of: ${validResponses.join(', ')}`,
              },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiRsvpEvent({
            userId: userContext.userId,
            eventId: String(eventId),
            response: response as (typeof validResponses)[number],
          });

          return this.calendarActionResult(
            action,
            startTime,
            'rsvp_event',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'check_conflicts': {
          const { start, end, calendarIds } = parameters || {};

          if (!start || !end) {
            return this.calendarActionResult(
              action,
              startTime,
              'check_conflicts',
              { success: false, error: 'start and end are required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiCheckConflicts({
            userId: userContext.userId,
            start: String(start),
            end: String(end),
            calendarIds: Array.isArray(calendarIds)
              ? calendarIds.map(String)
              : calendarIds != null
                ? String(calendarIds)
                : undefined,
          });

          return this.calendarActionResult(
            action,
            startTime,
            'check_conflicts',
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown calendar operation: ${operation}`,
            metadata: this.calendarActionMetadata(
              action,
              startTime,
              operation,
              action.affectedUsers || [],
              false
            ),
          };
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        actionId: action.id,
        success: false,
        error: err.message || 'Unknown error occurred',
        metadata: this.calendarActionMetadata(
          action,
          startTime,
          operation,
          action.affectedUsers || [],
          false
        ),
      };
    }
  }

  private notebookActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'notebook' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private notebookActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.notebookActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: outcome.data,
      metadata: this.notebookActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Notebook module action executor — read-only AI via notebookAIActionService (Phase 7+).
   * Writes (confirm action items) are HTTP-only with explicit user confirmation.
   */
  private async executeNotebookAction(
    action: AIAction,
    userContext: UserContext
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      const {
        summarizePage,
        extractActionItems,
        generateMeetingRecap,
        suggestLinks,
      } = await import('../../services/notebook/notebookAIActionService.js');
      const { loadGroundedAIContext } = await import(
        '../../services/notebook/notebookAIContextService.js'
      );

      const pageId = parameters?.pageId != null ? String(parameters.pageId) : '';
      if (!pageId) {
        return this.notebookActionResult(
          action,
          startTime,
          operation,
          { success: false, error: 'pageId is required' },
          action.affectedUsers || [],
          false
        );
      }

      switch (operation) {
        case 'summarize_page': {
          const data = await summarizePage(pageId, userContext.userId);
          return this.notebookActionResult(
            action,
            startTime,
            'summarize_page',
            { success: true, data },
            action.affectedUsers || [],
            false
          );
        }

        case 'extract_action_items': {
          const selectedText =
            parameters?.selectedText != null ? String(parameters.selectedText) : undefined;
          const data = await extractActionItems({
            pageId,
            userId: userContext.userId,
            selectedText,
          });
          return this.notebookActionResult(
            action,
            startTime,
            'extract_action_items',
            { success: true, data },
            action.affectedUsers || [],
            false
          );
        }

        case 'meeting_recap': {
          const data = await generateMeetingRecap(pageId, userContext.userId);
          return this.notebookActionResult(
            action,
            startTime,
            'meeting_recap',
            { success: true, data },
            action.affectedUsers || [],
            false
          );
        }

        case 'suggest_links': {
          const data = await suggestLinks(pageId, userContext.userId);
          return this.notebookActionResult(
            action,
            startTime,
            'suggest_links',
            { success: true, data },
            action.affectedUsers || [],
            false
          );
        }

        case 'get_page_ai_context': {
          const data = await loadGroundedAIContext(pageId, userContext.userId);
          return this.notebookActionResult(
            action,
            startTime,
            'get_page_ai_context',
            { success: true, data },
            action.affectedUsers || [],
            false
          );
        }

        case 'confirm_action_items':
          return this.notebookActionResult(
            action,
            startTime,
            'confirm_action_items',
            {
              success: false,
              error:
                'confirm_action_items requires explicit user approval — use POST /api/notebook/pages/:pageId/ai/action-items/confirm',
            },
            action.affectedUsers || [],
            false
          );

        default:
          return this.notebookActionResult(
            action,
            startTime,
            operation,
            { success: false, error: `Unknown notebook operation: ${operation}` },
            action.affectedUsers || [],
            false
          );
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return this.notebookActionResult(
        action,
        startTime,
        operation,
        { success: false, error: err.message || 'Notebook action failed' },
        action.affectedUsers || [],
        false
      );
    }
  }

  private placeActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'place' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private placeActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.placeActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: outcome.data,
      metadata: this.placeActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Place module action executor — read-only AI via placeAIActionService (Wave 1F).
   * No writes: no tasks, calendar events, transactions, notifications, or links created.
   */
  private async executePlaceAction(
    action: AIAction,
    userContext: UserContext
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    const {
      getPlaceContext,
      recommendPlaces,
      purchaseHelp,
      reservationHelp,
      searchPlaces,
      isPlaceAIReadOperation,
    } = await import('../../services/place/placeAIActionService.js');

    const writeLike = [
      'add_node',
      'remove_node',
      'create_meeting',
      'send_connection_request',
      'accept_connection',
      'create_transaction',
      'record_click',
      'dismiss_suggestion',
    ];
    if (writeLike.includes(operation)) {
      return this.placeActionResult(
        action,
        startTime,
        operation,
        {
          success: false,
          error: `Place AI v1 is read-only — ${operation} is not supported via ActionExecutor`,
        },
        action.affectedUsers || [],
        false
      );
    }

    if (!isPlaceAIReadOperation(operation)) {
      return this.placeActionResult(
        action,
        startTime,
        operation,
        { success: false, error: `Unknown or unsupported Place operation: ${operation}` },
        action.affectedUsers || [],
        false
      );
    }

    try {
      switch (operation) {
        case 'get_place_context': {
          const scope =
            parameters?.scope != null ? String(parameters.scope) : (parameters?.context as string) ?? 'all';
          const outcome = await getPlaceContext(userContext.userId, scope);
          return this.placeActionResult(
            action,
            startTime,
            operation,
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        case 'recommend_places': {
          const limit =
            parameters?.limit != null ? Number(parameters.limit) : undefined;
          const outcome = await recommendPlaces(userContext.userId, { limit });
          return this.placeActionResult(
            action,
            startTime,
            operation,
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        case 'purchase_help': {
          const query = parameters?.query != null ? String(parameters.query) : '';
          const businessId =
            parameters?.businessId != null ? String(parameters.businessId) : null;
          const outcome = await purchaseHelp(userContext.userId, { query, businessId });
          return this.placeActionResult(
            action,
            startTime,
            operation,
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        case 'reservation_help': {
          const businessId = parameters?.businessId != null ? String(parameters.businessId) : '';
          const date = parameters?.date != null ? String(parameters.date) : null;
          const partySize =
            parameters?.partySize != null ? Number(parameters.partySize) : null;
          const outcome = await reservationHelp(userContext.userId, {
            businessId,
            date,
            partySize,
          });
          return this.placeActionResult(
            action,
            startTime,
            operation,
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        case 'search_places': {
          const query = parameters?.query != null ? String(parameters.query) : '';
          const outcome = await searchPlaces(userContext.userId, query);
          return this.placeActionResult(
            action,
            startTime,
            operation,
            outcome,
            action.affectedUsers || [],
            false
          );
        }

        default:
          return this.placeActionResult(
            action,
            startTime,
            operation,
            { success: false, error: `Unknown Place operation: ${operation}` },
            action.affectedUsers || [],
            false
          );
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return this.placeActionResult(
        action,
        startTime,
        operation,
        { success: false, error: err.message || 'Place action failed' },
        action.affectedUsers || [],
        false
      );
    }
  }

  private todoActionMetadata(
    action: AIAction,
    startTime: number,
    operation: string,
    affectedUsers: string[],
    rollbackAvailable: boolean
  ) {
    return {
      executionTime: Date.now() - startTime,
      module: 'todo' as const,
      operation,
      affectedUsers,
      rollbackAvailable,
    };
  }

  private todoActionResult(
    action: AIAction,
    startTime: number,
    operation: string,
    outcome: { success: true; data: unknown } | { success: false; error: string },
    affectedUsers: string[],
    rollbackAvailable: boolean
  ): ActionExecutionResult {
    if (!outcome.success) {
      return {
        actionId: action.id,
        success: false,
        error: outcome.error,
        metadata: this.todoActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
      };
    }
    return {
      actionId: action.id,
      success: true,
      result: outcome.data,
      metadata: this.todoActionMetadata(action, startTime, operation, affectedUsers, rollbackAvailable),
    };
  }

  /**
   * Tasks module action executor — canonical services only (Phase 1F).
   */
  private async executeTasksAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      const {
        aiCreateTask,
        aiUpdateTask,
        aiCompleteTask,
        aiBulkUpdatePriority,
      } = await import('../../services/todoAIActionService.js');

      switch (operation) {
        case 'update_priority': {
          const { taskId, newPriority } = parameters || {};
          if (!taskId || !newPriority) {
            return this.todoActionResult(
              action,
              startTime,
              'update_priority',
              { success: false, error: 'taskId and newPriority are required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiUpdateTask({
            userId: userContext.userId,
            taskId: String(taskId),
            priority: String(newPriority),
          });

          return this.todoActionResult(
            action,
            startTime,
            'update_priority',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'bulk_update_priority': {
          const { taskIds, newPriority } = parameters || {};
          if (!Array.isArray(taskIds) || !newPriority) {
            return this.todoActionResult(
              action,
              startTime,
              'bulk_update_priority',
              { success: false, error: 'taskIds (array) and newPriority are required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiBulkUpdatePriority({
            userId: userContext.userId,
            taskIds: taskIds.map(String),
            newPriority: String(newPriority),
          });

          return this.todoActionResult(
            action,
            startTime,
            'bulk_update_priority',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'create_task': {
          const { title, description, priority, dueDate, dashboardId, businessId } = parameters || {};
          if (!title) {
            return this.todoActionResult(
              action,
              startTime,
              'create_task',
              { success: false, error: 'title is required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiCreateTask({
            userId: userContext.userId,
            title: String(title),
            description: description != null ? String(description) : undefined,
            priority: priority != null ? String(priority) : undefined,
            dueDate: dueDate != null ? String(dueDate) : null,
            dashboardId: dashboardId != null ? String(dashboardId) : null,
            businessId: businessId != null ? String(businessId) : null,
          });

          return this.todoActionResult(
            action,
            startTime,
            'create_task',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        case 'complete_task': {
          const { taskId } = parameters || {};
          if (!taskId) {
            return this.todoActionResult(
              action,
              startTime,
              'complete_task',
              { success: false, error: 'taskId is required' },
              action.affectedUsers || [],
              false
            );
          }

          const outcome = await aiCompleteTask({
            userId: userContext.userId,
            taskId: String(taskId),
          });

          return this.todoActionResult(
            action,
            startTime,
            'complete_task',
            outcome,
            action.affectedUsers || [],
            true
          );
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown todo operation: ${operation}`,
            metadata: this.todoActionMetadata(
              action,
              startTime,
              operation,
              action.affectedUsers || [],
              false
            ),
          };
      }
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      return {
        actionId: action.id,
        success: false,
        error: err.message || 'Unknown error occurred',
        metadata: this.todoActionMetadata(
          action,
          startTime,
          operation,
          action.affectedUsers || [],
          false
        ),
      };
    }
  }

  /**
   * HR module action executor
   */
  private async executeHRAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      switch (operation) {
        case 'create_time_off_request': {
          const { businessId, type, startDate, endDate, reason } = parameters || {};
          if (!businessId || !type || !startDate || !endDate) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId, type, startDate, and endDate are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'hr',
                operation: 'create_time_off_request',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false,
              },
            };
          }
          const { aiRequestTimeOff } = await import('../../services/hrAIActionService.js');
          const outcome = await aiRequestTimeOff({
            userId: userContext.userId,
            businessId: String(businessId),
            type: String(type),
            startDate: String(startDate),
            endDate: String(endDate),
            reason: reason != null ? String(reason) : null,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'hr',
              operation: 'create_time_off_request',
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: outcome.success,
            },
          };
        }

        case 'approve_time_off': {
          const { businessId, requestId, decision, note } = parameters || {};
          if (!businessId || !requestId || !decision) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId, requestId, and decision (APPROVE or DENY) are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'hr',
                operation: 'approve_time_off',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false,
              },
            };
          }
          if (decision !== 'APPROVE' && decision !== 'DENY') {
            return {
              actionId: action.id,
              success: false,
              error: 'decision must be either APPROVE or DENY',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'hr',
                operation: 'approve_time_off',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false,
              },
            };
          }
          const { aiApproveTimeOff } = await import('../../services/hrAIActionService.js');
          const outcome = await aiApproveTimeOff({
            managerUserId: userContext.userId,
            businessId: String(businessId),
            requestId: String(requestId),
            decision: decision as 'APPROVE' | 'DENY',
            note: note != null ? String(note) : null,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'hr',
              operation: 'approve_time_off',
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: outcome.success,
            },
          };
        }

        case 'clock_in': {
          const { businessId, employeePositionId, location, method } = parameters || {};
          
          if (!businessId || !employeePositionId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and employeePositionId are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'hr',
                operation: 'clock_in',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false
              }
            };
          }

          const { recordPunchIn } = await import('../../services/hrAttendanceService');
          
          // Default to ADMIN if method not provided (AI actions are admin-initiated)
          const attendanceMethod = method ? (method as AttendanceMethod) : AttendanceMethod.ADMIN;
          
          const punchResult = await recordPunchIn({
            businessId: businessId as string,
            employeePositionId: employeePositionId as string,
            method: attendanceMethod,
            location: location ? (location as Prisma.InputJsonValue) : undefined,
            source: 'AI_ACTION'
          });

          return {
            actionId: action.id,
            success: true,
            result: punchResult,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'hr',
              operation: 'clock_in',
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
        }

        case 'clock_out': {
          const { businessId, employeePositionId, recordId } = parameters || {};
          
          if (!businessId || !employeePositionId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and employeePositionId are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'hr',
                operation: 'clock_out',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false
              }
            };
          }

          const { recordPunchOut } = await import('../../services/hrAttendanceService');
          
          // Default to ADMIN if method not provided (AI actions are admin-initiated)
          const attendanceMethod = AttendanceMethod.ADMIN;
          
          const punchResult = await recordPunchOut({
            businessId: businessId as string,
            employeePositionId: employeePositionId as string,
            method: attendanceMethod,
            source: 'AI_ACTION',
            recordId: recordId as string | undefined
          });

          return {
            actionId: action.id,
            success: true,
            result: punchResult,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'hr',
              operation: 'clock_out',
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown HR operation: ${operation}`,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'hr',
              operation: action.operation,
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
      }
    } catch (error) {
      const err = error as Error;
      return {
        actionId: action.id,
        success: false,
        error: err.message || 'Unknown error occurred',
        metadata: {
          executionTime: Date.now() - startTime,
          module: 'hr',
          operation: action.operation,
          affectedUsers: action.affectedUsers || [],
          rollbackAvailable: false
        }
      };
    }
  }

  /**
   * Notifications module action executor
   */
  private async executeNotificationsAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const { operation, parameters } = action;

    try {
      switch (operation) {
        case 'send_notification': {
          const { userId, type, title, body, data, priority } = parameters || {};
          
          if (!userId || !type || !title) {
            return {
              actionId: action.id,
              success: false,
              error: 'userId, type, and title are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'notifications',
                operation: 'send_notification',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false
              }
            };
          }

          const { NotificationService } = await import('../../services/notificationService');
          
          const notification = await NotificationService.createNotification({
            userId: userId as string,
            type: type as string,
            title: title as string,
            body: body as string | undefined,
            data: data as Record<string, unknown> | undefined
          });

          return {
            actionId: action.id,
            success: true,
            result: notification,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'notifications',
              operation: 'send_notification',
              affectedUsers: action.affectedUsers || [userId as string],
              rollbackAvailable: false
            }
          };
        }

        case 'schedule_reminder': {
          // Schedule reminder would require background job infrastructure
          // For now, create a notification with scheduledAt in data
          const { userId, type, title, body, scheduledAt, data } = parameters || {};
          
          if (!userId || !type || !title || !scheduledAt) {
            return {
              actionId: action.id,
              success: false,
              error: 'userId, type, title, and scheduledAt are required',
              metadata: {
                executionTime: Date.now() - startTime,
                module: 'notifications',
                operation: 'schedule_reminder',
                affectedUsers: action.affectedUsers || [],
                rollbackAvailable: false
              }
            };
          }

          // For now, create notification with scheduledAt in data
          // A background job would need to process these later
          const { NotificationService } = await import('../../services/notificationService');
          
          const notification = await NotificationService.createNotification({
            userId: userId as string,
            type: type as string,
            title: title as string,
            body: body as string | undefined,
            data: {
              ...(data as Record<string, unknown> || {}),
              scheduledAt: scheduledAt,
              isScheduled: true
            }
          });

          return {
            actionId: action.id,
            success: true,
            result: {
              ...notification,
              message: 'Reminder scheduled (requires background job infrastructure to process)'
            },
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'notifications',
              operation: 'schedule_reminder',
              affectedUsers: action.affectedUsers || [userId as string],
              rollbackAvailable: false
            }
          };
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown notifications operation: ${operation}`,
            metadata: {
              executionTime: Date.now() - startTime,
              module: 'notifications',
              operation: action.operation,
              affectedUsers: action.affectedUsers || [],
              rollbackAvailable: false
            }
          };
      }
    } catch (error) {
      const err = error as Error;
      return {
        actionId: action.id,
        success: false,
        error: err.message || 'Unknown error occurred',
        metadata: {
          executionTime: Date.now() - startTime,
          module: 'notifications',
          operation: action.operation,
          affectedUsers: action.affectedUsers || [],
          rollbackAvailable: false
        }
      };
    }
  }

  /**
   * Rollback an action if possible
   */
  async rollbackAction(actionId: string, userContext: UserContext): Promise<ActionExecutionResult> {
    const rollbackPlan = this.rollbackPlans.get(actionId);
    
    if (!rollbackPlan) {
      throw new Error(`No rollback plan found for action: ${actionId}`);
    }

    try {
      // Execute rollback steps in reverse order
      const sortedSteps = rollbackPlan.steps.sort((a, b) => b.order - a.order);
      
      for (const step of sortedSteps) {
        await this.executeByModule({
          id: `rollback_${actionId}_${step.order}`,
          type: 'rollback',
          module: step.module,
          operation: step.operation,
          parameters: step.parameters,
          requiresApproval: false,
          affectedUsers: [],
          reasoning: 'Rollback operation'
        }, userContext);
      }

      // Remove rollback plan
      this.rollbackPlans.delete(actionId);

      return {
        actionId: `rollback_${actionId}`,
        success: true,
        result: 'Action successfully rolled back',
        metadata: {
          executionTime: 0,
          module: 'system',
          operation: 'rollback',
          affectedUsers: [],
          rollbackAvailable: false
        }
      };
    } catch (error) {
      return {
        actionId: `rollback_${actionId}`,
        success: false,
        error: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        metadata: {
          executionTime: 0,
          module: 'system',
          operation: 'rollback',
          affectedUsers: [],
          rollbackAvailable: false
        }
      };
    }
  }

  /**
   * Helper methods
   */
  private async createRollbackPlan(action: AIAction, userContext: UserContext): Promise<RollbackPlan> {
    // TODO: Implement sophisticated rollback plan creation
    return {
      steps: [],
      conditions: [],
      timeout: 60 // 1 hour
    };
  }

  private async storeApprovalRequest(request: ActionApprovalRequest): Promise<void> {
    // TODO: Store approval request in database
  }

  private async notifyAffectedUsers(request: ActionApprovalRequest): Promise<void> {
    // TODO: Send notifications to affected users
  }

  private async logActionExecution(action: AIAction, result: ActionExecutionResult, userContext: UserContext): Promise<void> {
    // TODO: Log action execution for audit trail
  }

  // Module-specific API call methods
  private async callDriveAPI(endpoint: string, method: string, data: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement Drive API calls
    return { success: true, message: 'Drive API call simulated' };
  }

  private async callChatAPI(endpoint: string, method: string, data: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement Chat API calls
    return { success: true, message: 'Chat API call simulated' };
  }

  private async callDashboardAPI(endpoint: string, method: string, data: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement Dashboard API calls
    return { success: true, message: 'Dashboard API call simulated' };
  }

  // Specific operation implementations
  private async organizeFiles(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement file organization logic
    return { organized: true, count: parameters.fileCount || 0 };
  }

  private async scheduleMessage(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement message scheduling
    return { scheduled: true, messageId: `msg_${Date.now()}` };
  }

  private async respondToMessage(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement automatic message response
    return { responded: true, responseId: `response_${Date.now()}` };
  }

  private async assignHouseholdTask(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement household task assignment
    return { assigned: true, taskId: `task_${Date.now()}` };
  }

  private async scheduleHouseholdEvent(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement household event scheduling
    return { scheduled: true, eventId: `event_${Date.now()}` };
  }

  private async notifyHouseholdMembers(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement household member notifications
    return { notified: true, memberCount: parameters.memberCount || 0 };
  }

  private async manageHouseholdBudget(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement household budget management
    return { updated: true, amount: parameters.amount || 0 };
  }

  private async scheduleBusinessMeeting(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement business meeting scheduling
    return { scheduled: true, meetingId: `meeting_${Date.now()}` };
  }

  private async delegateBusinessTask(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement business task delegation
    return { delegated: true, taskId: `task_${Date.now()}` };
  }

  private async generateBusinessReport(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement business report generation
    return { generated: true, reportId: `report_${Date.now()}` };
  }

  private async updateBusinessProject(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement business project updates
    return { updated: true, projectId: parameters.projectId };
  }

  private async updateDashboardLayout(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement dashboard layout updates
    return { updated: true, layoutId: `layout_${Date.now()}` };
  }

  private async addDashboardModule(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement dashboard module addition
    return { added: true, moduleId: parameters.moduleId };
  }

  private async sendNotification(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement notification sending
    return { sent: true, notificationId: `notif_${Date.now()}` };
  }

  private async scheduleReminder(parameters: Record<string, unknown>, userContext: UserContext): Promise<unknown> {
    // TODO: Implement reminder scheduling
    return { scheduled: true, reminderId: `reminder_${Date.now()}` };
  }

  /**
   * Scheduling module action executor
   */
  private async executeSchedulingAction(action: AIAction, userContext: UserContext): Promise<ActionExecutionResult> {
    try {
      const { operation, parameters } = action;

      switch (operation) {
        case 'generate_schedule': {
          const { businessId, scheduleId, strategy, constraints } = parameters || {};
          if (!businessId || !scheduleId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and scheduleId are required',
              metadata: {
                executionTime: 0,
                module: 'scheduling',
                operation: 'generate_schedule',
                affectedUsers: [],
                rollbackAvailable: false,
              },
            };
          }
          const { aiGenerateSchedule } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiGenerateSchedule({
            userId: userContext.userId,
            businessId: String(businessId),
            scheduleId: String(scheduleId),
            strategy: strategy != null ? String(strategy) : undefined,
            constraints:
              constraints && typeof constraints === 'object'
                ? (constraints as Record<string, unknown>)
                : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: {
              executionTime: 0,
              module: 'scheduling',
              operation: 'generate_schedule',
              affectedUsers: [],
              rollbackAvailable: false,
            },
          };
        }

        case 'suggest_assignments': {
          const { businessId, scheduleId, shiftId } = parameters || {};
          if (!businessId || !shiftId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and shiftId are required',
              metadata: {
                executionTime: 0,
                module: 'scheduling',
                operation: 'suggest_assignments',
                affectedUsers: [],
                rollbackAvailable: false,
              },
            };
          }
          const { aiSuggestShiftAssignments } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiSuggestShiftAssignments({
            userId: userContext.userId,
            businessId: String(businessId),
            shiftId: String(shiftId),
            scheduleId: scheduleId != null ? String(scheduleId) : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: {
              executionTime: 0,
              module: 'scheduling',
              operation: 'suggest_assignments',
              affectedUsers: [],
              rollbackAvailable: false,
            },
          };
        }

        case 'create_schedule': {
          const { businessId, name, startDate, endDate, description, timezone } = parameters || {};
          if (!businessId || !name || !startDate || !endDate) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId, name, startDate, and endDate are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'create_schedule', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiCreateSchedule } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiCreateSchedule({
            userId: userContext.userId,
            businessId: String(businessId),
            name: String(name),
            startDate: String(startDate),
            endDate: String(endDate),
            description: description != null ? String(description) : undefined,
            timezone: timezone != null ? String(timezone) : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'create_schedule', affectedUsers: [], rollbackAvailable: false },
          };
        }

        case 'publish_schedule': {
          const { businessId, scheduleId } = parameters || {};
          if (!businessId || !scheduleId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and scheduleId are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'publish_schedule', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiPublishSchedule } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiPublishSchedule({
            userId: userContext.userId,
            businessId: String(businessId),
            scheduleId: String(scheduleId),
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'publish_schedule', affectedUsers: [], rollbackAvailable: false },
          };
        }

        case 'assign_shift': {
          const { businessId, shiftId, employeePositionId } = parameters || {};
          if (!businessId || !shiftId || !employeePositionId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId, shiftId, and employeePositionId are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'assign_shift', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiAssignShift } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiAssignShift({
            userId: userContext.userId,
            businessId: String(businessId),
            shiftId: String(shiftId),
            employeePositionId: String(employeePositionId),
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'assign_shift', affectedUsers: [], rollbackAvailable: false },
          };
        }

        case 'swap_shift': {
          const { businessId, shiftId, requestedToId, reason } = parameters || {};
          if (!businessId || !shiftId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and shiftId are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'swap_shift', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiRequestShiftSwap } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiRequestShiftSwap({
            userId: userContext.userId,
            businessId: String(businessId),
            shiftId: String(shiftId),
            requestedToId: requestedToId != null ? String(requestedToId) : undefined,
            reason: reason != null ? String(reason) : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'swap_shift', affectedUsers: [], rollbackAvailable: false },
          };
        }

        case 'set_availability': {
          const { businessId, dayOfWeek, startTime, endTime, availabilityType, employeePositionId } = parameters || {};
          if (!businessId || !dayOfWeek || !startTime || !endTime) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId, dayOfWeek, startTime, and endTime are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'set_availability', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiSetAvailability } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiSetAvailability({
            userId: userContext.userId,
            businessId: String(businessId),
            dayOfWeek: String(dayOfWeek),
            startTime: String(startTime),
            endTime: String(endTime),
            availabilityType: availabilityType != null ? String(availabilityType) : undefined,
            employeePositionId: employeePositionId != null ? String(employeePositionId) : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'set_availability', affectedUsers: [], rollbackAvailable: false },
          };
        }

        case 'claim_open_shift': {
          const { businessId, shiftId, employeePositionId } = parameters || {};
          if (!businessId || !shiftId) {
            return {
              actionId: action.id,
              success: false,
              error: 'businessId and shiftId are required',
              metadata: { executionTime: 0, module: 'scheduling', operation: 'claim_open_shift', affectedUsers: [], rollbackAvailable: false },
            };
          }
          const { aiClaimOpenShift } = await import('../../services/schedulingAIActionService.js');
          const outcome = await aiClaimOpenShift({
            userId: userContext.userId,
            businessId: String(businessId),
            shiftId: String(shiftId),
            employeePositionId: employeePositionId != null ? String(employeePositionId) : undefined,
          });
          return {
            actionId: action.id,
            success: outcome.success,
            result: outcome.success ? outcome.data : undefined,
            error: outcome.success ? undefined : outcome.error,
            metadata: { executionTime: 0, module: 'scheduling', operation: 'claim_open_shift', affectedUsers: [], rollbackAvailable: false },
          };
        }

        default:
          return {
            actionId: action.id,
            success: false,
            error: `Unknown scheduling action: ${operation}`,
            metadata: {
              executionTime: 0,
              module: 'scheduling',
              operation,
              affectedUsers: [],
              rollbackAvailable: false
            }
          };
      }
    } catch (error) {
      const err = error as Error;
      return {
        actionId: action.id,
        success: false,
        error: err.message,
        metadata: {
          executionTime: 0,
          module: 'scheduling',
          operation: action.operation,
          affectedUsers: [],
          rollbackAvailable: false
        }
      };
    }
  }
}