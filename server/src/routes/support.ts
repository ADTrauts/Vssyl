import express, { Request, Response } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validateRequest';
import { getUserFromRequest } from '../middleware/auth';
import { createSupportTicket } from '../services/admin/adminSupportService';
import { logger } from '../lib/logger';

const router: express.Router = express.Router();

const createCustomerTicketBody = validate([
  body('title').isString().notEmpty().trim().isLength({ max: 200 }),
  body('description').isString().notEmpty().trim(),
  body('category').isString().notEmpty(),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']),
  body('contactPhone').optional().isString(),
]);

router.post('/tickets/customer', createCustomerTicketBody, async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { title, description, category, priority, contactPhone } = req.body as {
      title: string;
      description: string;
      category: string;
      priority: string;
      contactPhone?: string;
    };

    const result = await createSupportTicket(
      {
        title,
        description,
        category,
        priority,
        customerId: user.id,
        tags: contactPhone ? [`phone:${contactPhone}`] : undefined,
      },
      undefined
    );

    await logger.info('Customer created support ticket', {
      operation: 'customer_create_support_ticket',
      userId: user.id,
      ticketId: (result as { id: string }).id,
    });

    res.json({
      success: true,
      data: {
        ticketId: (result as { id: string }).id,
        message: 'Support ticket created successfully',
      },
    });
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    await logger.error('Failed to create customer support ticket', {
      operation: 'customer_create_support_ticket',
      error: { message: err.message, stack: err.stack },
    });
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

export default router;
