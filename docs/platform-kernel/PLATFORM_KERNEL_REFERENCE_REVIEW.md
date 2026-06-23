# Platform Kernel — Reference Review

**Program:** Platform Kernel — Formal L2 Certification Evaluation  
**Evaluation date:** 2026-06-23  
**Status:** Evaluation disposition — **no REFERENCE_MODULE_CATALOG update**

**Cross-reference:** [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md), [PLATFORM_KERNEL_OWNERSHIP_MODEL.md](./PLATFORM_KERNEL_OWNERSHIP_MODEL.md), [PLATFORM_KERNEL_CERTIFICATION_MODEL_REVIEW.md](./PLATFORM_KERNEL_CERTIFICATION_MODEL_REVIEW.md)

---

## 1. Evaluation determination

| Role | Eligible? | Evaluation verdict |
|------|-----------|-------------------|
| **Reference producer** (Platform Kernel infrastructure exemplar) | **No** | **Deferred** — PK-ACT-M1, PK-ACT-M4, PK-DE-M4 |
| **Module dual-write facade pattern** | **Yes** | **Affirmed informal exemplar** |
| **Activity read federation consumer** | **Yes** | **Affirmed** — `platformActivityQueryService` |
| **DE subscriber honesty pattern** | **Yes** | **Affirmed** — matrix-driven registration |
| **Product module reference** | **N/A** | Platform Capability — not catalog module class |

---

## 2. Reference producer — evaluation rejection rationale

| Criterion | Evidence | Verdict |
|-----------|----------|---------|
| Canonical write contracts stable | `emitModuleActivityEvent` + `emitDomainEvent` | ✅ Met |
| Canonical read contract stable | `platformActivityQueryService` | ✅ Met |
| Operation matrix at reference quality | DE runtime matrix ✅; Activity docs-only (PK-ACT-M5) | 🟡 Partial |
| Registry CI at reference quality | PK-DE-M4 orphan audit absent | ❌ Fail |
| Legacy debt retired | PK-ACT-M1 Activity table remains | ❌ Fail |
| Durability exemplar | In-process bus — L3 deferred | ❌ Absent (by design) |

**Evaluation verdict:** **Not a reference producer.** Revisit after W4 Activity retirement + registry CI audit + optional activity operation matrix.

---

## 3. Affirmed patterns (informal reference)

### Module dual-write lifecycle

| Pattern | Producer | Consumer | Evaluation status |
|---------|----------|----------|-------------------|
| `authorize → execute → activity → domain event → notify/realtime` | Module `*ActivityService` + `*DomainEventService` | Platform subscribers | **✅ Affirmed** — cite in `module-interoperability.mdc` |
| HR lifecycle dual emit | `hrActivityService` + `hrDomainEventService` | DE subscribers | **✅ Affirmed** — DE-2 template |
| Drive delegated emitters | `domainEventEmitters` | Registry | **✅ Affirmed** |

Modules should cite Chat, Calendar, HR, and Drive patterns — **not** elevated to Reference Module catalog entries at L2 evaluation.

### Activity read federation

| Pattern | Producer | Consumer | Evaluation status |
|---------|----------|----------|-------------------|
| Cross-surface activity reads | Platform Activity (`Log`) | Feed, Analytics, AI, Drive | **✅ Affirmed reference consumer contract** |
| Query service delegation | `platformActivityQueryService` | 7 migrated consumers | **✅ Affirmed** |

**Rule:** New cross-module activity consumers must use `platformActivityQueryService` — not direct `prisma.activity` or ad-hoc `Log` queries.

### Domain Events subscriber honesty

| Pattern | Implementation | Evaluation status |
|---------|----------------|-------------------|
| Matrix-defined subscribers | `domainEventOperationMatrix.ts` | **✅ Affirmed** |
| Stub gating | Env-opt-in only | **✅ Affirmed** |
| Participation validation | `validateCertifiedModuleParticipation()` | **✅ Affirmed** |

---

## 4. Consumer-only affirmation (Analytics parallel)

Platform Kernel is primarily a **platform infrastructure producer** consumed by:

| Consumer | Pattern | Status |
|----------|---------|--------|
| Dashboard activity feed | Query service / feed controller | **Consumer** |
| Analytics Capability | `getModuleActivity` etc. | **Consumer** |
| AI context engines | Query service | **Consumer** |
| Notifications / AI DE consumers | Partial type maps | **Consumer** — PK-DE-M6 |
| Webhooks | Subscription-filtered | **Consumer** |

This mirrors Analytics **consumer-pattern affirmation** — kernel patterns are teachable without reference producer designation.

---

## 5. Post-ratification reference posture

| Event | Reference action |
|-------|------------------|
| **L2 CwF ratified** | Reaffirm dual-write + query service rules in architecture docs |
| **W4 Activity table retired (PK-ACT-M1)** | Re-evaluate producer candidacy |
| **Registry CI audit (PK-DE-M4)** | Re-evaluate producer candidacy |
| **L3 durability delivered** | Re-evaluate infrastructure L3 + reference producer |

---

## 6. Evaluation options disposition

| Option | Verdict |
|--------|---------|
| Reference producer candidate | ❌ **Rejected at evaluation** |
| **Module facade pattern affirmed** | ✅ **Selected** |
| **Activity query consumer affirmed** | ✅ **Selected** |
| **DE honesty pattern affirmed** | ✅ **Selected** |
| **Producer deferred** | ✅ **Selected** — W4 + CI gate |

---

## 7. Required question

| # | Question | Answer |
|---|----------|--------|
| 10 | Reference candidate status? | **Consumer/facade patterns affirmed; reference producer deferred** |

---

**Last updated:** 2026-06-23
