import { prisma } from '../lib/prisma';
import { HouseholdRole } from '@prisma/client';

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

export async function createDashboard(userId: string, data: { name: string; layout?: any; preferences?: any; businessId?: string; institutionId?: string; householdId?: string }) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
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
  // Create the dashboard first
  const dashboard = await prisma.dashboard.create({
    data: {
      userId,
      name: data.name,
      layout: data.layout,
      preferences: data.preferences,
      businessId: data.businessId,
      institutionId: data.institutionId,
      householdId: data.householdId,
    },
  });
  // Create default widgets: chat and drive
  const chatWidget = await prisma.widget.create({
    data: {
      dashboardId: dashboard.id,
      type: 'chat',
    },
  });
  const driveWidget = await prisma.widget.create({
    data: {
      dashboardId: dashboard.id,
      type: 'drive',
    },
  });
  // Return the dashboard with widgets included
  return prisma.dashboard.findUnique({
    where: { id: dashboard.id },
    include: { widgets: true },
  });
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

export async function updateDashboard(userId: string, dashboardId: string, data: { name?: string; layout?: any; preferences?: any }) {
  // First, validate that the user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });
  
  if (!user) {
    throw new Error(`User with ID ${userId} not found`);
  }

  const updated = await prisma.dashboard.updateMany({
    where: { id: dashboardId, userId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.layout !== undefined ? { layout: data.layout } : {}),
      ...(data.preferences !== undefined ? { preferences: data.preferences } : {}),
    },
  });
  if (updated.count === 0) return null;
  return prisma.dashboard.findFirst({ where: { id: dashboardId, userId }, include: { widgets: true } });
}

export async function deleteDashboard(userId: string, dashboardId: string) {
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
      // Only household owner can delete household dashboard
      return { count: 0 };
    }

    // Delete widgets and conversations first to avoid foreign key issues
    await prisma.widget.deleteMany({
      where: { dashboardId },
    });
    
    await prisma.conversation.deleteMany({
      where: { dashboardId },
    });

    // Delete the dashboard first
    const dashboardDeleteResult = await prisma.dashboard.deleteMany({
      where: { id: dashboardId, userId },
    });

    // Then delete the household and its members
    await prisma.household.delete({
      where: { id: dashboard.householdId }
    });

    return dashboardDeleteResult;
  } else {
    // For regular dashboards, delete widgets and conversations first
    await prisma.widget.deleteMany({
      where: { dashboardId },
    });
    
    await prisma.conversation.deleteMany({
      where: { dashboardId },
    });

    // Delete the dashboard
    return prisma.dashboard.deleteMany({
      where: { id: dashboardId, userId },
    });
  }
}
