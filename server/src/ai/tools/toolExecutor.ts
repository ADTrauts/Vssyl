/**
 * Executes AI tool calls (list_drive_files, share_file, create_todo) with user context.
 * Returns a string result for the model; throws on auth/validation errors.
 */

import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { grantFileSharePermission, DriveShareError } from '../../services/driveFileShareService';
import { listAccessibleDriveFiles } from '../../services/driveVisibilityService';
import type { AIToolName } from './toolDefinitions';

export interface ToolExecutionContext {
  userId: string;
  dashboardId?: string | null;
}

interface ToolResult {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}

export async function executeTool(
  name: AIToolName,
  args: Record<string, unknown>,
  context: ToolExecutionContext
): Promise<string> {
  const { userId, dashboardId } = context;
  try {
    let result: ToolResult;
    switch (name) {
      case 'list_drive_files': {
        const folderId = (args.folderId as string) ?? null;
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 50);
        const files = await listAccessibleDriveFiles({
          userId,
          dashboardId: dashboardId ?? null,
          folderId,
          limit,
          applyPolicyEngine: true,
        });
        result = {
          success: true,
          message: `Found ${files.length} file(s).`,
          data: { files: files.map((f) => ({ id: f.id, name: f.name, type: f.type, size: f.size })) },
        };
        break;
      }
      case 'share_file': {
        const fileId = args.fileId as string;
        const targetUserEmail = (args.targetUserEmail as string)?.trim();
        const canWrite = Boolean(args.canWrite);
        if (!fileId || !targetUserEmail) {
          result = { success: false, message: 'fileId and targetUserEmail are required.' };
          break;
        }
        const targetUser = await prisma.user.findUnique({ where: { email: targetUserEmail } });
        if (!targetUser) {
          result = { success: false, message: `No user found with email "${targetUserEmail}".` };
          break;
        }
        try {
          const { file } = await grantFileSharePermission({
            ownerUserId: userId,
            fileId,
            targetUserId: targetUser.id,
            canRead: true,
            canWrite,
          });
          result = {
            success: true,
            message: `Shared "${file.name}" with ${targetUserEmail} (${canWrite ? 'read and write' : 'read only'}).`,
          };
        } catch (shareError: unknown) {
          if (shareError instanceof DriveShareError) {
            result = {
              success: false,
              message:
                shareError.statusCode === 403
                  ? 'File not found or you do not have permission to share it.'
                  : shareError.message,
            };
          } else {
            throw shareError;
          }
        }
        break;
      }
      case 'summarize_notebook_page': {
        const pageId = (args.pageId as string)?.trim();
        if (!pageId) {
          result = { success: false, message: 'pageId is required.' };
          break;
        }
        const { summarizePage } = await import('../../services/notebook/notebookAIActionService.js');
        const summary = await summarizePage(pageId, userId);
        result = {
          success: true,
          message: summary.summary?.slice(0, 500) || 'Summary generated.',
          data: { pageId, summary },
        };
        break;
      }
      case 'extract_notebook_action_items': {
        const pageId = (args.pageId as string)?.trim();
        if (!pageId) {
          result = { success: false, message: 'pageId is required.' };
          break;
        }
        const selectedText = (args.selectedText as string) || undefined;
        const { extractActionItems } = await import('../../services/notebook/notebookAIActionService.js');
        const extracted = await extractActionItems({ pageId, userId, selectedText });
        result = {
          success: true,
          message: `Proposed ${extracted.proposals.length} action item(s). Confirm in Notebook to create tasks.`,
          data: { pageId, proposals: extracted.proposals, warnings: extracted.warnings },
        };
        break;
      }
      case 'search_places': {
        const query = (args.query as string)?.trim();
        if (!query || query.length < 2) {
          result = { success: false, message: 'query must be at least 2 characters.' };
          break;
        }
        const { searchPlaces } = await import('../../services/place/placeAIActionService.js');
        const outcome = await searchPlaces(userId, query);
        if (!outcome.success) {
          result = { success: false, message: outcome.error };
          break;
        }
        const data = outcome.data as { results?: unknown[] };
        result = {
          success: true,
          message: `Found ${data.results?.length ?? 0} place listing(s).`,
          data: { query, results: data.results ?? [] },
        };
        break;
      }
      case 'get_place_recommendations': {
        const limit = args.limit != null ? Number(args.limit) : undefined;
        const { recommendPlaces } = await import('../../services/place/placeAIActionService.js');
        const outcome = await recommendPlaces(userId, { limit });
        if (!outcome.success) {
          result = { success: false, message: outcome.error };
          break;
        }
        const data = outcome.data as { recommendations?: unknown[] };
        result = {
          success: true,
          message: `Returned ${data.recommendations?.length ?? 0} recommendation(s).`,
          data: { recommendations: data.recommendations ?? [] },
        };
        break;
      }
      case 'get_place_purchase_help': {
        const query = (args.query as string)?.trim();
        if (!query) {
          result = { success: false, message: 'query is required.' };
          break;
        }
        const businessId = (args.businessId as string) || null;
        const { purchaseHelp } = await import('../../services/place/placeAIActionService.js');
        const outcome = await purchaseHelp(userId, { query, businessId });
        if (!outcome.success) {
          result = { success: false, message: outcome.error };
          break;
        }
        result = {
          success: true,
          message: 'Purchase guidance returned (read-only — no transaction created).',
          data: outcome.data as Record<string, unknown>,
        };
        break;
      }
      case 'create_todo': {
        const title = (args.title as string)?.trim();
        if (!title) {
          result = { success: false, message: 'title is required.' };
          break;
        }
        const { aiCreateTask } = await import('../../services/todoAIActionService.js');
        const priorityArg = (args.priority as string) || 'MEDIUM';
        const dueDateStr = args.dueDate as string | undefined;
        const outcome = await aiCreateTask({
          userId,
          title,
          dashboardId: dashboardId ?? null,
          priority: priorityArg,
          dueDate: dueDateStr ?? null,
        });
        if (!outcome.success) {
          result = { success: false, message: outcome.error };
          break;
        }
        const task = outcome.data as { id: string; title: string; priority: string };
        result = {
          success: true,
          message: `Created task "${title}" (priority: ${task.priority}).`,
          data: { taskId: task.id, title: task.title },
        };
        break;
      }
      default:
        result = { success: false, message: `Unknown tool: ${name}` };
    }
    return JSON.stringify(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await logger.warn('AI tool execution failed', {
      operation: 'ai_tool_execute',
      tool: name,
      userId,
      error: { message },
    });
    return JSON.stringify({ success: false, message });
  }
}
