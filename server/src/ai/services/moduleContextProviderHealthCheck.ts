/**
 * Admin dry-run health checks for registered module context providers (Phase 4B).
 */

import axios from 'axios';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { classifyProviderFailure, type ProviderFailureReason } from '../context/contextDensityReport';
import {
  MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES,
  MODULE_CONTEXT_PROVIDER_TIMEOUT_MS,
} from '../constants/moduleContextProvider';
import {
  buildModuleContextFetchParams,
  requiresBusinessId,
  type ContextProviderConfig,
} from './moduleContextProviderSelection';
import {
  hasProviderCertificationErrors,
  parseContextProviders,
  validateModuleAIContextProviders,
  type ModuleContextProviderCertIssue,
} from './moduleContextProviderCertification';

export type ProviderHealthStatus = 'healthy' | 'unhealthy' | 'skipped';

export interface ModuleContextProviderHealthResult {
  moduleId: string;
  moduleName: string;
  providerName: string;
  endpoint: string;
  status: ProviderHealthStatus;
  certificationIssues: ModuleContextProviderCertIssue[];
  latencyMs?: number;
  payloadBytesEstimate?: number;
  payloadOverLimit?: boolean;
  cacheDurationMs?: number;
  failureReason?: ProviderFailureReason;
  failureMessage?: string;
  skipReason?: string;
}

export interface ModuleContextProviderHealthReport {
  checkedAt: string;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  summary: {
    totalProviders: number;
    healthy: number;
    unhealthy: number;
    skipped: number;
    certificationErrors: number;
  };
  results: ModuleContextProviderHealthResult[];
}

export interface RunModuleContextProviderHealthCheckInput {
  userId: string;
  moduleId?: string;
  businessId?: string;
  dashboardId?: string;
  timeoutMs?: number;
}

function getInternalApiBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === 'production';
  return (
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.INTERNAL_API_BASE_URL ||
    (isProduction
      ? 'https://vssyl-server-235369681725.us-central1.run.app'
      : `http://127.0.0.1:${process.env.PORT || '5000'}`)
  );
}

function buildInternalAuthToken(userId: string, email: string, role: string): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured for internal context fetch');
  }

  return jwt.sign({ sub: userId, email, role }, jwtSecret, { expiresIn: '5m' });
}

function estimatePayloadBytes(data: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(data), 'utf8');
  } catch {
    return 0;
  }
}

function validateProviderResponseShape(data: unknown): string | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return 'Response must be a JSON object';
  }
  const record = data as Record<string, unknown>;
  if (record.success !== true) {
    return 'Response must include success: true';
  }
  if (!('context' in record)) {
    return 'Response must include a context field';
  }
  return null;
}

async function probeProvider(input: {
  moduleId: string;
  provider: ContextProviderConfig;
  userId: string;
  businessId?: string;
  dashboardId?: string;
  timeoutMs: number;
}): Promise<{
  status: 'healthy' | 'unhealthy';
  latencyMs?: number;
  payloadBytesEstimate?: number;
  payloadOverLimit?: boolean;
  failureReason?: ProviderFailureReason;
  failureMessage?: string;
}> {
  const start = Date.now();

  try {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, role: true },
    });

    if (!user?.email || !user?.role) {
      return {
        status: 'unhealthy',
        failureReason: 'auth',
        failureMessage: `Cannot resolve user for internal fetch: ${input.userId}`,
      };
    }

    const endpoint = input.provider.endpoint.replace(':id', input.moduleId);
    const authToken = buildInternalAuthToken(input.userId, user.email, user.role);
    const requestParams = buildModuleContextFetchParams(input.moduleId, input.userId, {
      businessId: input.businessId,
      dashboardId: input.dashboardId,
    });

    const response = await axios.get(endpoint, {
      baseURL: getInternalApiBaseUrl(),
      params: requestParams,
      headers: { Authorization: `Bearer ${authToken}` },
      timeout: input.timeoutMs,
    });

    const latencyMs = Date.now() - start;
    const shapeError = validateProviderResponseShape(response.data);
    if (shapeError) {
      return {
        status: 'unhealthy',
        latencyMs,
        failureReason: 'unknown',
        failureMessage: shapeError,
      };
    }

    const payloadBytesEstimate = estimatePayloadBytes(response.data);
    const payloadOverLimit = payloadBytesEstimate > MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES;

    return {
      status: payloadOverLimit ? 'unhealthy' : 'healthy',
      latencyMs,
      payloadBytesEstimate,
      payloadOverLimit,
      ...(payloadOverLimit
        ? {
            failureReason: 'unknown' as ProviderFailureReason,
            failureMessage: `Payload ${payloadBytesEstimate} bytes exceeds recommended max ${MODULE_CONTEXT_PROVIDER_MAX_PAYLOAD_BYTES}`,
          }
        : {}),
    };
  } catch (error: unknown) {
    const failure = classifyProviderFailure(error);
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      failureReason: failure.reason,
      failureMessage: failure.message,
    };
  }
}

