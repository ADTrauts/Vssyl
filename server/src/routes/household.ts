import express from 'express';
import {
  getHouseholds,
  createHousehold,
  getHouseholdById,
  updateHousehold,
  deleteHousehold,
  inviteMember,
  updateMemberRole,
  removeMember
} from '../controllers/householdController';

const router: express.Router = express.Router();

// Household CRUD operations
router.get('/', getHouseholds);
router.post('/', createHousehold);
router.get('/:id', getHouseholdById);
router.put('/:id', updateHousehold);
router.delete('/:id', deleteHousehold);

// Member management
router.post('/:id/members', inviteMember);
router.put('/:id/members/:userId', updateMemberRole);
router.delete('/:id/members/:userId', removeMember);

export default router; 