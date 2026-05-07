/**
 * Emergency HR module fix endpoint
 * Manually runs migrations and seeds HR module
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { execSync } from 'child_process';
import path from 'path';
import { getUserFromRequest } from '../middleware/auth';
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
 * Check database state and run migrations if needed
 * POST /api/admin/fix-hr/run-migrations
 */
router.post('/run-migrations', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    logSrvDebug('admin_fix_hr_running_hr_migrations_manually', '🔧 Running HR migrations manually...');
    
    // Check if HR tables exist
    const tablesCheck = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employee_hr_profiles', 'manager_approval_hierarchy', 'hr_module_settings');
    `;
    
    const existingTables = tablesCheck.map(t => t.table_name);
    logSrvDebug('admin_fix_hr_existing_tables', 'Existing HR tables', { existingTables });
    
    if (existingTables.length === 3) {
      return res.json({
        success: true,
        message: 'HR tables already exist',
        tables: existingTables
      });
    }
    
    // Run the migration manually
    logSrvDebug('admin_fix_hr_running_prisma_migrate_deploy', 'Running Prisma migrate deploy...');
    
    try {
      const result = execSync('npx prisma migrate deploy', {
        cwd: path.join(__dirname, '../..'),
        encoding: 'utf-8',
        env: { ...process.env }
      });
      
      logSrvDebug('admin_fix_hr_migration_output', 'Migration output', {
        output: result.length > 4000 ? `${result.slice(0, 4000)}…` : result,
      });
      
      return res.json({
        success: true,
        message: 'Migrations applied successfully',
        output: result
      });
    } catch (migrationError) {
      logSrvErr('admin_fix_hr_migration_error', 'Migration error:', migrationError);
      return res.status(500).json({
        success: false,
        error: 'Migration failed',
        details: migrationError instanceof Error ? migrationError.message : String(migrationError)
      });
    }
    
  } catch (error) {
    logSrvErr('admin_fix_hr_error_in_run_migrations', 'Error in run-migrations:', error);
    return res.status(500).json({
      error: 'Failed to run migrations',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Simple database check (no HR table dependencies)
 * GET /api/admin/fix-hr/check-db
 */
router.get('/check-db', async (req: Request, res: Response) => {
  try {
    // Check if HR module tables exist
    const tablesCheck = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'employee_hr_profiles', 
        'manager_approval_hierarchy', 
        'hr_module_settings',
        'business_module_installations'
      );
    `;
    
    const tables = tablesCheck.map(t => t.table_name);
    
    // Check if business_module_installations has installedBy column
    let hasInstalledByColumn = false;
    if (tables.includes('business_module_installations')) {
      const columnsCheck = await prisma.$queryRaw<Array<{column_name: string}>>`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'business_module_installations';
      `;
      hasInstalledByColumn = columnsCheck.some(c => c.column_name === 'installedBy');
    }
    
    // Check if HR module exists (without using model)
    const moduleCheck = await prisma.$queryRaw<Array<{id: string, name: string}>>`
      SELECT id, name 
      FROM modules 
      WHERE id = 'hr';
    `;
    
    return res.json({
      success: true,
      hrTablesExist: tables.includes('employee_hr_profiles') && 
                     tables.includes('manager_approval_hierarchy') && 
                     tables.includes('hr_module_settings'),
      tables: tables,
      businessModuleInstallationsHasInstalledBy: hasInstalledByColumn,
      hrModuleExists: moduleCheck.length > 0,
      hrModule: moduleCheck[0] || null
    });
    
  } catch (error) {
    logSrvErr('admin_fix_hr_error_checking_database', 'Error checking database:', error);
    return res.status(500).json({
      error: 'Database check failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * Seed HR module (no dependencies on HR tables)
 * POST /api/admin/fix-hr/seed-module
 */
router.post('/seed-module', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    logSrvDebug('admin_fix_hr_seeding_hr_module', '🌱 Seeding HR module...');
    
    // Check if already exists
    const existingCheck = await prisma.$queryRaw<Array<{id: string}>>`
      SELECT id FROM modules WHERE id = 'hr';
    `;
    
    if (existingCheck.length > 0) {
      return res.json({
        success: true,
        message: 'HR module already exists',
        moduleId: 'hr'
      });
    }
    
    // Get an admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });
    
    if (!adminUser) {
      return res.status(500).json({
        error: 'No admin user found'
      });
    }
    
    // Insert HR module using raw SQL to avoid Prisma client issues
    await prisma.$executeRaw`
      INSERT INTO modules (
        id, name, description, version, category, tags, icon, screenshots,
        "developerId", status, downloads, rating, "reviewCount",
        "pricingTier", "basePrice", "enterprisePrice", "isProprietary", "revenueSplit",
        manifest, dependencies, permissions, "createdAt", "updatedAt"
      ) VALUES (
        'hr',
        'HR Management',
        'Complete human resources management system for employee lifecycle, attendance, payroll, and performance management',
        '1.0.0',
        'PRODUCTIVITY',
        ARRAY['hr', 'human-resources', 'business', 'enterprise', 'proprietary']::text[],
        'Users',
        ARRAY[]::text[],
        ${adminUser.id},
        'APPROVED',
        0,
        5.0,
        0,
        'business_advanced',
        0,
        0,
        true,
        0,
        '{"name":"HR Management","version":"1.0.0","description":"Human resources management system","author":"Vssyl","license":"proprietary","businessOnly":true,"requiresOrgChart":true,"minimumTier":"business_advanced","routes":{"admin":"/business/[id]/admin/hr","employee":"/business/[id]/workspace/hr/me","manager":"/business/[id]/workspace/hr/team"},"permissions":["hr:admin","hr:employees:read","hr:employees:write","hr:team:view","hr:team:approve","hr:self:view","hr:self:update"]}'::jsonb,
        ARRAY[]::text[],
        ARRAY['hr:admin','hr:employees:read','hr:employees:write','hr:team:view','hr:self:view']::text[],
        NOW(),
        NOW()
      );
    `;
    
    logSrvDebug('admin_fix_hr_hr_module_seeded_successfully', '✅ HR module seeded successfully');
    
    return res.json({
      success: true,
      message: 'HR module created successfully',
      moduleId: 'hr'
    });
    
  } catch (error) {
    logSrvErr('admin_fix_hr_error_seeding_hr_module', 'Error seeding HR module:', error);
    return res.status(500).json({
      error: 'Failed to seed HR module',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

