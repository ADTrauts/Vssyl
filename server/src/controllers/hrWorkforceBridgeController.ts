import { Request, Response } from 'express';
import { getUserFromRequest } from '../middleware/auth';
import {
  requestHrAnnouncementWorkforceBroadcast,
  requestHrPolicyWorkforceBroadcast,
} from '../services/hrWorkforceBridgeIntegrationService.js';
import { logger } from '../lib/logger';

function requireBusinessId(req: Request): string | null {
  const fromQuery = req.query.businessId;
  const fromBody = req.body?.businessId;
  const value = (typeof fromBody === 'string' && fromBody) || (typeof fromQuery === 'string' && fromQuery);
  return value || null;
}

export async function postHrPolicyWorkforceBroadcast(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserFromRequest(req)?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const businessId = requireBusinessId(req);
    if (!businessId) {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }
    const { policyId, policyName, policySummary, requiresAck } = req.body ?? {};
    if (!policyId || !policyName) {
      res.status(400).json({ success: false, message: 'policyId and policyName are required' });
      return;
    }
    const result = await requestHrPolicyWorkforceBroadcast({
      businessId,
      actorUserId: userId,
      policyId: String(policyId),
      policyName: String(policyName),
      policySummary: policySummary != null ? String(policySummary) : undefined,
      requiresAck: typeof requiresAck === 'boolean' ? requiresAck : undefined,
    });
    res.json({ success: true, bridge: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('HR policy workforce broadcast failed', {
      operation: 'hr_workforce_bridge_policy',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function postHrAnnouncementWorkforceBroadcast(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserFromRequest(req)?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    const businessId = requireBusinessId(req);
    if (!businessId) {
      res.status(400).json({ success: false, message: 'businessId is required' });
      return;
    }
    const { announcementId, title, body, summary, audienceType, audienceSpec, requiresAck } =
      req.body ?? {};
    if (!announcementId || !title || !body) {
      res.status(400).json({
        success: false,
        message: 'announcementId, title, and body are required',
      });
      return;
    }
    const result = await requestHrAnnouncementWorkforceBroadcast({
      businessId,
      actorUserId: userId,
      announcementId: String(announcementId),
      title: String(title),
      body: String(body),
      summary: summary != null ? String(summary) : undefined,
      audienceType: audienceType != null ? String(audienceType) : undefined,
      audienceSpec:
        audienceSpec && typeof audienceSpec === 'object'
          ? (audienceSpec as Record<string, unknown>)
          : undefined,
      requiresAck: typeof requiresAck === 'boolean' ? requiresAck : undefined,
    });
    res.json({ success: true, bridge: result });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('HR announcement workforce broadcast failed', {
      operation: 'hr_workforce_bridge_announcement',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ success: false, message: err.message });
  }
}
