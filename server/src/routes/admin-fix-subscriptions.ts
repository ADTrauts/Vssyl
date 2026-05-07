/**
 * Emergency endpoint to fix subscriptions table
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, getUserFromRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


const router: express.Router = express.Router();

/**
 * Add missing columns to subscriptions table
 * POST /api/admin/fix-subscriptions/add-employee-columns
 */
router.post('/add-employee-columns', async (req: Request, res: Response) => {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    logSrvDebug('admin_fix_subscriptions_adding_missing_columns_to_subscriptions_table', 'Adding missing columns to subscriptions table...');
    
    // Add employeeCount column
    await prisma.$executeRaw`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "employeeCount" INTEGER;
    `;
    
    // Add includedEmployees column
    await prisma.$executeRaw`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "includedEmployees" INTEGER;
    `;
    
    // Add additionalEmployeeCost column
    await prisma.$executeRaw`
      ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "additionalEmployeeCost" DOUBLE PRECISION;
    `;
    
    // Create index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "subscriptions_employeeCount_idx" ON "subscriptions"("employeeCount");
    `;
    
    logSrvDebug('admin_fix_subscriptions_subscription_columns_added_successfully', '✅ Subscription columns added successfully');
    
    return res.json({
      success: true,
      message: 'Subscription employee columns added successfully',
      columns: ['employeeCount', 'includedEmployees', 'additionalEmployeeCost']
    });
    
  } catch (error) {
    logSrvErr('admin_fix_subscriptions_error_adding_subscription_columns', 'Error adding subscription columns:', error);
    return res.status(500).json({
      error: 'Failed to add subscription columns',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Check subscriptions table schema
 * GET /api/admin/fix-subscriptions/check
 */
router.get('/check', async (req: Request, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Check subscription table columns
    const columnsCheck = await prisma.$queryRaw<Array<{column_name: string, data_type: string}>>`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `;
    
    const columns = columnsCheck.map(c => c.column_name);
    const hasEmployeeCount = columns.includes('employeeCount');
    const hasIncludedEmployees = columns.includes('includedEmployees');
    const hasAdditionalCost = columns.includes('additionalEmployeeCost');
    
    return res.json({
      success: true,
      allColumnsPresent: hasEmployeeCount && hasIncludedEmployees && hasAdditionalCost,
      hasEmployeeCount,
      hasIncludedEmployees,
      hasAdditionalEmployeeCost: hasAdditionalCost,
      allColumns: columns
    });
    
  } catch (error) {
    logSrvErr('admin_fix_subscriptions_error_checking_subscriptions', 'Error checking subscriptions:', error);
    return res.status(500).json({
      error: 'Failed to check subscriptions table',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

