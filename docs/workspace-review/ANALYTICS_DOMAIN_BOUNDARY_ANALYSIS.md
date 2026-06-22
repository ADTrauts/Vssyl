# Analytics Domain Boundary Analysis

**Program:** Workspace & Dashboard Constitutional Review  
**Assessment date:** 2026-06-21  
**Status:** Discovery only — no implementation, no certification, no ledger changes

**Authority:** [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) §0.1; [moduleSpecs.md](../../memory-bank/moduleSpecs.md) Activity vs Analytics; [ANALYTICS_PERMISSION_MODEL.md](../architecture/ANALYTICS_PERMISSION_MODEL.md)

---

## Purpose

Determine whether Analytics is a module, platform capability, Admin Portal responsibility, or Dashboard responsibility. Resolve ledger ambiguity (`analytics` L1 pseudo-module row).

---

## 1. Executive determination

| Question | Answer |
|----------|--------|
| Is Analytics a module? | **No — not a true registered module today** |
| Is Analytics a platform capability? | **Yes — primary long-term class** (derived reads, event subscribers, permission-gated rollups) |
| Is Analytics an Admin Portal responsibility? | **Yes — for operator/platform metrics** (canonical `/admin-portal/analytics`, L3 certified) |
| Is Analytics a Dashboard responsibility? | **Partially — widget projections only**; not aggregate warehouse ownership |
| Incorrectly modeled today? | **Yes** — runtime pseudo-module + mock business UI + placeholder subscribers + ledger product-module row |

**Recommended class:** **Platform Analytics Capability** with an optional **Business Tenant Analytics Product Surface** mounted in Business Workspace — not a peer L3 module like Chat or Drive until scope charter defines owned entities and services.

---

## 2. Analytics systems inventory

| # | System | Type | Path / entry | Owner | Maturity |
|---|--------|------|--------------|-------|----------|
| 1 | **Business workspace analytics UI** | Product surface (stub) | `/business/:id/workspace/analytics` | Unowned pseudo-module | **L0 mock** |
| 2 | **`analytics` runtime registry entry** | Pseudo-module metadata | `coreModuleRegistry.ts` | Platform runtime | **L1** |
| 3 | **`/api/analytics/*`** | Tenant read API | `analyticsController.ts` | Platform (unscoped program) | **L1 partial** |
| 4 | **Domain event subscriber** | Platform pipeline | `analyticsDomainEventSubscriber.ts` | Platform Engineering | **Placeholder** |
| 5 | **Admin Portal Platform Analytics** | Operator UI | `/admin-portal/analytics` | Admin Portal (L3) | **L3 CwF** |
| 6 | **`adminAnalyticsService`** | Operator backend | `/api/admin-portal/analytics/*` | Admin Portal | **L3 CwF** |
| 7 | **AI analytics engines** | AI subsystem | `server/src/ai/analytics/*` | AI Platform (L2) | **Satellite** |
| 8 | **HR module analytics** | Domain-owned slices | `/business/:id/admin/hr/analytics` | HR module (L3 CwF) | **Module interior** |
| 9 | **Place analytics AI context** | Module provider | `/api/place/ai/context/analytics` | Place module (L3) | **Module interior** |
| 10 | **Profile analytics page** | Privacy/settings adjacent | `/profile/analytics` | Account Platform (L3 CwF) | **Misnamed — privacy hub** |
| 11 | **Relationship analytics model** | Constitutional rules | `ANALYTICS_PERMISSION_MODEL.md` | Platform architecture | **Spec only** |
| 12 | **Dashboard analytics widgets** | Projections | `CrossModuleAnalyticsPanel`, enterprise panels | Dashboard module | **Feature-gated partial** |

**Count:** 12 distinct analytics-related surfaces; **3 ownership classes** (operator, platform capability, module/domain slices).

---

## 3. Is Analytics a module?

### 3.1 True module criteria

