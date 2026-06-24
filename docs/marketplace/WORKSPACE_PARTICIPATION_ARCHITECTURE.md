# Workspace Participation — Architecture

**Program:** Marketplace & Module Ecosystem — Phase 1A  
**Date:** 2026-06-23  
**Status:** Architecture recommendation — **implemented in Phase 1B-C** (see [WORKSPACE_EMBED_RUNTIME_FOUNDATION.md](./WORKSPACE_EMBED_RUNTIME_FOUNDATION.md))  
**Authority:** [WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md](../architecture/WORKSPACE_RUNTIME_AND_MODULE_CONTRACTS.md), `web/src/runtime/modules/`

---

## 1. Participation readiness

| Surface | Level | Partner today? |
|---------|-------|----------------|
| **Standalone runtime (`/modules/run`)** | **3 — Partner Ready** | ✅ |
| **Business workspace hub** | **2 — Pilot Ready** | ✅ Embed via `PartnerModuleWorkspaceEmbed` (flagged) |
| **Personal workspace routes** | **1 — First Party Only** | ❌ |
| **Dashboard widgets** | **1 — First Party Only** | ❌ |
| **Sidebar navigation** | **2 — Architecturally Ready** | 🟡 Installed modules + `?module=` routes |

**Composite workspace readiness: 2 / 4** (up from 1.5 after Phase 1B-C)

---

## 2. Current state

### Business workspace

`BusinessWorkspaceContent.tsx` — **hardcoded switch** for ~15 module ids:

```typescript
switch (currentModule) {
  case 'drive': return <DriveWorkspaceLanding ... />;
  case 'todo': return <TodoWorkspaceLanding ... />;
  // ...
  default: return <BusinessWorkspaceHubPanel />;  // partner modules fall through
}
```

Partner installed modules **do not render** — user gets hub panel fallback.

### Personal workspace

First-party routes: `/todo`, `/drive`, `/calendar`, etc.  
Partner modules: `/modules/run/:moduleId?scope=personal` only.

### Runtime registry

`web/src/runtime/modules/coreModuleRegistry.ts` — first-party definitions only.

`getModuleDefinition()` returns undefined for partner ids → `getUnknownModuleFallback()` for display name only.

### Marketplace UI

`web/src/app/modules/page.tsx` — "Open" → `/modules/run/:id` with scope params. ✅

### Dashboard

`WIDGET_REGISTRY` — first-party widgets only. No marketplace widget registration.

### Sidebar / navigation

`BrandedWorkDashboard.tsx` — `getModuleIcon`, `getModuleName` for built-ins.  
Installed modules from API may appear in lists but without workspace deep integration.

---

## 3. Recommended embed architecture

### Model A — Embedded ModuleHost (recommended Phase 1B)

Replace `default` case in business workspace with:

```typescript
case default:
  if (isInstalledMarketplaceModule(currentModule)) {
    return (
      <PartnerModuleWorkspaceEmbed
        moduleId={currentModule}
        scope="business"
        businessId={business.id}
        dashboardId={businessDashboardId}
      />
    );
  }
  return <BusinessWorkspaceHubPanel />;
```

`PartnerModuleWorkspaceEmbed`:
1. Fetches `GET /api/modules/:id/runtime?scope=business&businessId=...`
2. Renders `ModuleHost` full-height in workspace content area
3. postMessage bridge for settings/context (extends existing `ModuleHost`)

**URL pattern:** `/business/[id]/workspace/[moduleId]` — already used for first-party; partner ids route to embed.

### Model B — Redirect to run page (interim — current)

Keep `/modules/run` but add sidebar link from business workspace.

**Lower UX quality** — breaks workspace chrome consistency.

### Model C — First-party parity (Integrated Partner only)

Platform co-builds `PartnerWorkspaceLanding.tsx` in monorepo.

**Not scalable** — exception tier only.

---

## 4. Surface-specific requirements

### 4.1 Business workspace

| Requirement | Detail |
|-------------|--------|
| **Embed** | Full-height `ModuleHost` in content panel |
| **Auth context** | postMessage includes `businessId`, `dashboardId`, session token ref |
| **Navigation** | Module appears in installed modules list with icon from manifest |
| **Deep links** | Search results link to `/business/{id}/workspace/{moduleId}?...` |
| **Permissions** | Install record required; same gates as runtime API |

