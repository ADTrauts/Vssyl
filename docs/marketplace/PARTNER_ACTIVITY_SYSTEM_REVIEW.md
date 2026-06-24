# Partner Activity — System Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-E  
**Date:** 2026-06-24  
**Status:** Discovery / architecture baseline — **no implementation**  
**Authority:** `memory-bank/moduleSpecs.md`, `docs/architecture/DOMAIN_EVENTS.md`, `docs/platform-kernel/PLATFORM_ACTIVITY_AUDIT.md`

---

## 1. Executive summary

Vssyl has a **mature first-party activity write path** (`emitModuleActivityEvent`) and a **canonical read path** (`platformActivityQueryService` → `GET /api/activity-feed`). Partner modules **cannot publish** into this pipeline today. Outbound **domain event webhooks** (platform → partner) exist; **inbound partner activity ingest does not**.

Partner activity must be treated as a **platform trust boundary** — not a logging convenience.

---

## 2. Activity models (persistence)

| Model / store | Path | Purpose | Partner today |
|---------------|------|---------|---------------|
| **Normalized module activity** | `Log` rows, `operation: module_activity_event` | Canonical feed envelope in `metadata` | ❌ Write in-process only |
| **Domain event log** | `Log` rows, `operation: domain_event_recorded` | Cross-cutting platform facts | ❌ Platform emit only |
| **Legacy Drive `Activity`** | `prisma Activity` (file-linked) | Historical per-file audit | ❌ First-party |
| **V_Link `VLinkActivity`** | Module-specific table | V_Link timeline | ❌ First-party |
| **Place `PlaceActivityFeedItem`** | Module-specific table | Local discovery feed | ❌ First-party |
| **`AuditLog`** | Governance / HR supplementary | Admin/compliance trails | ❌ Not feed substitute |

**Canonical partner target:** normalized `module_activity_event` envelope — not legacy `Activity` table, not raw analytics.

---

## 3. Activity services

| Service | Role | Partner |
|---------|------|---------|
| `moduleActivityService.emitModuleActivityEvent` | Write normalized envelope + socket `activity:feed:refresh` | ❌ No external entry |
| `platformActivityQueryService` | Parse log rows, `getFeedForUser`, `getActivityForEntity`, summaries | N/A (read) |
| `platformActivityFeedMapper.toActivityFeedItem` | API DTO for dashboard feed | N/A |
| `*ActivityService` wrappers (HR, scheduling, workforce, org chart, dashboard, notes) | Module-specific emit helpers | ❌ First-party |
| `activityDomainEventSubscriber` | Persists domain events to log (separate operation) | N/A |

**Write contract** (`ModuleActivityEventInput`):

- `actorUserId`, `moduleId`, `action`, `targetType`, `targetId`
- Optional: `parentType/Id`, `dashboardId`, `businessId`, `householdId`, `visibilityScope`, `metadata`

---

## 4. Activity routes & consumers

| Route / surface | Consumer | Notes |
|-----------------|----------|-------|
| `GET /api/activity-feed` | Dashboard activity widget | Federated normalized feed |
| `GET /api/folder/activity/recent` | Drive UI | Legacy + normalized mix |
| File detail panels | `getActivityForEntity` | Per-entity history |
| `GET /api/place/feed` | Place module | Module-local feed |
| `GET /api/vlinks/:id/activity` | V_Link | Module-local |
| `GET /api/place/ai/context/activity` | AI context provider | Bounded activity snippet |
| Admin `GET /api/admin-portal/dashboard/activity` | Admin portal | Platform ops (not partner feed) |
| Analytics | `getActivitySummary` / timeline | Derived reads — not activity writes |

**Realtime:** `activity:feed:refresh` broadcast to **actor user only** on emit (not tenant-wide fan-out today).

---

## 5. Audit logging overlap

| Concern | Activity (`module_activity_event`) | Audit (`auditLog`) |
|---------|-----------------------------------|---------------------|
| Audience | User-visible feeds, AI ambient | Admin/governance |
| Shape | Normalized envelope | Free-form audit rows |
| Partner path | Future ingest → envelope | ❌ Not partner ingest target |
| Rule | Activity ≠ analytics | Do not conflate |

HR/org-chart supplementary `auditLog` writes are **not** a substitute for normalized activity.

---

## 6. Notification integration

| Path | Mechanism |
|------|-----------|
| Domain event → notification | `notificationDomainEventSubscriber` — explicit mapping per `DOMAIN_EVENT_TYPES` |
| Module activity → notification | **No automatic fan-out** today |
| Partner notifications | Manifest metadata only; `NotificationService` in-process |

**Implication:** Partner activity ingest must **not** auto-create notifications without a separate, gated policy (see notification boundary doc).

---

## 7. Domain event integration

| Direction | Status |
|-----------|--------|
| Platform mutation → `emitDomainEvent` | ✅ First-party |
| Domain event → activity log subscriber | ✅ `recordDomainEventToActivityLog` |
| Domain event → outbound webhooks | ✅ `webhookDomainEventSubscriber` |
| Partner action → domain event | ❌ No ingest |
| `module.installed` / `file.shared` webhooks | ✅ Outbound to business admin URLs |

Domain events represent **platform-certified facts after authorized mutations**. Partner-reported actions are **claims** until validated — they should not enter the domain bus directly.

---

## 8. AI / activity context usage

| Consumer | Path | Partner activity today |
|----------|------|------------------------|
| Cross-module AI context | `CrossModuleContextEngine` (activity slice) | First-party log rows only |
| Place AI provider | `GET /api/place/ai/context/activity` | Place module only |
| AI Retrieval | Indirect via Search — not activity stream | N/A |
| Context Graph | Retrieval bridge — not activity ingest | N/A |

Future AI readability should **read normalized activity records** after ingest — not bypass validation.

---

## 9. Existing partner-adjacent patterns (reuse candidates)

| Pattern | Relevance to activity ingest |
|---------|------------------------------|
| **Search Delegate JWT** (`vssyl:search-delegate:v1`) | Auth model template: short-lived, audience-pinned, module-bound |
| **Workspace Bridge JWT** (`vssyl:workspace-bridge:v1`) | Tenant + actor binding template |
| **Webhook executor HMAC** (`webhookSigning.ts`) | Alternative auth for server-to-server ingest |
| **Outbound webhook subscriptions** | Wrong direction; proves signing/retry patterns only |
| **`moduleSpecs.md` envelope** | Target normalization shape |

---

## 10. Gaps (partner publish)

| Gap | Impact |
|-----|--------|
| No `POST` partner activity ingest API | Partner actions invisible in unified feed |
| No manifest `activityIngest` capability block | Cannot certify or gate |
| No registry / allowlist for ingest-enabled modules | Cannot fail closed |
| No idempotency store | Replay / duplicate risk |
| No rate limits per module/tenant | Feed spam risk |
| No actor binding to platform user | Impersonation risk |
| No admin probe for activity readiness | Sandbox validation gap |

---

## 11. Activity participation readiness

| Metric | Value |
|--------|-------|
| **Current level** | **1 — First Party Only** (write); **2 — Architecturally Ready** (contract documented in `moduleSpecs.md`) |
| **Target after Phase 1B-E** | **2 — Architecture Defined** |
| **Target after Phase 1C-F implementation** | **3 — Pilot Ready** |
| **Target after certification** | **4 — Certified Partner Capability** |

**Blockers to Level 3:** Ingest API, auth bridge, registry, normalizer, idempotency, rate limits, admin probe, pilot module.

---

**Last updated:** 2026-06-24
