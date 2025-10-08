import { PrismaClient } from '@prisma/client';
import { Permission, PermissionSet, Position, EmployeePosition } from '@prisma/client';
import { prisma } from '../lib/prisma';

// ============================================================================
// INTERFACES
// ============================================================================

interface PermissionDependency {
  moduleId: string;
  featureId: string;
  action: string;
  required: boolean;
}

interface PermissionConflict {
  moduleId: string;
  featureId: string;
  action: string;
  reason: string;
}

interface PermissionData {
  moduleId: string;
  featureId: string;
  action: string;
  description?: string;
  category?: string;
}

interface CustomPermission {
  id: string;
  moduleId: string;
  featureId: string;
  action: string;
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface CreatePermissionData {
  moduleId: string;
  featureId: string;
  action: string;
  description: string;
  category: 'basic' | 'advanced' | 'admin';
  dependencies?: unknown;
  conflicts?: unknown;
}

export interface CreatePermissionSetData {
  businessId: string;
  name: string;
  description?: string;
  permissions: PermissionData[];
  category: 'basic' | 'advanced' | 'admin';
  template?: boolean;
}

export interface PermissionCheckResult {
  hasPermission: boolean;
  permission?: Permission;
  inheritedFrom?: string;
  customOverride?: boolean;
}

export interface UserPermissions {
  userId: string;
  businessId: string;
  permissions: Permission[];
  positions: Position[];
  customPermissions: CustomPermission[];
}

export class PermissionService {
  /**
   * Create a new permission
   */
  async createPermission(data: CreatePermissionData): Promise<Permission> {
    return await prisma.permission.create({
      data: {
        moduleId: data.moduleId,
        featureId: data.featureId,
        action: data.action,
        description: data.description,
        category: data.category,
        // TODO: Prisma JSON compatibility issue - using any temporarily
        // Need to research proper Prisma JSON field typing solutions
        dependencies: data.dependencies as any,
        conflicts: data.conflicts as any,
      },
    });
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await prisma.permission.findMany({
      orderBy: [
        { moduleId: 'asc' },
        { featureId: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(moduleId: string): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: { moduleId },
      orderBy: [
        { featureId: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  /**
   * Get permissions by category
   */
  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: { category },
      orderBy: [
        { moduleId: 'asc' },
        { featureId: 'asc' },
        { action: 'asc' },
      ],
    });
  }

  /**
   * Create a new permission set
   */
  async createPermissionSet(data: CreatePermissionSetData): Promise<PermissionSet> {
    return await prisma.permissionSet.create({
      data: {
        businessId: data.businessId,
        name: data.name,
        description: data.description,
        // TODO: Prisma JSON compatibility issue - using any temporarily
        // Need to research proper Prisma JSON field typing solutions
        permissions: data.permissions as any,
        category: data.category,
        template: data.template || false,
      },
    });
  }

  /**
   * Get all permission sets for a business
   */
  async getPermissionSets(businessId: string): Promise<PermissionSet[]> {
    return await prisma.permissionSet.findMany({
      where: { businessId },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Get permission set by ID
   */
  async getPermissionSet(id: string): Promise<PermissionSet | null> {
    return await prisma.permissionSet.findUnique({
      where: { id },
    });
  }

  /**
   * Update a permission set
   */
  async updatePermissionSet(
    id: string,
    data: Partial<Omit<CreatePermissionSetData, 'businessId'>>
  ): Promise<PermissionSet> {
    const updateData: Record<string, unknown> = { ...data };
    
    // Handle JSON fields separately for Prisma compatibility
    // TODO: Prisma JSON compatibility issue - using any temporarily
    if (data.permissions) {
      updateData.permissions = data.permissions as any;
    }
    
    return await prisma.permissionSet.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Delete a permission set
   */
  async deletePermissionSet(id: string): Promise<void> {
    await prisma.permissionSet.delete({
      where: { id },
    });
  }

  /**
   * Get template permission sets
   */
  async getTemplatePermissionSets(): Promise<PermissionSet[]> {
    return await prisma.permissionSet.findMany({
      where: { template: true },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });
  }

  /**
   * Copy a permission set as a template
   */
  async copyPermissionSetAsTemplate(
    sourceId: string,
    businessId: string,
    newName: string
  ): Promise<PermissionSet> {
    const source = await this.getPermissionSet(sourceId);
    if (!source) {
      throw new Error('Source permission set not found');
    }

    return await this.createPermissionSet({
      businessId,
      name: newName,
      description: `Copy of ${source.name}`,
      permissions: source.permissions as any[],
      category: source.category as 'basic' | 'advanced' | 'admin',
      template: false,
    });
  }

  /**
   * Check if a user has a specific permission
   */
  async checkUserPermission(
    userId: string,
    businessId: string,
    moduleId: string,
    featureId: string,
    action: string
  ): Promise<PermissionCheckResult> {
    // Get user's positions and permissions
    const employeePositions = await prisma.employeePosition.findMany({
      where: {
        userId,
        businessId,
        active: true,
      },
      include: {
        position: {
          include: {
            tier: true,
            department: true,
          },
        },

      },
    });

    if (employeePositions.length === 0) {
      return { hasPermission: false };
    }

    // Check position permissions
    for (const empPos of employeePositions) {
      const position = empPos.position;
      
      // Check position-level permissions
      if (position.permissions) {
        const posPermissions = position.permissions as any[];
        const hasPosPermission = posPermissions.some(p => 
          p.moduleId === moduleId && 
          p.featureId === featureId && 
          p.action === action
        );
        
        if (hasPosPermission) {
          return {
            hasPermission: true,
            inheritedFrom: `Position: ${position.title}`,
          };
        }
      }

      // Check tier-level permissions
      if (position.tier?.defaultPermissions) {
        const tierPermissions = position.tier.defaultPermissions as any[];
        const hasTierPermission = tierPermissions.some(p => 
          p.moduleId === moduleId && 
          p.featureId === featureId && 
          p.action === action
        );
        
        if (hasTierPermission) {
          return {
            hasPermission: true,
            inheritedFrom: `Tier: ${position.tier.name}`,
          };
        }
      }

      // Check department-level permissions
      if (position.department?.departmentPermissions) {
        const deptPermissions = position.department.departmentPermissions as any[];
        const hasDeptPermission = deptPermissions.some(p => 
          p.moduleId === moduleId && 
          p.featureId === featureId && 
          p.action === action
        );
        
        if (hasDeptPermission) {
          return {
            hasPermission: true,
            inheritedFrom: `Department: ${position.department.name}`,
          };
        }
      }

      // Check custom permissions
      if (empPos.customPermissions) {
        const customPermissions = empPos.customPermissions as any[];
        const hasCustomPermission = customPermissions.some(p => 
          p.moduleId === moduleId && 
          p.featureId === featureId && 
          p.action === action
        );
        
        if (hasCustomPermission) {
          return {
            hasPermission: true,
            inheritedFrom: `Custom: ${position.title}`,
            customOverride: true,
          };
        }
      }
    }

    return { hasPermission: false };
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string, businessId: string): Promise<UserPermissions> {
    const employeePositions = await prisma.employeePosition.findMany({
      where: {
        userId,
        businessId,
        active: true,
      },
      include: {
        position: {
          include: {
            tier: true,
            department: true,
          },
        },

      },
    });

    const permissions = new Map<string, Permission>();
    const positions: Position[] = [];
    const customPermissions: CustomPermission[] = [];

    for (const empPos of employeePositions) {
      const position = empPos.position;
      positions.push(position);

      // Collect position permissions
      if (position.permissions) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        const posPermissions = position.permissions as any[];
        for (const perm of posPermissions) {
          const key = `${perm.moduleId}:${perm.featureId}:${perm.action}`;
          if (!permissions.has(key)) {
            permissions.set(key, perm as Permission);
          }
        }
      }

      // Collect tier permissions
      if (position.tier?.defaultPermissions) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        const tierPermissions = position.tier.defaultPermissions as any[];
        for (const perm of tierPermissions) {
          const key = `${perm.moduleId}:${perm.featureId}:${perm.action}`;
          if (!permissions.has(key)) {
            permissions.set(key, perm as Permission);
          }
        }
      }

      // Collect department permissions
      if (position.department?.departmentPermissions) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        const deptPermissions = position.department.departmentPermissions as any[];
        for (const perm of deptPermissions) {
          const key = `${perm.moduleId}:${perm.featureId}:${perm.action}`;
          if (!permissions.has(key)) {
            permissions.set(key, perm as Permission);
          }
        }
      }

      // Collect custom permissions
      if (empPos.customPermissions) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        customPermissions.push(...(empPos.customPermissions as any[]));
      }
    }

    return {
      userId,
      businessId,
      permissions: Array.from(permissions.values()),
      positions,
      customPermissions,
    };
  }

  /**
   * Grant custom permission to a user
   */
  async grantCustomPermission(
    userId: string,
    positionId: string,
    businessId: string,
    permission: CustomPermission
  ): Promise<void> {
    await prisma.employeePosition.updateMany({
      where: {
        userId,
        positionId,
        businessId,
        active: true,
      },
      data: {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        customPermissions: {
          push: permission as any,
        },
      },
    });
  }

  /**
   * Revoke custom permission from a user
   */
  async revokeCustomPermission(
    userId: string,
    positionId: string,
    businessId: string,
    permissionKey: string
  ): Promise<void> {
    const empPos = await prisma.employeePosition.findFirst({
      where: {
        userId,
        positionId,
        businessId,
        active: true,
      },
    });

    if (empPos && empPos.customPermissions) {
      const customPermissions = empPos.customPermissions as any[];
      const filteredPermissions = customPermissions.filter(p => 
        `${p.moduleId}:${p.featureId}:${p.action}` !== permissionKey
      );

      await prisma.employeePosition.update({
        where: { id: empPos.id },
        data: {
          customPermissions: filteredPermissions,
        },
      });
    }
  }

  /**
   * Get permission summary for a business
   */
  async getBusinessPermissionSummary(businessId: string): Promise<{
    totalPositions: number;
    totalEmployees: number;
    permissionSets: number;
    modulesWithPermissions: string[];
    permissionDistribution: Record<string, number>;
  }> {
    const [positions, employees, permissionSets] = await Promise.all([
      prisma.position.count({ where: { businessId } }),
      prisma.employeePosition.count({ 
        where: { businessId, active: true } 
      }),
      prisma.permissionSet.count({ where: { businessId } }),
    ]);

    // Get unique modules with permissions
    const permissions = await prisma.permission.findMany({
      select: { moduleId: true },
      distinct: ['moduleId'],
    });

    const modulesWithPermissions = permissions.map(p => p.moduleId);

    // Get permission distribution by category
    const permissionDistribution = await prisma.permission.groupBy({
      by: ['category'],
      _count: { category: true },
    });

    const distribution: Record<string, number> = {};
    for (const item of permissionDistribution) {
      distribution[item.category] = item._count.category;
    }

    return {
      totalPositions: positions,
      totalEmployees: employees,
      permissionSets,
      modulesWithPermissions,
      permissionDistribution: distribution,
    };
  }

  /**
   * Validate permission dependencies
   */
  async validatePermissionDependencies(permissions: PermissionData[]): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const allPermissions = await this.getAllPermissions();
    const permissionMap = new Map(
      allPermissions.map(p => [`${p.moduleId}:${p.featureId}:${p.action}`, p])
    );

    for (const permission of permissions) {
      const key = `${permission.moduleId}:${permission.featureId}:${permission.action}`;
      const perm = permissionMap.get(key);

      if (perm?.dependencies) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        const dependencies = perm.dependencies as any[];
        for (const dep of dependencies) {
          const depKey = `${dep.moduleId}:${dep.featureId}:${dep.action}`;
          const hasDependency = permissions.some(p => 
            `${p.moduleId}:${p.featureId}:${p.action}` === depKey
          );

          if (!hasDependency) {
            errors.push(
              `Permission ${key} requires dependency ${depKey}`
            );
          }
        }
      }

      if (perm?.conflicts) {
        // TODO: Prisma JSON compatibility issue - using any temporarily
        const conflicts = perm.conflicts as any[];
        for (const conflict of conflicts) {
          const conflictKey = `${conflict.moduleId}:${conflict.featureId}:${conflict.action}`;
          const hasConflict = permissions.some(p => 
            `${p.moduleId}:${p.featureId}:${p.action}` === conflictKey
          );

          if (hasConflict) {
            errors.push(
              `Permission ${key} conflicts with ${conflictKey}`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default new PermissionService();
