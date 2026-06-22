# Platform Reference Candidates 2026

**Program:** Platform Portfolio Refresh 2026  
**Date:** 2026-06-21  
**Authority:** [`REFERENCE_MODULE_CATALOG.md`](../architecture/REFERENCE_MODULE_CATALOG.md) (read-only)  
**Status:** Discovery only — **no designation votes, no ledger changes**

---

## Reference taxonomy overview

Vssyl uses **multiple reference taxonomies** — they do not share integer slots:

| Taxonomy | Slots | Authority |
|----------|-------|-----------|
| **Architecture Reference Modules** | #1–#5 | File Hub, Chat, Calendar, Todo, Place |
| **UX Reference Modules** | #1–#6 | Drive, Notifications, Todo, AI, Calendar, Place (expansion) |
| **Platform Capabilities** | #OC, #CG, #AP | Business Admin, Context Graph, Account Platform |
| **Business Operations Candidates** | #1, #6, #7 | HR, Scheduling, Workforce Communications |
| **Workspace Program** | Program #3 | Reference Workspace With Findings |
| **Level 4** | Single | File Hub only |

---

## Current reference inventory (ratified)

### Architecture Reference Modules (L3/L4 code)

| # | Module | Level | Status |
|---|--------|-------|--------|
| **#1** | File Hub (`drive`) | **L4** | Reference Implementation |
| **#2** | Chat | **L3** | Certified |
| **#3** | Calendar | **L3** | Certified |
| **#4** | Todo | **L3** | Certified |
| **#5** | Place | **L3** | Certified |
| — | Notebook | **L3** | Certified — **not** Reference #5 |

### UX Reference Modules

| # | Module | Status |
|---|--------|--------|
| **#1** | Drive / File Hub | Approved with Findings |
| **#2** | Notifications | Approved with Findings |
| **#3** | Todo | Approved with Findings |
| **#4** | AI Experience | Approved with Findings |
| **#5** | Calendar | Approved with Findings |
| **#6** | Place *(expansion)* | **Eligible With Findings — not registered** |

### Platform capability references

| ID | Capability | Designation | Program |
|----|------------|-------------|---------|
| — | Admin Portal | Control Plane Reference With Findings | Archived L3 |
| **#OC-1** | Org Chart Identity & Structure | Reference Platform Capability With Findings | BA archived |
| **#OC-2** | Permission Sets & Module Access | Reference Platform Capability With Findings | BA archived |
| **#OC-3** | Approval Boundaries | Reference Platform Capability With Findings | BA archived |
| **#CG-1** | Federated Context Graph Read Model | Reference Capability | CG archived |
| **#CG-2** | V_Link Cross-Module Substrate | Reference Capability | CG archived |
| **#CG-3** | Context Bundle / AI Grounding | Reference Capability With Findings | CG archived |
| **#AP-BILL-1** | Billing Platform Pattern | Reference Capability With Findings | AP archived |

### Business Operations reference candidates

| # | Module | Designation | Advisories |
|---|--------|-------------|------------|
| **#1** | HR | Reference Candidate #1 — Workforce Lifecycle | 6 |
| **#6** | Scheduling | Reference Candidate WITH FINDINGS #6 — Planning | 5 |
| **#7** | Workforce Communications | Reference Candidate #7 — Workforce Broadcast | 3 |

### Workspace reference

| Program | Designation | Certification |
|---------|-------------|---------------|
| Reference Workspace #3 | Reference Workspace With Findings | WS-L3 CwF (2026-06-19) |

---

## Top 5 reference candidates (promotion potential)

Ranked by **teachability**, **gate score**, and **platform copy value** — not by business urgency.

