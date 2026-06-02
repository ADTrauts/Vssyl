/**
 * To-Do Module Controller
 * Handles all task-related operations
 */

import type { Express } from 'express';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../lib/logger';
import type { TaskPriority, TaskStatus } from '@prisma/client';
import { TodoAIPrioritizationService } from '../services/todoAIPrioritizationService';
import { TodoSmartSchedulingService } from '../services/todoSmartSchedulingService';
import { TodoChatIntegrationService } from '../services/todoChatIntegrationService';
import { TodoServiceError } from '../services/todo/todoErrors';
import { TodoTrashError } from '../services/todoTrashService';
import * as todoTrashService from '../services/todoTrashService';
import * as todoTaskService from '../services/todoTaskService';
import * as todoVisibilityService from '../services/todoVisibilityService';
import type { TaskListFilter } from '../services/todoVisibilityService';
import * as todoRecurrenceOrchestration from '../services/todoRecurrenceOrchestrationService';
import { ensureTaskCalendarEvent } from '../services/todoCalendarBridgeService';
import { mapTaskDetailAttachmentUrls } from '../services/todoPresentationService';
import * as todoCommentService from '../services/todoCommentService';
import * as todoSubtaskService from '../services/todoSubtaskService';
import * as todoAttachmentService from '../services/todoAttachmentService';
import * as todoProjectService from '../services/todoProjectService';
import * as todoDependencyService from '../services/todoDependencyService';
import * as todoTimeLogService from '../services/todoTimeLogService';
import * as todoIntegrationLinkService from '../services/todoIntegrationLinkService';

function respondTodoServiceError(res: Response, error: unknown): boolean {
  if (error instanceof TodoServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  if (error instanceof TodoTrashError) {
    const status =
      error.code === 'forbidden' ? 403 : error.code === 'not_found' ? 404 : 400;
    res.status(status).json({ error: error.message });
    return true;
  }
  return false;
}

/* <todo-core-handlers> */

/**
 * GET /api/todo/tasks
 * List tasks with filtering and sorting
 */
export async function getTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      dashboardId,
      businessId,
      householdId,
      status,
      priority,
      dueDate,
      assignedToId,
      projectId,
      q,
      search,
      filter,
      dueSoonDays,
    } = req.query;

    const listFilter =
      typeof filter === 'string' &&
      ['assigned', 'overdue', 'dueSoon', 'completed'].includes(filter)
        ? (filter as TaskListFilter)
        : undefined;

    const searchTerm =
      (typeof q === 'string' && q.trim() !== '' ? q : undefined) ||
      (typeof search === 'string' && search.trim() !== '' ? search : undefined);

    const tasks = await todoVisibilityService.listAccessibleTasks({
      userId,
      dashboardId: typeof dashboardId === 'string' ? dashboardId : undefined,
      businessId: typeof businessId === 'string' ? businessId : undefined,
      householdId: typeof householdId === 'string' ? householdId : undefined,
      status: typeof status === 'string' ? (status as TaskStatus) : undefined,
      priority: typeof priority === 'string' ? (priority as TaskPriority) : undefined,
      dueDate: typeof dueDate === 'string' ? dueDate : undefined,
      assignedToId: typeof assignedToId === 'string' ? assignedToId : undefined,
      projectId: typeof projectId === 'string' ? projectId : undefined,
      search: searchTerm,
      listFilter,
      dueSoonDays:
        typeof dueSoonDays === 'string' && !Number.isNaN(Number(dueSoonDays))
          ? Number(dueSoonDays)
          : undefined,
    });

    res.json(tasks);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    const dashboardIdParam = req.query.dashboardId;
    await logger.error('Failed to get tasks', {
      operation: 'todo_get_tasks',
      error: { message: err.message, stack: err.stack },
      dashboardId: typeof dashboardIdParam === 'string' ? dashboardIdParam : undefined,
    });
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

/**
 * POST /api/todo/tasks
 * Create a new task
 */