### 4.2 Personal workspace

| Requirement | Detail |
|-------------|--------|
| **Route** | `/workspace/[moduleId]` or continue `/modules/run/:id` |
| **Consistency** | Prefer embed in shell vs. standalone run page |
| **Scope** | `scope=personal` on runtime API |

### 4.3 Dashboard

| Requirement | Detail |
|-------------|--------|
| **Widget registration** | Manifest `widgets[]` declaration (future) |
| **Phase 1B scope** | **Defer** — dashboard widgets Phase 2 |
| **Minimum** | Module card linking to workspace embed |

### 4.4 Sidebar navigation

| Requirement | Detail |
|-------------|--------|
| **Icon** | From `Module.icon` or manifest |
| **Name** | From `Module.name` |
| **Ordering** | After core modules; user pin preference (future) |
| **Disabled state** | When `enabled: false` on installation |

---

## 5. Runtime requirements

| Concern | First-party | Partner embed |
|---------|-------------|---------------|
| Loading | React component import | Runtime API + ModuleHost |
| Settings | Context providers | postMessage `host:settings` |
| Tenant context | Props | postMessage `host:init` payload |
| Height/resize | Native layout | ModuleHost resize messages ✅ exists |
| Error states | Module error boundaries | Runtime API error UI |

### Proposed postMessage init payload

```typescript
{
  type: 'host:init',
  payload: {
    moduleId: string;
    moduleVersion: string;
    scope: 'personal' | 'business';
    businessId?: string;
    dashboardId?: string;
    userId: string;
    apiBaseUrl: '/api';  // proxy-relative
    permissions: string[];
  }
}
```

**Security:** Do not pass raw JWT in postMessage if avoidable — use short-lived embed token endpoint (Phase 1B design).

---

## 6. Navigation requirements

```
Business sidebar
    → installed modules from GET /api/modules/installed?scope=business
    → for each: link to /business/{id}/workspace/{moduleId}
    → PartnerModuleWorkspaceEmbed loads runtime

Personal sidebar
    → same pattern with personal scope
```

**Normalize module ids** via existing `normalizeModuleId()` — partner ids pass through unchanged (no HR-style aliasing).

---

## 7. Blockers

| ID | Blocker |
|----|---------|
| **WS-B01** | `BusinessWorkspaceContent` default case swallows partner modules |
| **WS-B02** | `coreModuleRegistry` has no marketplace resolution |
| **WS-B03** | No `PartnerModuleWorkspaceEmbed` component |
| **WS-B04** | postMessage auth bridge not standardized |
| **WS-B05** | Search deep links point to `/modules/run` not workspace |
| **WS-B06** | Dashboard widget registry static |

---

## 8. Certification requirements

| # | Requirement |
|---|-------------|
| **WS-P01** | Manifest declares supported `contexts[]` |
| **WS-P02** | Module handles `host:init` postMessage |
| **WS-P03** | Responsive layout in iframe (min height) |
| **WS-P04** | Deep links documented for search delegate |
| **WS-P05** | No navigation escape from workspace shell without user action |
| **WS-P06** | Business + personal embed tested in admin Test Lab |

---

## 9. Activity & notifications in workspace context

Workspace embed enables:
- **Notifications:** Partner implements in iframe OR future platform API
- **Activity:** Partner posts to future ingest API; timeline widget in shell (Phase 2)

Not workspace architecture per se — but embed is prerequisite for unified UX.

---

## 10. Recommendation

| Priority | Action | Phase |
|----------|--------|-------|
| **P0** | `PartnerModuleWorkspaceEmbed` + business switch default case | 1B-C ✅ |
| **P1** | postMessage init/auth bridge spec | 1B-C ✅ |
| **P1** | Installed module sidebar from API metadata | 1B-C partial |
| **P2** | Personal workspace embed route | Next |
| **P3** | Dashboard widget manifest | 2 |
| **Defer** | First-party parity landings for partners | — |

**Target readiness:** **Level 2 — Pilot Ready** for business workspace embed (Phase 1B-C).

---

**Implementation:** [WORKSPACE_EMBED_RUNTIME_FOUNDATION.md](./WORKSPACE_EMBED_RUNTIME_FOUNDATION.md), [MARKETPLACE_PHASE_1B_C_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_C_CLOSEOUT.md)

**Last updated:** 2026-06-24
