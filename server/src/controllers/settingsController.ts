import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  SettingsServiceError,
  resolveSettings,
  updateSettings,
  resolvePreference,
  updatePreference,
  deletePreference,
  resolveSettingsSections,
} from '../services/account/settingsService';

function getUserId(req: Request): string | null {
  return (req as AuthenticatedRequest).user?.id ?? null;
}

function handleError(res: Response, error: unknown): void {
  if (error instanceof SettingsServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const result = await resolveSettings(userId);
    res.json({ success: true, settings: result.settings, registry: result.registry });
  } catch (error) {
    handleError(res, error);
  }
}

export async function putSettings(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const body = req.body as { key?: string; value?: string; settings?: Record<string, string> };
    const result = await updateSettings(userId, body);
    res.json({ success: true, settings: result.settings, registry: result.registry });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getSettingsSections(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  try {
    const result = await resolveSettingsSections(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
}

export async function getPreference(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const { key } = req.params;
  try {
    const result = await resolvePreference(userId, key);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
}

export async function putPreference(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const { key } = req.params;
  const { value } = req.body as { value?: unknown };
  if (typeof value !== 'string') {
    res.status(400).json({ success: false, error: 'Value must be a string' });
    return;
  }
  try {
    const result = await updatePreference(userId, key, value);
    res.json({ success: true, ...result });
  } catch (error) {
    handleError(res, error);
  }
}

export async function deletePreferenceHandler(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }
  const { key } = req.params;
  try {
    await deletePreference(userId, key);
    res.json({ success: true });
  } catch (error) {
    handleError(res, error);
  }
}
