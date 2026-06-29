import { prisma } from '../lib/prisma';
import { HouseholdRole, Prisma } from '@prisma/client';
import {
  recordDashboardCreated,
  recordDashboardDeleted,
  recordDashboardUpdated,
  contextFromDashboard,
} from './dashboardActivityService';
import {
  recordDashboardTabCreatedDomainEvent,
  recordDashboardTabDeletedDomainEvent,
} from './dashboardDomainEventService';
import { prepareDashboardTabDeletion } from './chat/chatDashboardLifecycleService';
import * as fileMigrationService from './fileMigrationService';

/** Invalid context or forbidden tenant access when creating a context-bound dashboard */
export class DashboardCreationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 400 | 403 = 403
  ) {
    super(message);
    this.name = 'DashboardCreationError';
  }
}

function countContextIds(data: {
  businessId?: string;
  institutionId?: string;
  householdId?: string;
}): number {
  let n = 0;
  if (data.businessId) n += 1;
  if (data.institutionId) n += 1;
  if (data.householdId) n += 1;
  return n;
}

async function assertDashboardContextMembership(
  userId: string,
  data: { businessId?: string; institutionId?: string; householdId?: string }
): Promise<void> {
  if (data.businessId) {
    const m = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: data.businessId, userId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      throw new DashboardCreationError('Not a member of this business');
    }
    return;
  }
  if (data.institutionId) {
    const m = await prisma.institutionMember.findUnique({
      where: { institutionId_userId: { institutionId: data.institutionId, userId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      throw new DashboardCreationError('Not a member of this institution');
    }
    return;
  }
  if (data.householdId) {
    const m = await prisma.householdMember.findUnique({
      where: { userId_householdId: { userId, householdId: data.householdId } },
      select: { isActive: true },
    });
    if (!m?.isActive) {
      throw new DashboardCreationError('Not a member of this household');
    }
  }
}

export interface DashboardLayout {
  widgets?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
  }>;
  [key: string]: unknown;
}

export interface DashboardPreferences {
  theme?: 'light' | 'dark' | 'system';
  defaultView?: 'grid' | 'list';
  refreshInterval?: number;
  notifications?: boolean;
  /** Module membership for this dashboard tab (sidebar source of truth). */
  selectedModuleIds?: string[];
  [key: string]: unknown;
}

/** Matches web DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS — preserves main personal tab sidebar. */
export const DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS = [
  'dashboard',
  'drive',
  'chat',
  'calendar',
  'connections',
  'todo',
] as const;

export interface DashboardUpdateData {
  name?: string;
  layout?: DashboardLayout;
  preferences?: DashboardPreferences;
}

// Dashboard service stubs
export async function getDashboards(userId: string) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return prisma.dashboard.findMany({
    where: { userId },
    include: { widgets: true },
    orderBy: { createdAt: 'asc' },
  });
}

