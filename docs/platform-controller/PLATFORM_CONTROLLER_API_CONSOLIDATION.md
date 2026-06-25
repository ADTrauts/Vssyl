# Platform Controller — API Consolidation

**Program:** Platform Controller Program — Phase 1A  
**Date:** 2026-06-24  
**Status:** Design only — **no API refactors in this phase**

**Source:** [`ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md`](../architecture/audits/ADMIN_PORTAL_SATELLITE_MOUNT_MAP.md) · [Architecture Audit](../admin-portal/ADMIN_PORTAL_ARCHITECTURE_AUDIT.md)

**Target prefix (long-term):** `/api/admin-portal/*` (unchanged until explicit migration program)

---

## 1. Executive summary

Twenty-one admin-adjacent API mount prefixes create **client fragmentation** (`adminApiService` calls multiple bases) and **operator confusion** about canonical paths. Phase 1A documents **merge / leave / rename / group** recommendations with rationale.

**No routes change in Phase 1A.**

| Disposition | Count |
|-------------|------:|
| **Keep canonical** | 2 |
| **Merge into canonical** | 6 |
| **Group under namespace** | 2 |
| **Leave (documented satellite)** | 3 |
| **Gate / hide** | 4 |
| **Retire / CLI** | 6 |
| **Out of scope** | 1 |

---

## 2. Consolidation principles

1. **All Platform Controller UI calls** should eventually target `/api/admin-portal/*` via Next.js proxy.
2. **Emergency and bootstrap routes** move to CLI/runbook — not operator UI.
3. **Legacy scaffolds** return 410 — do not merge mock handlers.
4. **Merge = proxy alias first** — old prefix deprecated, not broken, during transition.
5. **Domain services stay** — only mount paths consolidate.

---

## 3. Mount-by-mount recommendations

| # | Mount prefix | Handlers | Disposition | Target | Rationale | Priority |
|---|--------------|:--------:|-------------|--------|-----------|----------|
| 1 | `/api/admin-portal` | ~148 | **Keep** | — | Canonical control plane | — |
| 2 | `/api/admin-portal/security` | 7 | **Keep** | Sub-mount of canonical | Already correct pattern | — |
| 3 | `/api/admin-portal/testing` | 4 | **Gate** | Keep gated; **retire** to CLI long-term | Debug shell exec — not production ops | P3 |
| 4 | `/api/admin` | 4 | **Merge** | `/api/admin-portal/platform/block-id/*` | Block ID / audit — portal UI should use canonical | P2 |
| 5 | `/api/admin/ai-providers` | 8 | **Merge** | `/api/admin-portal/providers/*` | Providers nav panel; single client prefix | **P1** |
| 6 | `/api/admin/business-ai` | 5 | **Group** | `/api/admin-portal/programs/business-ai/*` | Business AI program — namespace clarity | P2 |
| 7 | `/api/admin/seed` | 1 | **Retire** | CLI `pnpm admin:seed-modules` | Emergency — seed-modules page hidden | P3 |
| 8 | `/api/admin/logs` | 12 | **Merge** | `/api/admin-portal/logs/*` | system-logs UI; unify auth to requireAdmin | **P1** |
| 9 | `/api/admin-override` | 6 | **Merge** | `/api/admin-portal/overrides/*` | Overrides UI already on portal | **P1** |
| 10 | `/api/admin-setup` | 6 | **Retire** | CLI bootstrap runbook | Shared-secret bootstrap — not controller UI | P3 |
| 11 | `/api/admin/hr-setup` | 2 | **Retire** | HR runbook CLI | Emergency HR — out of controller IA | P4 |
| 12 | `/api/admin/fix-hr` | 3 | **Retire** | HR runbook CLI | execSync migrations via HTTP — high risk | P4 |
| 13 | `/api/admin/create-hr-tables` | 1 | **Retire** | HR runbook CLI | Raw DDL via HTTP | P4 |
| 14 | `/api/admin/fix-subscriptions` | 2 | **Retire** | Billing runbook CLI | Raw SQL ALTER | P4 |
| 15 | `/api/centralized-ai` | ~97 | **Retire** | 410 Gone (keep fence) | Legacy mock; AI Pipeline is canonical | **P1** |
| 16 | `/api/ai-context-debug` | 6 | **Merge** | `/api/admin-portal/ai-pipeline/diagnostics/*` | Page already redirects; API should follow | P2 |
| 17 | `/api/admin/modules/ai/*` | 9 | **Merge** | `/api/admin-portal/modules/ai/*` | Module AI context — same UI, canonical prefix | **P1** |
| 18 | `/api/debug` | 3 | **Gate** | Non-prod only | Already env-gated | — |
| 19 | `/api/debug/database` | 1 | **Gate** | Non-prod only | Already env-gated | — |
| 20 | `/api/debug/business-tier` | 2 | **Gate** | Non-prod only | Already env-gated | — |
| 21 | `/api/business-ai` | — | **Leave** | — | Business-scoped, not Platform Controller | N/A |

