import express from 'express';
import { authenticateJWT } from '../middleware/auth';
import * as userMemoryFactController from '../controllers/userMemoryFactController';

const router: express.Router = express.Router();

router.use(authenticateJWT);

router.get('/', userMemoryFactController.getUserMemoryFacts);
router.post('/', userMemoryFactController.postUserMemoryFact);
router.delete('/:id', userMemoryFactController.deleteUserMemoryFactHandler);

export default router;
