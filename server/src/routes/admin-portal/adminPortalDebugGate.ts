import type { Request, Response, NextFunction } from 'express';

export const ADMIN_PORTAL_DEBUG_ENV_VAR = 'ADMIN_PORTAL_DEBUG_ENABLED';

export function isAdminPortalDebugEnabled(): boolean {
  return process.env[ADMIN_PORTAL_DEBUG_ENV_VAR] === 'true';
}

export function requireAdminPortalDebugEnabled(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!isAdminPortalDebugEnabled()) {
    res.status(403).json({ error: 'Admin portal debug tools are disabled in this environment' });
    return;
  }
  next();
}