### 3.1 Canonical internal paths (already correct — keep)

| Path | Gate | Disposition |
|------|------|-------------|
| `POST .../database/migrations/delete` | Dangerous ops env | **Keep** |
| `POST .../database/migrations/reset-baseline` | Dangerous ops env | **Keep** |
| `GET .../modules/:id/*-probe` | Inline admin check | **Keep** short-term; **rename** middleware in 1B |

---

## 4. Grouping model (target namespace)

```
/api/admin-portal/
├── (existing core, analyticsOps, platform, aiPipeline)
├── providers/          ← merge ai-providers
├── logs/               ← merge admin/logs admin paths
├── overrides/          ← merge admin-override
├── modules/
│   └── ai/             ← merge /api/admin/modules/ai
├── programs/
│   └── business-ai/    ← group business-ai admin
└── platform/
    └── block-id/       ← merge /api/admin
```

**Rename strategy:** Old prefixes return **Deprecation** header + proxy to new path for **one release cycle**.

---

## 5. Route file consolidation (backend — Phase 1C+)

| Current file | LOC | Recommendation |
|--------------|----:|----------------|
| `adminPortalRoutes.analyticsOps.ts` | 1,562 | **Split** — extract `adminPortalRoutes.moduleGovernance.ts` (submissions, probes, readiness) |
| `adminPortalRoutes.platform.ts` | 1,588 | **Split** — extract `adminPortalRoutes.configuration.ts` |
| `adminPortalRoutes.aiPipeline.ts` | 1,203 | **Leave** — subsystem scope justified |
| `adminPortalRoutes.core.ts` | 472 | **Leave** | Acceptable |

**Rationale:** File splits align with Platform Controller domains — not required for API prefix merge.

---

## 6. Client consolidation (`adminApiService.ts`)

| Current pattern | Target |
|-----------------|--------|
| Mixed `/api/admin-portal`, `/api/admin/ai-providers`, `/api/admin-override` | Single base `/api/admin-portal` |
| Module AI calls to `/api/admin/modules/ai` | `/api/admin-portal/modules/ai` |
| Business AI to `/api/admin/business-ai` | `/api/admin-portal/programs/business-ai` |

**Phase 1B:** Add alias helpers — **do not delete** old client methods until mounts proxy.

---

## 7. Auth consolidation

| Pattern | Recommendation |
|---------|----------------|
| `adminPortalShared.requireAdmin` | **Canonical** — all merged routes use this |
| Inline `req.user.role === 'ADMIN'` on probes | **Merge** to shared middleware |
| Duplicate `requireAdmin` in admin.ts, admin-override | **Remove** on merge |
| `requireRole('ADMIN')` on logs | **Align** to requireAdmin |

---

## 8. Duplicate handler review

| Duplicate | Location | Recommendation |
|-----------|----------|----------------|
| `GET /security/events` (historical) | analyticsOps | **Remove** duplicate if still present |
| centralized-ai vs ai-pipeline endpoints | two mounts | **Retire** centralized-ai |
| ai-context-debug vs pipeline diagnostics | two mounts | **Merge** to pipeline |
| BI API routes vs analytics tab | same service | **Leave** — UI already consolidated |

---

## 9. Implementation waves (planning)

| Wave | Scope | Risk |
|------|-------|------|
| **1B** | Proxy aliases: providers, overrides, module AI | Low |
| **1C** | Client `adminApiService` base unification | Medium |
| **1D** | Retire centralized-ai 410 | Low |
| **2A** | Merge admin/logs | Medium |
| **2B** | Retire emergency HTTP → CLI | High — ops process change |
| **2C** | Route file splits | Low |

---

## 10. Out of scope

- Policy Engine on admin routes
- New probe endpoints
- GraphQL or BFF layer
- `/api/pricing` merge (separate product surface — **leave** until pricing program)

---

## 11. Success criteria mapping

| Criterion | Documented |
|-----------|------------|
| 21 mounts reviewed | §3 table |
| Merge/leave/rename/group rationale | §3, §4 |
| No implementation | Phase 1A constraint |
| Client consolidation path | §6 |

---

**Last updated:** 2026-06-24 (Phase 1A design)
