# Place Reference Module #5 — Council Review

**Module id:** `place`  
**Date:** 2026-06-02  
**Phase:** **4B** — Formal Reference Module #5 council review (governance only)  
**Certification:** **Level 3 — Certified** (Wave 3C)  
**Evidence package (Wave 4A — sole council inputs):**  
[PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md), [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md), [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md)  
**Portfolio:** Reference Modules #1–4 — [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)

> **Governance-only phase.** No runtime code, schema, or modernization. Council evaluated **approved evidence only** — no new implementation requests, no out-of-package discovery.

---

## Executive summary

| Outcome | Decision |
|---------|----------|
| **Council vote** | **C. Approve** |
| **Reference Module #5 designation** | **Yes — Place (`place`)** |
| **Certification level change** | **None** — remains **Level 3 — Certified** (not Level 4 Reference Implementation) |
| **Wave 4A conditions RC-1–RC-5** | **Accepted** as pre-vote acknowledgments |

**Headline:** Place fills the **external market graph** slot absent from References #1–4 and Notebook. Constitutional maturity, uniqueness, reusability, and platform value meet the same bar Calendar (#3) and Todo (#4) met at reference designation. Documented debt PL-H1, PL-H2, PL-H3, PL-H7 is **not reference-blocking**.

---

## Council rules compliance

| Rule | Compliance |
|------|------------|
| Evaluate evidence only | ✅ Wave 4A package + L3/constitutional audits cited in package index |
| No new implementation work requested | ✅ Post-designation hygiene listed as optional punch-list only |
| No out-of-package discovery | ✅ No new gaps introduced in this session |
| Vote: approve / conditionally approve / reject | ✅ **Approve** recorded below |

---

## Part 1 — Constitutional strength

**Question:** Is Place constitutionally mature enough to be copied by future modules?

**Council answer:** **Yes.**

| Area | Verdict | Evidence (approved package) |
|------|---------|----------------------------|
| **Services** | 🟢 | 16+ `place*Service` modules; extraction plan complete |
| **Controllers** | 🟢 | Thin; zero handler Prisma; contract tests |
| **Policy Engine** | 🟡 | Write paths **C**; read/discovery partial (PL-H1/H3 — not blocking) |
| **Visibility** | 🟡 | `placeVisibilityService` owns reads; bounded sets |
| **Trash** | 🟢 | `placeTrashService` + handler; listing + meeting |
| **V_Link** | 🟢 | Access, lifecycle, resolver |
| **Entities** | 🟢 | `place:listing`, `place:meeting`; manifest aligned |
| **Activity** | 🟡 | Primary write lifecycles **C**; transactions omit (PL-H2) |
| **Domain events** | 🟢 | Registry + emitters on primary lifecycles |
| **Notifications** | 🟢 | 6 types; manifest truth |
| **Realtime** | 🟢 | `placeRealtimeService` adapter |
| **AI compliance** | 🟢 | Read-only executor → `placeAIActionService` |

**Comparison to Reference #4 (Todo) at designation:** Todo carried satellite read partials and optional due-notification gaps; council accepted 🟡 on non-core paths. Place is **at parity or better** on write-path constitutional completeness for its core domain.

---

## Part 2 — Architectural uniqueness

**Question:** Does Place teach patterns not represented by File Hub, Calendar, Todo, or Notebook?

**Council answer:** **Yes.**

| Pattern | Represented elsewhere? | Place teaches |
|---------|---------------------|---------------|
| External personal graph (Main Street) | **No** | Typed `PlaceNode`, follow sync, interests |
| Dual consumer + publisher surface | **No** (Workspace is shell only) | `/place` + business listing admin |
| Directory + EIN verification gate | **No** | `BusinessPlaceListing` + explore/search filters |
| Commerce routing without checkout | **No** | Interaction links + telemetry boundary |
| Connection mirror on Member domain | **No** | `placeConnectionService` side effects |
| Meeting-at-place + Calendar delegate | **Partial** Calendar alone | Social location meeting + event link |
| Bounded community (no Chat messages) | **No** | `placeCommunityService` |

