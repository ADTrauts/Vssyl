/**
 * Tool definitions for AI tool calling (OpenAI/Anthropic format).
 * Used when the model requests an action (e.g. share file, list files, create todo).
 */

export const AI_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'list_drive_files',
      description: 'List files in the user\'s Drive. Optionally filter by folder. Returns file names, ids, and types.',
      parameters: {
        type: 'object',
        properties: {
          folderId: { type: 'string', description: 'Optional folder ID to list files in. Omit for root.' },
          limit: { type: 'number', description: 'Max number of files to return (default 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'share_file',
      description: 'Share a Drive file with another user by giving them read access. Use the target user\'s email.',
      parameters: {
        type: 'object',
        properties: {
          fileId: { type: 'string', description: 'The Drive file ID to share' },
          targetUserEmail: { type: 'string', description: 'Email address of the user to share with' },
          canWrite: { type: 'boolean', description: 'Grant write access (default false)' },
        },
        required: ['fileId', 'targetUserEmail'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_todo',
      description: 'Create a new to-do task for the user.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the task' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Priority (default medium)' },
          dueDate: { type: 'string', description: 'Optional due date in ISO format (YYYY-MM-DD)' },
        },
        required: ['title'],
      },
    },
  },
];

export type AIToolName = 'list_drive_files' | 'share_file' | 'create_todo';
