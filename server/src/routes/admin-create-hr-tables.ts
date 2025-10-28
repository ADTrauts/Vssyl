/**
 * Emergency endpoint to manually create HR tables
 */

import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const router: express.Router = express.Router();

/**
 * Manually create HR tables using raw SQL
 * POST /api/admin/create-hr-tables
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('Manually creating HR tables...');
    
    // Check if tables already exist
    const tablesCheck = await prisma.$queryRaw<Array<{table_name: string}>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('employee_hr_profiles', 'manager_approval_hierarchy', 'hr_module_settings');
    `;
    
    if (tablesCheck.length === 3) {
      return res.json({
        success: true,
        message: 'HR tables already exist',
        tables: tablesCheck.map(t => t.table_name)
      });
    }
    
    // Create EmployeeType enum if it doesn't exist
    await prisma.$executeRaw`
      DO $$ BEGIN
        CREATE TYPE "EmployeeType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN', 'TEMPORARY', 'SEASONAL');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `;
    
    // Create employee_hr_profiles table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "employee_hr_profiles" (
        "id" TEXT NOT NULL,
        "employeePositionId" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "hireDate" TIMESTAMP(3),
        "terminationDate" TIMESTAMP(3),
        "employeeType" "EmployeeType",
        "workLocation" TEXT,
        "emergencyContact" JSONB,
        "personalInfo" JSONB,
        "deletedAt" TIMESTAMP(3),
        "deletedBy" TEXT,
        "deletedReason" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "employee_hr_profiles_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "employee_hr_profiles_employeePositionId_fkey" FOREIGN KEY ("employeePositionId") REFERENCES "employee_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "employee_hr_profiles_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create indexes for employee_hr_profiles
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "employee_hr_profiles_employeePositionId_key" ON "employee_hr_profiles"("employeePositionId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "employee_hr_profiles_businessId_idx" ON "employee_hr_profiles"("businessId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "employee_hr_profiles_employeePositionId_idx" ON "employee_hr_profiles"("employeePositionId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "employee_hr_profiles_deletedAt_idx" ON "employee_hr_profiles"("deletedAt");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "employee_hr_profiles_employeeType_idx" ON "employee_hr_profiles"("employeeType");`;
    
    // Create manager_approval_hierarchy table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "manager_approval_hierarchy" (
        "id" TEXT NOT NULL,
        "employeePositionId" TEXT NOT NULL,
        "managerPositionId" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "approvalTypes" TEXT[],
        "approvalLevel" INTEGER NOT NULL DEFAULT 1,
        "isPrimary" BOOLEAN NOT NULL DEFAULT true,
        "active" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "manager_approval_hierarchy_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "manager_approval_hierarchy_employeePositionId_fkey" FOREIGN KEY ("employeePositionId") REFERENCES "employee_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "manager_approval_hierarchy_managerPositionId_fkey" FOREIGN KEY ("managerPositionId") REFERENCES "employee_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "manager_approval_hierarchy_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create indexes for manager_approval_hierarchy
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "manager_approval_hierarchy_employeePositionId_managerPositionId_businessId_key" ON "manager_approval_hierarchy"("employeePositionId", "managerPositionId", "businessId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "manager_approval_hierarchy_businessId_idx" ON "manager_approval_hierarchy"("businessId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "manager_approval_hierarchy_employeePositionId_idx" ON "manager_approval_hierarchy"("employeePositionId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "manager_approval_hierarchy_managerPositionId_idx" ON "manager_approval_hierarchy"("managerPositionId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "manager_approval_hierarchy_active_idx" ON "manager_approval_hierarchy"("active");`;
    
    // Create hr_module_settings table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "hr_module_settings" (
        "id" TEXT NOT NULL,
        "businessId" TEXT NOT NULL,
        "timeOffSettings" JSONB,
        "workWeekSettings" JSONB,
        "payrollSettings" JSONB,
        "enabledFeatures" JSONB,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "hr_module_settings_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "hr_module_settings_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `;
    
    // Create indexes for hr_module_settings
    await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "hr_module_settings_businessId_key" ON "hr_module_settings"("businessId");`;
    await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "hr_module_settings_businessId_idx" ON "hr_module_settings"("businessId");`;
    
    console.log('✅ HR tables created successfully');
    
    return res.json({
      success: true,
      message: 'HR tables created successfully',
      tables: ['employee_hr_profiles', 'manager_approval_hierarchy', 'hr_module_settings']
    });
    
  } catch (error) {
    console.error('Error creating HR tables:', error);
    return res.status(500).json({
      error: 'Failed to create HR tables',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;

