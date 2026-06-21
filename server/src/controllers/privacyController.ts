import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  PrivacyServiceError,
  getOrCreatePrivacySettings,
  updatePrivacySettings,
  listUserConsents,
  grantConsent as grantUserConsent,
  revokeConsent as revokeUserConsent,
  requestDataDeletion as createDataDeletionRequest,
  listDeletionRequests,
  exportUserData as buildUserDataExport,
} from '../services/account/privacyService';

function getUserId(req: Request): string | null {
  const user = (req as AuthenticatedRequest).user;
  return user?.id ?? null;
}

function handlePrivacyError(res: Response, error: unknown): void {
  if (error instanceof PrivacyServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }
  res.status(500).json({ success: false, error: 'Internal server error' });
}

export const getUserPrivacySettings = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const settings = await getOrCreatePrivacySettings(userId);
    res.json({ success: true, data: settings });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const updateUserPrivacySettings = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const settings = await updatePrivacySettings(userId, req.body as Record<string, unknown>);
    res.json({ success: true, data: settings });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const getUserConsents = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const consents = await listUserConsents(userId);
    res.json({ success: true, data: consents });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const grantConsent = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const { consentType, version } = req.body as { consentType?: string; version?: string };
  if (!consentType || !version) {
    return res.status(400).json({ success: false, error: 'Consent type and version are required' });
  }
  try {
    const consent = await grantUserConsent(userId, consentType, version, req.ip, req.get('User-Agent'));
    res.json({ success: true, data: consent });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const revokeConsent = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const { consentType, version } = req.body as { consentType?: string; version?: string };
  if (!consentType || !version) {
    return res.status(400).json({ success: false, error: 'Consent type and version are required' });
  }
  try {
    const consent = await revokeUserConsent(userId, consentType, version);
    res.json({ success: true, data: consent });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const requestDataDeletion = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  const { reason } = req.body as { reason?: string };
  try {
    const deletionRequest = await createDataDeletionRequest(userId, reason);
    res.json({ success: true, data: deletionRequest });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const getUserDeletionRequests = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const requests = await listDeletionRequests(userId);
    res.json({ success: true, data: requests });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};

export const exportUserData = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const data = await buildUserDataExport(userId);
    res.json({ success: true, data });
  } catch (error) {
    handlePrivacyError(res, error);
  }
};