**Shared (correctly reused, not claimed as novel):** Trash, V_Link, PE dual, side-effect adapters, Calendar delegation, Chat realtime borrow — per [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md) §10.

**Notebook:** Composition over certified modules — **does not compete** for external-graph reference slot (Notebook L3 review §9).

---

## Part 3 — Reusability

**Question:** Can future modules copy Place patterns?

**Council answer:** **Yes.**

| Pattern family | Copyable? | Target modules |
|----------------|-----------|----------------|
| Graph patterns | ✅ | Future Vendor/Market, partner directory modules |
| Discovery patterns | ✅ | Any verified public directory |
| Listing patterns | ✅ | Publisher storefront modules |
| Delegation patterns | ✅ | Cross-module mirror + Calendar/File Hub routing |
| Marketplace routing | ✅ | External-link routers (not payment processors) |

[PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md) provides actionable checklists — sufficient for reference teaching without File Hub Level 4 bar.

---

## Part 4 — Platform value

**Question:** Does Place materially improve architectural completeness of Vssyl?

**Council answer:** **Yes.**

| Capability | Platform gap without Place | Place contribution |
|------------|---------------------------|-------------------|
| **External graph** | Internal modules only | User market neighborhood |
| **Discovery** | No verified business directory | Explore, search provider, categories |
| **Directory** | Business entity without storefront | `BusinessPlaceListing` lifecycle |
| **Commerce routing** | No external-link pattern | Interaction links + boundary doc |
| **Communities** | Chat = messages; not interest graph | Bounded social layer |
| **Dual surfaces** | Single-context modules | Consumer + publisher on one domain |

**Internal vs external rule** (Notebook architecture): Place completes the platform story for **outside the building** workflows — healthcare supplier discovery, routing, coordination — documented in product architecture review.

---

## Part 5 — Remaining debt review (PL-H1, PL-H2, PL-H3, PL-H7)

| ID | Debt | Reference blocker? | Council disposition |
|----|------|-------------------|---------------------|
| **PL-H1** | `searchUsers` PE dual not wired | **No** | Post-Reference hygiene; visibility bounded today |
| **PL-H2** | Transaction activity/events omitted | **No** | **Intentional** commerce routing boundary per [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md); RC-2 accepted |
| **PL-H3** | Read-path PE parity | **No** | Same tier as Todo/Calendar read partials; RC-3 accepted |
| **PL-H7** | Notebook PLACE_LISTING resolver partial | **No** | Cross-module polish; fail-closed today |

**None block Reference #5 designation.** Rejecting on these items would exceed evidence package scope and contradict L3 + 4A council conditions.

---

## Part 6 — Reference portfolio fit

**Question:** Does Place fill a unique catalog role? Best next reference vs Dashboard / Analytics / Business Workspace?

**Council answer:** **Place is the only viable Reference #5.**

| Candidate | Level | Unique persistence / patterns | Fit for #5 |
|-----------|-------|------------------------------|------------|
| **Place** | 3 — Certified | External graph, directory, routing, dual-surface | **Selected** |
| Dashboard | 1 | Widget registry only | Rejected — composition, not domain reference |
| Analytics | 1 | Derived metrics / stubs | Rejected — read-only pseudo-module |
| Business Workspace | 1 | Hub switch | Rejected — shell; patterns in module-development rules |

**Portfolio after vote:**

| # | Module | Role |
|---|--------|------|
| 1 | File Hub | Content, trash, V_Link, entities (Level 4) |
| 2 | Chat | Realtime, messaging, AI routing |
| 3 | Calendar | Scheduling, recurrence, reminders |
| 4 | Todo | Tasks, assignment, work satellites |
| **5** | **Place** | **External graph, directory, discovery, commerce routing, dual-surface** |

---

## Part 7 — Council vote

### **C. Approve**

**Rationale:**

