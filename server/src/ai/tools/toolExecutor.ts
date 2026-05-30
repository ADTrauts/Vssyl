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
      case 'create_todo': {
        const title = (args.title as string)?.trim();
        if (!title) {
          result = { success: false, message: 'title is required.' };
          break;
        }
        let effectiveDashboardId = dashboardId ?? null;
        if (!effectiveDashboardId) {
          const dash = await prisma.dashboard.findFirst({
            where: { userId, businessId: null, householdId: null },
            orderBy: { createdAt: 'asc' },
          });
          effectiveDashboardId = dash?.id ?? null;
        }
        if (!effectiveDashboardId) {
          result = { success: false, message: 'No dashboard found for this user. Create a dashboard first.' };
          break;
        }
        const priority = (args.priority as string)?.toUpperCase() === 'HIGH' ? 'HIGH' : (args.priority as string)?.toUpperCase() === 'LOW' ? 'LOW' : 'MEDIUM';
        const dueDateStr = args.dueDate as string | undefined;
        const task = await prisma.task.create({
          data: {
            title,
            status: 'TODO',
            priority,
            dashboardId: effectiveDashboardId,
            createdById: userId,
            dueDate: dueDateStr ? new Date(dueDateStr) : null,
          },
        });
        result = {
          success: true,
          message: `Created task "${title}" (priority: ${priority}).`,
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
