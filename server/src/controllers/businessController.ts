import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { evaluateBusinessMemberPolicyDual } from '../auth/businessMemberPolicyDual';
import { evaluateBusinessUpdatePolicyDual } from '../auth/businessUpdatePolicyDual';
import { evaluateBusinessAdminPolicyDual } from '../auth/businessAdminPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  BusinessServiceError,
  isPrismaUniqueViolation,
} from '../services/business/businessServiceErrors';
import {
  createBusiness as createBusinessRecord,
  getBusinessForMember,
  getBusinessSetupStatus as fetchBusinessSetupStatus,
  listUserBusinesses,
  updateBusiness as updateBusinessRecord,
} from '../services/business/businessProfileService';
import {
  removeBusinessLogo,
  updateBusinessLogo,
} from '../services/business/businessBrandingService';
import {
  acceptInvitation as acceptBusinessInvitation,
  getInvitationBusinessId,
  inviteMember as inviteBusinessMember,
  listBusinessMembers,
  previewInvitation as previewBusinessInvitation,
  removeBusinessMember as removeBusinessMemberRecord,
  updateBusinessMember as updateBusinessMemberRecord,
} from '../services/business/businessMemberService';
import {
  getBusinessAnalytics as fetchBusinessAnalytics,
  getBusinessModuleAnalytics as fetchBusinessModuleAnalytics,
} from '../services/business/businessAnalyticsService';
import {
  followBusiness as followBusinessRecord,
  getBusinessFollowers as fetchBusinessFollowers,
  getUserFollowing as fetchUserFollowing,
  unfollowBusiness as unfollowBusinessRecord,
} from '../services/business/businessSocialService';
import type {
  CreateBusinessInput,
  InviteMemberInput,
  UpdateBusinessInput,
  UpdateMemberInput,
} from '../services/business/businessServiceTypes';

const handleError = (
  res: Response,
  error: unknown,
  message: string = 'Internal server error',
  operation: string = 'business_controller'
) => {
  if (error instanceof BusinessServiceError) {
    return res.status(error.httpStatus).json({
      success: false,
      error: error.message,
    });
  }

  const err = error instanceof Error ? error : new Error(String(error));
  const prismaCode =
    typeof (error as { code?: string }).code === 'string'
      ? (error as { code: string }).code
      : undefined;
  void logger
    .error(`Business controller error: ${message}`, {
      operation,
      error: { message: err.message, stack: err.stack },
      ...(prismaCode && { prismaCode }),
    })
    .catch(() => {
      /* log failure non-fatal */
    });
  res.status(500).json({ success: false, error: message });
};

function requireUser(req: Request, res: Response) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return null;
  }
  return user;
}

export const createBusinessHandler = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const createPolicyDual = await evaluateBusinessAdminPolicyDual({
      userId: user.id,
      action: POLICY_ACTIONS.BUSINESS_CREATE,
    });
    if (createPolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: createPolicyDual.reason,
      });
    }

    const businessData = req.body as CreateBusinessInput;
    const business = await createBusinessRecord({
      actorUserId: user.id,
      data: businessData,
    });

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    if (isPrismaUniqueViolation(error)) {
      return res.status(400).json({ success: false, error: 'Business with this EIN already exists' });
    }
    handleError(res, error, 'Failed to create business');
  }
};

export const getUserBusinesses = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const businesses = await listUserBusinesses(user.id);
    res.json({ success: true, data: businesses });
  } catch (error) {
    handleError(res, error, 'Failed to fetch businesses', 'get_user_businesses');
  }
};

export const getBusiness = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const business = await getBusinessForMember(user.id, req.params.id);
    res.json({ success: true, data: business });
  } catch (error) {
    handleError(res, error, 'Failed to fetch business');
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { businessId } = req.params;
    const inviteData = req.body as InviteMemberInput;

    const invitePolicyDual = await evaluateBusinessMemberPolicyDual({
      userId: user.id,
      businessId,
      action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
    });
    if (invitePolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: invitePolicyDual.reason,
      });
    }

    const invitation = await inviteBusinessMember({
      actorUserId: user.id,
      actorName: user.name ?? null,
      actorUserNumber: user.userNumber ?? null,
      businessId,
      data: inviteData,
    });

    res.status(201).json({ success: true, data: invitation });
  } catch (error) {
    handleError(res, error, 'Failed to invite member');
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { token } = req.params;

    const invitation = await getInvitationBusinessId(token);
    const acceptPolicyDual = await evaluateBusinessMemberPolicyDual({
      userId: user.id,
      businessId: invitation.businessId,
      action: POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION,
      metadata: { invitationToken: token },
    });
    if (acceptPolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        reason: acceptPolicyDual.reason,
      });
    }

    const result = await acceptBusinessInvitation({
      actorUserId: user.id,
      token,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    handleError(res, error, 'Failed to accept invitation');
  }
};

/** Public — token acts as authorization to view invitation metadata */
export const previewInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const preview = await previewBusinessInvitation(token);
    res.json({ success: true, data: preview });
  } catch (error) {
    handleError(res, error, 'Failed to load invitation');
  }
};

