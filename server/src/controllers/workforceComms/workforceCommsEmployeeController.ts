import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/workforceCommsPermissions';
import { mapWorkforceCommsServiceError } from '../../services/workforceControllerUtils';
import {
  listPublishedCommunicationsForUserFeed,
  getPublishedCommunicationForUser,
} from '../../services/workforceCommunicationService';
import { recordRead } from '../../services/workforceReadReceiptService';
import {
  acknowledgeCommunication,
  listPendingAcksForUser,
} from '../../services/workforceAcknowledgementService';
import { requireAuthorizedBusinessId } from './workforceCommsShared';

export async function getMyFeed(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    const communications = await listPublishedCommunicationsForUserFeed({
      businessId,
      actorUserId: user.id,
      limit,
    });

    res.json({ communications });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_my_feed');
  }
}

export async function getCommunicationForEmployee(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communication = await getPublishedCommunicationForUser({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_communication_for_employee');
  }
}

export async function recordReadHandler(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const receipt = await recordRead({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      source: typeof req.body?.source === 'string' ? req.body.source : undefined,
    });

    res.json({ receipt });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'record_read');
  }
}

export async function acknowledge(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const acknowledgement = await acknowledgeCommunication({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      ipAddress: req.ip ?? null,
      userAgent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
    });

    res.json({ acknowledgement });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'acknowledge');
  }
}

export async function listPendingAcks(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    const pending = await listPendingAcksForUser({
      businessId,
      actorUserId: user.id,
      limit,
    });

    res.json({ pending });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'list_pending_acks');
  }
}
