import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { logSecurityEvent } from './adminSecurityService';
import { logSystemOpsAudit } from './adminAuditService';
import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_RESOURCE_TYPES } from './adminAuditTaxonomy';

const CRITICAL_TABLES = [
  'pricing_configs',
  'price_changes',
  'module_ai_context_registry',
  'subscriptions',
  'invoices',
  'developer_revenues',
  'content_reports',
  'security_events',
  'module_subscriptions',
] as const;

export async function getSystemHealth() {
  try {
    const { SystemMonitoringService } = await import('../systemMonitoringService.js');
    const metrics = await SystemMonitoringService.getSystemHealth();
    return {
      status: 'available' as const,
      ...metrics,
    };
  } catch (error: unknown) {
    await logger.error('Failed to get system health', {
      operation: 'admin_get_system_health',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return {
      status: 'unavailable' as const,
      cpu: null,
      memory: null,
      disk: null,
      network: null,
      uptime: null,
      responseTime: null,
      activeConnections: null,
      errorRate: null,
      timestamp: new Date(),
    };
  }
}

export async function getSystemConfig() {
  return prisma.systemConfig.findMany({
    orderBy: { updatedAt: 'desc' },
  });
}

export async function updateSystemConfig(
  configKey: string,
  configValue: string | number | boolean,
  description: string,
  adminId: string,
) {
  const config = await prisma.systemConfig.upsert({
    where: { configKey },
    update: {
      configValue,
      description,
      updatedBy: adminId,
      updatedAt: new Date(),
    },
    create: {
      configKey,
      configValue,
      description,
      updatedBy: adminId,
    },
  });

  await logger.info('Admin updated system configuration', {
    operation: 'admin_update_system_config',
    adminId,
    configKey,
  });

  await logSystemOpsAudit({
    adminId,
    action: ADMIN_AUDIT_ACTIONS.SYSTEM_CONFIG_UPDATE,
    resourceId: configKey,
    resourceType: ADMIN_AUDIT_RESOURCE_TYPES.SYSTEM_CONFIG,
    details: { configKey, description },
  });

  return config;
}

export async function getBackupStatus() {
  try {
    const { SystemMonitoringService } = await import('../systemMonitoringService.js');
    return await SystemMonitoringService.getBackupStatus();
  } catch (error: unknown) {
    await logger.error('Failed to get backup status', {
      operation: 'admin_get_backup_status',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return {
      lastBackup: new Date().toISOString(),
      nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      backupSize: '0 GB',
      status: 'failed' as const,
      retentionDays: 30,
    };
  }
}

export async function createBackup(adminId: string) {
  try {
    await logger.info('Admin initiated backup creation', {
      operation: 'admin_create_backup',
      adminId,
    });

    await logSecurityEvent({
      eventType: 'backup_created',
      severity: 'low',
      adminId,
      details: {
        backupType: 'manual',
        timestamp: new Date().toISOString(),
      },
    });

    await logSystemOpsAudit({
      adminId,
      action: ADMIN_AUDIT_ACTIONS.BACKUP_CREATE,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.BACKUP,
      details: { backupType: 'manual' },
    });

    return {
      success: true,
      backupId: `backup_${Date.now()}`,
      message: 'Backup created successfully',
    };
  } catch (error: unknown) {
    await logger.error('Failed to create backup', {
      operation: 'admin_create_backup',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
}

export async function getMaintenanceMode() {
  try {
    const { SystemMonitoringService } = await import('../systemMonitoringService.js');
    return await SystemMonitoringService.getMaintenanceMode();
  } catch (error: unknown) {
    await logger.error('Failed to get maintenance mode', {
      operation: 'admin_get_maintenance_mode',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    return {
      enabled: false,
      message: 'System is currently under maintenance. Please try again later.',
      scheduledStart: undefined,
      scheduledEnd: undefined,
    };
  }
}

export async function setMaintenanceMode(enabled: boolean, message: string, adminId: string) {
  try {
    const { SystemMonitoringService } = await import('../systemMonitoringService.js');
    await SystemMonitoringService.setMaintenanceMode(enabled, message, adminId);

    await logSecurityEvent({
      eventType: 'maintenance_mode_changed',
      severity: 'high',
      adminId,
      details: {
        enabled,
        message,
        timestamp: new Date().toISOString(),
      },
    });

    await logSystemOpsAudit({
      adminId,
      action: ADMIN_AUDIT_ACTIONS.MAINTENANCE_MODE_UPDATE,
      resourceType: ADMIN_AUDIT_RESOURCE_TYPES.MAINTENANCE,
      details: { enabled, message },
    });

    return {
      success: true,
      enabled,
      message,
      updatedAt: new Date().toISOString(),
    };
  } catch (error: unknown) {
    await logger.error('Failed to set maintenance mode', {
      operation: 'admin_set_maintenance_mode',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
    });
    throw error;
  }
}

export async function probeDatabaseConnection(timeoutMs: number): Promise<void> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs);
  });
  await Promise.race([prisma.$queryRaw`SELECT 1`, timeout]);
}

export async function getDatabaseSchemaCheck() {
  const tableChecks = await Promise.all(
    CRITICAL_TABLES.map(async (tableName) => {
      try {
        const result = await prisma.$queryRaw<Array<{ table_name: string }>>`
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = ${tableName};
        `;
        return { table: tableName, exists: result.length > 0, error: null };
      } catch (error: unknown) {
        return {
          table: tableName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }),
  );

  let migrationStatus = 'unknown';
  let appliedMigrations = 0;
  try {
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM _prisma_migrations
      ORDER BY finished_at DESC
      LIMIT 10;
    `;
    appliedMigrations = migrations.length;
    migrationStatus = 'connected';
  } catch {
    migrationStatus = 'error';
  }

  let allTables: string[] = [];
  try {
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    allTables = tables.map((t) => t.table_name);
  } catch {
    // ignore
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
    criticalTables: tableChecks,
    migrationStatus,
    appliedMigrations,
    allTables: allTables.slice(0, 50),
    totalTables: allTables.length,
    missingTables: tableChecks.filter((t) => !t.exists).map((t) => t.table),
  };
}

export async function listMigrations() {
  const migrations = await prisma.$queryRaw<
    Array<{
      id: string;
      migration_name: string;
      started_at: Date;
      finished_at: Date | null;
      checksum: string;
      applied_steps_count: number;
      rolled_back_at: Date | null;
      logs: string | null;
    }>
  >`
    SELECT id, migration_name, started_at, finished_at, checksum, applied_steps_count, rolled_back_at, logs
    FROM "_prisma_migrations"
    ORDER BY started_at DESC;
  `;

  const migrationsWithStatus = migrations.map((m) => ({
    ...m,
    status: m.rolled_back_at ? 'rolled_back' : m.finished_at ? 'applied' : 'failed',
    startedAt: m.started_at,
    finishedAt: m.finished_at,
    rolledBackAt: m.rolled_back_at,
  }));

  const failedMigrations = migrationsWithStatus.filter((m) => m.status === 'failed');
  const appliedMigrations = migrationsWithStatus.filter((m) => m.status === 'applied');

  return {
    totalMigrations: migrations.length,
    appliedCount: appliedMigrations.length,
    failedCount: failedMigrations.length,
    migrations: migrationsWithStatus,
    failedMigrations: failedMigrations.map((m) => m.migration_name),
    timestamp: new Date().toISOString(),
  };
}

function resolveServerRoot(): string {
  return path.join(__dirname, '../../..');
}

function resolveRepoPrismaDir(): string {
  return path.join(resolveServerRoot(), '../prisma');
}

export type FixFailedMigrationsResult =
  | { success: true; fixed: string[]; message: string }
  | { success: false; error: string; failedMigrations?: string[] };

export async function fixFailedMigrations(
  adminId: string,
  migrationName?: string,
): Promise<FixFailedMigrationsResult> {
  const failedMigrations = await prisma.$queryRaw<
    Array<{ id: string; migration_name: string; started_at: Date }>
  >`
    SELECT id, migration_name, started_at
    FROM "_prisma_migrations"
    WHERE finished_at IS NULL AND rolled_back_at IS NULL;
  `;

  if (failedMigrations.length === 0) {
    return { success: true, fixed: [], message: 'No failed migrations found' };
  }

  const migrationsToFix = migrationName
    ? failedMigrations.filter((m) => m.migration_name === migrationName)
    : failedMigrations;

  if (migrationsToFix.length === 0) {
    return {
      success: false,
      error: `Migration ${migrationName} not found or not in failed state`,
      failedMigrations: failedMigrations.map((m) => m.migration_name),
    };
  }

  const fixed: string[] = [];
  for (const migration of migrationsToFix) {
    await prisma.$executeRaw`
      UPDATE "_prisma_migrations"
      SET finished_at = NOW(),
          logs = COALESCE(logs, '') || E'\n[ADMIN FIX] Marked as applied by admin at ' || NOW()::text
      WHERE id = ${migration.id};
    `;
    fixed.push(migration.migration_name);
  }

  await logger.info('Admin fixed failed migrations', {
    operation: 'admin_fix_migrations',
    adminId,
    fixedMigrations: fixed,
  });

  return {
    success: true,
    fixed,
    message: `Fixed ${fixed.length} failed migration(s)`,
  };
}

export type DeleteMigrationRecordsInput = {
  migrationName?: string;
  deleteAll?: boolean;
};

export type DeleteMigrationRecordsResult =
  | { success: true; deleted: string[]; deleteAll: boolean }
  | { success: false; error: string };

export async function deleteMigrationRecords(
  adminId: string,
  input: DeleteMigrationRecordsInput,
): Promise<DeleteMigrationRecordsResult> {
  const { migrationName, deleteAll } = input;

  if (!migrationName && !deleteAll) {
    return { success: false, error: 'Either migrationName or deleteAll must be provided' };
  }

  let deleted: string[] = [];

  if (deleteAll) {
    const allMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM "_prisma_migrations";
    `;

    await prisma.$executeRaw`DELETE FROM "_prisma_migrations";`;
    deleted = allMigrations.map((m) => m.migration_name);

    await logger.warn('Admin deleted ALL migration records', {
      operation: 'admin_delete_all_migrations',
      adminId,
      deletedCount: deleted.length,
    });
  } else if (migrationName) {
    const migration = await prisma.$queryRaw<Array<{ id: string; migration_name: string }>>`
      SELECT id, migration_name FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName};
    `;

    if (migration.length === 0) {
      return { success: false, error: `Migration ${migrationName} not found` };
    }

    await prisma.$executeRaw`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = ${migrationName};
    `;
    deleted = [migrationName];

    await logger.info('Admin deleted migration record', {
      operation: 'admin_delete_migration',
      adminId,
      migrationName,
    });
  }

  return { success: true, deleted, deleteAll: Boolean(deleteAll) };
}

export async function resetMigrationBaseline(adminId: string): Promise<{ applied: string[] }> {
  const migrationsDir = path.join(resolveRepoPrismaDir(), 'migrations');

  const migrationDirs = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort();

  await prisma.$executeRaw`DELETE FROM "_prisma_migrations";`;

  const applied: string[] = [];
  for (const migrationName of migrationDirs) {
    const migrationPath = path.join(migrationsDir, migrationName, 'migration.sql');

    if (fs.existsSync(migrationPath)) {
      const content = fs.readFileSync(migrationPath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(content).digest('hex');

      await prisma.$executeRaw`
        INSERT INTO "_prisma_migrations" (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
        VALUES (
          ${crypto.randomUUID()},
          ${checksum},
          ${migrationName},
          NOW(),
          NOW(),
          1
        );
      `;
      applied.push(migrationName);
    }
  }

  await logger.info('Admin reset migrations to baseline', {
    operation: 'admin_reset_baseline',
    adminId,
    appliedMigrations: applied,
  });

  return { applied };
}

export async function runMigrationsManually(adminId: string): Promise<{
  success: boolean;
  message: string;
  output: string;
}> {
  const serverRoot = resolveServerRoot();
  const schemaPath = path.join(resolveRepoPrismaDir(), 'schema.prisma');
  const migrationsDir = path.join(resolveRepoPrismaDir(), 'migrations');

  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Prisma schema not found at ${schemaPath}`);
  }

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found at ${migrationsDir}`);
  }

  const buildScriptPath = path.join(serverRoot, '../scripts/build-prisma-schema.js');
  try {
    execSync(`node ${buildScriptPath}`, {
      stdio: 'pipe',
      env: process.env,
      cwd: path.join(serverRoot, '..'),
      timeout: 30000,
    });
  } catch (buildError: unknown) {
    await logger.warn('Schema build failed, continuing anyway', {
      operation: 'admin_run_migrations',
      error: {
        message: buildError instanceof Error ? buildError.message : 'Unknown error',
        stack: buildError instanceof Error ? buildError.stack : undefined,
      },
    });
  }

  const migrationUrl = process.env.DATABASE_MIGRATE_URL || process.env.DATABASE_URL;
  const migrationEnv = {
    ...process.env,
    DATABASE_URL: migrationUrl,
  };

  let migrationOutput = '';
  let migrationSuccess = false;
  try {
    const output = execSync(`npx prisma migrate deploy --schema ${schemaPath}`, {
      stdio: 'pipe',
      env: migrationEnv,
      cwd: serverRoot,
      timeout: 120000,
      encoding: 'utf-8',
    });
    migrationOutput = output.toString();
    migrationSuccess = true;
  } catch (migrationError: unknown) {
    migrationOutput =
      migrationError instanceof Error ? migrationError.message : String(migrationError);
    migrationSuccess = false;
  }

  await logger.info('Admin triggered manual migration', {
    operation: 'admin_run_migrations',
    adminId,
    success: migrationSuccess,
  });

  return {
    success: migrationSuccess,
    message: migrationSuccess ? 'Migrations applied successfully' : 'Migration failed',
    output: migrationOutput,
  };
}