| Criterion | Analytics | Verdict |
|-----------|-----------|---------|
| `registerBuiltInModules.ts` entry | ❌ **Absent** | **Fail** |
| ModuleAIContext | ❌ None for `analytics` id | **Fail** |
| Canonical domain services | ❌ Controller reads Prisma directly; no `analyticsService` | **Fail** |
| Owned entities / SoR | ❌ No analytics-specific models (uses Activity, File, etc.) | **Fail** |
| WorkspaceLanding | ❌ Inline page only | **Fail** |
| Activity emissions | ❌ Read-only consumer | N/A |
| Manifest / marketplace | ❌ | **Fail** |

**Determination:** Analytics is **not a true module** by platform standards. Constitutional doc §0.1 explicitly lists it under **"Platform pseudo-modules (runtime only)."**

### 3.2 Why ledger shows L1 product module

CERTIFICATION_LEDGER rows Dashboard and Analytics together as uncertified product modules — a **portfolio simplification** that overstates Analytics modulehood. This review recommends ledger **classification clarification** in a future governance pass (not executed here).

---

## 4. Platform capability analysis

Analytics as platform capability means:

| Responsibility | Description |
|----------------|-------------|
| **Event ingestion** | Domain event subscribers derive rollups (currently placeholder) |
| **Derived read APIs** | Tenant-scoped aggregates from activity, storage, module installs |
| **Permission gate** | PE + ANALYTICS_PERMISSION_MODEL fail-closed rules |
| **Activity separation** | Never substitute activity log for analytics warehouse (moduleSpecs.md) |
| **Cross-module federation** | Compose module rollups in presentation — no god-table SoR |

**Existing partial implementation:**

- `getPersonalAnalytics`, `getModuleAnalytics`, `exportAnalytics` in `analyticsController.ts` — reads Activity, File, ModuleInstallation with tenant scope
- `analyticsDomainEventSubscriber.ts` — debug placeholder only
- Constitutional permission model AP1–AP5 documented but not fully enforced in code paths

**Gap vs File Hub reference:** No canonical service layer, no operation matrix, no certification charter.

---

## 5. Admin Portal boundary

Post Stage 0C (2026-06-18):

| Rule | Detail |
|------|--------|
| **Canonical operator destination** | `/admin-portal/analytics` |
| **Data owner** | `adminAnalyticsService.ts` |
| **Out of scope** | Business tenant product analytics (`workspace/analytics`) |
| **Satellites retained** | Performance, AI pipeline metrics, support/module analytics APIs |

**Answer:** Admin Portal **owns operator analytics** — platform MRR, growth, segments, BI insights tab. This is **not** the business workspace `analytics` pseudo-module.

Evidence: [ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md](../architecture/audits/ADMIN_PORTAL_ANALYTICS_REALITY_ASSESSMENT.md) — 12 systems inventoried; 1 canonical operator UI.

---

## 6. Dashboard boundary

| Relationship | Rule |
|--------------|------|
| **Analytics widgets on personal grid** | Projections — Dashboard module hosts widget chrome; data from module APIs or platform read services |
| **Enterprise analytics panels** | `DashboardModuleWrapper` / `EnhancedDashboardModule` — Dashboard module feature gates |
| **Aggregate ownership** | Dashboard module must **not** own cross-tenant or cross-module warehouse |
| **Quick Stats / Activity Feed widgets** | Dashboard projections consuming platform/module feeds — not Analytics module |

**Answer:** Dashboard is a **host surface** for analytics widgets, not the **domain owner** of analytics capability.

WORKSPACE_RUNTIME doc: *"some modules have no dashboard widget (e.g. Analytics in business workspace only)"* — business analytics is segment-mounted, not widget-grid primary.

---

## 7. Business Workspace stub overlap

`BusinessWorkspaceContent` case `analytics` redirects to `/workspace/analytics` segment page.

Page reality (`workspace/analytics/page.tsx`):

