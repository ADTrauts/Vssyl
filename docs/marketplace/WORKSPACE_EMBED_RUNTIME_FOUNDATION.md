# Workspace Embed — Runtime Foundation

**Program:** Marketplace & Module Ecosystem — Phase 1B-C  
**Date:** 2026-06-24  
**Status:** **Implemented** (sandbox pilot; feature-flagged)

---

## 1. Purpose

Establish the runtime foundation for **native workspace participation** by certified partner modules — embedding via `ModuleHost` inside the business workspace shell with a secure postMessage auth bridge. Session tokens are never exposed to partner iframes.

---

## 2. Current embed audit (pre-1B-C baseline)

| Component | Location | Behavior |
|-----------|----------|----------|
| **ModuleHost** | `web/src/components/ModuleHost.tsx` | iframe / bundle runtime; legacy `host:init` + settings postMessage |
| **Standalone run** | `web/src/app/modules/run/[moduleId]/page.tsx` | Fetches runtime config; renders ModuleHost full-page |
| **Business workspace** | `BusinessWorkspaceContent.tsx` | Hardcoded switch for first-party modules; partners fell through to hub |
| **Runtime API** | `GET /api/modules/:id/runtime` | Install + scope gates; returns entry URL or bundle signed URL |
| **iframe sandbox** | ModuleHost | `allow-forms allow-scripts allow-same-origin` |
| **Navigation** | `buildBusinessWorkspaceModuleHref` | Unknown module ids → `?module=` query route |

---

## 3. Phase 1B-C runtime components

| Component | Path | Role |
|-----------|------|------|
| Shared contract | `shared/src/types/workspace-bridge.ts` | Manifest block, postMessage types, JWT audience |
| Manifest parser | `server/src/marketplace/workspaceParticipationManifest.ts` | Validate `workspaceParticipation` |
| Registry | `server/src/marketplace/workspaceParticipationRegistry.ts` | In-memory participation index |
| Bridge JWT | `server/src/marketplace/workspaceBridgeJwt.ts` | 120s signed init token, jti replay cache |
| Init API | `GET /api/modules/:id/workspace-bridge-init` | Issues signed init payload |
| Verify API | `POST /api/modules/workspace-bridge/verify` | Optional token introspection |
| Embed component | `web/src/components/PartnerModuleWorkspaceEmbed.tsx` | Runtime + bridge init loader |
| ModuleHost bridge | `web/src/components/ModuleHost.tsx` | `vssyl:workspace:v1:host:init` postMessage |
| Business embed | `BusinessWorkspaceContent.tsx` default case | Partner modules → embed |

---

## 4. Feature flags

| Variable | Default | Purpose |
|----------|---------|---------|
| `PARTNER_WORKSPACE_BRIDGE_ENABLED` | `false` | Master switch |
| `PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST` | `vssyl-pilot-assets` | Pilot allowlist |
| `PARTNER_WORKSPACE_BRIDGE_JWT_TTL_SECONDS` | `120` | Bridge token TTL (30–300) |

---

## 5. Lifecycle integration

- **Startup:** `syncAllPartnerWorkspaceParticipationsFromDatabase()` in `server/src/index.ts`
- **Module sync:** `ModuleRegistrySyncService.syncModule()` → `syncPartnerWorkspaceParticipationForModuleId()`
- **Certification:** `moduleCertificationValidator` requires valid `workspaceParticipation` when `capabilities.workspace` is set
- **Admin probe:** `GET /api/admin-portal/modules/:id/workspace-bridge-probe?issueToken=true`

---

## 6. Related documents

- [POSTMESSAGE_AUTH_BRIDGE.md](./POSTMESSAGE_AUTH_BRIDGE.md)
- [PARTNER_WORKSPACE_CONTRACT.md](./PARTNER_WORKSPACE_CONTRACT.md)
- [MARKETPLACE_PHASE_1B_C_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_C_CLOSEOUT.md)

---

**Last updated:** 2026-06-24
