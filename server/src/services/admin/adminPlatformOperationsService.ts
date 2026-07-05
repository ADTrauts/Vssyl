import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { isStripeConfigured } from '../../config/stripe';
import * as adminSystemOpsService from './adminSystemOpsService';

const TIMEOUT_MS = 5000;

export type IntegrationProbeStatus = 'healthy' | 'error' | 'not_configured' | 'timeout';

export type OperatorServiceStatus = 'healthy' | 'warning' | 'offline' | 'unknown';

export interface IntegrationProbeResult {
  configured: boolean;
  status: IntegrationProbeStatus;
  error?: string;
  details?: Record<string, unknown>;
}

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
    database: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    storage: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    stripe: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    email: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    openai: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    anthropic: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    realtime: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
    search: IntegrationProbeResult & { operatorStatus: OperatorServiceStatus };
  };
  recommendations: string[];
}

function withTimeout<T>(promise: Promise<T>, ms: number, timeoutError: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(timeoutError)), ms)),
  ]);
}

export function mapProbeToOperatorStatus(probe: IntegrationProbeResult): OperatorServiceStatus {
  if (!probe.configured) return 'unknown';
  if (probe.status === 'healthy') return 'healthy';
  if (probe.status === 'timeout' || probe.status === 'error') return 'offline';
  return 'unknown';
}

function generateRecommendations(
  integrations: Record<string, IntegrationProbeResult>,
): string[] {
  const recommendations: string[] = [];

  if (!integrations.stripe?.configured) {
    recommendations.push('Stripe: Add STRIPE_SECRET_KEY to Secret Manager');
  } else if (integrations.stripe?.status === 'error' || integrations.stripe?.status === 'timeout') {
    recommendations.push(`Stripe: ${integrations.stripe.error ?? 'Check API key validity'}`);
  }

  if (!integrations.email?.configured) {
    recommendations.push('Email: Configure SMTP_HOST, SMTP_USER, and SMTP_PASS');
  } else if (integrations.email?.status === 'error' || integrations.email?.status === 'timeout') {
    recommendations.push(`Email: ${integrations.email.error ?? 'SMTP unreachable'}`);
  }

  if (!integrations.openai?.configured) {
    recommendations.push('OpenAI: Add OPENAI_API_KEY to Secret Manager');
  } else if (integrations.openai?.status === 'error' || integrations.openai?.status === 'timeout') {
    recommendations.push(`OpenAI: ${integrations.openai.error ?? 'Check API key validity'}`);
  }

  if (!integrations.anthropic?.configured) {
    recommendations.push('Anthropic: Add ANTHROPIC_API_KEY to Secret Manager');
  } else if (integrations.anthropic?.status === 'error') {
    recommendations.push(`Anthropic: ${integrations.anthropic.error ?? 'Check API key validity'}`);
  }

  if (integrations.database?.status === 'error' || integrations.database?.status === 'timeout') {
    recommendations.push('Database: Check DATABASE_URL and VPC connectivity');
  }

  if (integrations.storage?.status === 'error' || integrations.storage?.status === 'timeout') {
    recommendations.push('Storage: Check GCS bucket permissions and service account');
  }

  if (recommendations.length === 0) {
    recommendations.push('All critical services are operational.');
  }

  return recommendations;
}

function computeOverallStatus(services: PlatformOperationsStatus['services']): OperatorServiceStatus {
  const statuses = Object.values(services).map((s) => s.operatorStatus);
  if (statuses.every((s) => s === 'healthy')) return 'healthy';
  if (statuses.some((s) => s === 'offline')) return 'offline';
  if (statuses.some((s) => s === 'warning')) return 'warning';
  if (statuses.some((s) => s === 'healthy')) return 'warning';
  return 'unknown';
}

