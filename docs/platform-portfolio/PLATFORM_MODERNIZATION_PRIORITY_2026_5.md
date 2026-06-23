# Platform Modernization Priority 2026.5

**Program:** Platform Portfolio Refresh 2026.5  
**Date:** 2026-06-23  
**Status:** Recommendation — post Platform Kernel L2 CwF execution  
**Supersedes for prioritization:** [`PLATFORM_MODERNIZATION_PRIORITY_2026.md`](./PLATFORM_MODERNIZATION_PRIORITY_2026.md)

---

## Priority framework

| Signal | Weight |
|--------|--------|
| Architectural risk (Critical/High) | 35% |
| Business value (daily use + revenue) | 30% |
| Certification unlock (enables L3 path) | 20% |
| Dependency order (unblocks other work) | 15% |

**Excluded from prioritization:** All archived certification programs (including **Platform Kernel**); Calendar/Place/Notebook hygiene-only work; AI Platform full L3 (deferred); **Analytics Phase 2** (not authorized); PK-W4 / L3 replay (not authorized).

---

## Top 10 modernization priorities (re-ranked post-kernel)

| Rank | Initiative | Type | Rationale | Est. effort |
|------|------------|------|-----------|-------------|
| **1** | **AI Platform stub executor deny policy (narrow L3 prep)** | Platform | R-01 Critical; constitutional trust closure | 2–3 weeks |
| **2** | **Policy Engine read-path parity → platform L3** | Platform | R-03; closest L2→L3 cert candidate | 2–4 weeks |
| **3** | **Search Capability platform audit + provider gaps** | Platform | R-08/R-13; cross-module findability | 2 weeks audit + 3–4 weeks providers |
| **4** | **Platform Scheduler §22 registry + Manifest reconcile** | Platform kernel adj. | R-09/R-10; job and capability truth | 2–3 weeks |
| **5** | **Platform Kernel certificate finding burn-down** | Hygiene | PK-ACT-M1, M4; PK-DE-M4; PK-K-M1 | Phased |
| **6** | **Account Platform advisory burn-down** | Hygiene | R-04; MFA, billing UX | 4–8 weeks phased |
| **7** | **Realtime platform audit charter** | Platform | R-11; no ledger row | 2 weeks discovery |
| **8** | **Dashboard Package 4 finding remediation (optional)** | Hygiene | R-05; M1-R, M4, M5, M7 | 4–6 weeks |
| **9** | **Analytics certificate finding burn-down** | Hygiene | R-07; not Phase 2 | Phased |
| **10** | **V_Link resolver expansion** | Platform | R-20; L2→L3 path | 2–3 weeks |

---

## Decision options — ranked recommendation

| Rank | Option | Scope | Verdict |
|------|--------|-------|---------|
| **1** | **B. AI Platform Modernization (narrow)** | Stub deny policy only | **Primary recommendation** |
| **2** | **PE platform L3 charter** | Read-path parity | **Second** |
| **3** | **C. Search Capability Program** | Platform audit + providers | **Third** |
| **4** | **E. Other** | AP / Kernel finding burn-down | Parallel hygiene |
| **—** | **A. Platform Kernel Modernization** | Activity + Events | **Complete** — L2 CwF archived 2026-06-23 |
| **5** | **D. Analytics Phase 2** | Event pipeline | **Do not authorize** |

---

## Recommended next initiative

### **B. AI Platform stub executor deny policy (narrow)**

| Field | Detail |
|-------|--------|
| **Why first** | Product module + kernel gaps **closed**; R-01 remains **Critical** constitutional trust violation |
| **Scope** | Deny/fail stub executors; no full L3 wave |
| **Unlocks** | AI Platform L3 re-readiness; safer module AI context |
| **Not in scope** | Full L3; LifeTwin expansion |

---

## Recommended next three initiatives

| Order | Initiative | Type |
|-------|------------|------|
| **1** | **AI stub executor deny policy** | Option B (narrow) |
| **2** | **Policy Engine platform L3** | PE read parity |
| **3** | **Search Capability Program** | Option C |

---

## What should be modernized next (capability vs module)

| Question | Answer |
|----------|--------|
| **Next capability** | **Policy Engine platform L3** or **AI stub deny** |
| **Next module** | **None required** — all product modules L3+ |
| **Kernel status** | **L2 CwF ARCHIVED** — finding-track only |

---

## Top 10 certification candidates (updated)

| # | Candidate | Current → Target |
|---|-----------|------------------|
| 1 | Policy Engine (platform) | L2 → L3 |
| 2 | NotificationService (platform) | L2 → L3 |
| 3 | Search (platform capability) | Unaudited → L2 |
| 4 | Global Trash API (platform) | L2 → L3 |
| 5 | V_Link (platform) | L2 → L3 |
| 6 | Realtime (platform) | Unaudited → L2 |
| 7 | Platform Scheduler | L1 → L2 |
| 8 | Manifest governance | L1 → L2 |
| 9 | Platform Kernel plain L2 | L2 CwF → L2 (23+) | Finding burn-down |
| 10 | AI Platform | L2 → L3 (**deferred**) |

*Domain Events and Module Activity removed — certified via Platform Kernel sub-scores.*

---

**Last updated:** 2026-06-23
