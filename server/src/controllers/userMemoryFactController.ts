import { Request, Response } from 'express';
import { z } from 'zod';
import {
  MEMORY_FACT_CATEGORIES,
  MEMORY_FACT_SOURCE_TYPES,
} from '../ai/memory/memoryFactTypes';
import { logger } from '../lib/logger';
import {
  createUserMemoryFact,
  deleteUserMemoryFact,
  listUserMemoryFacts,
  MemoryFactValidationError,
  updateUserMemoryFact,
} from '../services/userMemoryFactService';

function resolveUserId(user: unknown): string | undefined {
  if (typeof user !== 'object' || user === null) return undefined;
  const u = user as { id?: string; sub?: string };
  return u.id || u.sub;
}

const createSchema = z.object({
  subject: z.string().min(1).max(200),
  predicate: z.string().min(1).max(4000),
  scope: z.enum(['personal', 'business']).optional(),
  businessId: z.string().optional(),
  dashboardId: z.string().optional(),
  sourceConversationId: z.string().optional(),
  sourceType: z.enum(MEMORY_FACT_SOURCE_TYPES).optional(),
  category: z.enum(MEMORY_FACT_CATEGORIES).optional(),
  confidence: z.number().min(0).max(1).optional(),
  expiresAt: z.string().datetime().optional(),
});

const updateSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  predicate: z.string().min(1).max(4000).optional(),
  category: z.enum(MEMORY_FACT_CATEGORIES).optional(),
  confidence: z.number().min(0).max(1).optional(),
  expiresAt: z.union([z.string().datetime(), z.null()]).optional(),
});

function parseListFilter(req: Request): {
  scope?: string;
  businessId?: string;
  category?: string;
  sourceType?: string;
} {
  const scope = typeof req.query.scope === 'string' ? req.query.scope : undefined;
  const businessId = typeof req.query.businessId === 'string' ? req.query.businessId : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const sourceType = typeof req.query.sourceType === 'string' ? req.query.sourceType : undefined;
  return { scope, businessId, category, sourceType };
}

function resolveListFilter(req: Request): {
  scope?: string;
  businessId?: string;
  category?: (typeof MEMORY_FACT_CATEGORIES)[number];
  sourceType?: (typeof MEMORY_FACT_SOURCE_TYPES)[number];
} {
  const raw = parseListFilter(req);
  const filter: ReturnType<typeof resolveListFilter> = {
    scope: raw.scope,
    businessId: raw.businessId,
  };
  if (raw.category) {
    if (!(MEMORY_FACT_CATEGORIES as readonly string[]).includes(raw.category)) {
      throw new MemoryFactValidationError(`Invalid category: ${raw.category}`);
    }
    filter.category = raw.category as (typeof MEMORY_FACT_CATEGORIES)[number];
  }
  if (raw.sourceType) {
    if (!(MEMORY_FACT_SOURCE_TYPES as readonly string[]).includes(raw.sourceType)) {
      throw new MemoryFactValidationError(`Invalid sourceType: ${raw.sourceType}`);
    }
    filter.sourceType = raw.sourceType as (typeof MEMORY_FACT_SOURCE_TYPES)[number];
  }
  return filter;
}

export const getUserMemoryFacts = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const filter = resolveListFilter(req);
    const facts = await listUserMemoryFacts(userId, filter);
    res.json({ success: true, data: { facts } });
  } catch (error: unknown) {
    if (error instanceof MemoryFactValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to list memory facts', {
      operation: 'getUserMemoryFacts',
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to list memory facts' });
  }
};

export const postUserMemoryFact = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const body = createSchema.parse(req.body);

    if (body.sourceType && body.sourceType !== 'explicit_user') {
      return res.status(400).json({
        success: false,
        error: 'Only explicit_user sourceType may be set via API create',
      });
    }

    const fact = await createUserMemoryFact({
      userId,
      subject: body.subject,
      predicate: body.predicate,
      scope: body.scope,
      businessId: body.businessId,
      dashboardId: body.dashboardId,
      sourceConversationId: body.sourceConversationId,
      sourceType: body.sourceType ?? 'explicit_user',
      category: body.category,
      confidence: body.confidence,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      isExplicit: true,
    });
    res.status(201).json({ success: true, data: fact });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    if (error instanceof MemoryFactValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to create memory fact', {
      operation: 'postUserMemoryFact',
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to create memory fact' });
  }
};

export const patchUserMemoryFact = async (req: Request, res: Response) => {
  const userId = resolveUserId(req.user);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const { id } = req.params;
  try {
    const body = updateSchema.parse(req.body);
    const fact = await updateUserMemoryFact(userId, id, {
      subject: body.subject,
      predicate: body.predicate,
      category: body.category,
      confidence: body.confidence,
      expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt ? new Date(body.expiresAt) : null,
    });
    if (!fact) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: fact });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    if (error instanceof MemoryFactValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Failed to update memory fact', {
      operation: 'patchUserMemoryFact',
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ success: false, error: 'Failed to update memory fact' });
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
