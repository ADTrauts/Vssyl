import express from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import {
  createBusiness,
  getUserBusinesses,
  getBusiness,
  updateBusiness,
  uploadLogo,
  removeLogo,
  inviteMember,
  acceptInvitation,
  getBusinessMembers,
  updateBusinessMember,
  removeBusinessMember,
  getBusinessAnalytics,
  getBusinessModuleAnalytics,
  followBusiness,
  unfollowBusiness,
  getBusinessFollowers,
  getUserFollowing,
  getBusinessSetupStatus
} from '../controllers/businessController';

const router: express.Router = express.Router();

const businessIdParam = validate([param('id').isUUID()]);
const businessIdAltParam = validate([param('businessId').isUUID()]);
const memberUserIdParam = validate([param('userId').isUUID()]);
const inviteTokenParam = validate([param('token').isString().notEmpty().isLength({ min: 8, max: 256 })]);

const createBusinessBody = validate([
  body('name').isString().notEmpty().trim(),
  body('ein').isString().notEmpty().trim(),
  body('industry').optional().isString(),
  body('size').optional().isString(),
  body('website').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('description').optional().isString(),
]);

const updateBusinessBody = validate([
  body('name').optional().isString(),
  body('industry').optional().isString(),
  body('size').optional().isString(),
  body('website').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isEmail(),
  body('description').optional().isString(),
  body('branding').optional(),
  body('schedulingMode').optional().isString(),
  body('schedulingStrategy').optional().isString(),
  body('schedulingConfig').optional(),
]);

const inviteMemberBody = validate([
  body('email').isEmail(),
  body('role').isIn(['EMPLOYEE', 'ADMIN', 'MANAGER']),
  body('title').optional().isString(),
  body('department').optional().isString(),
]);

const updateMemberBody = validate([
  body('role').optional().isIn(['EMPLOYEE', 'ADMIN', 'MANAGER']),
  body('title').optional().isString(),
  body('department').optional().isString(),
  body('canInvite').optional().isBoolean(),
  body('canManage').optional().isBoolean(),
  body('canBilling').optional().isBoolean(),
]);

router.post('/', createBusinessBody, createBusiness);
router.get('/', getUserBusinesses);

router.get('/user/following', getUserFollowing);

router.get('/:id/setup-status', businessIdParam, getBusinessSetupStatus);
router.get('/:id', businessIdParam, getBusiness);
router.put('/:id', businessIdParam, updateBusinessBody, updateBusiness);
router.patch('/:id', businessIdParam, updateBusinessBody, updateBusiness);

router.post('/:id/logo', businessIdParam, validate([body('logoUrl').isString().notEmpty()]), uploadLogo);
router.delete('/:id/logo', businessIdParam, removeLogo);

router.get('/:id/members', businessIdParam, getBusinessMembers);
router.put('/:id/members/:userId', businessIdParam, memberUserIdParam, updateMemberBody, updateBusinessMember);
router.delete('/:id/members/:userId', businessIdParam, memberUserIdParam, removeBusinessMember);

router.post('/:businessId/invite', businessIdAltParam, inviteMemberBody, inviteMember);
router.post('/invite/accept/:token', inviteTokenParam, acceptInvitation);

router.get('/:id/analytics', businessIdParam, getBusinessAnalytics);
router.get('/:id/module-analytics', businessIdParam, getBusinessModuleAnalytics);

router.post('/:businessId/follow', businessIdAltParam, followBusiness);
router.delete('/:businessId/follow', businessIdAltParam, unfollowBusiness);
router.get('/:businessId/followers', businessIdAltParam, getBusinessFollowers);

export default router;