export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      title,
      description,
      status,
      priority,
      dashboardId,
      businessId,
      householdId,
      dueDate,
      startDate,
      category,
      tags,
      timeEstimate,
      assignedToId,
      parentTaskId,
      projectId,
      recurrenceRule,
      recurrenceEndAt,
    } = req.body;

    if (!title || !dashboardId) {
      res.status(400).json({ error: 'Title and dashboardId are required' });
      return;
    }

    const recurrenceValidation = await todoRecurrenceOrchestration.validateRecurrenceForCreate({
      recurrenceRule,
      dueDate,
    });
    if (recurrenceValidation) {
      res.status(recurrenceValidation.status).json({ error: recurrenceValidation.message });
      return;
    }

    const task = await todoTaskService.createTask({
      userId,
      title,
      description,
      status,
      priority,
      dashboardId,
      businessId,
      householdId,
      dueDate,
      startDate,
      category,
      tags,
      timeEstimate,
      assignedToId,
      parentTaskId,
      projectId,
      recurrenceRule,
      recurrenceEndAt,
    });

    if (task.dueDate) {
      await ensureTaskCalendarEvent(task.id, userId);
    }
    await todoRecurrenceOrchestration.afterTaskCreatedWithRecurrence(task);

    res.status(201).json(task);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to create task', {
      operation: 'todo_create_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create task' });
  }
}

/**
 * GET /api/todo/tasks/:id
 * Get a single task by ID
 */
export async function getTaskById(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const task = await todoVisibilityService.getTaskByIdIfAccessible(userId, id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(mapTaskDetailAttachmentUrls(task));
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to get task', {
      operation: 'todo_get_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to fetch task' });
  }
}

/**
 * PUT /api/todo/tasks/:id
 * Update a task
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      category,
      tags,
      timeEstimate,
      assignedToId,
      snoozedUntil,
      recurrenceRule,
      recurrenceEndAt,
      // Exclude fields that shouldn't be updated
      // dashboardId, businessId, householdId, createdById, etc.
    } = req.body;

    const recurrenceValidation = await todoRecurrenceOrchestration.validateRecurrenceForUpdate({
      userId,
      taskId: id,
      recurrenceRule,
      dueDate,
    });
    if (recurrenceValidation) {
      res.status(recurrenceValidation.status).json({ error: recurrenceValidation.message });
      return;
    }

    const updateResult = await todoTaskService.updateTask({
      userId,
      taskId: id,
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      category,
      tags,
      timeEstimate,
      assignedToId,
      snoozedUntil,
      recurrenceRule,
      recurrenceEndAt,
    });

    await todoRecurrenceOrchestration.afterTaskUpdatedWithRecurrence(userId, id, updateResult, {
      recurrenceRule,
      recurrenceEndAt,
    });
    await todoRecurrenceOrchestration.syncTaskCalendarAfterUpdate(userId, updateResult);

    res.json(updateResult.task);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to update task', {
      operation: 'todo_update_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update task' });
  }
}

/**
 * DELETE /api/todo/tasks/:id
 * Soft delete a task (move to trash)
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const result = await todoTrashService.softTrashTask(userId, id);
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to delete task', {
      operation: 'todo_delete_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete task' });
  }
}

/**
 * POST /api/todo/tasks/:id/complete
 * Mark a task as complete
 */
export async function completeTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    const task = await todoTaskService.completeTask(userId, id);
    res.json(task);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to complete task', {
      operation: 'todo_complete_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to complete task' });
  }
}

/**
 * POST /api/todo/tasks/:id/reopen
 * Reopen a completed task
 */
export async function reopenTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { status } = req.body;

    const task = await todoTaskService.reopenTask(userId, id, status);
    res.json(task);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) {
      return;
    }
    const err = error as Error;
    await logger.error('Failed to reopen task', {
      operation: 'todo_reopen_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to reopen task' });
  }
}

/* </todo-core-handlers> */

/**
 * POST /api/todo/tasks/:id/create-event
 * Create a calendar event from a task
 */
