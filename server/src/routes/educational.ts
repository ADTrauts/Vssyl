import express from 'express';
import {
  createInstitution,
  getUserInstitutions,
  getInstitution,
  inviteMember,
  acceptInvitation
} from '../controllers/educationalController';

const router: express.Router = express.Router();

// Create a new educational institution
router.post('/', createInstitution);

// Get user's educational institutions
router.get('/', getUserInstitutions);

// Get specific institution details
router.get('/:id', getInstitution);

// Invite member to institution
router.post('/:institutionId/invite', inviteMember);

// Accept institution invitation
router.post('/invite/:token/accept', acceptInvitation);

export default router; 