async function runIntegrationProbes(): Promise<Record<string, IntegrationProbeResult>> {
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const smtpConfigured = !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );

  const integrations: Record<string, IntegrationProbeResult> = {
    stripe: {
      configured: isStripeConfigured(),
      status: 'not_configured',
      details: {
        keyPrefix: stripeKey ? `${stripeKey.substring(0, 12)}...` : null,
        mode: stripeKey?.startsWith('sk_live_') ? 'live' : stripeKey?.startsWith('sk_test_') ? 'test' : 'unset',
        webhookConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
      },
    },
    openai: {
      configured: !!(openaiKey && openaiKey.length > 10),
      status: 'not_configured',
      details: {
        keyPrefix: openaiKey ? `${openaiKey.substring(0, 10)}...` : null,
        adminKeyConfigured: !!process.env.OPENAI_ADMIN_API_KEY,
      },
    },
    anthropic: {
      configured: !!(anthropicKey && anthropicKey.length > 10),
      status: 'not_configured',
      details: {
        keyPrefix: anthropicKey ? `${anthropicKey.substring(0, 10)}...` : null,
      },
    },
    database: {
      configured: !!process.env.DATABASE_URL,
      status: 'not_configured',
      details: {
        urlConfigured: !!process.env.DATABASE_URL,
        directUrlConfigured: !!process.env.DIRECT_URL,
      },
    },
    storage: {
      configured: true,
      status: 'not_configured',
      details: {
        provider: process.env.STORAGE_PROVIDER || 'local',
        bucket: process.env.GOOGLE_CLOUD_STORAGE_BUCKET || null,
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || null,
      },
    },
    email: {
      configured: smtpConfigured,
      status: smtpConfigured ? 'healthy' : 'not_configured',
      details: {
        host: process.env.SMTP_HOST || null,
        port: process.env.SMTP_PORT || null,
        fromConfigured: !!process.env.EMAIL_FROM || !!process.env.SMTP_FROM,
      },
    },
    realtime: {
      configured: true,
      status: 'healthy',
      details: {
        redisAdapter: !!(process.env.SOCKET_IO_REDIS_URL || process.env.REDIS_URL),
        mode:
          process.env.SOCKET_IO_REDIS_URL || process.env.REDIS_URL
            ? 'multi-instance'
            : 'single-process',
      },
    },
    search: {
      configured: true,
      status: 'not_configured',
      details: {},
    },
  };

  const checks = await Promise.allSettled([
    (async () => {
      if (!stripeKey || stripeKey.length < 10) return;
      const Stripe = (await import('stripe')).default;
      const stripe = new Stripe(stripeKey, { timeout: 10000, maxNetworkRetries: 1 });
      await withTimeout(stripe.customers.list({ limit: 1 }), TIMEOUT_MS, 'Stripe API timeout');
      integrations.stripe.status = 'healthy';
    })(),
    (async () => {
      if (!openaiKey || openaiKey.length < 10) return;
      const OpenAI = (await import('openai')).default;
      const client = new OpenAI({ apiKey: openaiKey, timeout: TIMEOUT_MS });
      await withTimeout(client.models.list(), TIMEOUT_MS, 'OpenAI API timeout');
      integrations.openai.status = 'healthy';
    })(),
    (async () => {
      if (!anthropicKey || anthropicKey.length < 10) return;
      if (anthropicKey.startsWith('sk-ant-')) {
        integrations.anthropic.status = 'healthy';
        integrations.anthropic.details = { ...integrations.anthropic.details, keyFormat: 'valid' };
      } else {
        integrations.anthropic.status = 'error';
        integrations.anthropic.error = 'Invalid key format (expected sk-ant- prefix)';
      }
    })(),
    (async () => {
      await adminSystemOpsService.probeDatabaseConnection(TIMEOUT_MS);
      integrations.database.status = 'healthy';
      try {
        const rows = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`;
        integrations.database.details = {
          ...integrations.database.details,
          version: rows[0]?.version?.split(' ')[0] ?? null,
        };
      } catch {
        // version probe is advisory
      }
    })(),
    (async () => {
      if (process.env.STORAGE_PROVIDER !== 'gcs') {
        integrations.storage.status = 'healthy';
        return;
      }
      const { Storage } = await import('@google-cloud/storage');
      const storage = new Storage();
      const bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
      if (!bucketName) {
        integrations.storage.status = 'error';
        integrations.storage.error = 'GOOGLE_CLOUD_STORAGE_BUCKET not set';
        return;
      }
      const bucket = storage.bucket(bucketName);
      await withTimeout(bucket.exists(), TIMEOUT_MS, 'GCS connection timeout');
      integrations.storage.status = 'healthy';
    })(),
    (async () => {
      const { getEnabledPartnerSearchDelegates } = await import(
        '../../marketplace/searchDelegateRegistry.js'
      );
      const delegates = getEnabledPartnerSearchDelegates();
      integrations.search.status = delegates.length > 0 ? 'healthy' : 'not_configured';
      integrations.search.details = { delegateCount: delegates.length };
    })(),
  ]);

  const checkNames = ['stripe', 'openai', 'anthropic', 'database', 'storage', 'search'];
  checks.forEach((result, index) => {
    const name = checkNames[index];
    if (result.status === 'rejected' && integrations[name]?.configured) {
      const error = result.reason;
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('timeout')) {
        integrations[name].status = 'timeout';
      } else {
        integrations[name].status = 'error';
      }
      integrations[name].error = message;
    }
  });

  return integrations;
}

/** Canonical operator-facing platform status (Wave 0). */
export async function getPlatformOperationsStatus(): Promise<PlatformOperationsStatus> {
  const integrations = await runIntegrationProbes();

  const attachOperator = (probe: IntegrationProbeResult) => ({
    ...probe,
    operatorStatus: mapProbeToOperatorStatus(probe),
  });

  const services = {
    api: {
      status: 'healthy' as OperatorServiceStatus,
      uptimeSeconds: Math.round(process.uptime()),
    },
    database: attachOperator(integrations.database),
    storage: attachOperator(integrations.storage),
    stripe: attachOperator(integrations.stripe),
    email: attachOperator(integrations.email),
    openai: attachOperator(integrations.openai),
    anthropic: attachOperator(integrations.anthropic),
    realtime: {
      ...attachOperator(integrations.realtime),
      operatorStatus: integrations.realtime.details?.redisAdapter
        ? ('healthy' as OperatorServiceStatus)
        : ('warning' as OperatorServiceStatus),
    },
    search: attachOperator(integrations.search),
  };

  return {
    timestamp: new Date().toISOString(),
    overallStatus: computeOverallStatus(services),
    platform: {
      environment: process.env.NODE_ENV || 'development',
      cloudRunService: process.env.K_SERVICE ?? null,
      cloudRunRevision: process.env.K_REVISION ?? null,
      nodeVersion: process.version,
      appVersion: process.env.npm_package_version || '1.0.0',
      uptimeSeconds: Math.round(process.uptime()),
    },
    services,
    recommendations: generateRecommendations(integrations),
  };
}

/** Legacy shape for GET /integrations/status — delegates to shared probes. */
export async function getIntegrationsStatusPayload(adminId: string) {
  const integrations = await runIntegrationProbes();
  const statuses = Object.values(integrations).map((i) => i.status);
  const overallStatus = statuses.every((s) => s === 'healthy')
    ? 'healthy'
    : statuses.some((s) => s === 'error' || s === 'timeout')
      ? 'degraded'
      : 'partial';

  await logger.info('Integration status check performed', {
    operation: 'admin_integration_status_check',
    adminId,
    overallStatus,
  });

  return {
    success: true,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    overallStatus,
    integrations,
    recommendations: generateRecommendations(integrations),
  };
}
