import { Response } from 'express';
import { AuthenticatedRequest } from '../../middleware/workforceCommsPermissions';
import { mapWorkforceCommsServiceError } from '../../services/workforceControllerUtils';
import {
  listCommunicationsForBusiness,
  getCommunicationById,
  createCommunicationDraft,
  updateCommunicationDraft,
  scheduleCommunication,
  publishCommunication,
  cancelCommunication,
  setCommunicationAudience,
  trashCommunicationForBusiness,
  getCommunicationMetrics,
  listFrontPageCommunicationsForBusiness,
} from '../../services/workforceCommunicationService';
import {
  getSummaryReport,
  getCommunicationsReport,
  getCampaignsReport,
  getAcknowledgementsReport,
} from '../../services/workforceReportingService';
import { listBridgeTemplatesForBusiness } from '../../services/workforceBridgeService';
import { estimateAudienceCount } from '../../services/workforceAudienceService';
import {
  listCampaignsForBusiness,
  getCampaignById,
  createCampaign,
  updateCampaign,
  completeCampaign,
} from '../../services/workforceCampaignService';
import {
  addAttachmentToCommunication,
  removeAttachmentFromCommunication,
} from '../../services/workforceAttachmentService';
import {
  importFrontPageAnnouncements,
  previewFrontPageMigration,
} from '../../services/workforceMigrationService';
import { parseAudienceSpecRecord } from '../../services/workforceServiceShared';
import { requireAuthorizedBusinessId, parseOptionalAudienceSpec } from './workforceCommsShared';

export async function listCommunications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const { status, campaignId, limit } = req.query;
    const communications = await listCommunicationsForBusiness({
      businessId,
      actorUserId: user.id,
      status: typeof status === 'string' ? status : undefined,
      campaignId: typeof campaignId === 'string' ? campaignId : undefined,
      limit: typeof limit === 'string' ? Number.parseInt(limit, 10) : undefined,
    });

    res.json({ communications });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'list_communications');
  }
}

export async function createCommunication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const {
      title,
      body,
      summary,
      communicationType,
      priority,
      requiresAck,
      requiresRead,
      showOnFrontPage,
      showInHubFeed,
      campaignId,
      scheduledAt,
      expiresAt,
      audienceType,
      audienceSpec,
      legacyFrontPageId,
    } = req.body;

    if (!title || !body || !communicationType) {
      res.status(400).json({ error: 'Missing required fields: title, body, communicationType' });
      return;
    }

    const communication = await createCommunicationDraft({
      businessId,
      actorUserId: user.id,
      title,
      body,
      summary,
      communicationType,
      priority,
      requiresAck,
      requiresRead,
      showOnFrontPage,
      showInHubFeed,
      campaignId,
      scheduledAt,
      expiresAt,
      audienceType,
      audienceSpec: parseOptionalAudienceSpec(req.body) ?? audienceSpec,
      legacyFrontPageId,
    });

    res.status(201).json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'create_communication');
  }
}

export async function getCommunication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communication = await getCommunicationById({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_communication');
  }
}

export async function updateCommunication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communication = await updateCommunicationDraft({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      ...req.body,
      audienceSpec: parseOptionalAudienceSpec(req.body) ?? req.body.audienceSpec,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'update_communication');
  }
}

export async function trashCommunication(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const result = await trashCommunicationForBusiness({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json(result);
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'trash_communication');
  }
}

export async function publishCommunicationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communication = await publishCommunication({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'publish_communication');
  }
}

export async function scheduleCommunicationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const { scheduledAt } = req.body;
    if (!scheduledAt) {
      res.status(400).json({ error: 'scheduledAt is required' });
      return;
    }

    const communication = await scheduleCommunication({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      scheduledAt,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'schedule_communication');
  }
}

export async function cancelCommunicationHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const communication = await cancelCommunication({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'cancel_communication');
  }
}

export async function setAudience(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const { audienceType } = req.body;
    if (!audienceType || typeof audienceType !== 'string') {
      res.status(400).json({ error: 'audienceType is required' });
      return;
    }

    const communication = await setCommunicationAudience({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      audienceType,
      audienceSpec: parseOptionalAudienceSpec(req.body) ?? req.body.audienceSpec,
    });

    res.json({ communication });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'set_audience');
  }
}

