/** Operator-facing service health labels (Wave 0). */

export type OperatorServiceStatus = 'healthy' | 'warning' | 'offline' | 'unknown';

export interface PlatformOperationsStatus {
  timestamp: string;
  overallStatus: OperatorServiceStatus;
  platform: {
    environment: string;
    cloudRunService: string | null;
    cloudRunRevision: string | null;
    nodeVersion: string;
    appVersion: string;
    uptimeSeconds: number;
  };
  services: {
    api: { status: OperatorServiceStatus; uptimeSeconds: number };
    database: ServiceRow;
    storage: ServiceRow;
    stripe: ServiceRow;
    email: ServiceRow;
    openai: ServiceRow;
    anthropic: ServiceRow;
    realtime: ServiceRow;
    search: ServiceRow;
  };
  recommendations: string[];
}

export interface ServiceRow {
  configured: boolean;
  status: string;
  operatorStatus: OperatorServiceStatus;
  error?: string;
  details?: Record<string, unknown>;
}

export const OPERATOR_STATUS_LABEL: Record<OperatorServiceStatus, string> = {
  healthy: 'Healthy',
  warning: 'Warning',
  offline: 'Offline',
  unknown: 'Unknown',
};

export function operatorStatusDotClass(status: OperatorServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'bg-green-400';
    case 'warning':
      return 'bg-yellow-400';
    case 'offline':
      return 'bg-red-400';
    default:
      return 'bg-gray-400';
  }
}

export function operatorStatusTextClass(status: OperatorServiceStatus): string {
  switch (status) {
    case 'healthy':
      return 'text-green-600 dark:text-green-400';
    case 'warning':
      return 'text-yellow-700 dark:text-yellow-300';
    case 'offline':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-v-text-muted';
  }
}

export function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remMin = minutes % 60;
  if (hours < 48) return `${hours}h ${remMin}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

export const SERVICE_DISPLAY_NAMES: Record<keyof PlatformOperationsStatus['services'], string> = {
  api: 'API',
  database: 'Database',
  storage: 'Storage',
  stripe: 'Stripe',
  email: 'Email (SMTP)',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  realtime: 'Realtime',
  search: 'Search',
};