export async function createEventFromTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await todoIntegrationLinkService.createEventFromTask({
      userId,
      taskId: req.params.id,
      calendarId: req.body.calendarId,
    });

    res.json({ success: true, ...result });
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    logger.error('Failed to create event from task', {
      operation: 'create_event_from_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create calendar event' });
  }
}

/**
 * POST /api/todo/tasks/:id/link-event
 * Link a task to an existing calendar event
 */
export async function linkTaskToEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await todoIntegrationLinkService.linkTaskToEvent({
      userId,
      taskId: req.params.id,
      eventId: req.body.eventId,
    });

    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    logger.error('Failed to link task to event', {
      operation: 'link_task_to_event',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to link task to event' });
  }
}

/**
 * DELETE /api/todo/tasks/:id/unlink-event/:eventId
 * Unlink a task from a calendar event
 */
export async function unlinkTaskFromEvent(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await todoIntegrationLinkService.unlinkTaskFromEvent({
      userId,
      taskId: req.params.id,
      eventId: req.params.eventId,
    });

    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    logger.error('Failed to unlink task from event', {
      operation: 'unlink_task_from_event',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to unlink task from event' });
  }
}

/**
 * POST /api/todo/tasks/:id/link-file
 * Link a Drive file to a task
 */
export async function linkTaskToFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const fileId = req.body.fileId;
    if (!fileId || typeof fileId !== 'string') {
      res.status(400).json({ error: 'fileId is required' });
      return;
    }

    const result = await todoIntegrationLinkService.linkTaskToFile({
      userId,
      taskId: req.params.id,
      fileId,
    });

    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to link file to task', {
      operation: 'todo_link_file',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to link file to task' });
  }
}

/**
 * DELETE /api/todo/tasks/:id/unlink-file/:fileId
 * Unlink a file from a task
 */
export async function unlinkTaskFromFile(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await todoIntegrationLinkService.unlinkTaskFromFile({
      userId,
      taskId: req.params.id,
      fileId: req.params.fileId,
    });

    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to unlink file from task', {
      operation: 'todo_unlink_file',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to unlink file from task' });
  }
}

/**
 * GET /api/todo/tasks/:id/linked-files
 * Get all Drive files linked to a task
 */
export async function getTaskLinkedFiles(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const result = await todoIntegrationLinkService.getTaskLinkedFiles({
      userId,
      taskId: req.params.id,
    });

    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to get linked files', {
      operation: 'todo_get_linked_files',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get linked files' });
  }
}

/**
 * GET /api/todo/tasks/:id/linked-events
 * Get all calendar events linked to a task
 */
export async function getTaskLinkedEvents(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const events = await todoIntegrationLinkService.getTaskLinkedEvents({
      userId,
      taskId: req.params.id,
    });

    res.json(events);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    logger.error('Failed to get linked events', {
      operation: 'get_task_linked_events',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get linked events' });
  }
}


export async function createTaskComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const comment = await todoCommentService.createComment({
      userId,
      taskId: req.params.id,
      content: req.body.content,
    });
    res.status(201).json(comment);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to create task comment', {
      operation: 'todo_create_comment',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create comment' });
  }
}

export async function updateTaskComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const updated = await todoCommentService.updateComment({
      userId,
      taskId: req.params.id,
      commentId: req.params.commentId,
      content: req.body.content,
    });
    res.json(updated);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to update task comment', {
      operation: 'todo_update_comment',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update comment' });
  }
}

export async function deleteTaskComment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoCommentService.deleteComment({
      userId,
      taskId: req.params.id,
      commentId: req.params.commentId,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to delete task comment', {
      operation: 'todo_delete_comment',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete comment' });
  }
}

export async function createSubtask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const subtask = await todoSubtaskService.createSubtask({
      userId,
      parentTaskId: req.params.id,
      title: req.body.title,
      description: req.body.description,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
    });
    res.status(201).json(subtask);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to create subtask', {
      operation: 'todo_create_subtask',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create subtask' });
  }
}

