/**
 * Emergency endpoint to fix subscriptions table
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

/**
 * Add missing columns to subscriptions table
 * POST /api/admin/fix-subscriptions/add-employee-columns
 */
router.post('/add-employee-columns', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Adding missing columns to subscriptions table...');
    
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
    
    console.log('✅ Subscription columns added successfully');
    
    return res.json({
      success: true,
      message: 'Subscription employee columns added successfully',
      columns: ['employeeCount', 'includedEmployees', 'additionalEmployeeCost']
    });
    
  } catch (error) {
    console.error('Error adding subscription columns:', error);
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
    console.error('Error checking subscriptions:', error);
    return res.status(500).json({
      error: 'Failed to check subscriptions table',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

