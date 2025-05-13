import { z } from 'zod';

export const conversationValidation = {
  createConversation: z.object({
    body: z.object({
      name: z.string().min(1, 'Name is required'),
      type: z.enum(['direct', 'group']).optional(),
      participantIds: z.array(z.string()).optional(),
    }),
  }),

  createMessage: z.object({
    body: z.object({
      content: z.string().min(1, 'Content is required'),
      type: z.string().optional(),
      metadata: z.record(z.any()).optional(),
    }),
  }),
}; 