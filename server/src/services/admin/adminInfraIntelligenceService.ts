import { isEmailConfigured } from '../email/config';
import { isStripeConfigured, STRIPE_CONFIG } from '../../config/stripe';
import * as adminPlatformOperationsService from './adminPlatformOperationsService';

function resolveStripeMode(): 'test' | 'live' | 'unconfigured' {
  const key = STRIPE_CONFIG.secretKey;
  if (!key) return 'unconfigured';
  if (key.startsWith('sk_live_')) return 'live';
  if (key.startsWith('sk_test_')) return 'test';
  return 'unconfigured';
}

function resolveGcpProject(): string | null {
  return process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCP_PROJECT ?? process.env.GCLOUD_PROJECT ?? null;
}

function buildCloudRunConsoleUrl(service: string | null, project: string | null): string | null {
  if (!service || !project) return null;
  return `https://console.cloud.google.com/run/detail/us-central1/${service}/metrics?project=${project}`;
}

function buildCloudSqlConsoleUrl(project: string | null): string | null {
  if (!project) return null;
  const dbUrl = process.env.DATABASE_URL ?? '';
  const instanceMatch = dbUrl.match(/@\/cloudsql\/([^:?]+)/) ?? dbUrl.match(/host=([^:\s]+)/);
  const instance = instanceMatch?.[1];
  if (instance?.includes('cloudsql')) {
    return `https://console.cloud.google.com/sql/instances?project=${project}`;
  }
  return `https://console.cloud.google.com/sql/instances?project=${project}`;
}

function buildStorageConsoleUrl(project: string | null): string | null {
  if (!project) return null;
  const bucket = process.env.GCS_BUCKET_NAME ?? process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
  if (bucket) {
    return `https://console.cloud.google.com/storage/browser/${bucket}?project=${project}`;
  }
  return `https://console.cloud.google.com/storage/browser?project=${project}`;
}

export async function getInfrastructureIntelligence() {
  const ops = await adminPlatformOperationsService.getPlatformOperationsStatus();
  const project = resolveGcpProject();
  const service = ops.platform.cloudRunService;
  const revision = ops.platform.cloudRunRevision;

  return {
    timestamp: ops.timestamp,
    overallStatus: ops.overallStatus,
    platform: {
      environment: ops.platform.environment,
      nodeVersion: ops.platform.nodeVersion,
      appVersion: ops.platform.appVersion,
      uptimeSeconds: ops.platform.uptimeSeconds,
      buildRevision: revision,
      cloudRunService: service,
    },
    modes: {
      stripe: resolveStripeMode(),
      stripeConfigured: isStripeConfigured(),
      smtp: isEmailConfigured() ? 'configured' : 'unconfigured',
    },
    services: {
      database: ops.services.database,
      storage: ops.services.storage,
      realtime: ops.services.realtime,
      search: ops.services.search,
      stripe: ops.services.stripe,
      email: ops.services.email,
      openai: ops.services.openai,
      anthropic: ops.services.anthropic,
    },
    consoleLinks: {
      cloudRun: buildCloudRunConsoleUrl(service, project),
      cloudSql: buildCloudSqlConsoleUrl(project),
      storage: buildStorageConsoleUrl(project),
      gcpProject: project,
    },
    recommendations: ops.recommendations,
    deploymentHistory: [] as Array<{ timestamp: string; revision: string | null; note: string }>,
  };
}
