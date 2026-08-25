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
      name: 'summarize_notebook_page',
      description:
        'Summarize a Notebook page (read-only). Returns summary, key decisions, and follow-ups grounded on page content and links.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Notebook page id (note id)' },
        },
        required: ['pageId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'extract_notebook_action_items',
      description:
        'Propose action items from a Notebook page (read-only). Does not create tasks — user must confirm via Notebook UI.',
      parameters: {
        type: 'object',
        properties: {
          pageId: { type: 'string', description: 'Notebook page id (note id)' },
          selectedText: {
            type: 'string',
            description: 'Optional excerpt to focus extraction',
          },
        },
        required: ['pageId'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_places',
      description:
        'Search published Place business listings the user can access (read-only). Returns matching businesses on Vssyl Place.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search text (min 2 characters)' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_place_recommendations',
      description:
        'Get personalized Place recommendations based on interests and followed businesses (read-only).',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Max recommendations (default 10, max 20)' },
        },
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_place_purchase_help',
      description:
        'Suggest external interaction links for ordering, delivery, or browsing (read-only). Does not create transactions or click links.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'What the user wants to do (order, delivery, menu, etc.)' },
          businessId: { type: 'string', description: 'Optional specific business id on Place' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'google_place_details',
      description:
        'Get Google Place Details for a known Google place id from prior external discovery (read-only). Use places/ChIJ... or ChIJ... form.',
      parameters: {
        type: 'object',
        properties: {
          placeId: { type: 'string', description: 'Google place resource id (places/PLACE_ID or PLACE_ID)' },
        },
        required: ['placeId'],
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

export type AIToolName =
  | 'list_drive_files'
  | 'share_file'
  | 'summarize_notebook_page'
  | 'extract_notebook_action_items'
  | 'search_places'
  | 'get_place_recommendations'
  | 'get_place_purchase_help'
  | 'google_place_details'
  | 'create_todo';