export async function updateSubtask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const updated = await todoSubtaskService.updateSubtask({
      userId,
      parentTaskId: req.params.id,
      subtaskId: req.params.subtaskId,
      ...req.body,
    });
    res.json(updated);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to update subtask', {
      operation: 'todo_update_subtask',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update subtask' });
  }
}

export async function deleteSubtask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoSubtaskService.deleteSubtask({
      userId,
      parentTaskId: req.params.id,
      subtaskId: req.params.subtaskId,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to delete subtask', {
      operation: 'todo_delete_subtask',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete subtask' });
  }
}

export async function completeSubtask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const updated = await todoSubtaskService.completeSubtask({
      userId,
      parentTaskId: req.params.id,
      subtaskId: req.params.subtaskId,
    });
    res.json(updated);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to complete subtask', {
      operation: 'todo_complete_subtask',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to complete subtask' });
  }
}

export async function uploadTaskAttachment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const attachment = await todoAttachmentService.uploadAttachment({
      userId,
      taskId: req.params.id,
      file: req.file as Express.Multer.File,
    });
    res.status(201).json(attachment);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to upload task attachment', {
      operation: 'todo_upload_attachment',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to upload attachment' });
  }
}

export async function deleteTaskAttachment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoAttachmentService.deleteAttachment({
      userId,
      taskId: req.params.id,
      attachmentId: req.params.attachmentId,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to delete task attachment', {
      operation: 'todo_delete_attachment',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete attachment' });
  }
}

export async function serveTaskAttachment(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const served = await todoAttachmentService.serveAttachment({
      userId,
      taskId: req.params.id,
      attachmentId: req.params.attachmentId,
    });
    res.setHeader('Content-Type', served.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${served.filename}"`);
    res.setHeader('Content-Length', served.buffer.length.toString());
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.send(served.buffer);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to serve task attachment', {
      operation: 'todo_serve_attachment',
      attachmentId: req.params.attachmentId,
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to serve attachment' });
  }
}

export async function addTaskDependency(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const dependency = await todoDependencyService.addDependency({
      userId,
      taskId: req.params.id,
      dependsOnTaskId: req.body.dependsOnTaskId,
    });
    res.json(dependency);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to add task dependency', {
      operation: 'todo_add_dependency',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to add dependency' });
  }
}

export async function removeTaskDependency(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoDependencyService.removeDependency({
      userId,
      taskId: req.params.id,
      dependsOnTaskId: req.params.dependsOnTaskId,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to remove task dependency', {
      operation: 'todo_remove_dependency',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to remove dependency' });
  }
}

export async function getTaskDependencies(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoDependencyService.listDependencies({
      userId,
      taskId: req.params.id,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to get task dependencies', {
      operation: 'todo_get_dependencies',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to fetch dependencies' });
  }
}

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const { dashboardId, businessId } = req.query;
    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }
    const projects = await todoProjectService.listProjects({
      userId,
      dashboardId,
      businessId: typeof businessId === 'string' ? businessId : undefined,
    });
    res.json(projects);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to get projects', {
      operation: 'todo_get_projects',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
}

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const project = await todoProjectService.createProject({
      userId,
      ...req.body,
    });
    res.json(project);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to create project', {
      operation: 'todo_create_project',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create project' });
  }
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const updated = await todoProjectService.updateProject({
      userId,
      projectId: req.params.id,
      ...req.body,
    });
    res.json(updated);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to update project', {
      operation: 'todo_update_project',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update project' });
  }
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoProjectService.deleteProject({
      userId,
      projectId: req.params.id,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to delete project', {
      operation: 'todo_delete_project',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete project' });
  }
}

