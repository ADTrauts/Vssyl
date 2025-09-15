// Widget API types
export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface WidgetConfig {
  title?: string;
  refreshInterval?: number;
  dataSource?: string;
  displayOptions?: {
    showLegend?: boolean;
    showLabels?: boolean;
    colorScheme?: string[];
  };
  filters?: {
    field: string;
    operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string | number;
  }[];
  [key: string]: unknown;
}

export interface Widget {
  id: string;
  dashboardId: string;
  type: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWidgetRequest {
  type: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
}

export interface UpdateWidgetRequest {
  type?: string;
  config?: WidgetConfig;
  position?: WidgetPosition;
}

export interface WidgetResponse {
  widget: Widget;
}

export interface WidgetsResponse {
  widgets: Widget[];
}