export async function runModuleContextProviderHealthCheck(
  input: RunModuleContextProviderHealthCheckInput
): Promise<ModuleContextProviderHealthReport> {
  const timeoutMs = input.timeoutMs ?? MODULE_CONTEXT_PROVIDER_TIMEOUT_MS;

  const installations = await prisma.moduleInstallation.findMany({
    where: {
      userId: input.userId,
      ...(input.moduleId ? { moduleId: input.moduleId } : {}),
    },
    select: { moduleId: true },
  });

  const installedModuleIds = new Set(installations.map((row) => row.moduleId));

  const registries = await prisma.moduleAIContextRegistry.findMany({
    where: input.moduleId ? { moduleId: input.moduleId } : undefined,
    include: {
      module: { select: { name: true } },
    },
  });

  const results: ModuleContextProviderHealthResult[] = [];

  for (const registry of registries) {
    const moduleId = registry.moduleId;
    const moduleName = registry.module?.name ?? moduleId;
    const providers = parseContextProviders(registry.contextProviders);
    const certIssues = validateModuleAIContextProviders(moduleId, registry.contextProviders);

    if (providers.length === 0) {
      results.push({
        moduleId,
        moduleName,
        providerName: '(none)',
        endpoint: '',
        status: 'skipped',
        certificationIssues: certIssues,
        skipReason: 'No valid context providers registered',
      });
      continue;
    }

    if (!installedModuleIds.has(moduleId)) {
      for (const provider of providers) {
        results.push({
          moduleId,
          moduleName,
          providerName: provider.name,
          endpoint: provider.endpoint.replace(':id', moduleId),
          status: 'skipped',
          certificationIssues: certIssues,
          cacheDurationMs: provider.cacheDuration,
          skipReason: 'Module not installed for target user',
        });
      }
      continue;
    }

    if (requiresBusinessId(moduleId) && !input.businessId) {
      for (const provider of providers) {
        results.push({
          moduleId,
          moduleName,
          providerName: provider.name,
          endpoint: provider.endpoint.replace(':id', moduleId),
          status: 'skipped',
          certificationIssues: certIssues,
          cacheDurationMs: provider.cacheDuration,
          skipReason: 'businessId required for this module',
        });
      }
      continue;
    }

    if (hasProviderCertificationErrors(certIssues)) {
      for (const provider of providers) {
        results.push({
          moduleId,
          moduleName,
          providerName: provider.name,
          endpoint: provider.endpoint.replace(':id', moduleId),
          status: 'skipped',
          certificationIssues: certIssues,
          cacheDurationMs: provider.cacheDuration,
          skipReason: 'Registry certification errors',
        });
      }
      continue;
    }

    for (const provider of providers) {
      const probe = await probeProvider({
        moduleId,
        provider,
        userId: input.userId,
        businessId: input.businessId,
        dashboardId: input.dashboardId,
        timeoutMs,
      });

      results.push({
        moduleId,
        moduleName,
        providerName: provider.name,
        endpoint: provider.endpoint.replace(':id', moduleId),
        status: probe.status,
        certificationIssues: certIssues,
        latencyMs: probe.latencyMs,
        payloadBytesEstimate: probe.payloadBytesEstimate,
        payloadOverLimit: probe.payloadOverLimit,
        cacheDurationMs: provider.cacheDuration,
        failureReason: probe.failureReason,
        failureMessage: probe.failureMessage,
      });
    }
  }

  const certificationErrors = results.filter((row) =>
    hasProviderCertificationErrors(row.certificationIssues)
  ).length;

  return {
    checkedAt: new Date().toISOString(),
    userId: input.userId,
    ...(input.businessId ? { businessId: input.businessId } : {}),
    ...(input.dashboardId ? { dashboardId: input.dashboardId } : {}),
    summary: {
      totalProviders: results.length,
      healthy: results.filter((row) => row.status === 'healthy').length,
      unhealthy: results.filter((row) => row.status === 'unhealthy').length,
      skipped: results.filter((row) => row.status === 'skipped').length,
      certificationErrors,
    },
    results,
  };
}