export const updateBusiness = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { id } = req.params;
    const updateData = req.body as UpdateBusinessInput;

    const updatePolicyDual = await evaluateBusinessUpdatePolicyDual({
      userId: user.id,
      businessId: id,
    });
    if (updatePolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: updatePolicyDual.reason,
      });
    }

    const business = await updateBusinessRecord({
      actorUserId: user.id,
      businessId: id,
      data: updateData,
    });

    res.json({ success: true, data: business });
  } catch (error) {
    handleError(res, error, 'Failed to update business');
  }
};

export const uploadLogo = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { id } = req.params;
    const { logoUrl } = req.body as { logoUrl: string };

    const logoPolicyDual = await evaluateBusinessUpdatePolicyDual({
      userId: user.id,
      businessId: id,
    });
    if (logoPolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: logoPolicyDual.reason,
      });
    }

    const business = await updateBusinessLogo({
      actorUserId: user.id,
      businessId: id,
      logoUrl,
    });

    res.json({ success: true, data: business });
  } catch (error) {
    handleError(res, error, 'Failed to upload logo');
  }
};

export const removeLogo = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { id } = req.params;

    const removeLogoPolicyDual = await evaluateBusinessUpdatePolicyDual({
      userId: user.id,
      businessId: id,
    });
    if (removeLogoPolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: removeLogoPolicyDual.reason,
      });
    }

    const business = await removeBusinessLogo({
      actorUserId: user.id,
      businessId: id,
    });

    res.json({ success: true, data: business });
  } catch (error) {
    handleError(res, error, 'Failed to remove logo');
  }
};

export const getBusinessMembers = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const members = await listBusinessMembers(user.id, req.params.id);
    res.json({ success: true, data: members });
  } catch (error) {
    handleError(res, error, 'Failed to fetch members');
  }
};

export const updateBusinessMember = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { id, userId } = req.params;
    const updateData = req.body as UpdateMemberInput;

    const updatePolicyDual = await evaluateBusinessMemberPolicyDual({
      userId: user.id,
      businessId: id,
      action: POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE,
    });
    if (updatePolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: updatePolicyDual.reason,
      });
    }

    const member = await updateBusinessMemberRecord({
      actorUserId: user.id,
      businessId: id,
      memberUserId: userId,
      data: updateData,
    });

    res.json({ success: true, data: member });
  } catch (error) {
    handleError(res, error, 'Failed to update member');
  }
};

export const removeBusinessMember = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { id, userId } = req.params;

    const removePolicyDual = await evaluateBusinessMemberPolicyDual({
      userId: user.id,
      businessId: id,
      action: POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE,
    });
    if (removePolicyDual.blocked) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        reason: removePolicyDual.reason,
      });
    }

    await removeBusinessMemberRecord({
      actorUserId: user.id,
      businessId: id,
      memberUserId: userId,
    });

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    handleError(res, error, 'Failed to remove member');
  }
};

export const getBusinessAnalytics = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const timeRange = typeof req.query.timeRange === 'string' ? req.query.timeRange : '30d';
    const analytics = await fetchBusinessAnalytics({
      userId: user.id,
      businessId: req.params.id,
      timeRange,
    });

    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch analytics');
  }
};

export const getBusinessModuleAnalytics = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const analytics = await fetchBusinessModuleAnalytics(user.id, req.params.id);
    res.json({ success: true, data: analytics });
  } catch (error) {
    handleError(res, error, 'Failed to fetch module analytics');
  }
};

export const getBusinessSetupStatus = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const setup = await fetchBusinessSetupStatus(user.id, req.params.id);
    return res.json({ success: true, data: setup });
  } catch (error) {
    handleError(res, error, 'Failed to get business setup status');
  }
};

export const followBusiness = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const { businessId } = req.params;
    const result = await followBusinessRecord(user.id, businessId);

    if (result.alreadyFollowing) {
      return res.status(200).json({ success: true, message: 'Already following' });
    }

    res.status(201).json({ success: true, message: 'Followed business' });
  } catch (error) {
    handleError(res, error, 'Failed to follow business');
  }
};

export const unfollowBusiness = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    await unfollowBusinessRecord(user.id, req.params.businessId);
    res.json({ success: true, message: 'Unfollowed business' });
  } catch (error) {
    handleError(res, error, 'Failed to unfollow business');
  }
};

export const getBusinessFollowers = async (req: Request, res: Response) => {
  try {
    const followers = await fetchBusinessFollowers(req.params.businessId);
    res.json({ success: true, followers });
  } catch (error) {
    handleError(res, error, 'Failed to get followers');
  }
};

export const getUserFollowing = async (req: Request, res: Response) => {
  try {
    const user = requireUser(req, res);
    if (!user) return;

    const following = await fetchUserFollowing(user.id);
    res.json({ success: true, following });
  } catch (error) {
    handleError(res, error, 'Failed to get following businesses');
  }
};

export const createBusiness = createBusinessHandler;
