// Dashboard API types
export interface DashboardLayout {
  type: 'grid' | 'list';
  columns?: number;
  rows?: number;
  cellSize?: {
    width: number;
    height: number;
  };
}

export interface DashboardPreferences {
  theme?: 'light' | 'dark' | 'system';
  refreshInterval?: number;
  notifications?: boolean;
  defaultView?: 'grid' | 'list';
}

export interface Dashboard {
  id: string;
  userId: string;
  name: string;
  layout?: DashboardLayout;
  preferences?: DashboardPreferences;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  dashboardId: string;
  type: string;
  config?: Record<string, unknown>;
  position?: { x: number; y: number; width: number; height: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateDashboardRequest {
  name: string;
  layout?: DashboardLayout;
  preferences?: DashboardPreferences;
  businessId?: string;
  institutionId?: string;
  householdId?: string;
}

export interface UpdateDashboardRequest {
  name?: string;
  layout?: DashboardLayout;
  preferences?: DashboardPreferences;
}

export interface DashboardResponse {
  dashboard: Dashboard;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
}
