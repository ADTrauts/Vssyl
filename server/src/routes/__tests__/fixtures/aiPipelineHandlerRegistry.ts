/**
 * Canonical registry of AI Pipeline admin-portal HTTP handlers (45).
 * Used by 1B-D coverage tests and coverage report generation.
 */

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface AiPipelineHandlerSpec {
  id: string;
  method: HttpMethod;
  /** Path under /api/admin-portal */
  path: string;
  body?: Record<string, unknown>;
  /** Status codes that prove the handler was reached (not auth failure) */
  allowedStatuses?: number[];
}

const INTENT = '1bd-nonexistent-intent';
const SOURCE = '1bd-nonexistent-source';
const TOOL = '1bd-nonexistent-tool';
const TRACE = 'history-1bd-nonexistent-trace';

const DEFAULT_ALLOWED = [200, 400, 404, 409, 500];

export const AI_PIPELINE_HANDLER_REGISTRY: AiPipelineHandlerSpec[] = [
  { id: 'catalog', method: 'get', path: '/ai-pipeline/catalog' },
  { id: 'registry-graph', method: 'get', path: '/ai-pipeline/registry/graph' },
  {
    id: 'registry-validate',
    method: 'post',
    path: '/ai-pipeline/registry/validate',
    body: { entityType: 'intent', action: 'create', entityId: '', payload: {} },
  },
  {
    id: 'policies-intents-create',
    method: 'post',
    path: '/ai-pipeline/policies/intents',
    body: { id: '1bd-test-intent', name: '1B-D Test', description: 'coverage' },
  },
  {
    id: 'policies-intents-duplicate',
    method: 'post',
    path: `/ai-pipeline/policies/intents/${INTENT}/duplicate`,
    body: {},
  },
  { id: 'policies-intents-archive', method: 'post', path: `/ai-pipeline/policies/intents/${INTENT}/archive` },
  { id: 'policies-intents-restore', method: 'post', path: `/ai-pipeline/policies/intents/${INTENT}/restore` },
  { id: 'policies-intents-enable', method: 'post', path: `/ai-pipeline/policies/intents/${INTENT}/enable` },
  { id: 'policies-intents-disable', method: 'post', path: `/ai-pipeline/policies/intents/${INTENT}/disable` },
  {
    id: 'policies-intents-update',
    method: 'put',
    path: `/ai-pipeline/policies/intents/${INTENT}`,
    body: { name: 'updated' },
  },
  {
    id: 'policies-grounding-update',
    method: 'put',
    path: `/ai-pipeline/policies/grounding/${INTENT}`,
    body: { required: true },
  },
  {
    id: 'policies-grounding-create',
    method: 'post',
    path: '/ai-pipeline/policies/grounding',
    body: { intentId: INTENT, required: true },
  },
  { id: 'policies-grounding-duplicate', method: 'post', path: `/ai-pipeline/policies/grounding/${INTENT}/duplicate` },
  { id: 'policies-grounding-archive', method: 'post', path: `/ai-pipeline/policies/grounding/${INTENT}/archive` },
  { id: 'policies-grounding-restore', method: 'post', path: `/ai-pipeline/policies/grounding/${INTENT}/restore` },
  { id: 'policies-grounding-enable', method: 'post', path: `/ai-pipeline/policies/grounding/${INTENT}/enable` },
  { id: 'policies-grounding-disable', method: 'post', path: `/ai-pipeline/policies/grounding/${INTENT}/disable` },
  {
    id: 'policies-sources-update',
    method: 'put',
    path: `/ai-pipeline/policies/sources/${SOURCE}`,
    body: { enabled: true },
  },
  {
    id: 'policies-sources-create',
    method: 'post',
    path: '/ai-pipeline/policies/sources',
    body: { id: '1bd-test-source', name: 'Test Source' },
  },
  { id: 'policies-sources-duplicate', method: 'post', path: `/ai-pipeline/policies/sources/${SOURCE}/duplicate` },
  { id: 'policies-sources-archive', method: 'post', path: `/ai-pipeline/policies/sources/${SOURCE}/archive` },
  { id: 'policies-sources-restore', method: 'post', path: `/ai-pipeline/policies/sources/${SOURCE}/restore` },
  { id: 'policies-sources-enable', method: 'post', path: `/ai-pipeline/policies/sources/${SOURCE}/enable` },
  { id: 'policies-sources-disable', method: 'post', path: `/ai-pipeline/policies/sources/${SOURCE}/disable` },
  {
    id: 'policies-tools-update',
    method: 'put',
    path: `/ai-pipeline/policies/tools/${TOOL}`,
    body: { enabled: true },
  },
  {
    id: 'policies-tools-create',
    method: 'post',
    path: '/ai-pipeline/policies/tools',
    body: { id: '1bd-test-tool', name: 'Test Tool' },
  },
  { id: 'policies-tools-duplicate', method: 'post', path: `/ai-pipeline/policies/tools/${TOOL}/duplicate` },
  { id: 'policies-tools-archive', method: 'post', path: `/ai-pipeline/policies/tools/${TOOL}/archive` },
  { id: 'policies-tools-restore', method: 'post', path: `/ai-pipeline/policies/tools/${TOOL}/restore` },
  { id: 'policies-tools-enable', method: 'post', path: `/ai-pipeline/policies/tools/${TOOL}/enable` },
  { id: 'policies-tools-disable', method: 'post', path: `/ai-pipeline/policies/tools/${TOOL}/disable` },
  {
    id: 'policies-settings-update',
    method: 'put',
    path: '/ai-pipeline/policies/settings',
    body: {},
  },
  { id: 'audit', method: 'get', path: '/ai-pipeline/audit' },
  { id: 'quality-stats', method: 'get', path: '/ai-pipeline/quality/stats' },
  { id: 'diagnostics-list', method: 'get', path: '/ai-pipeline/diagnostics' },
  { id: 'diagnostics-get', method: 'get', path: `/ai-pipeline/diagnostics/${TRACE}` },
  {
    id: 'test-lab',
    method: 'post',
    path: '/ai-pipeline/test-lab',
    body: { query: '1B-D smoke ping' },
    allowedStatuses: [200, 400, 500],
  },
  {
    id: 'context-providers-health',
    method: 'post',
    path: '/ai-pipeline/context-providers/health',
    body: {},
  },
  { id: 'retention-get', method: 'get', path: '/ai-pipeline/retention' },
  {
    id: 'retention-put',
    method: 'put',
    path: '/ai-pipeline/retention',
    body: { diagnosticRetentionDays: 30 },
  },
  {
    id: 'retention-purge',
    method: 'post',
    path: '/ai-pipeline/retention/purge',
    body: { dryRun: true },
  },
  {
    id: 'diagnostics-export',
    method: 'post',
    path: '/ai-pipeline/diagnostics/export',
    body: { format: 'json', limit: 1 },
    allowedStatuses: [200, 500],
  },
  {
    id: 'diagnostics-evidence',
    method: 'get',
    path: `/ai-pipeline/diagnostics/${TRACE}/evidence`,
    allowedStatuses: [200, 404, 500],
  },
  { id: 'suggestions-metrics', method: 'get', path: '/ai-pipeline/suggestions/metrics' },
  {
    id: 'suggestions-dry-run',
    method: 'post',
    path: '/ai-pipeline/suggestions/dry-run',
    body: { fixtureId: 'meeting_prep' },
  },
];

export function apiPath(handlerPath: string): string {
  return `/api/admin-portal${handlerPath}`;
}

export function allowedStatusesFor(spec: AiPipelineHandlerSpec): number[] {
  return spec.allowedStatuses ?? DEFAULT_ALLOWED;
}
