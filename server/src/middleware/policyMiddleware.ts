import { Request, Response, NextFunction } from 'express';
import { authorize } from '../auth/policyEngine';
import type { PolicyResourceType, PolicyScope } from '../auth/policyTypes';
import { AuthenticatedRequest } from './auth';

export interface RequirePolicyOptions {
  resolveResourceId?: (req: Request) => string | undefined;
  resolveScope?: (req: Request) => PolicyScope | undefined;
}

/**
 * Express helper: run after authenticateJWT. Denies are logged by the policy engine (`policy_deny`).
 */
export function requirePolicy(action: string, resourceType: PolicyResourceType, options?: RequirePolicyOptions) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const user = authReq.user;
    const userId = user?.id;
    if (!userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }
    const resourceId = options?.resolveResourceId?.(req);
    const scope = options?.resolveScope?.(req);
    const decision = await authorize({
      userId,
      user,
      action,
      resourceType,
      resourceId,
      scope,
    });
    if (!decision.allow) {
      res.status(403).json({
        message: 'Forbidden',
        reason: decision.reason,
      });
      return;
    }
    next();
  };
}
