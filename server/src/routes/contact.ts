import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import { logger } from '../lib/logger';
import { sendContactFormEmail } from '../services/emailService';

const router: express.Router = express.Router();

const contactBody = validate([
  body('name').isString().notEmpty().trim().isLength({ max: 120 }),
  body('email').isEmail().normalizeEmail(),
  body('subject').isString().notEmpty().trim().isLength({ max: 200 }),
  body('message').isString().notEmpty().trim().isLength({ max: 5000 }),
  body('company').optional().isString().trim().isLength({ max: 200 }),
]);

router.post('/', contactBody, async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, company } = req.body as {
      name: string;
      email: string;
      subject: string;
      message: string;
      company?: string;
    };

    await sendContactFormEmail({ name, email, subject, message, company });

    res.json({ success: true, message: 'Message sent successfully' });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Contact form submission failed', {
      operation: 'contact_form_submit',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to send message. Please try again or email support.' });
  }
});

export default router;
