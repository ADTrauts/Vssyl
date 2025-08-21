import { PrismaClient } from '@prisma/client';

export interface ActionTemplate {
  id: string;
  name: string;
  description: string;
  module: string;
  actionType: string;
  parameters: ActionParameter[];
  autonomyLevel: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  approvalRequired: boolean;
  executionSteps: ExecutionStep[];
  rollbackSteps: ExecutionStep[];
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
  validation?: string;
}

export interface ExecutionStep {
  order: number;
  module: string;
  operation: string;
  parameters: any;
  description: string;
  rollbackOperation?: string;
  rollbackParameters?: any;
}

export class ActionTemplates {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all available action templates
   */
  async getActionTemplates(): Promise<ActionTemplate[]> {
    return [
      // Drive Module Templates
      this.getFileOrganizationTemplate(),
      this.getFileSharingTemplate(),
      this.getFolderStructureTemplate(),
      
      // Chat Module Templates
      this.getMessageResponseTemplate(),
      this.getMeetingSchedulingTemplate(),
      this.getFollowUpTemplate(),
      
      // Household Module Templates
      this.getTaskAssignmentTemplate(),
      this.getEventSchedulingTemplate(),
      this.getBudgetUpdateTemplate(),
      
      // Business Module Templates
      this.getProjectUpdateTemplate(),
      this.getMeetingPreparationTemplate(),
      this.getReportGenerationTemplate(),
      
      // Cross-Module Templates
      this.getCrossModuleNotificationTemplate(),
      this.getDataSyncTemplate(),
      this.getPriorityAlignmentTemplate()
    ];
  }