1. Wave 4A evidence package complete; RC-1–RC-5 satisfied in this session.
2. L3 certified with 35 matrix **C** rows; 0 primary **N**; no P0 violations.
3. Architectural uniqueness **confirmed** — fifth orthogonal domain in catalog.
4. Reusability and platform value **confirmed** via pattern guide and commerce boundary.
5. PL-H1/H2/H3/H7 **not reference blockers** — documented and bounded.
6. Same governance bar as Calendar Reference #3 and Todo Reference #4 at Level 3 designation.

### Not chosen: **A. Reject**

Would require 🔴 constitutional failures or absence of teachable uniqueness — neither applies per approved evidence.

### Not chosen: **B. Conditionally Approve**

Conditional tier reserved when designation must wait on **undocumented** blockers or unaccepted scope boundaries. Wave 4A explicitly pre-accepted PL-H2/H3 as routing/read partials; conditional vote would duplicate RC-2/RC-3 without adding governance value.

---

## Part 8 — Reference Module decision

| Decision | Outcome |
|----------|---------|
| **Place designated Reference Module #5?** | **Yes** |
| **Level** | **3 — Certified** (reference designation does not promote to Level 4) |
| **Catalog row** | Reference Module #5 — external graph + directory + commerce routing |
| **Teaching docs** | [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md), [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md) |

**Not granted:** Level 4 Reference Implementation (File Hub bar) — out of scope; no `Level 4` ledger promotion.

---

## Part 9 — Catalog impact (applied)

| Document | Update |
|----------|--------|
| [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md) | Place added as **#5** in at-a-glance table; candidate language retired |
| [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md) | Place status → **Reference Module #5 (Level 3)** |
| [PLATFORM_MODULE_MODERNIZATION_ROADMAP.md](../../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) | Wave 4B council complete |
| `memory-bank/activeContext.md` / `progress.md` | Reference #5 assigned |

---

## Post-Reference punch-list (optional hygiene — not council conditions)

| ID | Item |
|----|------|
| PL-H1 | Wire `PLACE_DISCOVERY_READ` on `searchUsers` |
| PL-H2 | Transaction activity/events (only if product wants commerce feed — not ERP) |
| PL-H3 | Read PE parity audit |
| PL-H5 | Legacy `PlaceActivityFeedItem` schema sunset |
| PL-H7 | Notebook PLACE_LISTING resolver parity |

---

## Recommended next phase

| Priority | Phase |
|----------|-------|
| 1 | **Dashboard / Analytics / Business Workspace** modernization (Wave 3 roadmap) — copy references #1–5 as applicable |
| 2 | Optional Place post-Reference hygiene (PL-H1–H3) |
| 3 | Future Vendor/Procurement module — copy Place routing + commerce boundary patterns |

**Do not start:** Level 4 promotion for Place without separate Reference Implementation review (File Hub precedent).

---

## Evidence index (council record)

All deliberation confined to:

- [PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md](./PLACE_REFERENCE_IMPLEMENTATION_REVIEW.md)
- [PLACE_PATTERN_GUIDE.md](../PLACE_PATTERN_GUIDE.md)
- [PLACE_COMMERCE_BOUNDARY.md](../PLACE_COMMERCE_BOUNDARY.md)
- [PLACE_LEVEL3_CERTIFICATION_REVIEW.md](./PLACE_LEVEL3_CERTIFICATION_REVIEW.md)
- [PLACE_LEVEL2_CERTIFICATION_REVIEW.md](./PLACE_LEVEL2_CERTIFICATION_REVIEW.md)
- [PLACE_CONSTITUTIONAL_AUDIT.md](./PLACE_CONSTITUTIONAL_AUDIT.md)
- [PLACE_OPERATION_MATRIX.md](./PLACE_OPERATION_MATRIX.md)
- [REFERENCE_MODULE_CATALOG.md](../REFERENCE_MODULE_CATALOG.md)
- [CERTIFICATION_LEDGER.md](../CERTIFICATION_LEDGER.md)

---

*Wave 4B Reference Module #5 council review — governance only, 2026-06-02.*
