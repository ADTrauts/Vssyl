import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';
import { getUserPreference, setUserPreferenceWithPolicy } from '../services/userPreferenceService';
import {
  resolvePreference,
  updatePreference,
  SettingsServiceError,
} from '../services/account/settingsService';
import { resolveRegistryMetadata } from '../services/account/preferenceRegistry';

export const searchUsers = async (req: Request, res: Response) => {
  const { query } = req.query;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Query must be at least 2 characters.' });
  }
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      take: 10,
    });
    res.json({ success: true, data: users });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    void logger.error('User search error', {
      operation: 'user_search',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, error: 'Failed to search users.' });
  }
};

export const getUserPreferenceByKey = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { key } = req.params;
  try {
    const meta = resolveRegistryMetadata(key);
    if (meta.known) {
      const result = await resolvePreference(req.user.id, key);
      return res.json({ success: true, key: result.key, value: result.value });
    }
    const value = await getUserPreference(req.user.id, key);
    res.json({ success: true, key, value });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get user preference';
    const status =
      error instanceof SettingsServiceError
        ? error.statusCode
        : message.includes('Invalid')
          ? 400
          : 500;
    res.status(status).json({ success: false, error: message });
  }
};

export const setUserPreferenceByKey = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { key } = req.params;
  const { value } = req.body as { value?: unknown };
  if (typeof value !== 'string') {
    return res.status(400).json({ success: false, error: 'Value must be a string' });
  }
  try {
    const meta = resolveRegistryMetadata(key);
    if (meta.known) {
      await updatePreference(req.user.id, key, value);
      return res.json({ success: true });
    }
    await setUserPreferenceWithPolicy(req.user.id, key, value);
    res.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to set user preference';
    const status =
      error instanceof SettingsServiceError
        ? error.statusCode
        : message.includes('Invalid') || message.includes('Policy')
          ? 400
          : 500;
    res.status(status).json({ success: false, error: message });
  }
};
