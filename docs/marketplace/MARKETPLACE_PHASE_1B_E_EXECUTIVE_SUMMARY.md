# Marketplace Phase 1B-E — Executive Summary

**Program:** Marketplace & Module Ecosystem — Phase 1B-E / **1B-F implemented**  
**Phase:** 1B-E — Partner Activity Ingest Architecture  
**Date:** 2026-06-24  
**Status:** ✅ Architecture complete — **runtime implemented in 1B-F**  
**Closeout:** [MARKETPLACE_PHASE_1B_F_CLOSEOUT.md](./MARKETPLACE_PHASE_1B_F_CLOSEOUT.md)  
**Prior phases:** 1B-A (lifecycle), 1B-B (search delegate), 1B-C (workspace bridge), 1B-D (business billing)

---

## 1. Objective

Design how **certified partner modules** can publish activity events into Vssyl **safely** — visible in activity feeds, audit trails, and future AI context — **without** allowing impersonation, tenant escape, or feed pollution.

---

## 2. Problem statement

Partner modules are discoverable, embeddable, and commercially viable (1B-D complete). They still **cannot publish first-class activity** into the platform normalized feed. User-visible partner actions are invisible in the unified activity timeline.

---

## 3. Current state (system review)

| Layer | Status |
|-------|--------|
| Write path (`emitModuleActivityEvent`) | ✅ Mature — first-party only |
| Read path (`platformActivityQueryService`, `/api/activity-feed`) | ✅ Mature |
| Domain events | ✅ Platform mutations only; outbound webhooks to partners |
| Partner inbound activity | ✅ **Pilot ready** (1B-F) |
| Notifications from activity | ❌ No auto fan-out (by design) |
| AI activity consumption | ✅ First-party via query slice |

**Detail:** [PARTNER_ACTIVITY_SYSTEM_REVIEW.md](./PARTNER_ACTIVITY_SYSTEM_REVIEW.md)

---

## 4. Architecture recommendation

### Hybrid (D): Direct HTTP Activity Ingest API

| Component | Choice |
|-----------|--------|
| **Transport** | `POST /api/modules/:moduleId/activity-ingest` |
| **Auth** | Short-lived Activity Ingest JWT (`vssyl:activity-ingest:v1`) |
| **Token issuance** | `POST .../activity-ingest-token` (session-bound) |
| **Processing** | `partnerActivityIngestService` → validate → `emitModuleActivityEvent` |
| **Registry** | Marketplace sync + certification + allowlist |
| **Probe** | Admin sandbox probe (mirror search/workspace) |
| **Domain events** | Optional **derived** `partner.activity.recorded` after normalization — not partner-posted |
| **Webhook executor** | ❌ Not primary (outbound-only today) |

**Detail:** [PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md](./PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md)

---

## 5. Event contract recommendation

- Manifest block: `activityIngest` with `contractVersion: "1"`, declared `actionTypes` + `entityTypes`
- Request: `idempotencyKey`, `occurredAt`, `actor`, `target`, `context`, optional `visibility` + `metadata`
- Platform assigns `eventId`; overwrites `moduleId` and resolved `actorUserId`
- Normalize to existing `ModuleActivityEnvelope`

**Detail:** [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md)

---

## 6. Security model

| Control | Purpose |
|---------|---------|
| JWT audience + module binding | Prevent token misuse |
| Tenant proof via install + subscription | Prevent cross-tenant publish |
| Actor bound to session user | Prevent spoofing |
| Manifest action/entity allowlist | Prevent arbitrary event types |
| Rate limits (60/min tenant, 1000/min module) | Prevent flooding |
| Idempotency (72h) | Prevent replay duplicates |
| Metadata size + sanitization | Prevent injection |
| Fail-closed entitlement | Unauthorized → reject |

**Detail:** [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md)

---

## 7. Notification boundary

| Policy | Decision |
|--------|----------|
| Pilot | **Activity-only** — no auto-notifications |
| Mapping authority | **Platform allowlist** only |
| Partner payload | **No** `notify` or recipient fields |
| Preferences | Required when mapping enabled (Phase 2+) |
| Redesign | Out of scope |

**Detail:** [PARTNER_ACTIVITY_NOTIFICATION_BOUNDARY.md](./PARTNER_ACTIVITY_NOTIFICATION_BOUNDARY.md)

---

## 8. AI context boundary

| Policy | Decision |
|--------|----------|
| Day one | **Not** AI-readable from ingest |
| Stage 1 | `platformActivityQueryService` → CrossModuleContextEngine |
| Stage 2 | Optional read-only module activity AI provider |
| Stage 3 | AI Retrieval evidence with provenance |
| Context Graph / V_Link | **Deferred** — out of scope |

