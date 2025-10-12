import { PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { OrgChartService } from './orgChartService';
import { PermissionService } from './permissionService';

// ============================================================================
// INTERFACES
// ============================================================================

export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetVisibility {
  requiredPermission?: string;
  visibleToRoles?: string[];
  visibleToTiers?: string[];
  visibleToPositions?: string[];
  visibleToDepartments?: string[];
}

export interface CreateWidgetData {
  widgetType: string;
  title: string;
  description?: string;
  position: WidgetPosition;
  visible?: boolean;
  order?: number;
  settings?: Record<string, unknown>;
  visibility?: WidgetVisibility;
}

export interface UpdateWidgetData {
  title?: string;
  description?: string;
  position?: WidgetPosition;
  visible?: boolean;
  order?: number;
  settings?: Record<string, unknown>;
  visibility?: WidgetVisibility;
}

export interface FrontPageConfigData {
  layout?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  showAIAssistant?: boolean;
  showCompanyStats?: boolean;
  showPersonalStats?: boolean;
  showRecentActivity?: boolean;
  showQuickActions?: boolean;
  showAnnouncements?: boolean;
  showUpcomingEvents?: boolean;
  showTeamHighlights?: boolean;
  showMetrics?: boolean;
  showTasks?: boolean;
  welcomeMessage?: string;
  heroImage?: string;
  companyAnnouncements?: Record<string, unknown>[];
  quickLinks?: Record<string, unknown>[];
  allowUserCustomization?: boolean;
  userCustomizableWidgets?: string[];
}

export interface UserCustomizationData {
  hiddenWidgets?: string[];
  widgetPositions?: Record<string, WidgetPosition>;
  customSettings?: Record<string, unknown>;
  preferredView?: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class BusinessFrontPageService {
  private orgChartService: OrgChartService;
  private permissionService: PermissionService;

  constructor() {
    this.orgChartService = new OrgChartService();
    this.permissionService = new PermissionService();
  }

  // ==========================================================================
  // CONFIGURATION MANAGEMENT
  // ==========================================================================

  /**
   * Get or create front page configuration for a business
   */
  async getOrCreateConfig(businessId: string) {
    let config = await prisma.businessFrontPageConfig.findUnique({
      where: { businessId },
      include: {
        widgets: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!config) {
      // Create default configuration
      config = await this.createDefaultConfig(businessId);
    }

    return config;
  }

  /**
   * Create default configuration for a new business
   */
  async createDefaultConfig(businessId: string) {
    const config = await prisma.businessFrontPageConfig.create({
      data: {
        businessId,
        layout: this.getDefaultLayout() as any,
        theme: this.getDefaultTheme() as any,
        showAIAssistant: true,
        showCompanyStats: true,
        showPersonalStats: true,
        showRecentActivity: true,
        showQuickActions: true,
        showAnnouncements: true,
        showUpcomingEvents: true,
        showTeamHighlights: false,
        showMetrics: true,
        showTasks: true,
        allowUserCustomization: false,
        widgets: {
          create: this.getDefaultWidgets()
        }
      },
      include: {
        widgets: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return config;
  }

  /**
   * Update front page configuration
   */
  async updateConfig(businessId: string, data: FrontPageConfigData, updatedBy?: string) {
    const updateData: Record<string, unknown> = {};

    if (data.layout !== undefined) updateData.layout = data.layout;
    if (data.theme !== undefined) updateData.theme = data.theme;
    if (data.showAIAssistant !== undefined) updateData.showAIAssistant = data.showAIAssistant;
    if (data.showCompanyStats !== undefined) updateData.showCompanyStats = data.showCompanyStats;
    if (data.showPersonalStats !== undefined) updateData.showPersonalStats = data.showPersonalStats;
    if (data.showRecentActivity !== undefined) updateData.showRecentActivity = data.showRecentActivity;
    if (data.showQuickActions !== undefined) updateData.showQuickActions = data.showQuickActions;
    if (data.showAnnouncements !== undefined) updateData.showAnnouncements = data.showAnnouncements;
    if (data.showUpcomingEvents !== undefined) updateData.showUpcomingEvents = data.showUpcomingEvents;
    if (data.showTeamHighlights !== undefined) updateData.showTeamHighlights = data.showTeamHighlights;
    if (data.showMetrics !== undefined) updateData.showMetrics = data.showMetrics;
    if (data.showTasks !== undefined) updateData.showTasks = data.showTasks;
    if (data.welcomeMessage !== undefined) updateData.welcomeMessage = data.welcomeMessage;
    if (data.heroImage !== undefined) updateData.heroImage = data.heroImage;
    if (data.companyAnnouncements !== undefined) updateData.companyAnnouncements = data.companyAnnouncements;
    if (data.quickLinks !== undefined) updateData.quickLinks = data.quickLinks;
    if (data.allowUserCustomization !== undefined) updateData.allowUserCustomization = data.allowUserCustomization;
    if (data.userCustomizableWidgets !== undefined) updateData.userCustomizableWidgets = data.userCustomizableWidgets;
    if (updatedBy) updateData.updatedBy = updatedBy;

    const config = await prisma.businessFrontPageConfig.update({
      where: { businessId },
      data: updateData,
      include: {
        widgets: {
          orderBy: { order: 'asc' }
        }
      }
    });

    return config;
  }

  /**
   * Delete front page configuration (reset to default)
   */
  async deleteConfig(businessId: string) {
    await prisma.businessFrontPageConfig.delete({
      where: { businessId }
    });
  }

  // ==========================================================================
  // WIDGET MANAGEMENT
  // ==========================================================================

  /**
   * Add a new widget to the configuration
   */
  async addWidget(businessId: string, widgetData: CreateWidgetData) {
    const config = await this.getOrCreateConfig(businessId);
    
    if (!config) {
      throw new Error('Failed to create or retrieve configuration');
    }

    const widget = await prisma.businessFrontWidget.create({
      data: {
        configId: config.id,
        widgetType: widgetData.widgetType,
        title: widgetData.title,
        description: widgetData.description,
        position: widgetData.position as any,
        visible: widgetData.visible ?? true,
        order: widgetData.order ?? 0,
        settings: widgetData.settings as any || {},
        requiredPermission: widgetData.visibility?.requiredPermission,
        visibleToRoles: widgetData.visibility?.visibleToRoles,
        visibleToTiers: widgetData.visibility?.visibleToTiers,
        visibleToPositions: widgetData.visibility?.visibleToPositions,
        visibleToDepartments: widgetData.visibility?.visibleToDepartments
      }
    });

    return widget;
  }

  /**
   * Update an existing widget
   */
  async updateWidget(widgetId: string, data: UpdateWidgetData) {
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.visible !== undefined) updateData.visible = data.visible;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.visibility) {
      if (data.visibility.requiredPermission !== undefined) {
        updateData.requiredPermission = data.visibility.requiredPermission;
      }
      if (data.visibility.visibleToRoles !== undefined) {
        updateData.visibleToRoles = data.visibility.visibleToRoles;
      }
      if (data.visibility.visibleToTiers !== undefined) {
        updateData.visibleToTiers = data.visibility.visibleToTiers;
      }
      if (data.visibility.visibleToPositions !== undefined) {
        updateData.visibleToPositions = data.visibility.visibleToPositions;
      }
      if (data.visibility.visibleToDepartments !== undefined) {
        updateData.visibleToDepartments = data.visibility.visibleToDepartments;
      }
    }

    const widget = await prisma.businessFrontWidget.update({
      where: { id: widgetId },
      data: updateData
    });

    return widget;
  }

  /**
   * Delete a widget
   */
  async deleteWidget(widgetId: string) {
    await prisma.businessFrontWidget.delete({
      where: { id: widgetId }
    });
  }

  /**
   * Reorder widgets
   */
  async reorderWidgets(businessId: string, widgetOrders: { id: string; order: number }[]) {
    const config = await this.getOrCreateConfig(businessId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Update each widget's order
    await Promise.all(
      widgetOrders.map(item =>
        prisma.businessFrontWidget.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );

    // Return updated config
    return this.getOrCreateConfig(businessId);
  }

  // ==========================================================================
  // USER VIEW & PERMISSION FILTERING
  // ==========================================================================

  /**
   * Get widgets visible to a specific user
   */
  async getVisibleWidgets(businessId: string, userId: string) {
    const config = await this.getOrCreateConfig(businessId);

    // Get all widgets
    const allWidgets = config.widgets;

    // Get user's organizational context
    const userRoles = await this.getUserBusinessRoles(userId, businessId);
    const allPositions = await this.orgChartService.getPositions(businessId);
    // Filter positions for this user
    const userPositions = allPositions.filter((pos: any) => pos.userId === userId);
    const userDepartments = await this.getUserDepartments(userId, businessId);
    const userTiers = await this.getUserTiers(userId, businessId);

    // Filter widgets based on permissions
    const visibleWidgets = allWidgets.filter((widget: any) => {
      // If widget is not visible, skip
      if (!widget.visible) return false;

      // If no restrictions, everyone can see it
      if (!widget.requiredPermission &&
          !widget.visibleToRoles &&
          !widget.visibleToTiers &&
          !widget.visibleToPositions &&
          !widget.visibleToDepartments) {
        return true;
      }

      // Check required permission (if set)
      if (widget.requiredPermission) {
        const [moduleId, featureId, action] = widget.requiredPermission.split('.');
        const hasPermission = this.permissionService.checkUserPermission(
          userId,
          businessId,
          moduleId,
          featureId,
          action
        );
        if (!hasPermission) return false;
      }

      // Check role-based visibility
      if (widget.visibleToRoles && Array.isArray(widget.visibleToRoles)) {
        const allowedRoles = widget.visibleToRoles as string[];
        if (!userRoles.some((role: string) => allowedRoles.includes(role))) {
          return false;
        }
      }

      // Check tier-based visibility
      if (widget.visibleToTiers && Array.isArray(widget.visibleToTiers)) {
        const allowedTiers = widget.visibleToTiers as string[];
        if (!userTiers.some(tier => allowedTiers.includes(tier.id))) {
          return false;
        }
      }

      // Check position-based visibility
      if (widget.visibleToPositions && Array.isArray(widget.visibleToPositions)) {
        const allowedPositions = widget.visibleToPositions as string[];
        if (!userPositions.some((pos: any) => allowedPositions.includes(pos.id))) {
          return false;
        }
      }

      // Check department-based visibility
      if (widget.visibleToDepartments && Array.isArray(widget.visibleToDepartments)) {
        const allowedDepts = widget.visibleToDepartments as string[];
        if (!userDepartments.some((dept: { id: string }) => allowedDepts.includes(dept.id))) {
          return false;
        }
      }

      return true;
    });

    return visibleWidgets;
  }

  /**
   * Get user's personalized front page view
   */
  async getUserView(businessId: string, userId: string) {
    const config = await this.getOrCreateConfig(businessId);
    const visibleWidgets = await this.getVisibleWidgets(businessId, userId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    // Get user customizations if allowed
    let userCustomization = null;
    if (config.allowUserCustomization) {
      userCustomization = await prisma.userFrontPageCustomization.findUnique({
        where: {
          userId_businessId: {
            userId,
            businessId
          }
        }
      });

      // Apply user customizations
      if (userCustomization?.hiddenWidgets && Array.isArray(userCustomization.hiddenWidgets)) {
        const hiddenWidgets = userCustomization.hiddenWidgets as string[];
        const filteredWidgets = visibleWidgets.filter((w: any) => !hiddenWidgets.includes(w.id));
        return {
          config,
          widgets: filteredWidgets,
          userCustomization
        };
      }
    }

    return {
      config,
      widgets: visibleWidgets,
      userCustomization
    };
  }

  // ==========================================================================
  // USER CUSTOMIZATION
  // ==========================================================================

  /**
   * Save user customization
   */
  async saveUserCustomization(
    businessId: string,
    userId: string,
    data: UserCustomizationData
  ) {
    const config = await this.getOrCreateConfig(businessId);
    
    if (!config) {
      throw new Error('Configuration not found');
    }

    if (!config.allowUserCustomization) {
      throw new Error('User customization is not enabled for this business');
    }

    const customization = await prisma.userFrontPageCustomization.upsert({
      where: {
        userId_businessId: {
          userId,
          businessId
        }
      },
      update: {
        hiddenWidgets: data.hiddenWidgets,
        widgetPositions: data.widgetPositions as any
      },
      create: {
        userId,
        businessId,
        hiddenWidgets: data.hiddenWidgets,
        widgetPositions: data.widgetPositions as any
      }
    });

    return customization;
  }

  /**
   * Reset user customization
   */
  async resetUserCustomization(businessId: string, userId: string) {
    await prisma.userFrontPageCustomization.deleteMany({
      where: {
        userId,
        businessId
      }
    });
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Get user's business roles
   */
  private async getUserBusinessRoles(userId: string, businessId: string): Promise<string[]> {
    const member = await prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId
        }
      }
    });

    return member ? [member.role] : [];
  }

  /**
   * Get user's departments
   */
  private async getUserDepartments(userId: string, businessId: string) {
    const allPositions = await this.orgChartService.getPositions(businessId);
    const positions = allPositions.filter((pos: any) => pos.userId === userId);
    const departmentIds = positions
      .filter((pos: any) => pos.departmentId)
      .map((pos: any) => pos.departmentId as string);

    if (departmentIds.length === 0) return [];

    const departments = await prisma.department.findMany({
      where: {
        id: { in: departmentIds }
      }
    });

    return departments;
  }

  /**
   * Get user's organizational tiers
   */
  private async getUserTiers(userId: string, businessId: string) {
    const allPositions = await this.orgChartService.getPositions(businessId);
    const positions = allPositions.filter((pos: any) => pos.userId === userId);
    const tierIds = positions.map((pos: any) => pos.tierId);

    if (tierIds.length === 0) return [];

    const tiers = await prisma.organizationalTier.findMany({
      where: {
        id: { in: tierIds }
      }
    });

    return tiers;
  }

  /**
   * Get default layout configuration
   */
  private getDefaultLayout(): Record<string, unknown> {
    return {
      type: 'grid',
      columns: 12,
      rowHeight: 60,
      gap: 16
    };
  }

  /**
   * Get default theme configuration
   */
  private getDefaultTheme(): Record<string, unknown> {
    return {
      spacing: 'comfortable',
      borderRadius: 'medium',
      shadows: true
    };
  }

  /**
   * Get default widgets for new business
   */
  private getDefaultWidgets() {
    return [
      {
        widgetType: 'ai-assistant',
        title: 'AI Assistant',
        description: 'Your daily briefing and personalized insights',
        position: { x: 0, y: 0, width: 12, height: 3 },
        visible: true,
        order: 0,
        settings: {}
      },
      {
        widgetType: 'company-stats',
        title: 'Company Overview',
        description: 'Key business metrics and performance',
        position: { x: 0, y: 3, width: 4, height: 2 },
        visible: true,
        order: 1,
        settings: {}
      },
      {
        widgetType: 'personal-stats',
        title: 'My Performance',
        description: 'Your individual metrics and goals',
        position: { x: 4, y: 3, width: 4, height: 2 },
        visible: true,
        order: 2,
        settings: {}
      },
      {
        widgetType: 'quick-actions',
        title: 'Quick Actions',
        description: 'Frequently used tools and shortcuts',
        position: { x: 8, y: 3, width: 4, height: 2 },
        visible: true,
        order: 3,
        settings: {}
      },
      {
        widgetType: 'announcements',
        title: 'Announcements',
        description: 'Company news and updates',
        position: { x: 0, y: 5, width: 6, height: 3 },
        visible: true,
        order: 4,
        settings: {}
      },
      {
        widgetType: 'recent-activity',
        title: 'Recent Activity',
        description: 'Latest updates and actions',
        position: { x: 6, y: 5, width: 6, height: 3 },
        visible: true,
        order: 5,
        settings: {}
      }
    ];
  }
}

// Export singleton instance
const businessFrontPageService = new BusinessFrontPageService();
export default businessFrontPageService;

