# Module Manager Context

## Purpose
- Define how third‑party modules are submitted, reviewed, installed, and executed within Block on Block.
- Extend the existing module system without duplication. Reuse current DB models, APIs, and marketplace UI; add a safe runtime for executing approved modules.

## Fit With Existing System
- Reuse: `Module`, `ModuleSubmission`, `ModuleInstallation` (Prisma), existing routes/controllers in `server/src/controllers/moduleController.ts` and `server/src/routes/module.ts`.
- Keep: submission, review, marketplace listing, install/uninstall/configure flows.
- Add: a runtime layer to actually run third‑party UI code, plus a runtime config endpoint. No parallel "manager" or duplicated registry.

## Current State (2025‑01)
- Submission UI exists at `web/src/app/modules/submit/page.tsx` and posts to `/api/modules/submit`.
- Marketplace list, details, install/uninstall/configure endpoints exist.
- Billing and subscription checks integrated in install flow for paid modules.
- Missing piece: runtime/loader to execute third‑party UI code safely.

## Roadmap for Module Runtime

### Phase A (MVP): Frontend Micro‑Frontend Runtime via iframe
- Manifest extensions (stored inside existing `Module.manifest` JSON):
  - `runtime`: `{ apiVersion: 'v1' }`
  - `frontend`: `{ entryUrl: string }` // HTTPS URL to hosted bundle (or signed uploaded artifact URL later)
  - `permissions`: `string[]` // requested platform permissions
  - `capabilities?`: `string[]` // e.g., ['storage', 'notifications'] (UI‑only for MVP)
  - `settings?`: `Record<string, any>` // module settings schema or defaults

- Backend additions:
  - `GET /api/modules/:id/runtime` → returns sanitized runtime config if user has module installed and subscription (when applicable). Strips server‑only fields, enforces permissions.
  - Submission: accept a hosted URL now; later, optional artifact upload to local disk/S3 and set `frontend.entryUrl` on approval.

- Frontend additions:
  - `web/src/components/ModuleHost.tsx` → iframe sandbox host with strict `sandbox`/`allow` attributes and postMessage bridge.
  - `web/src/app/modules/run/[moduleId]/page.tsx` → fetch runtime config and render `ModuleHost`.
  - Update modules list to show “Open” for installed modules and route to `/modules/run/:id`.

- Security model:
  - iframe sandbox; origin allowlist equals `new URL(frontend.entryUrl).origin`.
  - No token by default. Optional short‑lived, audience‑scoped token only when explicit permission is approved.
  - All communications over postMessage with origin checks; fail‑closed defaults.

- Acceptance criteria:
  - Approved module with `frontend.entryUrl` renders via `/modules/run/:id`.
  - Install/subscription gating enforced before runtime config returns.
  - Strict origin checks and sandboxing; no console errors.

### Phase B: Marketplace & Developer Portal Enhancements
- Submission UX: hosted URL now; later, upload zip; pre‑publish validation results.
- Versioning: track versions per module; approve sets current version pointer; rollback supported.
- Developer Portal: versions, publish/unpublish, error logs, basic analytics.

### Phase C: Server‑Side Extensions (Out‑of‑Process Webhooks)
- Modules can optionally declare webhook actions the platform can invoke with signed HMAC.
- No arbitrary code execution inside our API process. Strong isolation, rate limits, timeouts.

### Phase D: Advanced Options
- Optional Module Federation for trusted partners, CDN asset signing, prefetching and in‑app updates.

## Runtime Message Protocol (MVP)
- Handshake: `host:init` → `module:ready`.
- Requests from module → host:
  - `module:request:resize` { width?, height? }
  - `module:request:settings` → host replies with `host:settings`.
  - `module:request:context` → host replies with `host:context` (non‑sensitive user/dashboard context).
  - `module:request:token` (only if permission granted) → host replies with short‑lived, audience‑scoped token.
- All messages validated; origin must match allowlisted origin.

## Example Manifest Snippet
```json
{
  "name": "Hello World",
  "version": "1.0.0",
  "description": "Sample module",
  "runtime": { "apiVersion": "v1" },
  "frontend": { "entryUrl": "https://example-cdn.com/hello-world/index.html" },
  "permissions": ["module:read"],
  "capabilities": ["notifications"],
  "settings": { "theme": "light" }
}
```

## Developer Workflow (MVP)
1. Build a static micro‑frontend and host it (HTTPS).
2. Submit module via `/modules/submit` with manifest including `frontend.entryUrl`.
3. Admin review/approve → module becomes installable.
4. User installs module → “Open” navigates to `/modules/run/:id` where `ModuleHost` loads the iframe with runtime config.

## Open Decisions
- Artifact storage: start local; migrate to S3.
- Token sharing: disabled by default; opt‑in per permission with short TTL.
- Module Federation: only for vetted partners (post‑MVP).

