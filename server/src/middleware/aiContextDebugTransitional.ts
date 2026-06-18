/**
 * Package 0D-E — transitional deprecation headers for ai-context-debug.
 * Endpoints remain callable; canonical successor is AI Pipeline diagnostics.
 * Full retirement scheduled 0D-F per ADMIN_PORTAL_AI_CONTEXT_DEBUG_DISPOSITION.md.
 */

import type { Request, Response, NextFunction } from 'express';

export interface AiContextDebugTransitionalRoute {
  methods: string[];
  pathPattern: RegExp;
  successor: string;
  disposition: 'MERGE' | 'KEEP' | 'REDIRECT';
}

export const AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES: AiContextDebugTransitionalRoute[] = [
  {
    methods: ['GET'],
    pathPattern: /^\/user\/[^/]+$/,
    successor: '/api/admin-portal/ai-pipeline/diagnostics?userId=',
    disposition: 'MERGE',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/session\/[^/]+$/,
    successor: '/api/admin-portal/ai-pipeline/diagnostics',
    disposition: 'MERGE',
  },
  {
    methods: ['POST'],
    pathPattern: /^\/validate\/?$/,
    successor: '/admin-portal/ai-pipeline/test-lab',
    disposition: 'KEEP',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/cross-module\/[^/]+$/,
    successor: '/api/admin-portal/ai-pipeline/context-providers/health',
    disposition: 'MERGE',
  },
  {
    methods: ['GET'],
    pathPattern: /^\/stats\/?$/,
    successor: '/api/admin-portal/ai-pipeline/quality/stats',
    disposition: 'MERGE',
  },
  {
    methods: ['POST'],
    pathPattern: /^\/assemble\/?$/,
    successor: '/api/admin-portal/ai-pipeline/diagnostics/:traceId/evidence',
    disposition: 'MERGE',
  },
];

export function relativeAiContextDebugPath(req: Request): string {
  const prefix = '/api/ai-context-debug';
  const raw = req.path.startsWith(prefix) ? req.path.slice(prefix.length) : req.path;
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return normalized === '' ? '/' : normalized;
}

export function matchAiContextDebugTransitionalRoute(
  method: string,
  relativePath: string
): AiContextDebugTransitionalRoute | undefined {
  const upper = method.toUpperCase();
  return AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES.find(
    (route) => route.methods.includes(upper) && route.pathPattern.test(relativePath)
  );
}

export function aiContextDebugTransitionalMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const relativePath = relativeAiContextDebugPath(req);
  const match = matchAiContextDebugTransitionalRoute(req.method, relativePath);
  if (match) {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', `<${match.successor}>; rel="successor-version"`);
    res.setHeader('X-AI-Context-Debug-Disposition', match.disposition);
  }
  next();
}

/** All six handlers must match a transitional rule (0D-E invariant). */
export function getAiContextDebugTransitionalRouteCount(): number {
  return AI_CONTEXT_DEBUG_TRANSITIONAL_ROUTES.length;
}
