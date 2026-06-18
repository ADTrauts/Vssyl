/**
 * Wave 1D / 0D-B — centralized-ai admin fence and deprecated route retirement.
 *
 * Canonical twin path: POST /api/ai/twin → DigitalLifeTwinCore.
 * This router is admin / scaffold / diagnostics only — never a user production AI path.
 *
 * Package 0D-B: expands 410 fences for mock scaffold + former ai-learning consumers.
 * Package 0D-G: middleware is the sole mount handler — always 410; router file deleted.
 */

import type { Request, Response, NextFunction } from 'express';

export interface CentralizedAiDeprecatedRoute {
  methods: string[];
  pathPattern: RegExp;
  replacement: string;
  reason: string;
  /** Retirement package that introduced this fence */
  phase?: 'wave-1d' | '0d-b-scaffold' | '0d-b-learning';
}

const ALL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

/** Retired duplicates and scaffold — return 410 with canonical replacement. */
export const CENTRALIZED_AI_DEPRECATED_ROUTES: CentralizedAiDeprecatedRoute[] = [
  // --- Wave 1D (pre-0D-B) ---
  {
    methods: ['POST'],
    pathPattern: /^\/learning\/event\/?$/,
    replacement: 'POST /api/ai/learning/*',
    reason: 'User learning events are ingested via the twin learning API, not centralized-ai.',
    phase: 'wave-1d',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/models(\/|$)/,
    replacement: 'GET /api/ai/models',
    reason: 'Model catalog for twin and UI is served at /api/ai/models.',
    phase: 'wave-1d',
  },

  // --- 0D-B: former ai-learning admin consumers (page redirected to AI Pipeline) ---
  {
    methods: ['GET'],
    pathPattern: /^\/health\/?$/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Centralized learning health admin moved to AI Pipeline control plane.',
    phase: '0d-b-learning',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/patterns(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Pattern administration is owned by AI Pipeline; user learning data uses /api/ai/learning/*.',
    phase: '0d-b-learning',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/insights(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Collective insights admin is consolidated under AI Pipeline.',
    phase: '0d-b-learning',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/privacy(\/|$)/,
    replacement: '/admin-portal/ai-pipeline/compliance',
    reason: 'Privacy settings admin is owned by AI Pipeline compliance surfaces.',
    phase: '0d-b-learning',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/consent(\/|$)/,
    replacement: '/admin-portal/ai-pipeline/compliance',
    reason: 'Consent stats admin is owned by AI Pipeline compliance surfaces.',
    phase: '0d-b-learning',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/scheduler(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Scheduler triggers were scaffold-only; use pipeline diagnostics and platform jobs.',
    phase: '0d-b-learning',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/analytics(\/|$)/,
    replacement: '/admin-portal/analytics',
    reason: 'Centralized-ai analytics scaffold retired; platform analytics owns charts (0C).',
    phase: '0d-b-learning',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/audit(\/|$)/,
    replacement: '/admin-portal/ai-pipeline/audit',
    reason: 'AI learning audit logs are available via AI Pipeline policy audit.',
    phase: '0d-b-learning',
  },

  // --- 0D-B: mock scaffold domains (no active consumers) ---
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/performance(\/|$)/,
    replacement: '/admin-portal/performance',
    reason: 'Mock performance scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/security(\/|$)/,
    replacement: '/admin-portal/security',
    reason: 'Mock security scaffold retired; use Admin Portal security surface.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/ab-testing(\/|$)/,
    replacement: '/admin-portal/ai-pipeline/test-lab',
    reason: 'A/B testing scaffold retired; evaluation uses AI Pipeline test lab.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/notifications(\/|$)/,
    replacement: '/admin-portal/notifications',
    reason: 'Notification scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/sso(\/|$)/,
    replacement: '/admin-portal/system',
    reason: 'SSO scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/automl(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'AutoML mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/workflows(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Workflow mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/decision-support(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Decision-support mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/predictive-maintenance(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Predictive maintenance mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/continuous-learning(\/|$)/,
    replacement: '/api/ai/learning/*',
    reason: 'Continuous learning HTTP scaffold retired; user path is /api/ai/learning/*.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/predictive(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'Predictive analytics mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/business(\/|$)/,
    replacement: '/admin-portal/business-ai',
    reason: 'Business metrics mock scaffold retired; use Business AI admin satellite.',
    phase: '0d-b-scaffold',
  },
  {
    methods: [...ALL_METHODS],
    pathPattern: /^\/ai-insights(\/|$)/,
    replacement: '/admin-portal/ai-pipeline',
    reason: 'AI insights mock scaffold retired from centralized-ai.',
    phase: '0d-b-scaffold',
  },
];

export function relativeCentralizedAiPath(req: Request): string {
  const prefix = '/api/centralized-ai';
  const raw = req.path.startsWith(prefix) ? req.path.slice(prefix.length) : req.path;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return normalized === '' ? '/' : normalized;
}

export function matchCentralizedAiDeprecatedRoute(
  method: string,
  relativePath: string
): CentralizedAiDeprecatedRoute | undefined {
  const upper = method.toUpperCase();
  return CENTRALIZED_AI_DEPRECATED_ROUTES.find(
    (route) => route.methods.includes(upper) && route.pathPattern.test(relativePath)
  );
}

export function centralizedAiDeprecatedMiddleware(
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const relativePath = relativeCentralizedAiPath(req);
  const match = matchCentralizedAiDeprecatedRoute(req.method, relativePath);

  const replacement = match?.replacement ?? '/admin-portal/ai-pipeline';
  const reason =
    match?.reason ??
    'The centralized-ai API is retired. Use AI Pipeline admin surfaces and twin APIs.';

  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `<${replacement}>; rel="successor-version"`);
  res.status(410).json({
    success: false,
    error: 'This centralized-ai route is retired.',
    reason,
    replacement,
    path: relativePath,
  });
}

/** Fence rules introduced in 0D-B (for tests and retirement register). */
export function getCentralizedAi0dBFenceRules(): CentralizedAiDeprecatedRoute[] {
  return CENTRALIZED_AI_DEPRECATED_ROUTES.filter(
    (route) => route.phase === '0d-b-scaffold' || route.phase === '0d-b-learning'
  );
}