// Get all dashboards including business and educational contexts
export async function getAllUserDashboards(userId: string) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Get personal dashboards
  const personalDashboards = await prisma.dashboard.findMany({
    where: { 
      userId,
      businessId: null,
      institutionId: null,
      householdId: null
    },
    include: { widgets: true },
    orderBy: { createdAt: 'asc' },
  });

  // Get business dashboards
  const businessDashboards = await prisma.dashboard.findMany({
    where: { 
      userId,
      businessId: { not: null }
    },
    include: { 
      widgets: true,
      business: {
        select: {
          id: true,
          name: true,
          ein: true
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get educational dashboards
  const educationalDashboards = await prisma.dashboard.findMany({
    where: { 
      userId,
      institutionId: { not: null }
    },
    include: { 
      widgets: true,
      institution: {
        select: {
          id: true,
          name: true,
          type: true
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  // Get household dashboards
  const householdDashboards = await prisma.dashboard.findMany({
    where: { 
      userId,
      householdId: { not: null }
    },
    include: { 
      widgets: true,
      household: {
        select: {
          id: true,
          name: true,
          type: true,
          isPrimary: true
        }
      }
    },
    orderBy: { createdAt: 'asc' },
  });

  return {
    personal: personalDashboards,
    business: businessDashboards,
    educational: educationalDashboards,
    household: householdDashboards
  };
}

export async function createDashboard(userId: string, data: { name: string; layout?: DashboardLayout; preferences?: DashboardPreferences; businessId?: string; institutionId?: string; householdId?: string }) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  if (countContextIds(data) > 1) {
    throw new DashboardCreationError(
      'Specify at most one of businessId, institutionId, or householdId',
      400
    );
  }

  // If businessId, institutionId, or householdId is provided, check for existing dashboard
  if (data.businessId) {
    const existing = await prisma.dashboard.findFirst({ where: { userId, businessId: data.businessId } });
    if (existing) return prisma.dashboard.findUnique({ where: { id: existing.id }, include: { widgets: true } });
  }
  if (data.institutionId) {
    const existing = await prisma.dashboard.findFirst({ where: { userId, institutionId: data.institutionId } });
    if (existing) return prisma.dashboard.findUnique({ where: { id: existing.id }, include: { widgets: true } });
  }
  if (data.householdId) {
    const existing = await prisma.dashboard.findFirst({ where: { userId, householdId: data.householdId } });
    if (existing) return prisma.dashboard.findUnique({ where: { id: existing.id }, include: { widgets: true } });
  }

  await assertDashboardContextMembership(userId, data);

  // Create the dashboard first
  const dashboard = await prisma.dashboard.create({
    data: {
      userId,
      name: data.name,
      layout: data.layout as Prisma.InputJsonValue,
      preferences: data.preferences as Prisma.InputJsonValue,
      businessId: data.businessId,
      institutionId: data.institutionId,
      householdId: data.householdId,
    },
  });

  const dashboardWithWidgets = await prisma.dashboard.findUnique({
    where: { id: dashboard.id },
    include: { widgets: true },
  });

  if (dashboardWithWidgets) {
    await recordDashboardCreated({
      actorUserId: userId,
      dashboard: {
        id: dashboardWithWidgets.id,
        name: dashboardWithWidgets.name,
        businessId: dashboardWithWidgets.businessId,
        householdId: dashboardWithWidgets.householdId,
        institutionId: dashboardWithWidgets.institutionId,
      },
    });
    recordDashboardTabCreatedDomainEvent({
      actorUserId: userId,
      dashboard: dashboardWithWidgets,
    });
  }
  return dashboardWithWidgets;
}

export async function ensureDefaultPersonalDashboard(userId: string) {
  const existing = await prisma.dashboard.findFirst({
    where: {
      userId,
      businessId: null,
      institutionId: null,
      householdId: null,
      trashedAt: null,
    },
    include: { widgets: true },
    orderBy: { createdAt: 'asc' },
  });

  if (existing) {
    return { dashboard: existing, created: false };
  }

  const dashboard = await createDashboard(userId, {
    name: 'My Dashboard',
    preferences: {
      selectedModuleIds: [...DEFAULT_MAIN_PERSONAL_TAB_MODULE_IDS],
    },
  });
  return { dashboard, created: true };
}

export async function getDashboardById(userId: string, dashboardId: string) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  return prisma.dashboard.findFirst({
    where: { id: dashboardId, userId },
    include: { widgets: true },
  });
}

export async function ensureBusinessDashboardForUser(userId: string, businessId: string) {
  const existing = await prisma.dashboard.findFirst({
    where: { userId, businessId },
    include: { widgets: true }
  });

  if (existing) {
    return existing;
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { name: true }
  });

  const dashboardName = business?.name ? `${business.name} Workspace` : 'Business Workspace';

  const dashboard = await createDashboard(userId, {
    name: dashboardName,
    businessId
  });

  return dashboard;
}

export async function updateDashboard(userId: string, dashboardId: string, data: DashboardUpdateData) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) {
    updateData.name = data.name;
  }
  if (data.layout !== undefined) {
    // Use proper Prisma JSON type with validation
    updateData.layout = data.layout as Prisma.InputJsonValue;
  }
  if (data.preferences !== undefined) {
    // Use proper Prisma JSON type with validation
    updateData.preferences = data.preferences as Prisma.InputJsonValue;
  }

  const updated = await prisma.dashboard.updateMany({
    where: { id: dashboardId, userId },
    data: updateData,
  });
  if (updated.count === 0) return null;
  const dashboard = await prisma.dashboard.findFirst({ where: { id: dashboardId, userId }, include: { widgets: true } });
  if (dashboard) {
    const changedFields = Object.keys(updateData);
    if (changedFields.length > 0) {
      await recordDashboardUpdated({
        actorUserId: userId,
        dashboard: contextFromDashboard(dashboard),
        changedFields,
      });
    }
  }
  return dashboard;
}

export async function deleteDashboard(userId: string, dashboardId: string, options?: { fileAction?: string }) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  // Fetch the dashboard to check its associations
  const dashboard = await prisma.dashboard.findFirst({ where: { id: dashboardId, userId } });
  if (!dashboard) return { count: 0 };

  const activityCtx = contextFromDashboard(dashboard);
  
  // Business and educational dashboards are protected
  if (dashboard.businessId || dashboard.institutionId) {
    // Protected: do not delete
    return { count: 0 };
  }
  
  // If this is a household dashboard, we need to handle the household deletion
  if (dashboard.householdId) {
    // Check if user is the household owner before allowing deletion
    const ownerMembership = await prisma.householdMember.findFirst({
      where: {
        householdId: dashboard.householdId,
        userId: userId,
        isActive: true,
        role: HouseholdRole.OWNER
      }
    });

    if (!ownerMembership) {
      return { count: 0 };
    }

    await prisma.widget.deleteMany({
      where: { dashboardId },
    });

    await prepareDashboardTabDeletion({ actorUserId: userId, dashboardId });

    const dashboardDeleteResult = await prisma.dashboard.deleteMany({
      where: { id: dashboardId, userId },
    });

    await prisma.household.delete({
      where: { id: dashboard.householdId },
    });

    if (dashboardDeleteResult.count > 0) {
      await recordDashboardDeleted({
        actorUserId: userId,
        dashboard: activityCtx,
        hardDelete: true,
      });
      recordDashboardTabDeletedDomainEvent({
        actorUserId: userId,
        dashboard: activityCtx,
        hardDelete: true,
      });
    }

    return dashboardDeleteResult;
  }

  await prisma.widget.deleteMany({
    where: { dashboardId },
  });

  await prepareDashboardTabDeletion({ actorUserId: userId, dashboardId });

  const result = await prisma.dashboard.deleteMany({
    where: { id: dashboardId, userId },
  });

  if (result.count > 0) {
    await recordDashboardDeleted({
      actorUserId: userId,
      dashboard: activityCtx,
      hardDelete: true,
      fileAction: options?.fileAction,
    });
    recordDashboardTabDeletedDomainEvent({
      actorUserId: userId,
      dashboard: activityCtx,
      hardDelete: true,
      fileAction: options?.fileAction,
    });
  }

  return result;
}

export interface DeleteDashboardWithFilesResult {
  deleted: number;
  migration: unknown;
  message: string;
}

export async function deleteDashboardWithFiles(
  userId: string,
  dashboardId: string,
  fileAction?: fileMigrationService.FileHandlingAction
): Promise<DeleteDashboardWithFilesResult | null> {
  const dashboard = await getDashboardById(userId, dashboardId);
  if (!dashboard) {
    return null;
  }

  let migrationResult: unknown = null;

  if (fileAction) {
    switch (fileAction.type) {
      case 'move-to-main': {
        const folderName =
          fileAction.folderName || fileMigrationService.generateLabeledFolderName(dashboard.name);
        migrationResult = await fileMigrationService.moveFilesToMainDrive(userId, dashboardId, {
          createFolder: fileAction.createFolder,
          folderName: fileAction.createFolder ? folderName : undefined,
        });
        break;
      }
      case 'move-to-trash':
        migrationResult = await fileMigrationService.moveFilesToTrash(userId, dashboardId, {
          retentionDays: fileAction.retentionDays,
        });
        break;
      case 'export': {
        const exportResult = await fileMigrationService.createDashboardExport(
          userId,
          dashboardId,
          fileAction.format
        );
        migrationResult = { exportResult };
        break;
      }
    }
  }

  const result = await deleteDashboard(userId, dashboardId, { fileAction: fileAction?.type });
  if (result.count === 0) {
    return null;
  }

  return {
    deleted: result.count,
    migration: migrationResult,
    message: migrationResult
      ? 'Dashboard deleted and files handled successfully'
      : 'Dashboard deleted successfully',
  };
}
