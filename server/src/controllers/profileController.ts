import { Request, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import {
  ProfileServiceError,
  getProfileForUser,
  updateProfileName,
} from '../services/account/profileService';

export async function getProfile(req: Request, res: Response): Promise<void> {
  const auth = req as AuthenticatedRequest;
  if (!auth.user?.id) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }
  res.json({ user: auth.user });
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const auth = req as AuthenticatedRequest;
  const userId = auth.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }
  const rawName = (req.body as { name?: unknown })?.name;
  if (typeof rawName !== 'string') {
    res.status(400).json({ message: 'Name is required' });
    return;
  }
  try {
    const updated = await updateProfileName(userId, rawName);
    res.json({ user: updated });
  } catch (error: unknown) {
    if (error instanceof ProfileServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

export async function getProfileById(req: Request, res: Response): Promise<void> {
  const auth = req as AuthenticatedRequest;
  const userId = auth.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'User not authenticated' });
    return;
  }
  try {
    const user = await getProfileForUser(userId);
    res.json({ user });
  } catch (error: unknown) {
    if (error instanceof ProfileServiceError) {
      res.status(error.statusCode).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Failed to get profile' });
  }
}
