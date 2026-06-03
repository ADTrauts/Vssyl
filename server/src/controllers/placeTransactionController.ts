import { Request, Response } from 'express';
import { logger } from '../lib/logger';
import { getUserFromRequest } from '../middleware/auth';
import { respondPlaceServiceError } from '../services/place/placeErrors';
import * as placeTransactionService from '../services/place/placeTransactionService';

function logPlaceTransactionError(desc: string, operation: string, err: unknown): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(desc, {
    operation,
    error: { message: e.message, stack: e.stack },
  });
}

function getUserId(req: Request): string | null {
  const user = getUserFromRequest(req);
  return user?.id ?? null;
}

export async function createTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId, type, amount, currency, description, externalService, externalUrl, interactionLinkId } =
      req.body;

    const transaction = await placeTransactionService.createTransaction({
      userId,
      businessId,
      type,
      amount,
      currency,
      description,
      externalService,
      externalUrl,
      interactionLinkId,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error creating transaction', 'place_transaction_create', error);
    res.status(500).json({ success: false, error: 'Failed to create transaction' });
  }
}

export async function getTransactions(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { limit, offset, type, businessId } = req.query;
    const result = await placeTransactionService.listTransactions({
      userId,
      limit: typeof limit === 'string' ? parseInt(limit, 10) : undefined,
      offset: typeof offset === 'string' ? parseInt(offset, 10) : undefined,
      type: typeof type === 'string' ? type : undefined,
      businessId: typeof businessId === 'string' ? businessId : undefined,
    });

    res.json({ success: true, data: result.transactions, pagination: result.pagination });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error fetching transactions', 'place_transaction_list', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
}

export async function getTransaction(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const transaction = await placeTransactionService.getTransaction({
      userId,
      transactionId: req.params.transactionId,
    });

    res.json({ success: true, data: transaction });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error fetching transaction', 'place_transaction_get', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction' });
  }
}

export async function updateTransactionPrivacy(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const updated = await placeTransactionService.updateTransactionPrivacy({
      userId,
      transactionId: req.params.transactionId,
      isPrivate: req.body.isPrivate,
    });

    res.json({ success: true, data: updated });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error updating transaction privacy', 'place_transaction_privacy', error);
    res.status(500).json({ success: false, error: 'Failed to update privacy' });
  }
}

export async function getTransactionSummary(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const data = await placeTransactionService.getTransactionSummary(userId);
    res.json({ success: true, data });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error fetching summary', 'place_transaction_summary', error);
    res.status(500).json({ success: false, error: 'Failed to fetch summary' });
  }
}

export async function trackInteractionClick(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { businessId, interactionLinkId, externalService, url } = req.body;
    await placeTransactionService.trackInteractionClick({
      userId,
      businessId,
      interactionLinkId,
      externalService,
      url,
    });

    res.json({ success: true, message: 'Click tracked' });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error tracking click', 'place_transaction_click', error);
    res.status(500).json({ success: false, error: 'Failed to track click' });
  }
}

export async function getInteractionStats(req: Request, res: Response): Promise<void> {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const data = await placeTransactionService.getInteractionStats({
      userId,
      businessId: req.params.businessId,
    });

    res.json({ success: true, data });
  } catch (error: unknown) {
    if (respondPlaceServiceError(res, error)) return;
    logPlaceTransactionError('Error fetching stats', 'place_transaction_stats', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
}
