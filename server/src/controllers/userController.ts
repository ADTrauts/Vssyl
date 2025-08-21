import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getUserPreference, setUserPreference } from '../services/userPreferenceService';

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
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ success: false, error: 'Failed to search users.' });
  }
};

export const getUserPreferenceByKey = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { key } = req.params;
  try {
    const value = await getUserPreference(req.user.id, key);
    res.json({ success: true, key, value });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to get user preference' });
  }
};

export const setUserPreferenceByKey = async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== 'string') return res.status(400).json({ success: false, error: 'Value must be a string' });
  try {
    await setUserPreference(req.user.id, key, value);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to set user preference' });
  }
}; 