| Rank | Candidate | Current designation | Promotion target | Readiness | Blockers |
|------|-----------|---------------------|------------------|-----------|----------|
| **1** | **PP-2 Settings Platform** | L3 CwF; pattern **deferred** | **Reference Platform Capability** (settings orchestration) | **High** — 26/27 G-score | PP2-F05 BA dedup; 6 advisories |
| **2** | **HR (BO #1)** | Reference Candidate #1 CwF | **Reference Candidate plain** or module reference annex | **Medium-High** — 24/27 domain | 6 advisories; G1/G6/G8 partial at domain |
| **3** | **#AP-BILL-1 Billing** | Reference Capability With Findings | **Plain Reference Capability** | **Medium** — 23/27 PP-3 | Modal UX (M02); webhook activity (M05); commerce PE (M07) |
| **4** | **PP-1 Identity & Profile** | L3 CwF; pattern **deferred** | **Reference Platform Capability** (identity substrate) | **Medium** — 24/27 | MFA major (PP1-F03); photo controller (PP1-F04) |
| **5** | **UX Reference #6 Place** | Eligible With Findings | **UX Reference #6 registered** | **Medium** — UX-L3 strict achieved | Registration doc + Wave 6D pattern extraction |

---

## Reference candidate detail

### 1. PP-2 Settings Platform (highest reference potential)

| Field | Value |
|-------|-------|
| **Why #1** | Strongest G-score in Account Platform trilogy (26/27); `settingsService` orchestration + `preferenceRegistry` + adapter pattern is copyable across modules |
| **Teachable patterns** | Settings hub IA; notification settings adapter; cross-module preference projection; registry-driven discovery |
| **Not ready for** | Reference Module #N integer (not a workspace module) |
| **Promotion path** | Close PP2-F05 → reference review → council vote for Reference Platform Capability |
| **Evidence** | [PP2_REFERENCE_REVIEW.md](../account-platform/PP2_REFERENCE_REVIEW.md) |

### 2. HR — Reference Candidate #1

| Field | Value |
|-------|-------|
| **Why #2** | Richest workforce lifecycle service architecture in BO domain; org-chart symmetry; V_Link + trash + PE dual |
| **Teachable patterns** | `employeeManagementService`, `hrPolicyDual`, `hrWorkforceBridgeIntegrationService` |
| **Promotion path** | Advisory burn-down → plain Reference Candidate vote → optional Reference Module annex (not #1–#5 slot) |
| **Evidence** | [HR_OPERATION_MATRIX.md](../architecture/audits/HR_OPERATION_MATRIX.md) |

### 3. #AP-BILL-1 Billing Platform Pattern

| Field | Value |
|-------|-------|
| **Why #3** | Only ratified AP reference capability; entitlement resolver + Stripe facade patterns |
| **Teachable patterns** | `subscriptionService`, `featureGatingService`, webhook verification, module commerce middleware |
| **Promotion path** | Close M02/M05/M07 → plain Reference Capability vote |
| **Evidence** | [PP3_REFERENCE_DECISION.md](../account-platform/PP3_REFERENCE_DECISION.md) |

### 4. PP-1 Identity & Profile

| Field | Value |
|-------|-------|
| **Why #4** | `identityPolicyDual`, `profileService` extraction — foundation for all user surfaces |
| **Blockers** | MFA not implemented (certificate major); limits reference promotion until closed |
| **Promotion path** | MFA implementation → reference review → deferred pattern ratification |
| **Evidence** | [PP1_REFERENCE_REVIEW.md](../account-platform/PP1_REFERENCE_REVIEW.md) |

### 5. UX Reference #6 — Place

| Field | Value |
|-------|-------|
| **Why #5** | Architecture Reference #5 + UX-L3 strict (11/0/0); dual-surface graph/discovery UX patterns not yet in UX catalog |
| **Blockers** | Registration doc; Wave 6D pattern extraction from Place surfaces |
| **Promotion path** | Registration prep → council → UX Ref #6 slot |
| **Evidence** | [UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md](../ux/audits/UX_REFERENCE_PROGRAM_EXPANSION_REVIEW.md) |

---

## Secondary reference candidates (watch list)

| Candidate | Designation | Notes |
|-----------|-------------|-------|
| **Scheduling #6** | Reference Candidate WITH FINDINGS | Strong shift-planning patterns; advisories block plain promotion |
| **Workforce Communications #7** | Reference Candidate #7 | Broadcast pipeline; closest to plain L3 at module level |
| **Context Graph #CG-1/#CG-2** | Reference Capability | Already plain reference; #CG-3 CwF could upgrade |
| **Admin Portal** | Control Plane Reference With Findings | 0 open findings — strongest control-plane reference |
| **Reference Workspace** | Reference Workspace With Findings | Navigation SSOT patterns; 11 advisories |
| **Entitlement resolver (AP)** | Candidate (informal) | Named in AP reference decision; not ratified |

---

## Not reference candidates

| Surface | Reason |
|---------|--------|
| **Account Platform umbrella** | Composite validates coherence — **not** a copyable teaching artifact |
| **Dashboard module** | L3 CwF — reference **Deferred** (not Reference Module) |
| **Analytics** | L1 pseudo-module — scope undecided |
| **AI Platform** | L2 deferred — stub executors block reference posture |
| **Notebook** | L3 composition — explicitly not Reference #5 |
| **Notes sub-domain** | L2 dependency — no separate product reference |
| **Domain Events / Activity / Search** | Uncertified L1 — reference requires L3 platform row first |

---

## Reference vs certification distinction

| Action | Reference promotion | L3 certification |
|--------|---------------------|------------------|
| **Purpose** | Teachable patterns for copy | Constitutional compliance proof |
| **Prerequisite** | Usually L3+ on surface | Audit + operation matrix |
| **Council** | Designation vote | Ratification vote |
| **This refresh** | **Discovery ranking only** | **No execution** |

---

## Recommended reference program sequence (12 months)

| Quarter | Reference action |
|---------|------------------|
| **Q3 2026** | UX Ref #6 Place registration prep (governance) |
| **Q4 2026** | PP-2 reference review charter (post PP2-F05 progress) |
| **Q1 2027** | #AP-BILL-1 plain promotion vote (if majors closed) |
| **Q2 2027** | HR plain Reference Candidate vote; PP-1 pattern review |

---

## Related

- [PLATFORM_PORTFOLIO_REFRESH_2026.md](./PLATFORM_PORTFOLIO_REFRESH_2026.md)
- [PLATFORM_MODERNIZATION_PRIORITY_2026.md](./PLATFORM_MODERNIZATION_PRIORITY_2026.md)
- [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md)

**Last updated:** 2026-06-21
