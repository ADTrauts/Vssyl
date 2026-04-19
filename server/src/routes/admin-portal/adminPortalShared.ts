import type { Request, Response, NextFunction } from 'express';

/** Allowed transitions for PATCH /moderation/reports/:reportId */
export const ALLOWED_CONTENT_REPORT_STATUSES = new Set([
  'pending',
  'reviewed',
  'approved',
  'rejected',
  'resolved',
  'dismissed',
  'escalated',
]);

export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user;
  if (!user || user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