  /**
   * Get template by ID
   */
  async getActionTemplate(templateId: string): Promise<ActionTemplate | null> {
    const templates = await this.getActionTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  /**
   * Execute a template with parameters
   */
  async executeTemplate(
    templateId: string,
    parameters: any,
    userId: string
  ): Promise<any> {
    const template = await this.getActionTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    // Validate parameters
    this.validateParameters(template, parameters);

    // Execute each step
    const results = [];
    for (const step of template.executionSteps) {
      const stepResult = await this.executeStep(step, parameters, userId);
      results.push(stepResult);
    }

    return {
      templateId,
      success: true,
      results,
      timestamp: new Date()
    };
  }

  /**
   * File Organization Template
   */
  private getFileOrganizationTemplate(): ActionTemplate {
    return {
      id: 'file_organization',
      name: 'Organize Files by Project',
      description: 'Automatically organize files into project-based folders',
      module: 'drive',
      actionType: 'organize_files',
      autonomyLevel: 60,
      riskLevel: 'low',
      approvalRequired: false,
      parameters: [
        {
          name: 'projectName',
          type: 'string',
          required: true,
          description: 'Name of the project to organize files for'
        },
        {
          name: 'fileTypes',
          type: 'array',
          required: false,
          description: 'Specific file types to organize',
          defaultValue: ['doc', 'pdf', 'xlsx', 'pptx']
        },
        {
          name: 'createSubfolders',
          type: 'boolean',
          required: false,
          description: 'Create subfolders for different file types',
          defaultValue: true
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'create_folder',
          parameters: { name: 'projectName', parentId: null },
          description: 'Create project folder'
        },
        {
          order: 2,
          module: 'drive',
          operation: 'move_files',
          parameters: { criteria: 'fileTypes', destination: 'projectFolder' },
          description: 'Move files to project folder'
        },
        {
          order: 3,
          module: 'drive',
          operation: 'create_subfolders',
          parameters: { parentId: 'projectFolder', types: 'fileTypes' },
          description: 'Create subfolders by file type'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'restore_files',
          parameters: { backupId: 'originalLocation' },
          description: 'Restore files to original location'
        }
      ]
    };
  }

  /**
   * Message Response Template
   */
  private getMessageResponseTemplate(): ActionTemplate {
    return {
      id: 'message_response',
      name: 'Auto-Respond to Messages',
      description: 'Automatically respond to messages based on content and context',
      module: 'chat',
      actionType: 'respond_message',
      autonomyLevel: 40,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'messageId',
          type: 'string',
          required: true,
          description: 'ID of the message to respond to'
        },
        {
          name: 'responseType',
          type: 'string',
          required: true,
          description: 'Type of response (acknowledge, schedule, delegate)',
          validation: 'acknowledge|schedule|delegate'
        },
        {
          name: 'tone',
          type: 'string',
          required: false,
          description: 'Tone of the response',
          defaultValue: 'professional'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'analyze_message',
          parameters: { messageId: 'messageId' },
          description: 'Analyze message content and context'
        },
        {
          order: 2,
          module: 'chat',
          operation: 'generate_response',
          parameters: { type: 'responseType', tone: 'tone' },
          description: 'Generate appropriate response'
        },
        {
          order: 3,
          module: 'chat',
          operation: 'send_message',
          parameters: { conversationId: 'conversationId', content: 'response' },
          description: 'Send the response'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'delete_message',
          parameters: { messageId: 'sentMessageId' },
          description: 'Delete sent message'
        }
      ]
    };
  }

  /**
   * Task Assignment Template
   */
  private getTaskAssignmentTemplate(): ActionTemplate {
    return {
      id: 'task_assignment',
      name: 'Assign Household Tasks',
      description: 'Automatically assign tasks to household members based on availability and skills',
      module: 'household',
      actionType: 'assign_task',
      autonomyLevel: 50,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'taskDescription',
          type: 'string',
          required: true,
          description: 'Description of the task to assign'
        },
        {
          name: 'priority',
          type: 'string',
          required: false,
          description: 'Priority level of the task',
          defaultValue: 'medium',
          validation: 'low|medium|high|urgent'
        },
        {
          name: 'dueDate',
          type: 'string',
          required: false,
          description: 'Due date for the task'
        },
        {
          name: 'assignedTo',
          type: 'string',
          required: false,
          description: 'Specific household member to assign to'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'analyze_member_availability',
          parameters: { taskType: 'taskDescription' },
          description: 'Analyze household member availability'
        },
        {
          order: 2,
          module: 'household',
          operation: 'create_task',
          parameters: { 
            description: 'taskDescription',
            priority: 'priority',
            dueDate: 'dueDate',
            assignedTo: 'assignedTo'
          },
          description: 'Create the task'
        },
        {
          order: 3,
          module: 'household',
          operation: 'notify_assignment',
          parameters: { taskId: 'createdTaskId' },
          description: 'Notify assigned member'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'delete_task',
          parameters: { taskId: 'createdTaskId' },
          description: 'Delete created task'
        }
      ]
    };
  }

  /**
   * Project Update Template
   */
  private getProjectUpdateTemplate(): ActionTemplate {
    return {
      id: 'project_update',
      name: 'Update Business Project',
      description: 'Automatically update project status and notify stakeholders',
      module: 'business',
      actionType: 'update_project',
      autonomyLevel: 30,
      riskLevel: 'high',
      approvalRequired: true,
      parameters: [
        {
          name: 'projectId',
          type: 'string',
          required: true,
          description: 'ID of the project to update'
        },
        {
          name: 'updateType',
          type: 'string',
          required: true,
          description: 'Type of update (progress, milestone, issue)',
          validation: 'progress|milestone|issue|completion'
        },
        {
          name: 'details',
          type: 'string',
          required: true,
          description: 'Details of the update'
        },
        {
          name: 'notifyStakeholders',
          type: 'boolean',
          required: false,
          description: 'Whether to notify project stakeholders',
          defaultValue: true
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'update_project_status',
          parameters: { 
            projectId: 'projectId',
            updateType: 'updateType',
            details: 'details'
          },
          description: 'Update project status'
        },
        {
          order: 2,
          module: 'business',
          operation: 'log_project_activity',
          parameters: { 
            projectId: 'projectId',
            activity: 'updateType',
            details: 'details'
          },
          description: 'Log project activity'
        },
        {
          order: 3,
          module: 'business',
          operation: 'notify_stakeholders',
          parameters: { 
            projectId: 'projectId',
            notificationType: 'updateType'
          },
          description: 'Notify project stakeholders'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'revert_project_status',
          parameters: { projectId: 'projectId' },
          description: 'Revert project status'
        }
      ]
    };
  }

  /**
   * Cross-Module Notification Template
   */
  private getCrossModuleNotificationTemplate(): ActionTemplate {
    return {
      id: 'cross_module_notification',
      name: 'Cross-Module Notification',
      description: 'Send coordinated notifications across multiple modules',
      module: 'cross_module',
      actionType: 'cross_module_notify',
      autonomyLevel: 70,
      riskLevel: 'low',
      approvalRequired: false,
      parameters: [
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Message to send across modules'
        },
        {
          name: 'modules',
          type: 'array',
          required: true,
          description: 'Modules to send notification to',
          validation: 'drive|chat|household|business'
        },
        {
          name: 'priority',
          type: 'string',
          required: false,
          description: 'Priority of the notification',
          defaultValue: 'normal',
          validation: 'low|normal|high|urgent'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'prepare_notification',
          parameters: { 
            message: 'message',
            modules: 'modules',
            priority: 'priority'
          },
          description: 'Prepare notification content'
        },
        {
          order: 2,
          module: 'cross_module',
          operation: 'send_to_modules',
          parameters: { 
            notificationId: 'preparedNotificationId',
            modules: 'modules'
          },
          description: 'Send to specified modules'
        },
        {
          order: 3,
          module: 'cross_module',
          operation: 'track_delivery',
          parameters: { notificationId: 'sentNotificationId' },
          description: 'Track notification delivery'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'cancel_notifications',
          parameters: { notificationId: 'sentNotificationId' },
          description: 'Cancel sent notifications'
        }
      ]
    };
  }

  /**
   * Meeting Scheduling Template
   */
  private getMeetingSchedulingTemplate(): ActionTemplate {
    return {
      id: 'meeting_scheduling',
      name: 'Schedule Meeting',
      description: 'Automatically schedule meetings based on availability',
      module: 'chat',
      actionType: 'schedule_meeting',
      autonomyLevel: 45,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'participants',
          type: 'array',
          required: true,
          description: 'List of participant user IDs'
        },
        {
          name: 'duration',
          type: 'number',
          required: true,
          description: 'Duration in minutes'
        },
        {
          name: 'topic',
          type: 'string',
          required: true,
          description: 'Meeting topic'
        },
        {
          name: 'urgency',
          type: 'string',
          required: false,
          description: 'Urgency level',
          defaultValue: 'normal',
          validation: 'low|normal|high|urgent'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'check_availability',
          parameters: { participants: 'participants', duration: 'duration' },
          description: 'Check participant availability'
        },
        {
          order: 2,
          module: 'chat',
          operation: 'find_optimal_time',
          parameters: { 
            participants: 'participants',
            duration: 'duration',
            urgency: 'urgency'
          },
          description: 'Find optimal meeting time'
        },
        {
          order: 3,
          module: 'chat',
          operation: 'create_meeting',
          parameters: { 
            participants: 'participants',
            topic: 'topic',
            duration: 'duration',
            startTime: 'optimalTime'
          },
          description: 'Create the meeting'
        },
        {
          order: 4,
          module: 'chat',
          operation: 'send_invitations',
          parameters: { meetingId: 'createdMeetingId' },
          description: 'Send meeting invitations'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'cancel_meeting',
          parameters: { meetingId: 'createdMeetingId' },
          description: 'Cancel created meeting'
        }
      ]
    };
  }

  /**
   * File Sharing Template
   */
  private getFileSharingTemplate(): ActionTemplate {
    return {
      id: 'file_sharing',
      name: 'Share Files with Team',
      description: 'Automatically share files with team members based on project context',
      module: 'drive',
      actionType: 'share_files',
      autonomyLevel: 35,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'fileIds',
          type: 'array',
          required: true,
          description: 'Array of file IDs to share'
        },
        {
          name: 'recipients',
          type: 'array',
          required: true,
          description: 'Array of recipient user IDs'
        },
        {
          name: 'permission',
          type: 'string',
          required: false,
          description: 'Permission level',
          defaultValue: 'view',
          validation: 'view|edit|admin'
        },
        {
          name: 'expiresAt',
          type: 'string',
          required: false,
          description: 'Expiration date for sharing'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'validate_files',
          parameters: { fileIds: 'fileIds' },
          description: 'Validate file access permissions'
        },
        {
          order: 2,
          module: 'drive',
          operation: 'create_shares',
          parameters: { 
            fileIds: 'fileIds',
            recipients: 'recipients',
            permission: 'permission',
            expiresAt: 'expiresAt'
          },
          description: 'Create file shares'
        },
        {
          order: 3,
          module: 'drive',
          operation: 'notify_recipients',
          parameters: { shareIds: 'createdShareIds' },
          description: 'Notify recipients of shared files'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'revoke_shares',
          parameters: { shareIds: 'createdShareIds' },
          description: 'Revoke file shares'
        }
      ]
    };
  }

  /**
   * Folder Structure Template
   */
  private getFolderStructureTemplate(): ActionTemplate {
    return {
      id: 'folder_structure',
      name: 'Create Standard Folder Structure',
      description: 'Create a standardized folder structure for projects',
      module: 'drive',
      actionType: 'create_folder_structure',
      autonomyLevel: 65,
      riskLevel: 'low',
      approvalRequired: false,
      parameters: [
        {
          name: 'projectName',
          type: 'string',
          required: true,
          description: 'Name of the project'
        },
        {
          name: 'structureType',
          type: 'string',
          required: true,
          description: 'Type of folder structure',
          validation: 'business|personal|creative|research'
        },
        {
          name: 'includeSubfolders',
          type: 'boolean',
          required: false,
          description: 'Include standard subfolders',
          defaultValue: true
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'create_root_folder',
          parameters: { name: 'projectName' },
          description: 'Create root project folder'
        },
        {
          order: 2,
          module: 'drive',
          operation: 'create_standard_subfolders',
          parameters: { 
            parentId: 'rootFolderId',
            structureType: 'structureType',
            includeSubfolders: 'includeSubfolders'
          },
          description: 'Create standard subfolders'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'drive',
          operation: 'delete_folder_tree',
          parameters: { folderId: 'rootFolderId' },
          description: 'Delete entire folder structure'
        }
      ]
    };
  }

  /**
   * Follow-Up Template
   */
  private getFollowUpTemplate(): ActionTemplate {
    return {
      id: 'follow_up',
      name: 'Schedule Follow-Up',
      description: 'Automatically schedule follow-up actions based on conversation context',
      module: 'chat',
      actionType: 'schedule_followup',
      autonomyLevel: 50,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'conversationId',
          type: 'string',
          required: true,
          description: 'ID of the conversation'
        },
        {
          name: 'followUpType',
          type: 'string',
          required: true,
          description: 'Type of follow-up',
          validation: 'reminder|task|meeting|checkin'
        },
        {
          name: 'delayDays',
          type: 'number',
          required: false,
          description: 'Days to delay the follow-up',
          defaultValue: 7
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'analyze_conversation',
          parameters: { conversationId: 'conversationId' },
          description: 'Analyze conversation context'
        },
        {
          order: 2,
          module: 'chat',
          operation: 'create_followup',
          parameters: { 
            type: 'followUpType',
            delayDays: 'delayDays',
            context: 'conversationContext'
          },
          description: 'Create follow-up action'
        },
        {
          order: 3,
          module: 'chat',
          operation: 'schedule_reminder',
          parameters: { followUpId: 'createdFollowUpId' },
          description: 'Schedule reminder'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'chat',
          operation: 'cancel_followup',
          parameters: { followUpId: 'createdFollowUpId' },
          description: 'Cancel follow-up action'
        }
      ]
    };
  }

  /**
   * Event Scheduling Template
   */
  private getEventSchedulingTemplate(): ActionTemplate {
    return {
      id: 'event_scheduling',
      name: 'Schedule Household Event',
      description: 'Schedule household events and notify all members',
      module: 'household',
      actionType: 'schedule_event',
      autonomyLevel: 40,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'eventName',
          type: 'string',
          required: true,
          description: 'Name of the event'
        },
        {
          name: 'eventDate',
          type: 'string',
          required: true,
          description: 'Date of the event'
        },
        {
          name: 'duration',
          type: 'number',
          required: false,
          description: 'Duration in minutes',
          defaultValue: 60
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Event description'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'check_household_availability',
          parameters: { eventDate: 'eventDate', duration: 'duration' },
          description: 'Check household member availability'
        },
        {
          order: 2,
          module: 'household',
          operation: 'create_event',
          parameters: { 
            name: 'eventName',
            date: 'eventDate',
            duration: 'duration',
            description: 'description'
          },
          description: 'Create household event'
        },
        {
          order: 3,
          module: 'household',
          operation: 'notify_members',
          parameters: { eventId: 'createdEventId' },
          description: 'Notify household members'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'delete_event',
          parameters: { eventId: 'createdEventId' },
          description: 'Delete created event'
        }
      ]
    };
  }

  /**
   * Budget Update Template
   */
  private getBudgetUpdateTemplate(): ActionTemplate {
    return {
      id: 'budget_update',
      name: 'Update Household Budget',
      description: 'Automatically update household budget based on transactions',
      module: 'household',
      actionType: 'update_budget',
      autonomyLevel: 25,
      riskLevel: 'high',
      approvalRequired: true,
      parameters: [
        {
          name: 'category',
          type: 'string',
          required: true,
          description: 'Budget category to update'
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
          description: 'Amount to add/subtract'
        },
        {
          name: 'transactionType',
          type: 'string',
          required: true,
          description: 'Type of transaction',
          validation: 'income|expense|transfer'
        },
        {
          name: 'description',
          type: 'string',
          required: false,
          description: 'Transaction description'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'validate_budget_change',
          parameters: { 
            category: 'category',
            amount: 'amount',
            type: 'transactionType'
          },
          description: 'Validate budget change'
        },
        {
          order: 2,
          module: 'household',
          operation: 'update_budget_category',
          parameters: { 
            category: 'category',
            amount: 'amount',
            type: 'transactionType'
          },
          description: 'Update budget category'
        },
        {
          order: 3,
          module: 'household',
          operation: 'log_transaction',
          parameters: { 
            category: 'category',
            amount: 'amount',
            type: 'transactionType',
            description: 'description'
          },
          description: 'Log transaction'
        },
        {
          order: 4,
          module: 'household',
          operation: 'notify_budget_change',
          parameters: { 
            category: 'category',
            change: 'amount'
          },
          description: 'Notify household of budget change'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'household',
          operation: 'revert_budget_change',
          parameters: { 
            category: 'category',
            amount: 'amount',
            type: 'transactionType'
          },
          description: 'Revert budget change'
        }
      ]
    };
  }

  /**
   * Meeting Preparation Template
   */
  private getMeetingPreparationTemplate(): ActionTemplate {
    return {
      id: 'meeting_preparation',
      name: 'Prepare for Business Meeting',
      description: 'Automatically prepare materials and agenda for business meetings',
      module: 'business',
      actionType: 'prepare_meeting',
      autonomyLevel: 35,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'meetingId',
          type: 'string',
          required: true,
          description: 'ID of the meeting to prepare for'
        },
        {
          name: 'preparationType',
          type: 'string',
          required: true,
          description: 'Type of preparation needed',
          validation: 'agenda|materials|presentation|summary'
        },
        {
          name: 'includeFiles',
          type: 'boolean',
          required: false,
          description: 'Include relevant files',
          defaultValue: true
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'analyze_meeting_context',
          parameters: { meetingId: 'meetingId' },
          description: 'Analyze meeting context and requirements'
        },
        {
          order: 2,
          module: 'business',
          operation: 'gather_relevant_files',
          parameters: { 
            meetingId: 'meetingId',
            includeFiles: 'includeFiles'
          },
          description: 'Gather relevant files and materials'
        },
        {
          order: 3,
          module: 'business',
          operation: 'create_agenda',
          parameters: { 
            meetingId: 'meetingId',
            preparationType: 'preparationType'
          },
          description: 'Create meeting agenda'
        },
        {
          order: 4,
          module: 'business',
          operation: 'share_materials',
          parameters: { meetingId: 'meetingId' },
          description: 'Share materials with participants'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'remove_preparation',
          parameters: { meetingId: 'meetingId' },
          description: 'Remove prepared materials'
        }
      ]
    };
  }

  /**
   * Report Generation Template
   */
  private getReportGenerationTemplate(): ActionTemplate {
    return {
      id: 'report_generation',
      name: 'Generate Business Report',
      description: 'Automatically generate business reports based on data analysis',
      module: 'business',
      actionType: 'generate_report',
      autonomyLevel: 30,
      riskLevel: 'high',
      approvalRequired: true,
      parameters: [
        {
          name: 'reportType',
          type: 'string',
          required: true,
          description: 'Type of report to generate',
          validation: 'progress|financial|performance|summary'
        },
        {
          name: 'dateRange',
          type: 'object',
          required: true,
          description: 'Date range for the report'
        },
        {
          name: 'recipients',
          type: 'array',
          required: false,
          description: 'List of recipients for the report'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'collect_report_data',
          parameters: { 
            reportType: 'reportType',
            dateRange: 'dateRange'
          },
          description: 'Collect data for report'
        },
        {
          order: 2,
          module: 'business',
          operation: 'analyze_data',
          parameters: { 
            reportType: 'reportType',
            data: 'collectedData'
          },
          description: 'Analyze collected data'
        },
        {
          order: 3,
          module: 'business',
          operation: 'generate_report',
          parameters: { 
            reportType: 'reportType',
            analysis: 'dataAnalysis'
          },
          description: 'Generate the report'
        },
        {
          order: 4,
          module: 'business',
          operation: 'distribute_report',
          parameters: { 
            reportId: 'generatedReportId',
            recipients: 'recipients'
          },
          description: 'Distribute report to recipients'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'business',
          operation: 'delete_report',
          parameters: { reportId: 'generatedReportId' },
          description: 'Delete generated report'
        }
      ]
    };
  }

  /**
   * Data Sync Template
   */
  private getDataSyncTemplate(): ActionTemplate {
    return {
      id: 'data_sync',
      name: 'Sync Data Across Modules',
      description: 'Synchronize data across different modules for consistency',
      module: 'cross_module',
      actionType: 'sync_data',
      autonomyLevel: 80,
      riskLevel: 'low',
      approvalRequired: false,
      parameters: [
        {
          name: 'sourceModule',
          type: 'string',
          required: true,
          description: 'Source module for sync',
          validation: 'drive|chat|household|business'
        },
        {
          name: 'targetModule',
          type: 'string',
          required: true,
          description: 'Target module for sync',
          validation: 'drive|chat|household|business'
        },
        {
          name: 'dataType',
          type: 'string',
          required: true,
          description: 'Type of data to sync',
          validation: 'contacts|schedules|tasks|files'
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'extract_source_data',
          parameters: { 
            sourceModule: 'sourceModule',
            dataType: 'dataType'
          },
          description: 'Extract data from source module'
        },
        {
          order: 2,
          module: 'cross_module',
          operation: 'transform_data',
          parameters: { 
            sourceData: 'extractedData',
            targetModule: 'targetModule'
          },
          description: 'Transform data for target module'
        },
        {
          order: 3,
          module: 'cross_module',
          operation: 'import_target_data',
          parameters: { 
            targetModule: 'targetModule',
            transformedData: 'transformedData'
          },
          description: 'Import data to target module'
        },
        {
          order: 4,
          module: 'cross_module',
          operation: 'verify_sync',
          parameters: { 
            sourceModule: 'sourceModule',
            targetModule: 'targetModule'
          },
          description: 'Verify sync completion'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'revert_sync',
          parameters: { 
            targetModule: 'targetModule',
            syncId: 'syncId'
          },
          description: 'Revert sync changes'
        }
      ]
    };
  }

  /**
   * Priority Alignment Template
   */
  private getPriorityAlignmentTemplate(): ActionTemplate {
    return {
      id: 'priority_alignment',
      name: 'Align Priorities Across Modules',
      description: 'Automatically align priorities across different modules based on user goals',
      module: 'cross_module',
      actionType: 'align_priorities',
      autonomyLevel: 45,
      riskLevel: 'medium',
      approvalRequired: true,
      parameters: [
        {
          name: 'goalType',
          type: 'string',
          required: true,
          description: 'Type of goal to align',
          validation: 'work|personal|family|health'
        },
        {
          name: 'timeframe',
          type: 'string',
          required: true,
          description: 'Timeframe for alignment',
          validation: 'daily|weekly|monthly|quarterly'
        },
        {
          name: 'modules',
          type: 'array',
          required: false,
          description: 'Specific modules to align',
          defaultValue: ['drive', 'chat', 'household', 'business']
        }
      ],
      executionSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'analyze_current_priorities',
          parameters: { 
            modules: 'modules',
            goalType: 'goalType'
          },
          description: 'Analyze current priorities across modules'
        },
        {
          order: 2,
          module: 'cross_module',
          operation: 'identify_conflicts',
          parameters: { 
            priorities: 'currentPriorities',
            goalType: 'goalType'
          },
          description: 'Identify priority conflicts'
        },
        {
          order: 3,
          module: 'cross_module',
          operation: 'propose_alignment',
          parameters: { 
            conflicts: 'identifiedConflicts',
            timeframe: 'timeframe'
          },
          description: 'Propose priority alignment'
        },
        {
          order: 4,
          module: 'cross_module',
          operation: 'apply_alignment',
          parameters: { 
            alignment: 'proposedAlignment',
            modules: 'modules'
          },
          description: 'Apply priority alignment'
        }
      ],
      rollbackSteps: [
        {
          order: 1,
          module: 'cross_module',
          operation: 'revert_priorities',
          parameters: { 
            modules: 'modules',
            originalPriorities: 'originalPriorities'
          },
          description: 'Revert to original priorities'
        }
      ]
    };
  }

  /**
   * Validate template parameters
   */
  private validateParameters(template: ActionTemplate, parameters: any): void {
    for (const param of template.parameters) {
      if (param.required && !(param.name in parameters)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      if (param.validation && parameters[param.name]) {
        const validValues = param.validation.split('|');
        if (!validValues.includes(parameters[param.name])) {
          throw new Error(`Invalid value for parameter '${param.name}'. Valid values: ${validValues.join(', ')}`);
        }
      }
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionStep, parameters: any, userId: string): Promise<any> {
    // This would integrate with the actual module APIs
    // For now, return a mock result
    return {
      stepId: `${step.module}_${step.operation}_${Date.now()}`,
      success: true,
      result: `Executed ${step.operation} in ${step.module}`,
      timestamp: new Date()
    };
  }
}

export default ActionTemplates; 