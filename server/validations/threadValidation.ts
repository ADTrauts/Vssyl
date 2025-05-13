import { z } from 'zod';

export const threadValidation = {
  createMessage: z.object({
    body: z.object({
      content: z.string().optional(),
      attachments: z
        .array(
          z.object({
            name: z.string(),
            url: z.string().url(),
            type: z.string(),
            size: z.number(),
          })
        )
        .optional(),
    }).refine(
      data => data.content || (data.attachments && data.attachments.length > 0),
      {
        message: 'Message must have either content or attachments',
      }
    ),
  }),

  updateMessage: z.object({
    body: z.object({
      messageId: z.string(),
      content: z.string().min(1, 'Message content is required'),
    }),
  }),
}; 