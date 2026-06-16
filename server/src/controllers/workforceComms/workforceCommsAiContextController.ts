import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/workforceCommsPermissions';
import { mapWorkforceCommsServiceError } from '../../services/workforceControllerUtils';
import {
  getWorkforceCommsOverviewContext,
  getCommunicationReachSummary,
} from '../../services/workforceAiContextService';
import { requireAuthorizedBusinessId } from './workforceCommsShared';

export async function getOverviewForAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const overview = await getWorkforceCommsOverviewContext({
      businessId,
      actorUserId: user.id,
    });

    res.json({ success: true, overview });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'workforce_comms_ai_overview');
  }
}

export async function getReachForAI(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communicationId =
      typeof req.query.communicationId === 'string' ? req.query.communicationId : undefined;
    if (!communicationId) {
      res.status(400).json({ success: false, message: 'communicationId is required' });
      return;
    }

    const reach = await getCommunicationReachSummary({
      businessId,
      actorUserId: user.id,
      communicationId,
    });

    if (!reach) {
      res.status(404).json({ success: false, message: 'Communication not found' });
      return;
    }

    res.json({ success: true, reach });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'workforce_comms_ai_reach');
  }
}
