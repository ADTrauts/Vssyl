/**
 * DEBUG DATABASE ENDPOINT
 * 
 * Check if database tables exist
 * Useful for troubleshooting migration issues
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

/**
 * Check if HR tables exist
 * GET /api/debug/database/hr-tables
 */
router.get('/hr-tables', async (req: Request, res: Response) => {
  try {
    const results = {
      hrModuleExists: false,
      tablesExist: {
        employeeHRProfile: false,
        managerApprovalHierarchy: false,
        hrModuleSettings: false
      },
      errors: [] as string[]
    };
    
    // Check if HR module exists
    try {
      const hrModule = await prisma.module.findUnique({
        where: { id: 'hr' }
      });
      results.hrModuleExists = !!hrModule;
    } catch (e) {
      results.errors.push(`Module check error: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    // Try to query each HR table
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM employee_hr_profiles LIMIT 1`;
      results.tablesExist.employeeHRProfile = true;
    } catch (e) {
      results.errors.push(`employee_hr_profiles: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM manager_approval_hierarchy LIMIT 1`;
      results.tablesExist.managerApprovalHierarchy = true;
    } catch (e) {
      results.errors.push(`manager_approval_hierarchy: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    try {
      await prisma.$queryRaw`SELECT COUNT(*) FROM hr_module_settings LIMIT 1`;
      results.tablesExist.hrModuleSettings = true;
    } catch (e) {
      results.errors.push(`hr_module_settings: ${e instanceof Error ? e.message : String(e)}`);
    }
    
    const allTablesExist = Object.values(results.tablesExist).every(v => v === true);
    
    res.json({
      success: true,
      hrModuleExists: results.hrModuleExists,
      migrationComplete: allTablesExist,
      tables: results.tablesExist,
      errors: results.errors,
      message: allTablesExist 
        ? 'All HR tables exist - migration successful!' 
        : 'HR tables missing - migration may not have run yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Database check failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

