import { Request, Response } from 'express';
import { z } from 'zod';
import {
  createUserMemoryFact,
  deleteUserMemoryFact,
  listUserMemoryFacts,
} from '../services/userMemoryFactService';

function resolveUserId(user: unknown): string | undefined {
  if (typeof user !== 'object' || user === null) return undefined;
  const u = user as { id?: string; sub?: string };
  return u.id || u.sub;
}

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  predicate: z.string().min(1).max(4000),
  scope: z.enum(['personal', 'business', 'household']).optional(),
  businessId: z.string().optional(),
  dashboardId: z.string().optional(),
  sourceConversationId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export const getUserMemoryFacts = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
  const facts = await listUserMemoryFacts(userId, scope);
  res.json({ success: true, data: { facts } });
};

export const postUserMemoryFact = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const body = createSchema.parse(req.body);
    const fact = await createUserMemoryFact({
      userId,
      subject: body.subject,
      predicate: body.predicate,
      scope: body.scope,
      businessId: body.businessId,
      dashboardId: body.dashboardId,
      sourceConversationId: body.sourceConversationId,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
    });
    res.status(201).json({ success: true, data: fact });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ success: false, error: 'Failed to create memory fact' });
  }
};

export const deleteUserMemoryFactHandler = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const { id } = req.params;
  const result = await deleteUserMemoryFact(userId, id);
  if (result.count === 0) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }
  res.json({ success: true });
};