export async function estimateAudience(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    let audienceType = typeof req.body?.audienceType === 'string' ? req.body.audienceType : undefined;
    let audienceSpec =
      parseOptionalAudienceSpec(req.body) ??
      (req.body?.audienceSpec && typeof req.body.audienceSpec === 'object'
        ? (req.body.audienceSpec as Record<string, unknown>)
        : undefined);

    if (!audienceType) {
      const communication = await getCommunicationById({
        businessId,
        actorUserId: user.id,
        communicationId: req.params.id,
      });
      if (!communication.audience) {
        res.status(404).json({ error: 'Audience not configured for this communication' });
        return;
      }
      audienceType = communication.audience.audienceType;
      audienceSpec = parseAudienceSpecRecord(communication.audience.spec);
    }

    const estimatedCount = await estimateAudienceCount({
      businessId,
      audienceType,
      spec: audienceSpec ?? {},
    });

    res.json({ estimatedCount, audienceType });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'estimate_audience');
  }
}

export async function getCommunicationReport(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const metrics = await getCommunicationMetrics({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
    });

    res.json({ metrics });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_communication_report');
  }
}

export async function addAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const attachment = await addAttachmentToCommunication({
      businessId,
      actorUserId: user.id,
      communicationId: req.params.id,
      ...req.body,
    });

    res.status(201).json({ attachment });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'add_attachment');
  }
}

export async function removeAttachment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const result = await removeAttachmentFromCommunication({
      businessId,
      actorUserId: user.id,
      attachmentId: req.params.attachmentId,
    });

    res.json(result);
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'remove_attachment');
  }
}

export async function listCampaigns(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    const campaigns = await listCampaignsForBusiness({
      businessId,
      actorUserId: user.id,
      limit,
    });

    res.json({ campaigns });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'list_campaigns');
  }
}

export async function createCampaignHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const { name, description, startsAt, endsAt } = req.body;
    if (!name) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const campaign = await createCampaign({
      businessId,
      actorUserId: user.id,
      name,
      description,
      startsAt,
      endsAt,
    });

    res.status(201).json({ campaign });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'create_campaign');
  }
}

export async function getCampaign(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const campaign = await getCampaignById({
      businessId,
      actorUserId: user.id,
      campaignId: req.params.id,
    });

    res.json({ campaign });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_campaign');
  }
}

export async function updateCampaignHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const campaign = await updateCampaign({
      businessId,
      actorUserId: user.id,
      campaignId: req.params.id,
      ...req.body,
    });

    res.json({ campaign });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'update_campaign');
  }
}

export async function completeCampaignHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const campaign = await completeCampaign({
      businessId,
      actorUserId: user.id,
      campaignId: req.params.id,
    });

    res.json({ campaign });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'complete_campaign');
  }
}

export async function migrateFrontPage(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const dryRun = req.query.dryRun === 'true' || req.body?.dryRun === true;
    const result = dryRun
      ? await previewFrontPageMigration({ businessId, actorUserId: user.id })
      : await importFrontPageAnnouncements({ businessId, actorUserId: user.id });

    res.json({ result, dryRun });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'migrate_front_page');
  }
}

export async function getSummaryReportHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;

    const report = await getSummaryReport({
      businessId,
      actorUserId: user.id,
      startDate,
      endDate,
    });

    res.json({ report });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_summary_report');
  }
}

export async function getCommunicationsReportHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;

    const report = await getCommunicationsReport({
      businessId,
      actorUserId: user.id,
      startDate,
      endDate,
      limit,
    });

    res.json({ report });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_communications_report');
  }
}

export async function getCampaignsReportHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;

    const report = await getCampaignsReport({
      businessId,
      actorUserId: user.id,
      limit,
    });

    res.json({ report });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_campaigns_report');
  }
}

export async function getAcknowledgementsReportHandler(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;

    const report = await getAcknowledgementsReport({
      businessId,
      actorUserId: user.id,
      startDate,
      endDate,
      limit,
    });

    res.json({ report });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'get_acknowledgements_report');
  }
}

export async function listBridgeTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!businessId) return;

    const result = await listBridgeTemplatesForBusiness(businessId);
    res.json(result);
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'list_bridge_templates');
  }
}

export async function listFrontPageCommunications(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const user = req.user;
    const businessId = requireAuthorizedBusinessId(req, res);
    if (!user || !businessId) return;

    const limit =
      typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : undefined;
    const communications = await listFrontPageCommunicationsForBusiness({
      businessId,
      actorUserId: user.id,
      limit,
    });

    res.json({ communications });
  } catch (error: unknown) {
    mapWorkforceCommsServiceError(error, res, 'list_front_page_communications');
  }
}
