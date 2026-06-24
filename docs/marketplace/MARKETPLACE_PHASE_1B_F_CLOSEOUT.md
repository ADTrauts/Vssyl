# Marketplace Phase 1B-F — Closeout

**Program:** Marketplace & Module Ecosystem  
**Phase:** 1B-F — Partner Activity Ingest Runtime & Sandbox Pilot  
**Date:** 2026-06-24  
**Status:** ✅ Complete  
**Prior:** 1B-E (architecture), 1B-E.5-F (module scope enforcement)

---

## 1. Objective

Implement safe partner Activity ingest so certified partner modules can publish trusted activity events into Vssyl without spoofing users, bypassing tenant boundaries, or polluting feeds.

---

## 2. Deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| 1 | Shared activity ingest types | ✅ `shared/src/types/activity-ingest.ts` |
| 2 | Activity Ingest JWT (`vssyl:activity-ingest:v1`) | ✅ `activityIngestJwt.ts` |
| 3 | Activity ingest registry + sync | ✅ `activityIngestRegistry.ts` |
| 4 | Ingest API (`token` + `activity-ingest`) | ✅ `moduleActivityIngestController.ts` |
| 5 | Internal emission via `emitModuleActivityEvent` | ✅ `partnerActivityIngestService.ts` |
| 6 | Sandbox pilot (`vssyl-pilot-assets`) | ✅ `registerSandboxPilotActivityIngest.ts` |
| 7 | Admin readiness + activity probe | ✅ `marketplaceReadinessService.ts`, admin route, UI |
| 8 | Certification validator 1.4.0 (`activity_ingest`) | ✅ |
| 9 | Tests | ✅ marketplace `__tests__/activityIngest*.test.ts` |
| 10 | Documentation | ✅ This closeout + runtime/sandbox docs |

---

## 3. Acceptance criteria

| Criterion | Met |
|-----------|-----|
| Activity ingest JWT exists | ✅ |
| Activity ingest registry exists | ✅ |
| Partner Activity ingest endpoint exists | ✅ |
| Events normalize through internal activity service | ✅ |
| `vssyl-pilot-assets` sandbox activity works | ✅ |
| Admin Portal readiness/probe reflects activity ingest | ✅ |
| Tests pass | ✅ |
| Documentation updated | ✅ |

---

## 4. Activity participation level

| Level | Description | Status |
|-------|-------------|--------|
| 1 | First-party only | Before 1B-E |
| 2 | Architecture defined | 1B-E |
| **3** | **Pilot ready** | **1B-F ✅** |
| 4 | Certified external partner | Phase 1C |

---

## 5. Explicitly out of scope (unchanged)

- Partner notifications
- AI-readable partner activity
- Context Graph partner adapters
- V_Link participation
- Open ecosystem / developer portal
- Graph persistence
- Full activity feed redesign

---

## 6. Enable pilot locally

```bash
PARTNER_ACTIVITY_INGEST_ENABLED=true
PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST=vssyl-pilot-assets
```

Restart server; confirm admin **Activity probe** on `vssyl-pilot-assets` returns success.

---

## 7. Next phase (1B-G / 1C)

| Item | Notes |
|------|-------|
| Metrics / rejection dashboards | Operational hardening |
| First external partner pilot | Single allowlisted module |
| Redis-backed idempotency | Replace in-memory store at scale |
| Derived domain event | Feature-flagged optional |

---

## 8. Document index

| Document | Role |
|----------|------|
| [PARTNER_ACTIVITY_RUNTIME_FOUNDATION.md](./PARTNER_ACTIVITY_RUNTIME_FOUNDATION.md) | Implementation map |
| [PARTNER_ACTIVITY_SANDBOX_PILOT.md](./PARTNER_ACTIVITY_SANDBOX_PILOT.md) | Pilot module guide |
| [PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md](./PARTNER_ACTIVITY_INGEST_ARCHITECTURE.md) | Architecture (updated) |
| [PARTNER_ACTIVITY_EVENT_CONTRACT.md](./PARTNER_ACTIVITY_EVENT_CONTRACT.md) | Contract (updated) |
| [PARTNER_ACTIVITY_SECURITY_MODEL.md](./PARTNER_ACTIVITY_SECURITY_MODEL.md) | Security (updated) |
| [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md) | Admin UI (updated) |
| [MARKETPLACE_PHASE_1B_E_EXECUTIVE_SUMMARY.md](./MARKETPLACE_PHASE_1B_E_EXECUTIVE_SUMMARY.md) | Architecture summary (updated) |

---

**Last updated:** 2026-06-24
