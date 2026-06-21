import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import { assertEntitlementReadPolicy } from '../auth/entitlementPolicyDual';
import { PolicyDeniedError } from '../auth/policyEngine';
import {
  EntitlementServiceError,
  resolveBusinessEntitlements,
  resolveEffectiveEntitlements,
  resolveTier,
  resolveUserEntitlements,
} from '../services/account/entitlementService';

function parseBusinessIdQuery(req: Request): string | undefined {
  const raw = req.query.businessId;
  if (raw === undefined) return undefined;
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new EntitlementServiceError('businessId query parameter must be a non-empty string', 400);
  }
  return raw;
}

function handleError(res: Response, error: unknown): Response {
  if (error instanceof EntitlementServiceError) {
    return res.status(error.statusCode).json({ error: error.message });
  }
  if (error instanceof PolicyDeniedError) {
    const reason =
      typeof error.decision.reason === 'string' ? error.decision.reason : 'Forbidden';
    return res.status(403).json({ message: 'Forbidden', reason });
  }
  const err = error instanceof Error ? error : new Error(String(error));
  return res.status(500).json({ error: 'Entitlement request failed', details: err.message });
}

export async function getEntitlements(req: Request, res: Response): Promise<Response> {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const businessId = parseBusinessIdQuery(req);
    await assertEntitlementReadPolicy({ userId: user.id, businessId });

    const entitlements = businessId
      ? await resolveBusinessEntitlements(user.id, businessId)
      : await resolveUserEntitlements(user.id);

    return res.json({ entitlements });
  } catch (error: unknown) {
    return handleError(res, error);
  }
}

export async function getTier(req: Request, res: Response): Promise<Response> {
  try {
    const user = getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const businessId = parseBusinessIdQuery(req);
    await assertEntitlementReadPolicy({ userId: user.id, businessId });

    const resolution = await resolveTier({ userId: user.id, businessId });

    return res.json({
      tier: resolution.tier,
      source: resolution.source,
      subscriptionId: resolution.subscriptionId,
      businessId: resolution.businessId,
    });
  } catch (error: unknown) {
    return handleError(res, error);
  }
}

/** Compatibility alias — same payload as getEntitlements. */
export async function getEffectiveEntitlements(req: Request, res: Response): Promise<Response> {
  return getEntitlements(req, res);
}