**Detail:** [PARTNER_ACTIVITY_AI_CONTEXT_BOUNDARY.md](./PARTNER_ACTIVITY_AI_CONTEXT_BOUNDARY.md)

---

## 9. Activity participation readiness

| Metric | Value |
|--------|-------|
| **Level before 1B-E** | **1 — First Party Only** (partner cannot publish) |
| **Level after 1B-E** | **2 — Architecture Defined** |
| **Level after 1B-F** | **3 — Pilot Ready** ✅ |
| **Target (certified partner)** | **4 — Certified Partner Capability** |

### Blockers to Level 3 — **cleared in 1B-F**

| ID | Blocker | Status |
|----|---------|--------|
| B1 | No ingest API or service | ✅ |
| B2 | No Activity Ingest JWT | ✅ |
| B3 | No registry / allowlist | ✅ |
| B4 | No idempotency store | ✅ (in-memory pilot) |
| B5 | No rate limiter | ✅ |
| B6 | No admin probe | ✅ |
| B7 | No sandbox pilot module path | ✅ |

### Blockers to Level 4

| ID | Blocker |
|----|---------|
| B8 | External partner certification checklist |
| B9 | Production rate tiers + monitoring |
| B10 | Optional notification allowlist (if product requires) |

---

## 10. Certification requirements (before ingest enabled)

| ID | Requirement |
|----|-------------|
| AP-01 | Module admin-approved |
| AP-02 | Active business entitlement (`BusinessModuleSubscription`) |
| AP-03 | Valid `activityIngest` manifest block |
| AP-04 | `capabilities.activity: true` |
| AP-05 | Sandbox probe pass |
| AP-06 | Idempotency keys implemented |
| AP-07 | Rate limit compliance demonstrated |
| AP-08 | No secrets/PII in metadata (review) |
| AP-09 | On activity ingest allowlist (pilot) |

---

## 11. Strategic question — recommendation

> Should partner activity ingest become activity-only first, domain-event first, notification-capable from day one, or AI-readable from day one?

### Recommendation: **Activity-only first**

| Option | Verdict | Rationale |
|--------|---------|-----------|
| **1. Activity-only first** | ✅ **Recommended** | Matches existing `emitModuleActivityEvent` semantics; feed consumers unchanged; lowest trust risk |
| 2. Domain event first | ❌ Reject | Domain bus is for platform authoritative facts; would trigger uncontrolled subscriber side effects |
| 3. Notification-capable day one | ❌ Reject | Spam/impersonation risk; no first-party precedent for activity→notification |
| 4. AI-readable day one | ❌ Reject | Prove ingest security and feed quality before AI consumes partner claims |

**Sequencing:** Activity feed → AI query slice → curated notifications → graph enrichment.

---

## 12. Implementation roadmap

| Phase | Scope | Est. dependency |
|-------|-------|-----------------|
| **1B-F** | JWT, ingest service, controller, registry sync, idempotency, rate limits, admin probe, `vssyl-pilot-assets` sandbox | ✅ Complete |
| **1B-G** | Metrics, rejection dashboards, certification validator AP-* rules | 1B-F |
| **1C** | First external partner pilot (single allowlisted module) | 1B-G |
| **1D** | Optional HMAC batch ingest; derived domain event | 1C stable |
| **2** | Platform notification allowlist (1–2 actions); preference UI | Product decision |
| **3** | AI Retrieval evidence + optional activity provider | AI Retrieval L2+ |
| **4** | Context Graph entity hints | Entity registry maturity |

**Explicitly out of scope for 1B-E:** migrations, notification redesign, V_Link adapters, Context Graph adapters, runtime ingest code.

---

## 13. Deliverables (this phase)

| Document | Status |
|----------|--------|
| [PARTNER_ACTIVITY_SYSTEM_REVIEW.md](./PARTNER_ACTIVITY_SYSTEM_REVIEW.md) | ✅ |
| [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md) | ✅ |
| [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md) | ✅ |
| [PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md](./PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md) | ✅ |
| [PARTNER_ACTIVITY_NOTIFICATION_BOUNDARY.md](./PARTNER_ACTIVITY_NOTIFICATION_BOUNDARY.md) | ✅ |
| [PARTNER_ACTIVITY_AI_CONTEXT_BOUNDARY.md](./PARTNER_ACTIVITY_AI_CONTEXT_BOUNDARY.md) | ✅ |
| [MARKETPLACE_PHASE_1B_E_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1B_E_EXECUTIVE_SUMMARY.md) | ✅ |

---

## 14. Trust boundary statement

Partner activity is **not** a logging convenience. It is a **platform trust boundary**. The ingest service is the sole gatekeeper: it validates identity, tenant, entitlement, and shape before any partner claim becomes a durable platform activity record visible to users and future AI systems.

---

**Last updated:** 2026-06-24
