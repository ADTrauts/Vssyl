# Platform Kernel W2P2 — Executive Summary

**Program:** Platform Kernel Modernization — Wave 2 Package 2  
**Package:** Domain Events Hardening Charter  
**Date:** 2026-06-23  
**Audience:** Product, engineering leadership, architecture council  
**Status:** Charter complete — **no implementation, no certification, no ledger updates**

---

## Bottom line

ACT-R1 closed Platform Activity read debt; Activity is now an **L2 candidate**. The **remaining primary kernel weakness is Domain Events**: 180 typed contracts and real fan-out value, undermined by **two production stubs**, **HR adoption gap**, and **no L3 durability story**.

Wave 2 Package 2 defines the constitutional path to **Domain Events L2 certification candidacy** via **subscriber honesty first**, then **adoption closure** — **not replay**.

**Recommended next step (not authorized here):** **PK-W3-DE-1** — unregister `search_index_stub` and `workflow_router_stub`; publish subscriber operation matrix.

---

## Required questions

| # | Question | Answer |
|---|----------|--------|
| **1** | How many domain event types exist? | **180** |
| **2** | How many active subscribers exist? | **9** registered |
| **3** | Which subscribers are production-ready? | **activity**, **socket**, **webhook_subscriptions**; narrow **dashboard bootstrap** + **workspace seed** |
| **4** | Which subscribers are stubs? | **`search_index_stub`**, **`workflow_router_stub`** |
| **5** | Which subscribers should be removed? | **Both stubs** from default production registry |
| **6** | Which subscribers should be implemented? | Real search index (Search program); workflow router (Workflow program); optional notification/AI expansion |
| **7** | Does `search_index_stub` have a constitutional future? | **Yes — deferred** to Search program; **not** kernel L2 |
| **8** | Does `workflow_router_stub` have a constitutional future? | **Yes — deferred** to Workflow program; **not** kernel L2 |
| **9** | Which modules lack domain event facades? | **HR** (critical); Analytics + Admin Portal **exempt**; Drive uses platform emitters (document delegation) |
| **10** | Which modules emit activity but not domain events? | **HR** (all); **Analytics** (intentional); partial **Business** activity-only paths |
| **11** | Is replay required for L2? | **No** |
| **12** | Is replay required for L3? | **Yes** |
| **13** | Updated Domain Events maturity? | **L1** honest today → **L2 candidate** after DE-1 + DE-2 |
| **14** | Earliest certification posture? | **Domain Events L2 evaluation** after PK-W3-DE-1 and DE-2 (~81% projected G-score) |
| **15** | Recommended implementation package? | **PK-W3-DE-1** Subscriber Honesty + Operation Matrix |

---

## Formal decision

### **Option D — Hybrid sequencing (ratified)**

| Order | Package | Focus |
|------:|---------|-------|
| 1 | **PK-W3-DE-1** | Subscriber honesty — remove/gate stubs; operation matrix |
| 2 | **PK-W3-DE-2** | HR facade + registry adoption audit |
| 3 | **PK-W3-DE-3** | Notification/AI expansion (optional) |
| 4 | **PK-W5-DE-4** | Replay + durability (**L3 only**) |

---

## Stub disposition

| Stub | Decision |
|------|----------|
| `search_index_stub` | **Remove** from production registry until Search v2 delivers real consumer |
| `workflow_router_stub` | **Remove** from production registry until Workflow program delivers router |

**Do not implement stubs in kernel L2 work** — they belong to sibling programs.

---

## Replay decision

| Tier | Replay |
|------|--------|
| L2 | **Not needed** — Log audit mirror + honest subscribers sufficient |
| L3 | **Required** — outbox/queue + admin replay |
| L4 | Partial — only if kernel becomes reference implementation (unlikely) |

**Replay should wait.**

---

## Kernel posture (updated)

| Surface | Maturity |
|---------|----------|
| Platform Activity | **L2 candidate** (post ACT-R1) |
| Domain Events | **L1** → **L2 candidate** (post DE-1+2) |
| Combined Platform Kernel | **L1–L2** → **L2 joint candidacy** (post DE-1+2) |

---

## Certification path

1. **PK-W3-DE-1** — stub removal + matrix (~78% G-score)
2. **PK-W3-DE-2** — HR + adoption audit (~81% G-score)
3. **L2 readiness review** — Domain Events
4. **Joint kernel L2** — Activity + Domain Events
5. **L3 program** — durability/replay (separate authorization)

**No certification execution in this package.**

---

## Deliverables (this package)

| Document | Status |
|----------|--------|
| `DOMAIN_EVENTS_HARDENING_CHARTER.md` | ✅ |
| `DOMAIN_EVENT_SUBSCRIBER_AUDIT.md` | ✅ |
| `DOMAIN_EVENT_ADOPTION_MATRIX.md` | ✅ |
| `DOMAIN_EVENT_REPLAY_REVIEW.md` | ✅ |
| `DOMAIN_EVENT_MODERNIZATION_PROGRAM.md` | ✅ |
| `PLATFORM_KERNEL_W2P2_EXECUTIVE_SUMMARY.md` | ✅ |

---

## Risk highlights

| Risk | Tier |
|------|------|
| Stubs imply false Search/Workflow capabilities | **Critical** |
| HR domain-event gap blocks BO fan-out | **High** |
| Registry >> verified emit sites | **High** |
| In-process bus — no crash recovery | **Medium** (L3) |
| Webhook HTTP on emit path | **Medium** |

---

## Related

- [DOMAIN_EVENTS_AUDIT.md](./DOMAIN_EVENTS_AUDIT.md) (Wave 1)
- [PK_W3_IMP3_IMPLEMENTATION_REPORT.md](./PK_W3_IMP3_IMPLEMENTATION_REPORT.md) (ACT-R1 complete)
- [PLATFORM_KERNEL_CERTIFICATION_READINESS.md](./PLATFORM_KERNEL_CERTIFICATION_READINESS.md)

---

**Last updated:** 2026-06-23