- Client component with **mock data** and TODO for real API
- No PE gate visible at UI layer
- Duplicates narrative of admin/HR analytics without canonical service

**Constitutional audit finding:** Analytics leak — `BusinessAnalyticsWidget` stub belongs in Analytics product/capability, not shell inline widget.

**Remediation direction (discovery only):** Mount a real Business Analytics surface backed by platform capability services — not a new shell stub.

---

## 8. Module-local analytics (correct pattern)

| Module | Pattern | Status |
|--------|---------|--------|
| **HR** | `TimeOffAnalyticsDashboard`, attendance, onboarding — domain services | ✅ L3 module interior |
| **Place** | AI context analytics provider | ✅ L3 module interior |
| **Chat** | `chatAnalyticsService` (Wave 1E extraction) | ✅ Reference pattern |
| **Workforce Comms** | Campaign report intents in manifest | ✅ Domain-owned |

**Rule:** Domain modules own **domain metrics**. Platform Analytics Capability owns **cross-module tenant rollups** and event pipeline. Admin Portal owns **operator metrics**.

---

## 9. Required questions — Analytics

| # | Question | Answer |
|---|----------|--------|
| 5 | Is Analytics a module? | **No** — pseudo-module runtime entry only |
| 6 | Platform capability? | **Yes** — primary recommended class |
| 7 | Admin Portal responsibility? | **Yes** — for operator/platform analytics (already L3) |
| 8 | Dashboard responsibility? | **No for domain** — widget host only |
| 9 | Incorrectly modeled? | **Yes** — ledger product row, mock UI, placeholder subscriber |
| 10 | Long-term architecture? | See §10 |

---

## 10. Long-term architecture recommendation

### Target model

```
┌─────────────────────────────────────────────────────────────┐
│  Admin Portal (L3) — operator / platform metrics             │
│  adminAnalyticsService · /admin-portal/analytics             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Platform Analytics Capability (uncertified L1→L2 target)    │
│  Event subscribers · rollup jobs · /api/analytics/* services │
│  ANALYTICS_PERMISSION_MODEL enforcement                      │
└─────────────────────────────────────────────────────────────┘
         │ feeds                          │ feeds
         ▼                                ▼
┌─────────────────────┐          ┌─────────────────────────────┐
│ Module domain       │          │ Business Tenant Analytics    │
│ analytics (HR, etc.)│          │ Product surface in workspace │
└─────────────────────┘          └─────────────────────────────┘
         │                                │
         └────────────┬───────────────────┘
                      ▼
         ┌─────────────────────────────┐
         │ Dashboard module widgets     │
         │ (projections only)           │
         └─────────────────────────────┘
```

### Sequencing (governance recommendation — not implementation)

1. **Scope lock charter** — product surface vs platform capability boundaries
2. **Remove pseudo-module pretense** — either register as true module with manifest + services OR reclassify ledger row to platform capability
3. **Activate or delete** domain event subscriber — no permanent placeholder
4. **Replace mock** business workspace page with capability-backed reads or defer segment until API exists
5. **Certification path:** Platform capability L2 charter (like Search/Realtime audit) — **not** parallel L3 module track unless scope lock adds owned entities

### Deferred (explicit)

- Advanced AI analytics (`RealTimeAnalyticsEngine`, predictive engines) — AI Platform L2 dependency
- Relationship analytics Phase 2B — planning only
- HR cross-tenant analytics — elevated certification per permission model

---

## 11. Wave 3 relationship

| Initiative | Analytics role |
|------------|----------------|
| Dashboard Module Wave 3 | Widget contract audit — analytics widgets as projections |
| Analytics Wave 3 (portfolio #3) | **Scope audit + product vs platform decision** — must precede any L3 claim |
| Workspace program | Retire analytics stub from shell switch — delegate to product/capability surface |

**Do not** certify Analytics as L3 product module in the same wave as Dashboard without scope lock.

---

**Last updated:** 2026-06-21
