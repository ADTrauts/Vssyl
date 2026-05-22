import { isValidHttpsEntryUrl, getManifestEntryUrl, asRecordJson } from '../controllers/module/moduleShared';

import {
  hasProviderCertificationErrors,
  validateModuleAIContextProviders,
} from '../ai/services/moduleContextProviderCertification';

/** Bump when certification rules change materially (stored on ModuleVersion for audit). */
export const CERTIFICATION_VALIDATOR_VERSION = '1.1.0';

export type CertificationCheckStatus = 'pass' | 'fail' | 'warn' | 'skip';

export interface ModuleCertificationChecklistItem {
  id: string;
  label: string;
  status: CertificationCheckStatus;
  message?: string;
}

export interface ModuleCertificationValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  checklist: ModuleCertificationChecklistItem[];
}

export interface ModuleCertificationInput {
  moduleId: string;
  manifest: Record<string, unknown>;
  permissions?: string[];
  /** Marketplace / third-party modules use stricter structural rules. */
  isThirdParty?: boolean;
}

const MODULE_ID_PATTERN = /^[a-z][a-z0-9-]{1,62}$/;
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.-]+)?(?:\+[\w.-]+)?$/;

const FORBIDDEN_THIRD_PARTY_CAPABILITY_PATTERNS = [
  'backend-execution',
  'server-side',
  'in-process',
  'in_process',
  'node-integration',
  'process-spawn',
  'system-access',
  'raw-database',
  'execute-on-server',
  'vssyl-server',
] as const;

const FORBIDDEN_MANIFEST_KEYS = ['backend', 'serverRuntime', 'executeOnServer', 'nodeIntegration'] as const;

function pushCheck(
  checklist: ModuleCertificationChecklistItem[],
  item: ModuleCertificationChecklistItem
): void {
  checklist.push(item);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === 'string');
}

function collectCapabilities(manifest: Record<string, unknown>): string[] {
  const caps = asStringArray(manifest.capabilities);
  const permissions = asStringArray(manifest.permissions);
  return [...caps, ...permissions];
}

function declaresAiExposure(manifest: Record<string, unknown>): boolean {
  const caps = collectCapabilities(manifest).map((c) => c.toLowerCase());
  if (caps.some((c) => c.includes('ai') || c.includes('assistant'))) return true;
  if (manifest.aiContext && typeof manifest.aiContext === 'object') return true;
  if (manifest.aiActionExecutor && typeof manifest.aiActionExecutor === 'object') return true;
  return false;
}

function declaresNotifications(manifest: Record<string, unknown>): boolean {
  const caps = collectCapabilities(manifest).map((c) => c.toLowerCase());
  if (caps.some((c) => c.includes('notification'))) return true;
  if (Array.isArray(manifest.notifications) && manifest.notifications.length > 0) return true;
  return false;
}

function declaresFileOrStorage(manifest: Record<string, unknown>): boolean {
  const caps = collectCapabilities(manifest).map((c) => c.toLowerCase());
  return caps.some((c) => c.includes('file') || c.includes('storage') || c.includes('drive'));
}

function resolveSupportedContexts(manifest: Record<string, unknown>): string[] {
  const explicit = asStringArray(manifest.supportedContexts);
  if (explicit.length > 0) return explicit;

  const features = asRecordJson(manifest.features);
  const fromFeatures = Object.keys(features).filter((k) => features[k] != null);
  if (fromFeatures.length > 0) return fromFeatures;

  const routes = asRecordJson(manifest.routes);
  const fromRoutes = Object.keys(routes).filter((k) => routes[k] != null);
  if (fromRoutes.length > 0) return fromRoutes;

  const frontend = asRecordJson(manifest.frontend);
  const inferred: string[] = [];
  if (frontend.personalUrl || frontend.entryUrl) inferred.push('personal');
  if (frontend.businessUrl) inferred.push('business');
  return inferred;
}

function resolveRuntimeType(manifest: Record<string, unknown>): 'hosted' | 'bundle' | 'invalid' {
  const entryUrl = getManifestEntryUrl(manifest);
  if (isValidHttpsEntryUrl(entryUrl)) return 'hosted';

  const frontend = asRecordJson(manifest.frontend);
  const runtimeType = typeof manifest.runtimeType === 'string' ? manifest.runtimeType.toLowerCase() : '';
  if (runtimeType === 'bundle' || runtimeType === 'iframe') {
    return runtimeType === 'bundle' ? 'bundle' : 'hosted';
  }

  if (frontend.entryPath && typeof frontend.entryPath === 'string') return 'bundle';
  if (entryUrl === '' || entryUrl === null) return 'bundle';

  return 'invalid';
}

