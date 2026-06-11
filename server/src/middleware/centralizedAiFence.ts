/**
 * Wave 1D — centralized-ai admin fence and deprecated route retirement.
 *
 * Canonical twin path: POST /api/ai/twin → DigitalLifeTwinCore.
 * This router is admin / scaffold / diagnostics only — never a user production AI path.
 */

import type { Request, Response, NextFunction } from 'express';

export interface CentralizedAiDeprecatedRoute {
  methods: string[];
  pathPattern: RegExp;
  replacement: string;
  reason: string;
}

/** Retired duplicates — return 410 with canonical replacement. */
export const CENTRALIZED_AI_DEPRECATED_ROUTES: CentralizedAiDeprecatedRoute[] = [
  {
    methods: ['POST'],
    pathPattern: /^\/learning\/event\/?$/,
    replacement: 'POST /api/ai/learning/*',
    reason: 'User learning events are ingested via the twin learning API, not centralized-ai.',
  },
  {
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    pathPattern: /^\/models(\/|$)/,
    replacement: 'GET /api/ai/models',
    reason: 'Model catalog for twin and UI is served at /api/ai/models.',
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
  next: NextFunction
): void {
  const relativePath = relativeCentralizedAiPath(req);
  const match = matchCentralizedAiDeprecatedRoute(req.method, relativePath);
  if (!match) {
    next();
    return;
  }

  res.setHeader('Deprecation', 'true');
  res.setHeader('Link', `<${match.replacement}>; rel="successor-version"`);
  res.status(410).json({
    success: false,
    error: 'This centralized-ai route is retired.',
    reason: match.reason,
    replacement: match.replacement,
    path: relativePath,
  });
}
