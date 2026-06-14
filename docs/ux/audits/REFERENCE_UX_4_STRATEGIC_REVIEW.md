# Reference UX Module #4 — Strategic Review

**Status:** **Complete** — portfolio strategy only  
**Date:** 2026-06-12  
**Phase:** Governance and registration planning (no designation award)  
**Authorities:** [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md), [`REFERENCE_MODULE_CATALOG.md`](../../architecture/REFERENCE_MODULE_CATALOG.md), [`CERTIFICATION_LEDGER.md`](../../architecture/CERTIFICATION_LEDGER.md), registered UX references #1–#3 and #5, [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md), [`AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md`](../../architecture/audits/AI_PLATFORM_LEVEL2_CERTIFICATION_REVIEW.md), [`AI_PLATFORM_LEVEL3_READINESS_REVIEW.md`](../../architecture/audits/AI_PLATFORM_LEVEL3_READINESS_REVIEW.md)

> **This document is a strategic review only.** It does **not** award Reference UX #4, change UX certification levels, or authorize engineering. **No designation** in this wave.

---

## Executive summary

| Decision | Outcome |
|----------|---------|
| **Intended role of UX #4** | **AI Experience** — canonical copy target for twin/chat workspace UX (streaming, provider selection, conversation lifecycle, attachments, explain drawers) |
| **Recommended holder** | **Reserve for `ai` / AI Chat surfaces** — do **not** award today |
| **Vacancy** | **Remain vacant** pending UX modernization + UX-L3 path |
| **Slot purpose** | **Clarified** — UX #4 is **product-surface** AI experience; independent of **Reference AI Module** (platform layer, [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)) |
| **Alternate candidates** | Place (future slot expansion); Chat (defer); Dashboard / Business Workspace (**ineligible** for UX #4 as defined) |

**Strategic headline:** The portfolio now covers **file workspace** (#1), **inbox management** (#2), **task workspace** (#3), and **scheduling grid** (#5). The remaining distinct archetype is **AI-assisted conversational workspace** — program history already associates vacant **#4** with AI. No other candidate meets both **distinctiveness** and **near-term certification readiness**.

---

## 1. Intended role of Reference UX #4

### 1.1 Portfolio gap analysis (post #1–#3–#5 registration)

| UX slot | Archetype | Holder |
|---------|-----------|--------|
| **#1** | File / entity browser workspace split | Drive |
| **#2** | Management-page inbox / feed | Notifications |
| **#3** | Task / project multi-view workspace | Todo |
| **#5** | Scheduling / time-grid | Calendar |
| **#4** | **Vacant** | — |

**Unfilled UX teaching gaps:**

| Gap | Why existing holders are insufficient |
|-----|--------------------------------------|
| **AI twin / chat workspace** | Drive/Todo/Calendar are CRUD workspaces; Notifications is feed — none model **streaming LLM chat**, provider/model picker, conversation archive, or explain/trace drawers |
| **Dual-surface external graph** | Place (architecture #5) — candidate for a **future** slot, not AI |
| **Widget / dashboard composition** | Dashboard module — no UX certification; different contract than product `moduleId` reference |
| **Business workspace shell** | Platform shell — **Reference Workspace** type (#3 in program), not Reference UX Module |

### 1.2 Program intent (historical)

[`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) vacant-slot note: *"Additional Reference UX modules (e.g. **#4 AI**) require explicit registration."*

The program **Reference types** table lists **#4 = Reference AI Module** (platform AI manifest, providers, executors). That track is **orthogonal** to UX slot numbering:

| Track | #4 meaning | Evidence |
|-------|------------|----------|
| **Reference UX #4** | Product **AI Experience** surfaces (`AIChatWorkspace`, embedded twin) | UX scorecard + registration doc (future) |
| **Reference AI Module** (type) | Platform AI layer L3/L4 | [`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md) |

**Clarified purpose (this review):**

> **Reference UX #4** benchmarks **user-facing AI chat / twin workspace UX** — layout, interaction safety, conversation management, attachments, accessibility, and mobile — for modules exposing AI conversation surfaces. It does **not** replace AI Platform architecture certification.

---

## 2. Candidate evaluation

Scoring: **1 (weak) – 5 (strong)** per dimension. **Weighted rank** = average × strategic fit for slot #4.

### 2.1 Summary rankings

| Rank | Candidate | Avg score | UX #4 fit | Recommendation |
|------|-----------|-----------|-----------|----------------|
| **1** | **AI Experience** (`ai` / `ai-chat`) | **3.4** | **Primary** | **Reserve #4** — award after UX-L3 path |
| **2** | **Place** (`place`) | **3.2** | Alternate (future #6?) | Modernize UX first; do not preempt #4 |
| **3** | **Chat** (`chat`) | **2.8** | Poor for #4 | Continue L2 path; not reference slot |
| **4** | **Dashboard** (`dashboard`) | **2.0** | Poor | Defer; widget registry immature |
| **5** | **Business Workspace** (shell) | **N/A** | **Ineligible** | Reference **Workspace** track, not UX #4 |
| **6** | **Notebook / HR / Scheduling** | **1.5–2.0** | Poor | Niche or tied to other references |

### 2.2 AI Experience (`ai` / AI Chat)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Reusability** | **4** | `AIChatWorkspace` single source (3C-5); page + embedded variants; patterns for streaming, trash confirm, attachments |
| **Cross-platform value** | **5** | Every module AI manifest + twin entry; marketplace AI surfaces will copy chat UX |
| **UX maturity** | **2** | No formal 11-category scorecard; 3C-5 layout dedup only; embedded variant retains pre-existing stubs |
| **Certification readiness** | **2** | No UX-L1 award; no manual QA matrix section; roadmap: Medium L2 effort |
| **Long-term importance** | **5** | AI Platform L2 compliant; constitutional AI central to product; distinct from registered archetypes |

**Strengths:** Only candidate that fills the **conversational AI workspace** portfolio gap; 3A-4A menus + 3C-5 dedup complete; AI Platform safe at L2.

**Weaknesses:** No `AI_UX_SCORECARD.md`; no Part 2 matrix; large monolithic workspace (~3k LOC); embedded/page parity gaps; AI Platform L3 deferred (~8–14 weeks, separate track).

### 2.3 Place (`place`)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Reusability** | **4** | Dual-surface (`/place` + `PlaceWorkspaceLanding`); directory, listing, commerce routing — unique |
| **Cross-platform value** | **4** | External graph pattern; Notebook/Calendar integrations |
| **UX maturity** | **2** | No 11-category UX scorecard; layout partial vs Drive parity |
| **Certification readiness** | **2** | Architecture L3 #5; UX waves not started on 5A framework |
| **Long-term importance** | **4** | Architecture Reference #5; active modernization |

**Assessment:** Strong **future** UX reference for **dual-surface / directory** archetype — but **does not match** historical #4 = AI intent and duplicates no portfolio gap if AI fills #4. Consider **Reference UX #6** (program expansion) if Place UX-L3 completes before AI.

### 2.4 Chat (`chat`)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Reusability** | **3** | 5B.1/5B.2 interaction safety; messaging patterns informal |
| **Cross-platform value** | **4** | Flagship comms; architecture #2 |
| **UX maturity** | **2** | UX-L1 CwF (6/11 PASS); 52% L2-ready |
| **Certification readiness** | **1** | UX #2 **Rejected**; C-5/C-6/C-8 open |
| **Long-term importance** | **4** | High product; poor certification ROI |

**Assessment:** **Not** UX #4 — messaging inbox partially covered by Notifications #2; product chat ≠ AI twin workspace. Pursue **5H-Chat-L2** without reference slot competition.

### 2.5 Dashboard (`dashboard`)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Reusability** | **3** | `WIDGET_REGISTRY`, `DashboardBuildOutModal` — widget composition |
| **Cross-platform value** | **3** | Personal + business dashboard contexts |
| **UX maturity** | **1** | Mixed shells; no UX certification; high widget variance |
| **Certification readiness** | **1** | No scorecard; Level 1 stabilizing in ledger |
| **Long-term importance** | **3** | Platform entry; superseded partly by Business Workspace |

**Assessment:** Wrong fit for UX #4 — widget grid is a **composition** pattern, not a certified product-module archetype like Drive/Todo.

### 2.6 Business Workspace (platform shell)

| Dimension | Score | Evidence |
|-----------|-------|----------|
| **Reusability** | **4** | `BusinessWorkspaceContent` switch; hub pattern for all modules |
| **Cross-platform value** | **5** | Mount point for every business module |
| **UX maturity** | **2** | Level 1–2 stabilizing; inline stub widgets |
| **Certification readiness** | **0** | **Not a `moduleId`** — fails Reference UX Module definition |
| **Long-term importance** | **5** | Core tenant shell |

**Assessment:** Pursue **Reference Workspace Module** (program type #3) when shell contract stabilizes — **not** Reference UX #4.

### 2.7 Other modules

| Module | Notes |
|--------|-------|
| **Notebook** | L3 composition; copies Todo/Drive — not a primary UX archetype |
| **HR / Scheduling** | Enterprise custom UI; low modernization investment |
| **Analytics** | Pseudo-module; stabilizing only |
| **Drive** | Already UX #1 |

---

## 3. Strategic decision

### 3.1 Options considered

| Option | Verdict |
|--------|---------|
| **Reserve UX #4 for AI** | ✅ **Recommended** |
| **Award UX #4 to existing module now** | ❌ No candidate meets UX-L3 CwF minimum |
| **Redefine UX #4 purpose** | ✅ **Clarified** — AI Experience surfaces (product UX), distinct from platform Reference AI Module |
| **Leave vacant pending future work** | ✅ **Yes** — vacancy is intentional, not neglect |

### 3.2 Recommended holder

| Field | Value |
|-------|-------|
| **Designated holder (reserved)** | **AI Experience** — `moduleId: ai` / routes `ai-chat`, `AIChatWorkspace`, `AIChatModule` |
| **Official holder today** | **None** — slot **remains vacant** |
| **Award timing** | After UX-L3 CwF + `REFERENCE_MODULE_AI.md` registration review (future wave) |

### 3.3 Why not award Place or Chat to #4 today

| Candidate | Blocker |
|-----------|---------|
| **Place** | No UX scorecard; would misalign slot with documented AI intent; architecture reference already satisfies code copy |
| **Chat** | UX-L1 only; #2 rejected; overlaps Notifications messaging patterns |
| **Dashboard / Business Workspace** | Ineligible or wrong certification model |

---

## 4. Required work before award (AI Experience)

### 4.1 UX modernization prerequisites

| Order | Wave (proposed) | Deliverable | Unlocks |
|-------|-----------------|-------------|---------|
| 1 | **5H-AI-UX-A** | Initial 11-category scorecard audit | UX-L1 baseline |
| 2 | **5H-AI-UX-B** | Layout shell pass (`WorkspaceSplitLayout` or certified AI workspace exception doc); interaction safety inventory | L2 path |
| 3 | **5H-AI-UX-C** | Embedded variant parity (remove/gate stubs); mobile pass | PWF reduction |
| 4 | **5G-QA** extension | Platform matrix **Part 2F — AI Chat** (new section) | QA gate |
| 5 | **5G-QA-EXEC** Part 2F | Execution report + evidence | T-11-class gate |
| 6 | **5H-AI-L3-D** | UX-L3 certification review | UX-L3 CwF minimum |
| 7 | **Reference UX #4 registration** | `REFERENCE_MODULE_AI.md` (or `REFERENCE_MODULE_AI_CHAT.md`) | Official holder |

**Estimated effort:** **Medium–Large** — 4–8 weeks UX engineering + ~1 week QA + governance (similar to pre-5G Chat/AI roadmap estimates).

### 4.2 Non-blocking parallel tracks

| Track | Required for UX #4? | Notes |
|-------|---------------------|-------|
| **AI Platform L3** | **No** | Architecture layer; defer per L3 readiness review |
| **AI Platform L4 Reference Architecture** | **No** | Post-L3 + council + stability window |
| **Chat UX-L2** | **No** | Independent; lower priority than AI #4 prep when AI is prioritized |

### 4.3 Registration bar (unchanged from program)

- UX-L3 Certified with Findings **minimum**
- 11-category scorecard published
- Manual QA matrix executed (or documented waiver)
- Registration artifact + program/catalog/ledger update

---

## 5. Portfolio archetype map (target state)

```txt
UX #1 Drive        → file / entity workspace split
UX #2 Notifications → management inbox / feed
UX #3 Todo         → task / project multi-view workspace
UX #4 AI (vacant)  → AI twin / chat workspace  ← RESERVED
UX #5 Calendar     → scheduling / time-grid
(future #6?) Place → dual-surface external graph / directory
```

**Reference Workspace** (separate): Business Workspace shell when Level 2+ stable.

---

## 6. Future obligations (program maintenance)

| Obligation | Owner |
|------------|-------|
| Do not award UX #4 without UX-L3 CwF + registration review | UX / governance |
| Keep UX #4 reserved for AI Experience until council/product reprioritizes | Architecture |
| Track Place as **alternate** UX reference candidate for **slot expansion** (#6), not #4 preemption | Product |
| Publish Part 2F AI matrix before AI QA-EXEC | QA |
| Sync [`REFERENCE_MODULE_PROGRAM.md`](../REFERENCE_MODULE_PROGRAM.md) UX #4 purpose text with this review | Docs |

---

## 7. Related documents

| Document | Role |
|----------|------|
| [`REFERENCE_MODULE_DRIVE.md`](./REFERENCE_MODULE_DRIVE.md) | UX #1 |
| [`REFERENCE_MODULE_NOTIFICATIONS.md`](./REFERENCE_MODULE_NOTIFICATIONS.md) | UX #2 |
| [`REFERENCE_MODULE_TODO.md`](./REFERENCE_MODULE_TODO.md) | UX #3 |
| [`REFERENCE_MODULE_CALENDAR.md`](./REFERENCE_MODULE_CALENDAR.md) | UX #5 |
| [`AI_CHAT_DEDUPLICATION_CLOSEOUT.md`](./AI_CHAT_DEDUPLICATION_CLOSEOUT.md) | 3C-5 baseline |
| [`CHAT_UX_MODERNIZATION_REASSESSMENT.md`](./CHAT_UX_MODERNIZATION_REASSESSMENT.md) | Chat ≠ UX #4 |
| [`PLACE_LEVEL3_CERTIFICATION_REVIEW.md`](../../architecture/audits/PLACE_LEVEL3_CERTIFICATION_REVIEW.md) | Place architecture; UX TBD |

---

**Last updated:** 2026-06-12 (Reference UX #4 strategic review — no designation)
