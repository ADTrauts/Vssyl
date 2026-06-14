# UX Reference Program Expansion Review (Wave 6C)

**Status:** **Complete** — governance review only  
**Date:** 2026-06-14  
**Wave:** 6C — UX Reference Program Expansion Review  
**Program:** [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md)  
**Prior closeout:** [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../UX_REFERENCE_PROGRAM_CLOSEOUT.md)

> **No registration. No certification changes. No council action.** Strategic governance only.

---

## Required report

| # | Question | Answer |
|---|----------|--------|
| 1 | Is the original UX program complete? | **Yes** — for its defined scope (#1–#5 registration + Wave 6A pattern extraction). **Platform UX standardization is not fully closed.** |
| 2 | Should UX #6 exist? | **Yes** — as a **governed expansion tier**, not an automatic slot. Recommend formal program amendment. |
| 3 | Should Place become UX #6? | **Yes — recommended primary candidate.** Eligible With Findings; council registration deferred to a separate wave. |
| 4 | Should a Reference Workspace track exist? | **Yes — in parallel.** Platform shell is a different reference class; not a substitute for UX #6. |
| 5 | Recommended future governance model | **Two-tier UX roster** (baseline #1–#5 frozen + expansion #6+) + **Reference Workspace** + **pattern annexes** for domain modules |
| 6 | Recommended next modernization initiative | **6B-Place-Ref6-Prep** + **6D-Place-Pattern-Extraction**; parallel **6C-Reference-Workspace-Charter** |

---

## 1. Executive summary

The **original UX Reference Module Program** achieved its charter: five registered UX references, full L1–L3 certification paths for each, and **56** canonical patterns extracted into platform standards (Wave 6A). That program phase is **complete and should remain frozen** as the baseline teaching set.

Place now holds **UX-L3 Certified** (strict, 11/0/0) and **Architecture Reference #5** independently. It fills the largest remaining **interaction archetype gap** in the portfolio: dual-surface consumer/publisher + neighborhood graph + discovery/publishing flows. No existing UX reference (#1–#5) adequately teaches this archetype.

**Strategic recommendation:** Approve a **governed expansion phase** with **Place as UX Reference #6** after registration prep and council review — not in this wave. Launch a **parallel Reference Workspace track** for Business Workspace shell patterns. Do **not** proliferate numbered UX slots for HR, Scheduling, Marketplace, or Analytics as full references; map them to archetype annexes instead.

---

## 2. Evidence inputs

| Artifact | Role |
|----------|------|
| [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) | Program charter, slot rules, Wave 6A status |
| [`REFERENCE_MODULE_CATALOG.md`](../../architecture/REFERENCE_MODULE_CATALOG.md) | Architecture vs UX tracks; Place arch #5 |
| [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md) | 56 patterns; inheritance matrix |
| [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../UX_REFERENCE_PROGRAM_CLOSEOUT.md) | Wave 6A completion verdict |
| [`PLACE_UX_CERTIFICATION.md`](./PLACE_UX_CERTIFICATION.md) | UX-L1/L2/L3 awards |
| [`PLACE_UX_CERTIFICATION_REVIEW.md`](./PLACE_UX_CERTIFICATION_REVIEW.md) | 11/0/0; Reference UX #6 eligibility |
| [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md) | Prior portfolio gap analysis; Place as future #6 |
| Peer reviews | Calendar, Todo, Notifications, AI Experience L3 certification reviews |

---

## 3. Program completion assessment

### 3.1 What “complete” means

| Phase | Scope | Status |
|-------|-------|--------|
| **UX Reference registration #1–#5** | Drive, Notifications, Todo, AI Experience, Calendar | ✅ **Complete** |
| **UX certification for all five** | L1–L3 paths executed | ✅ **Complete** |
| **Wave 6A pattern extraction** | 56 `UX-PAT-*` → 9 standard docs | ✅ **Complete** |
| **Governance cross-links** | Program, catalog, roadmap, memory bank | ✅ **Complete** |
| **Full platform UX archetype coverage** | All product interaction classes | ⚠️ **Partial** |
| **Partner enforcement automation** | `UX-PAT-*` in marketplace gates | ⚠️ **Partial** |

### 3.2 Verdict

The **original UX Reference Program** (registration roster capped at five + pattern extraction) **is complete** per [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../UX_REFERENCE_PROGRAM_CLOSEOUT.md) §7.

Completion does **not** imply:

- No further UX references may be added
- All modules have a dedicated numbered slot
- Place, Chat, or Business Workspace are adequately covered by borrowing alone

The program explicitly reserved expansion: *"Additional slots (e.g. #6 Place dual-surface) require explicit program expansion."*

---

## 4. Expansion options evaluation

### Option A — Keep roster fixed at #1–#5

| Pros | Cons |
|------|------|
| Stable teaching set; 56 patterns already extracted | Largest archetype gap (graph + dual-surface) unowned |
| No council overhead | Place UX-L3 graduates with no canonical copy target |
| Partners map to nearest archetype | Future modules invent ad-hoc graph/publisher UX |

**Assessment:** **Sufficient for maintenance mode only.** Reject as long-term posture now that Place is UX-L3 Certified. Baseline #1–#5 should remain **frozen**; expansion should add #6+, not replace the original five.

**Rating:** ⚠️ Acceptable short-term · ❌ Insufficient 12–24 months

---

### Option B — Add UX #6 and register Place

| Pros | Cons |
|------|------|
| Closes graph/dual-surface/publishing gap | Requires council, registration doc, pattern annex |
| Place exceeds L3 bar (strict 11/0/0, 27 QA PASS) | Human sign-off + staging QA still open |
| Aligns with 2026-06 strategic review (#4 reserved AI; Place future #6) | Second pattern extraction wave needed (~8–12 new patterns) |
| Independent of Architecture #5 (already Place) | Program charter amendment required |

**Assessment:** **Recommended primary expansion path.**

**Rating:** ✅ **Recommended**

**Prerequisites (not this wave):** `REFERENCE_MODULE_PLACE.md`, council approval, Wave 6D pattern extraction, human sign-off.

---

### Option C — Create Reference Workspace track

| Pros | Cons |
|------|------|
| Addresses Business Workspace / platform shell gap | Does not teach graph, discovery, or publisher listing UX |
| Already defined in program (Reference Workspace Module type) | Shell is not a `moduleId` — different contract |
| Complements product module references | Hub standardization still incomplete (dead landings) |

**Assessment:** **Recommended in parallel with Option B**, not instead of it. Reference Workspace benchmarks `PlatformShell`, `BusinessWorkspaceContent`, hub switches — patterns Place does not own.

**Rating:** ✅ **Recommended (parallel track)**

---

### Option D — Domain-specific reference tracks (HR, Scheduling, Marketplace, Analytics, Business Workspace)

| Track | Nearest archetype | Full numbered slot? |
|-------|-------------------|---------------------|
| **HR** | Todo #3 (work management) + Drive #1 (entity browser) | ❌ No — pattern annex |
| **Scheduling** | Calendar #5 (time-grid) | ❌ No — already covered |
| **Marketplace (partner)** | Matching built-in archetype + `moduleSpecs.md` | ❌ No — partner pipeline doc |
| **Analytics** | Notifications #2 (feed/dashboard cards) or new annex | ❌ No — immature UX certification |
| **Business Workspace** | Reference Workspace track (Option C) | ❌ No — not product module |

**Assessment:** **Reject numbered slots per domain.** Adopt **pattern annexes** in catalog: domain modules inherit from nearest UX reference + document domain-specific exceptions. Avoid slot proliferation (would dilute teaching authority and multiply council load).

**Rating:** ⚠️ **Annexes yes · Numbered slots no**

---

### Options summary

| Option | Recommendation |
|--------|----------------|
| **A** — Fixed #1–#5 | Baseline frozen; not sufficient alone |
| **B** — UX #6 Place | **Primary expansion — approve** |
| **C** — Reference Workspace | **Parallel — approve charter wave** |
| **D** — Domain tracks | **Pattern annexes only — not full slots** |

---

## 5. Place assessment

### 5.1 Certification posture (independent of registration)

| Dimension | Status |
|-----------|--------|
| UX-L1 / L2 / L3 | **Certified** (strict L3) |
| Scorecard | **11 PASS / 0 PWF / 0 FAIL** |
| QA matrix Part 2G | **27 PASS / 0 FAIL / 0 BLOCKED** |
| Architecture Reference #5 | **Level 3 Certified** (separate track) |
| Reference UX registration | **Not registered** |

### 5.2 Archetype uniqueness

| Pattern class | Owned by #1–#5? | Place contribution |
|---------------|-----------------|-------------------|
| Dual-surface (consumer + publisher) | ❌ | `PlacePageShell` + `PlaceWorkspaceLanding` |
| Neighborhood graph (React Flow) | ❌ | `PlaceGraph`, node list a11y, explore dismiss |
| Discovery / follow / unfollow | ❌ Partial (NTF feed ≠ graph follow) | Explore cards, `BusinessProfilePanel` |
| Publisher listing editor | ❌ | `PlaceListingEditor`, danger-zone trash |
| External commerce links | ❌ | Interaction links; commerce boundary |
| Meeting-at-place + calendar bridge | ❌ Partial (Cal grid ≠ social meeting) | `PlaceMeetings`, calendar link modal |
| Transaction history privacy | ❌ | `/place/transactions`, privacy overlay |

**Conclusion:** Place is a **distinct UX archetype**, not a variant of Drive, Notifications, Todo, AI, or Calendar.

### 5.3 Classification decision

| Class | Fit |
|-------|-----|
| **Future UX #6** | ✅ **Primary** — meets distinctiveness + L3 + QA bar |
| **Different reference class (Workspace)** | ❌ — product `moduleId`, not platform shell |
| **Not appropriate for expansion** | ❌ — would leave largest gap unowned |

**Place assessment:** **Recommended UX Reference #6** after registration prep. **Not** a Reference Workspace candidate. **Not** ineligible for expansion.

---

## 6. Portfolio gap analysis

### 6.1 Archetypes covered by current roster (#1–#5)

| Archetype | UX reference | Key patterns |
|-----------|--------------|--------------|
| File / entity browser | **#1 Drive** | WS-001, DES-001/003, XMOD-001 |
| Inbox / management feed | **#2 Notifications** | WS-010, NAV-002, A11Y-003 |
| Task / multi-view workspace | **#3 Todo** | WS-002/005/006, NAV-001 |
| AI twin / chat workspace | **#4 AI Experience** | WS-009, AI-001–007 |
| Scheduling / time-grid | **#5 Calendar** | WS-004, MOB-001/002, DES-006/007 |

### 6.2 Archetypes not represented (post-6A)

| Gap | Severity | Proposed owner |
|-----|----------|----------------|
| **Graph / network experiences** | **High** | Place #6 |
| **Dual-surface consumer + publisher** | **High** | Place #6 |
| **Discovery + follow relationship network** | **High** | Place #6 |
| **Publishing / listing editor workflows** | **Medium** | Place #6 |
| **Business workspace platform shell** | **Medium** | Reference Workspace track |
| **Messaging / chat UX** | **Medium** | No UX ref — Arch Chat #2; borrow NTF feed patterns |
| **Marketplace partner iframe UX** | **Medium** | Partner annex + nearest archetype |
| **Analytics / insights dashboards** | **Low** | Future annex; no slot yet |
| **HR / org management surfaces** | **Low** | Todo #3 annex |

### 6.3 Proposed new patterns (Place #6 extraction preview)

Wave 6D would add approximately **8–12** patterns, e.g.:

| Proposed ID | Name | Owner |
|-------------|------|-------|
| UX-PAT-GRPH-001 | Neighborhood graph canvas + minimap | Place #6 |
| UX-PAT-GRPH-002 | Keyboard node list (graph a11y fallback) | Place #6 |
| UX-PAT-PLC-001 | Dual-surface consumer shell (`PlacePageShell`) | Place #6 |
| UX-PAT-PLC-002 | Publisher storefront hub + listing editor | Place #6 |
| UX-PAT-PLC-003 | Explore discovery + follow toggle | Place #6 |
| UX-PAT-PLC-004 | Profile panel (business/household) | Place #6 |
| UX-PAT-PLC-005 | Meeting-place + calendar link modal | Place #6 |
| UX-PAT-PLC-006 | Commerce interaction link (external routing) | Place #6 |

(Full extraction deferred to **6D-Place-Pattern-Extraction** — not this wave.)

---

## 7. Portfolio comparison

| Module | UX slot | UX level | Scorecard | QA | Registration | Archetype |
|--------|---------|----------|-----------|-----|--------------|-----------|
| **Drive** | #1 | L3+ ref | Reference baseline | Mature | **Approved CwF** | Entity browser |
| **Notifications** | #2 | L3 CwF | 11/1/0 | 18 PASS | **Approved CwF** | Inbox feed |
| **Todo** | #3 | L3 Certified | 11/0/0 | 25 PASS | **Approved CwF** | Task workspace |
| **AI Experience** | #4 | L3 CwF | 11/0/0 | 20 PASS | **Approved CwF** | AI twin |
| **Calendar** | #5 | L3 Certified | 11/0/0 | 19 PASS | **Approved CwF** | Time-grid |
| **Place** | *(vacant)* | **L3 Certified** | **11/0/0** | **27 PASS** | **Eligible CwF** | Graph + dual-surface |

Place matches or exceeds Todo/Calendar strict L3 evidence. It is the only post-6A module with a **unique, unowned archetype** and full certification + QA closure.

**Chat:** Architecture #2 only; UX Reference #2 **rejected** at 5B.3 — not an expansion candidate near-term.

---

## 8. Recommended governance model (12–24 months)

### 8.1 Two-tier UX Reference roster

| Tier | Slots | Governance | Pattern obligation |
|------|-------|------------|------------------|
| **Baseline (frozen)** | UX #1–#5 | Complete — maintain only via recertification triggers | Wave 6A catalog authoritative |
| **Expansion (governed)** | UX #6+ | Council + registration doc + QA matrix + pattern annex required | New extraction wave per slot |

**Rules for expansion tier:**

1. Candidate must hold **UX-L3 Certified** (or CwF with documented non-blocking findings)
2. Must demonstrate **archetype distinctiveness** — not borrowable from baseline #1–#5 alone
3. Requires `REFERENCE_MODULE_[MODULE].md` + program catalog update
4. Requires pattern extraction into `UX_REFERENCE_PATTERN_CATALOG.md` (no orphan registrations)
5. **No certification or level changes** in governance-only waves

### 8.2 Parallel: Reference Workspace track

| Field | Value |
|-------|-------|
| **Type** | Reference Workspace Module (program type — not UX slot number) |
| **Benchmarks** | `BusinessWorkspaceContent`, `PlatformShell`, hub switch, runtime scope bridge |
| **Status** | Level 1–2 stabilizing — not registered |
| **Relationship to UX #6** | Orthogonal — shell orchestration vs product module surfaces |

### 8.3 Pattern annexes (domain modules)

For HR, Scheduling, Marketplace partners, Analytics:

- Document in `REFERENCE_MODULE_CATALOG.md` § Domain annexes
- Map to **primary + secondary** UX reference from baseline/expansion tiers
- No new numbered UX slot unless archetype is genuinely novel (high bar)

### 8.4 Recertification and drift

Unchanged from [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md): destructive flows, shell drift, native dialogs, trash contract changes trigger re-audit. Expansion tier modules follow same triggers.

---

## 9. Strategic roadmap (12–24 months)

| Window | Initiative | Outcome |
|--------|------------|---------|
| **Q2 2026** | **6B-Place-Ref6-Prep** | Draft `REFERENCE_MODULE_PLACE.md`; human sign-off package |
| **Q2–Q3 2026** | **6D-Place-Pattern-Extraction** | Mirror Wave 6A; GRPH/PLC patterns → new standard doc(s) |
| **Q3 2026** | **Council: Place UX #6 registration** | Approve With Findings (expected) |
| **Parallel Q2–Q3** | **6C-Reference-Workspace-Charter** | Workspace shell standard; hub completion gate |
| **Q3–Q4 2026** | Partner `UX-PAT-*` enforcement gate | Marketplace certification links patterns |
| **2027 H1** | Chat UX reassessment | Decide reject permanence vs feed-hybrid archetype |
| **2027+** | Analytics UX annex | Only if certification path matures |

**Do not schedule:** UX slots for HR, Scheduling, Marketplace as numbered references. **Do not merge** Architecture and UX slot numbering (already documented; preserve).

---

## 10. Recommended next modernization initiative

**Primary:** **6B-Place-Ref6-Prep** — registration artifact, council briefing, staging QA optional.

**Parallel:** **6C-Reference-Workspace-Charter** — Business Workspace shell reference track (Option C).

**Follow-on:** **6D-Place-Pattern-Extraction** — required before expansion tier is considered fully closed (registration without patterns repeats pre-6A gap).

**Explicitly not next:** Reference UX #6 council vote in Wave 6C; certification changes; engineering remediation.

---

## 11. Constraints honored

- ✅ Governance review only  
- ✅ No registration  
- ✅ No certification changes  
- ✅ No council action  
- ✅ No Reference UX #6 designation  

---

## Related

- [`PLACE_UX_CERTIFICATION_REVIEW.md`](./PLACE_UX_CERTIFICATION_REVIEW.md)
- [`UX_REFERENCE_PROGRAM_CLOSEOUT.md`](../UX_REFERENCE_PROGRAM_CLOSEOUT.md)
- [`REFERENCE_UX_4_STRATEGIC_REVIEW.md`](./REFERENCE_UX_4_STRATEGIC_REVIEW.md)
- [`UX_MODERNIZATION_ROADMAP.md`](../UX_MODERNIZATION_ROADMAP.md)

---

**Last updated:** 2026-06-14 (Wave 6C — governance review complete)
