import { isValidHttpsEntryUrl, getManifestEntryUrl, asRecordJson } from '../controllers/module/moduleShared';

import {
  hasProviderCertificationErrors,
  validateModuleAIContextProviders,
} from '../ai/services/moduleContextProviderCertification';
import { parseSearchDelegateFromManifest } from '../marketplace/searchDelegateManifest';
import { parseWorkspaceParticipationFromManifest } from '../marketplace/workspaceParticipationManifest';
import { parseActivityIngestFromManifest } from '../marketplace/activityIngestManifest';
import {
  validateModuleScopeManifest,
  validateSubCapabilityContexts,
} from '../marketplace/moduleScopeService';

/** Bump when certification rules change materially (stored on ModuleVersion for audit). */
export const CERTIFICATION_VALIDATOR_VERSION = '1.4.0';

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

  const scopeValidation = validateModuleScopeManifest(manifest, {
    moduleId: input.moduleId,
    requireExplicitScope: isThirdParty,
  });
  for (const scopeError of scopeValidation.errors) {
    errors.push(scopeError);
  }
  for (const scopeWarning of scopeValidation.warnings) {
    warnings.push(scopeWarning);
  }

  if (scopeValidation.errors.length > 0 || !scopeValidation.moduleScope) {
    pushCheck(checklist, {
      id: 'module_scope',
      label: 'Module scope',
      status: 'fail',
      message: scopeValidation.errors[0] ?? 'moduleScope unresolved',
    });
    pushCheck(checklist, {
      id: 'contexts',
      label: 'Supported contexts',
      status: 'fail',
      message: scopeValidation.errors.join('; ') || 'invalid',
    });
  } else {
    pushCheck(checklist, {
      id: 'module_scope',
      label: 'Module scope',
      status: 'pass',
      message: scopeValidation.moduleScope,
    });
    pushCheck(checklist, {
      id: 'contexts',
      label: 'Supported contexts',
      status: 'pass',
      message: scopeValidation.supportedContexts.join(', ') || '(internal)',
    });
  }

  const moduleTenantContexts = scopeValidation.supportedContexts;

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

  const capsRecord = asRecordJson(manifest.capabilities);
  const claimsSearch =
    capsRecord.search === true ||
    (Array.isArray(manifest.capabilities) &&
      manifest.capabilities.some((c) => typeof c === 'string' && c.toLowerCase() === 'search'));

  if (claimsSearch) {
    const { delegate, errors: delegateErrors } = parseSearchDelegateFromManifest(manifest);
    if (!delegate || delegateErrors.length > 0) {
      const msg = delegateErrors[0] ?? 'capabilities.search requires valid searchDelegate block';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'search_delegate',
        label: 'Search delegate',
        status: 'fail',
        message: msg,
      });
    } else {
      const subErr = validateSubCapabilityContexts(
        moduleTenantContexts,
        delegate.supportedContexts,
        'searchDelegate'
      );
      if (subErr) {
        errors.push(subErr);
        pushCheck(checklist, {
          id: 'search_delegate',
          label: 'Search delegate',
          status: 'fail',
          message: subErr,
        });
      } else {
        pushCheck(checklist, {
          id: 'search_delegate',
          label: 'Search delegate',
          status: 'pass',
          message: `${delegate.entityTypes.join(', ')} @ ${delegate.url.startsWith('vssyl-internal://') ? 'internal' : 'https'}`,
        });
      }
    }
  } else {
    const rawDelegate = asRecordJson(manifest.searchDelegate);
    if (rawDelegate && Object.keys(rawDelegate).length > 0) {
      warnings.push('searchDelegate declared without capabilities.search');
      pushCheck(checklist, {
        id: 'search_delegate',
        label: 'Search delegate',
        status: 'warn',
        message: 'Declare capabilities.search when using searchDelegate',
      });
    }
  }

  const claimsWorkspace =
    capsRecord.workspace === true ||
    (Array.isArray(manifest.capabilities) &&
      manifest.capabilities.some((c) => typeof c === 'string' && c.toLowerCase() === 'workspace'));

  if (claimsWorkspace) {
    const { participation, errors: workspaceErrors } =
      parseWorkspaceParticipationFromManifest(manifest);
    if (!participation || workspaceErrors.length > 0) {
      const msg =
        workspaceErrors[0] ?? 'capabilities.workspace requires valid workspaceParticipation block';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'workspace_participation',
        label: 'Workspace participation',
        status: 'fail',
        message: msg,
      });
    } else {
      const subErr = validateSubCapabilityContexts(
        moduleTenantContexts,
        participation.supportedContexts,
        'workspaceParticipation'
      );
      if (subErr) {
        errors.push(subErr);
        pushCheck(checklist, {
          id: 'workspace_participation',
          label: 'Workspace participation',
          status: 'fail',
          message: subErr,
        });
      } else {
        pushCheck(checklist, {
          id: 'workspace_participation',
          label: 'Workspace participation',
          status: 'pass',
          message: `${participation.supportedContexts.join(', ')} (${participation.embedMode})`,
        });
      }
    }
  } else {
    const rawWorkspace = asRecordJson(manifest.workspaceParticipation);
    if (rawWorkspace && Object.keys(rawWorkspace).length > 0) {
      warnings.push('workspaceParticipation declared without capabilities.workspace');
      pushCheck(checklist, {
        id: 'workspace_participation',
        label: 'Workspace participation',
        status: 'warn',
        message: 'Declare capabilities.workspace when using workspaceParticipation',
      });
    }
  }

  const claimsActivity =
    capsRecord.activity === true ||
    (Array.isArray(manifest.capabilities) &&
      manifest.capabilities.some((c) => typeof c === 'string' && c.toLowerCase() === 'activity'));

  if (claimsActivity) {
    const { ingest, errors: activityErrors } = parseActivityIngestFromManifest(manifest);
    if (!ingest || activityErrors.length > 0) {
      const msg = activityErrors[0] ?? 'capabilities.activity requires valid activityIngest block';
      errors.push(msg);
      pushCheck(checklist, {
        id: 'activity_ingest',
        label: 'Activity ingest',
        status: 'fail',
        message: msg,
      });
    } else {
      const subErr = validateSubCapabilityContexts(
        moduleTenantContexts,
        ingest.supportedContexts,
        'activityIngest'
      );
      if (subErr) {
        errors.push(subErr);
        pushCheck(checklist, {
          id: 'activity_ingest',
          label: 'Activity ingest',
          status: 'fail',
          message: subErr,
        });
      } else {
        pushCheck(checklist, {
          id: 'activity_ingest',
          label: 'Activity ingest',
          status: 'pass',
          message: `${ingest.actionTypes.join(', ')} on ${ingest.entityTypes.join(', ')}`,
        });
      }
    }
  } else {
    const rawActivity = asRecordJson(manifest.activityIngest);
    if (rawActivity && Object.keys(rawActivity).length > 0) {
      warnings.push('activityIngest declared without capabilities.activity');
      pushCheck(checklist, {
        id: 'activity_ingest',
        label: 'Activity ingest',
        status: 'warn',
        message: 'Declare capabilities.activity when using activityIngest',
      });
    }
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