export async function generateRecurringInstances(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoRecurrenceOrchestration.generateRecurringInstancesForTask({
      userId,
      taskId: req.params.id,
      maxInstances: req.body.maxInstances,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to generate recurring instances', {
      operation: 'todo_generate_instances',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to generate instances' });
  }
}

export async function getRecurrenceDescription(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoRecurrenceOrchestration.getRecurrenceDescriptionForTask({
      userId,
      taskId: req.params.id,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to get recurrence description', {
      operation: 'todo_get_recurrence_description',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get recurrence description' });
  }
}

export async function startTimer(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.startTimer({ userId, taskId: req.params.id });
    res.json(result);
  } catch (error: unknown) {
    if (error instanceof TodoServiceError && error.status === 400 && 'activeTimerId' in error) {
      const timerErr = error as TodoServiceError & { activeTimerId: string; activeTaskId: string };
      res.status(400).json({
        error: timerErr.message,
        activeTimerId: timerErr.activeTimerId,
        activeTaskId: timerErr.activeTaskId,
      });
      return;
    }
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to start timer', {
      operation: 'todo_start_timer',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to start timer' });
  }
}

export async function stopTimer(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.stopTimer({
      userId,
      taskId: req.params.id,
      description: req.body.description,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to stop timer', {
      operation: 'todo_stop_timer',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to stop timer' });
  }
}

export async function getActiveTimer(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.getActiveTimer(userId);
    res.json(result);
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to get active timer', {
      operation: 'todo_get_active_timer',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get active timer' });
  }
}

export async function logTime(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.logTime({
      userId,
      taskId: req.params.id,
      startedAt: req.body.startedAt,
      duration: req.body.duration,
      description: req.body.description,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to log time', {
      operation: 'todo_log_time',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to log time' });
  }
}

export async function getTimeLogs(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.listTimeLogs({
      userId,
      taskId: req.params.id,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to get time logs', {
      operation: 'todo_get_time_logs',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get time logs' });
  }
}

export async function updateTimeLog(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.updateTimeLog({
      userId,
      taskId: req.params.id,
      logId: req.params.logId,
      startedAt: req.body.startedAt,
      duration: req.body.duration,
      description: req.body.description,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to update time log', {
      operation: 'todo_update_time_log',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to update time log' });
  }
}

export async function deleteTimeLog(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const result = await todoTimeLogService.deleteTimeLog({
      userId,
      taskId: req.params.id,
      logId: req.params.logId,
    });
    res.json(result);
  } catch (error: unknown) {
    if (respondTodoServiceError(res, error)) return;
    const err = error as Error;
    await logger.error('Failed to delete time log', {
      operation: 'todo_delete_time_log',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to delete time log' });
  }
}

// ============================================================================
// AI PRIORITIZATION ENDPOINTS
// ============================================================================

const prioritizationService = new TodoAIPrioritizationService(prisma);

// ============================================================================
// SMART SCHEDULING ENDPOINTS
// ============================================================================

const schedulingService = new TodoSmartSchedulingService(prisma);

// ============================================================================
// CHAT INTEGRATION ENDPOINTS
// ============================================================================

const chatIntegrationService = new TodoChatIntegrationService(prisma);

/**
 * GET /api/todo/ai/prioritize/suggestions
 * Returns priority suggestions for current tasks
 */
export async function getPrioritySuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const businessIdString = businessId && typeof businessId === 'string' ? businessId : undefined;

    const suggestions = await prioritizationService.generatePrioritySuggestions(
      userId,
      dashboardId,
      businessIdString
    );

    await logger.info('Priority suggestions generated', {
      operation: 'todo_ai_prioritize_suggestions',
      userId,
      dashboardId,
      businessId: businessIdString,
      suggestionCount: suggestions.length,
    });

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to generate priority suggestions', {
      operation: 'todo_ai_prioritize_suggestions',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to generate priority suggestions' });
  }
}

/**
 * POST /api/todo/ai/prioritize/analyze
 * Analyzes specific tasks and returns priority recommendations
 */
export async function analyzeTaskPriorities(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId, taskIds } = req.body;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const analysis = await prioritizationService.analyzeTaskPriorities(
      userId,
      Array.isArray(taskIds) ? taskIds : [],
      dashboardId,
      businessId && typeof businessId === 'string' ? businessId : null
    );

    await logger.info('Task priorities analyzed', {
      operation: 'todo_ai_prioritize_analyze',
      userId,
      dashboardId,
      businessId: businessId || null,
      taskCount: analysis.suggestions.length,
    });

    res.json({
      success: true,
      analysis,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to analyze task priorities', {
      operation: 'todo_ai_prioritize_analyze',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to analyze task priorities' });
  }
}

/**
 * POST /api/todo/ai/prioritize/execute
 * Executes priority changes (with autonomy check)
 */
export async function executePriorityChanges(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { suggestions } = req.body;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      res.status(400).json({ error: 'suggestions array is required' });
      return;
    }

    // Validate suggestions format
    for (const suggestion of suggestions) {
      if (!suggestion.taskId || !suggestion.newPriority) {
        res.status(400).json({ 
          error: 'Each suggestion must have taskId and newPriority' 
        });
        return;
      }
    }

    const { aiExecutePriorityChanges } = await import('../services/todoAIActionService.js');
    const outcome = await aiExecutePriorityChanges({ userId, suggestions });

    if (!outcome.success) {
      res.status(400).json({ error: outcome.error });
      return;
    }

    const data = outcome.data as { updated: number; failed: number; total: number };

    await logger.info('Priority changes executed', {
      operation: 'todo_ai_prioritize_execute',
      userId,
      total: data.total,
      successful: data.updated,
      failed: data.failed,
    });

    res.json({
      success: true,
      updated: data.updated,
      failed: data.failed,
      total: data.total,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to execute priority changes', {
      operation: 'todo_ai_prioritize_execute',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to execute priority changes' });
  }
}

/**
 * POST /api/todo/ai/prioritize/feedback
 * Records user feedback on suggestions
 */
export async function submitPriorityFeedback(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { suggestionId, accepted, actualPriority, taskId, category } = req.body;

    if (!suggestionId || typeof accepted !== 'boolean') {
      res.status(400).json({ 
        error: 'suggestionId and accepted (boolean) are required' 
      });
      return;
    }

    // Record feedback for learning
    await prioritizationService.learnFromUserCorrections(userId, [{
      suggestionId,
      accepted,
      actualPriority,
      taskId,
      category,
    }]);

    await logger.info('Priority feedback submitted', {
      operation: 'todo_ai_prioritize_feedback',
      userId,
      suggestionId,
      accepted,
    });

    res.json({
      success: true,
      message: 'Feedback recorded',
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to submit priority feedback', {
      operation: 'todo_ai_prioritize_feedback',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
}

/**
 * GET /api/todo/ai/schedule/suggestions
 * Returns scheduling suggestions for current tasks
 */
export async function getSchedulingSuggestions(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId } = req.query;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const businessIdString = businessId && typeof businessId === 'string' ? businessId : undefined;

    const suggestions = await schedulingService.generateSchedulingSuggestions(
      userId,
      dashboardId,
      businessIdString || null
    );

    await logger.info('Scheduling suggestions generated', {
      operation: 'todo_ai_schedule_suggestions',
      userId,
      dashboardId,
      businessId: businessIdString,
      suggestionCount: suggestions.length,
    });

    res.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to generate scheduling suggestions', {
      operation: 'todo_ai_schedule_suggestions',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to generate scheduling suggestions' });
  }
}

/**
 * POST /api/todo/ai/schedule/analyze
 * Analyzes specific tasks and returns scheduling recommendations
 */
export async function analyzeTaskScheduling(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { dashboardId, businessId, taskIds } = req.body;

    if (!dashboardId || typeof dashboardId !== 'string') {
      res.status(400).json({ error: 'dashboardId is required' });
      return;
    }

    const businessIdString = businessId && typeof businessId === 'string' ? businessId : undefined;

    const analysis = await schedulingService.analyzeTaskScheduling(
      userId,
      Array.isArray(taskIds) ? taskIds : [],
      dashboardId,
      businessIdString || null
    );

    await logger.info('Task scheduling analyzed', {
      operation: 'todo_ai_schedule_analyze',
      userId,
      dashboardId,
      businessId: businessIdString,
      taskCount: analysis.suggestions.length,
    });

    res.json({
      success: true,
      analysis,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to analyze task scheduling', {
      operation: 'todo_ai_schedule_analyze',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to analyze task scheduling' });
  }
}

/**
 * POST /api/todo/ai/schedule/execute
 * Executes scheduling changes (updates task due dates)
 */
export async function executeSchedulingChanges(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { suggestions } = req.body;

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      res.status(400).json({ error: 'suggestions array is required' });
      return;
    }

    // Validate suggestions format
    for (const suggestion of suggestions) {
      if (!suggestion.taskId || !suggestion.suggestedDueDate) {
        res.status(400).json({ 
          error: 'Each suggestion must have taskId and suggestedDueDate' 
        });
        return;
      }
    }

    const { aiExecuteSchedulingChanges } = await import('../services/todoAIActionService.js');
    const outcome = await aiExecuteSchedulingChanges({ userId, suggestions });

    if (!outcome.success) {
      res.status(400).json({ error: outcome.error });
      return;
    }

    const data = outcome.data as { updated: number; failed: number; total: number };

    await logger.info('Scheduling changes executed', {
      operation: 'todo_ai_schedule_execute',
      userId,
      total: data.total,
      successful: data.updated,
      failed: data.failed,
    });

    res.json({
      success: true,
      updated: data.updated,
      failed: data.failed,
      total: data.total,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to execute scheduling changes', {
      operation: 'todo_ai_schedule_execute',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to execute scheduling changes' });
  }
}

/**
 * POST /api/todo/chat/create-task
 * Create a task from a chat message
 */
export async function createTaskFromMessage(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const {
      messageId,
      conversationId,
      dashboardId,
      businessId,
      householdId,
      title,
      description,
      priority,
      dueDate,
      assignedToId,
    } = req.body;

    if (!messageId || !conversationId || !dashboardId) {
      res.status(400).json({ error: 'messageId, conversationId, and dashboardId are required' });
      return;
    }

    const result = await chatIntegrationService.createTaskFromMessage({
      messageId,
      conversationId,
      userId,
      dashboardId,
      businessId: businessId || null,
      householdId: householdId || null,
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assignedToId,
    });

    await logger.info('Task created from chat message', {
      operation: 'todo_chat_create_task',
      taskId: result.task.id,
      messageId,
      conversationId,
      userId,
    });

    res.status(201).json({
      success: true,
      task: result.task,
      messageLink: result.messageLink,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Not a conversation member') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    if (err.message === 'Task dashboard not found') {
      res.status(404).json({ error: 'Dashboard not found' });
      return;
    }
    if (err.message === 'Task dashboard context mismatch') {
      res.status(400).json({ error: 'Dashboard does not match business or household context' });
      return;
    }
    await logger.error('Failed to create task from message', {
      operation: 'todo_chat_create_task',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create task from message' });
  }
}

/**
 * POST /api/todo/chat/parse-message
 * Parse a chat message to extract task details
 */
export async function parseMessageForTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      res.status(400).json({ error: 'content is required' });
      return;
    }

    const parsed = chatIntegrationService.parseTaskDetails(content);

    res.json({
      success: true,
      parsed,
    });
  } catch (error: unknown) {
    const err = error as Error;
    await logger.error('Failed to parse message for task', {
      operation: 'todo_chat_parse_message',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to parse message' });
  }
}

/**
 * GET /api/todo/chat/conversation/:conversationId/tasks
 * Get tasks linked to a conversation
 */
export async function getTasksForConversation(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: 'conversationId is required' });
      return;
    }

    const tasks = await chatIntegrationService.getTasksForConversation(conversationId, userId);

    res.json({
      success: true,
      tasks,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Not a conversation member') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    await logger.error('Failed to get tasks for conversation', {
      operation: 'todo_chat_get_tasks',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to get tasks for conversation' });
  }
}

