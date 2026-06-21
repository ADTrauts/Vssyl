import express from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import {
  register,
  login,
  refresh,
  forgotPasswordHandler,
  resetPasswordHandler,
  verifyEmailHandler,
  resendVerificationHandler,
  authLog,
} from '../controllers/authController';

const router: express.Router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', login);
router.post('/refresh', asyncHandler(refresh));
router.post('/forgot-password', asyncHandler(forgotPasswordHandler));
router.post('/reset-password', asyncHandler(resetPasswordHandler));
router.post('/verify-email', asyncHandler(verifyEmailHandler));
router.post('/resend-verification', asyncHandler(resendVerificationHandler));
router.post('/_log', authLog);

export default router;