/**
 * Structural certification validator for marketplace module manifests.
 * Not a malware scanner — enforces interoperability contract shape before admin approval.
 */
export function validateModuleCertification(
  input: ModuleCertificationInput
): ModuleCertificationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checklist: ModuleCertificationChecklistItem[] = [];
  const manifest = input.manifest;
  const isThirdParty = input.isThirdParty !== false;

  const name = typeof manifest.name === 'string' ? manifest.name.trim() : '';
  const version = typeof manifest.version === 'string' ? manifest.version.trim() : '';
  const permissions = input.permissions?.length
    ? input.permissions
    : asStringArray(manifest.permissions);

  if (!input.moduleId || !MODULE_ID_PATTERN.test(input.moduleId)) {
    const msg = 'moduleId must be lowercase alphanumeric with hyphens (2–63 chars)';
    errors.push(msg);
    pushCheck(checklist, { id: 'module_id', label: 'Module id', status: 'fail', message: msg });
  } else {
    pushCheck(checklist, { id: 'module_id', label: 'Module id', status: 'pass' });
  }

  if (!name) {
    const msg = 'manifest.name is required';
    errors.push(msg);
    pushCheck(checklist, { id: 'name', label: 'Display name', status: 'fail', message: msg });
  } else {
    pushCheck(checklist, { id: 'name', label: 'Display name', status: 'pass' });
  }

  if (!version || !SEMVER_PATTERN.test(version)) {
    const msg = 'manifest.version must be semver (e.g. 1.0.0)';
    errors.push(msg);
    pushCheck(checklist, { id: 'version', label: 'Version', status: 'fail', message: msg });
  } else {
    pushCheck(checklist, { id: 'version', label: 'Version', status: 'pass' });
  }

  const contexts = resolveSupportedContexts(manifest);
  if (contexts.length === 0) {
    const msg = 'supportedContexts (or features/routes) must declare at least one context (personal/business)';
    errors.push(msg);
    pushCheck(checklist, { id: 'contexts', label: 'Supported contexts', status: 'fail', message: msg });
  } else {
    pushCheck(checklist, {
      id: 'contexts',
      label: 'Supported contexts',
      status: 'pass',
      message: contexts.join(', '),
    });
  }

  if (!Array.isArray(permissions)) {
    const msg = 'permissions must be declared as an array';
    errors.push(msg);
    pushCheck(checklist, { id: 'permissions', label: 'Permissions', status: 'fail', message: msg });
  } else if (permissions.length === 0) {
    warnings.push('permissions array is empty — declare scopes the module needs');
    pushCheck(checklist, {
      id: 'permissions',
      label: 'Permissions',
      status: 'warn',
      message: 'Empty permissions array',
    });
  } else {
    pushCheck(checklist, { id: 'permissions', label: 'Permissions', status: 'pass' });
  }

  const runtime = asRecordJson(manifest.runtime);
  if (!runtime.apiVersion) {
    warnings.push('manifest.runtime.apiVersion is recommended');
    pushCheck(checklist, {
      id: 'runtime_api',
      label: 'Runtime apiVersion',
      status: 'warn',
      message: 'apiVersion missing',
    });
  } else {
    pushCheck(checklist, { id: 'runtime_api', label: 'Runtime apiVersion', status: 'pass' });
  }

  const runtimeType = resolveRuntimeType(manifest);
  if (runtimeType === 'invalid') {
    const msg =
      'Runtime must declare hosted HTTPS frontend.entryUrl or bundle entry (empty entryUrl + entryPath / bundle artifact)';
    errors.push(msg);
    pushCheck(checklist, { id: 'runtime_type', label: 'Runtime type', status: 'fail', message: msg });
  } else {
    pushCheck(checklist, {
      id: 'runtime_type',
      label: 'Runtime type',
      status: 'pass',
      message: runtimeType,
    });
  }

  const entryPoint = manifest.entryPoint ?? manifest.entryUrl;
  if (!entryPoint && !asRecordJson(manifest.routes).personal && !getManifestEntryUrl(manifest)) {
    warnings.push('entryPoint or routes should be declared for workspace navigation');
    pushCheck(checklist, {
      id: 'routes',
      label: 'Routes / entry',
      status: 'warn',
      message: 'No entryPoint or routes declared',
    });
  } else {
    pushCheck(checklist, { id: 'routes', label: 'Routes / entry', status: 'pass' });
  }

  if (isThirdParty) {
    for (const key of FORBIDDEN_MANIFEST_KEYS) {
      if (key in manifest) {
        const msg = `Third-party manifest must not declare in-process key "${key}"`;
        errors.push(msg);
        pushCheck(checklist, {
          id: `forbidden_${key}`,
          label: 'No in-process backend',
          status: 'fail',
          message: msg,
        });
      }
    }

    const capsLower = collectCapabilities(manifest).map((c) => c.toLowerCase());
    for (const pattern of FORBIDDEN_THIRD_PARTY_CAPABILITY_PATTERNS) {
      if (capsLower.some((c) => c.includes(pattern))) {
        const msg = `Forbidden third-party capability: ${pattern}`;
        errors.push(msg);
        pushCheck(checklist, {
          id: `cap_${pattern}`,
          label: 'Capability safety',
          status: 'fail',
          message: msg,
        });
      }
    }

    const runtimeRecord = asRecordJson(manifest.runtime);
    if (runtimeRecord.server || runtimeRecord.backend) {
      const msg = 'Third-party modules cannot declare server/backend execution in manifest.runtime';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'runtime_server',
        label: 'Runtime server claim',
        status: 'fail',
        message: msg,
      });
    }
  }

  if (declaresNotifications(manifest)) {
    const notificationMeta = manifest.notifications;
    if (!Array.isArray(notificationMeta) || notificationMeta.length === 0) {
      const msg = 'notifications capability requires manifest.notifications metadata array';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'notifications_meta',
        label: 'Notification metadata',
        status: 'fail',
        message: msg,
      });
    } else {
      pushCheck(checklist, { id: 'notifications_meta', label: 'Notification metadata', status: 'pass' });
    }
  } else {
    pushCheck(checklist, {
      id: 'notifications_meta',
      label: 'Notification metadata',
      status: 'skip',
      message: 'Module does not declare notifications',
    });
  }

  if (declaresAiExposure(manifest)) {
    const aiContext = asRecordJson(manifest.aiContext);
    const hasPurpose = typeof aiContext.purpose === 'string' && aiContext.purpose.trim().length > 0;
    const keywords = asStringArray(aiContext.keywords);
    const hasProviders =
      Array.isArray(aiContext.contextProviders) && aiContext.contextProviders.length > 0;

    if (!hasPurpose || keywords.length === 0) {
      const msg = 'AI-exposed modules require manifest.aiContext with purpose and keywords';
      errors.push(msg);
      pushCheck(checklist, { id: 'ai_context', label: 'AI context', status: 'fail', message: msg });
    } else if (!hasProviders) {
      const msg = 'AI-exposed modules require at least one manifest.aiContext.contextProvider';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'ai_context',
        label: 'AI context',
        status: 'fail',
        message: msg,
      });
    } else {
      const providerIssues = validateModuleAIContextProviders(
        input.moduleId,
        aiContext.contextProviders
      );
      if (hasProviderCertificationErrors(providerIssues)) {
        const msg = providerIssues
          .filter((issue) => issue.severity === 'error')
          .map((issue) => issue.message)
          .join('; ');
        errors.push(msg);
        pushCheck(checklist, {
          id: 'ai_context',
          label: 'AI context',
          status: 'fail',
          message: msg,
        });
      } else {
        pushCheck(checklist, { id: 'ai_context', label: 'AI context', status: 'pass' });
      }
    }
  } else {
    pushCheck(checklist, {
      id: 'ai_context',
      label: 'AI context',
      status: 'skip',
      message: 'Module does not declare AI exposure',
    });
  }

  if (declaresFileOrStorage(manifest) && permissions.length === 0) {
    warnings.push('File/storage capability declared but permissions array is empty');
    pushCheck(checklist, {
      id: 'file_permissions',
      label: 'File access declaration',
      status: 'warn',
      message: 'Declare file/storage permissions',
    });
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    checklist,
  };
}

export function buildCertificationInputFromModule(
  module: { id: string; manifest: unknown; permissions?: unknown },
  manifestSnapshot?: unknown
): ModuleCertificationInput {
  const manifest = asRecordJson(manifestSnapshot ?? module.manifest);
  return {
    moduleId: module.id,
    manifest,
    permissions: asStringArray(module.permissions),
    isThirdParty: true,
  };
}
