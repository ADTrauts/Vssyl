import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { getRecentVLinksForAIContext } from '../services/vlinkService';
import { handleVLinkServiceError } from '../services/vlinkService';

export async function getVLinkAIContext(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const limit = typeof req.query.limit === 'string' ? Number(req.query.limit) : 10;
    const vlinks = await getRecentVLinksForAIContext(userId, Math.min(limit, 20));
    res.json({ success: true, vlinks, moduleId: 'vlink' });
  } catch (error: unknown) {
    const handled = handleVLinkServiceError(error);
    res.status(handled.status).json(handled.body);
  }
}
