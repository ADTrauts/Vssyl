/**
 * Phase 3 — Operator platform API contracts (no UI; no route wiring required yet).
 * Documented for future admin/operator surfaces.
 */

export const AI_OPERATOR_API_CONTRACTS = [
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/executions',
    purpose: 'List AIExecutionRecord hubs with filters (user, business, surface, date, provider).',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/executions/:id',
    purpose: 'Get one execution record + timeline + linked artifact IDs.',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/executions/:id/explain',
    purpose: 'Architecture explainability payload (no private CoT).',
  },
  {
    method: 'POST',
    path: '/api/admin/ai/intelligence/executions/:id/evaluations',
    purpose: 'Persist operator/system evaluation + optional root causes + correction routes.',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/evaluations',
    purpose: 'List evaluations with role/label filters.',
  },
  {
    method: 'POST',
    path: '/api/admin/ai/intelligence/evaluations/:id/root-causes',
    purpose: 'Add/adjust root-cause findings (multi-cause allowed).',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/corrections',
    purpose: 'List correction routes by destination/status.',
  },
  {
    method: 'PATCH',
    path: '/api/admin/ai/intelligence/corrections/:id',
    purpose: 'Update correction status (OPEN→RESOLVED etc.). Does not auto-mutate Twin.',
  },
  {
    method: 'POST',
    path: '/api/admin/ai/intelligence/regressions',
    purpose: 'Create AIRegressionCase from an execution/evaluation.',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/regressions',
    purpose: 'List regression cases (CI not wired).',
  },
  {
    method: 'GET',
    path: '/api/admin/ai/intelligence/metrics',
    purpose: 'Return aggregated platform metrics for a time window.',
  },
  {
    method: 'POST',
    path: '/api/admin/ai/intelligence/executions/:id/replay',
    purpose: 'Accept replay request per contract (Phase 3: validate + reject execute; future sandbox).',
  },
  {
    method: 'POST',
    path: '/api/ai/feedback/evaluation',
    purpose: 'User/business evaluation attachment to an execution record (when record exists).',
  },
] as const;

export type AIOperatorApiContract = (typeof AI_OPERATOR_API_CONTRACTS)[number];
