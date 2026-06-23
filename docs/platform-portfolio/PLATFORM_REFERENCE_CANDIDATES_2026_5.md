# Platform Reference Candidates 2026.5

**Program:** Platform Portfolio Refresh 2026.5  
**Date:** 2026-06-22  
**Authority:** [`REFERENCE_MODULE_CATALOG.md`](../architecture/REFERENCE_MODULE_CATALOG.md) (read-only)  
**Status:** Discovery only — **no designation votes, no ledger changes**

---

## Reference taxonomy overview

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

### Architecture Reference Modules

| # | Module | Level | Status |
|---|--------|-------|--------|
| **#1** | File Hub (`drive`) | **L4** | Reference Implementation |
| **#2** | Chat | **L3** | Certified |
| **#3** | Calendar | **L3** | Certified |
| **#4** | Todo | **L3** | Certified |
| **#5** | Place | **L3** | Certified |

### UX Reference Modules

| # | Module | Status |
|---|--------|--------|
| **#1–#5** | Drive, Notifications, Todo, AI, Calendar | Approved with Findings |
| **#6** | Place *(expansion)* | **Eligible With Findings — not registered** |

### Platform capability references

| ID | Capability | Designation |
|----|------------|-------------|
| — | Admin Portal | Control Plane Reference With Findings |
| **#OC-1–#OC-3** | Org Chart, Permission Sets, Approval Boundaries | Reference Platform Capability CwF |
| **#CG-1–#CG-3** | Context Graph read model, V_Link substrate, AI grounding | Reference Capability (CG-3 CwF) |
| **#AP-BILL-1** | Billing Platform Pattern | Reference Capability CwF |

### Business Operations reference candidates

| # | Module | Designation | Advisories |
|---|--------|-------------|------------|
| **#1** | HR | Reference Candidate #1 | 6 |
| **#6** | Scheduling | Reference Candidate #6 CwF | 5 |
| **#7** | Workforce Communications | Reference Candidate #7 | 3 |

### Workspace reference

| Program | Designation | Certification |
|---------|-------------|---------------|
| Reference Workspace #3 | Reference Workspace With Findings | WS-L3 CwF |

---

## Top 10 reference candidates (promotion potential)

Ranked by **teachability**, **gate score**, and **platform copy value**.

| Rank | Candidate | Current designation | Promotion target | Readiness | Blockers |
|------|-----------|---------------------|------------------|-----------|----------|
| **1** | **PP-2 Settings Platform** | L3 CwF; pattern deferred | Reference Platform Capability | **High** — 26/27 | PP2-F05 BA dedup; 6 advisories |
| **2** | **HR (BO #1)** | Reference Candidate #1 CwF | Plain Reference Candidate | **Medium-High** | 6 advisories |
| **3** | **#AP-BILL-1 Billing** | Reference Capability CwF | Plain Reference Capability | **Medium** — 23/27 | Modal UX; webhook activity |
| **4** | **PP-1 Identity & Profile** | L3 CwF; pattern deferred | Reference Platform Capability | **Medium** — 24/27 | MFA major; photo controller |
| **5** | **UX Reference #6 Place** | Eligible With Findings | UX Reference #6 registered | **Medium** | Registration doc; Wave 6D |
| **6** | **Admin Portal** | Control Plane Reference CwF | Plain Control Plane Reference | **Medium** | 0 open findings — governance vote only |
| **7** | **Workforce Communications #7** | Reference Candidate #7 CwF | Plain Reference Candidate | **Medium** | 3 advisories — lowest BO advisory count |
| **8** | **Scheduling #6** | Reference Candidate #6 CwF | Plain Reference Candidate | **Medium-Low** | 5 advisories |
| **9** | **Context Graph #CG-3** | Reference Capability CwF | Plain Reference Capability | **Medium-Low** | 8 advisories on bundle/grounding |
| **10** | **Dashboard module** | L3 CwF; reference **deferred** | Reference Module annex (non-integer) | **Low** | 4 majors; widget trust patterns immature for reference |

---

## Reference candidate detail (top 5)

### 1. PP-2 Settings Platform

| Field | Value |
|-------|-------|
| **Why #1** | Strongest G-score in Account Platform trilogy (26/27); `settingsService` orchestration + `preferenceRegistry` + adapter pattern is copyable |
| **Teachable patterns** | Settings hub IA; notification settings adapter; cross-module preference projection |
| **Promotion path** | Close PP2-F05 → reference review → council vote |
| **Evidence** | [PP2_REFERENCE_REVIEW.md](../account-platform/PP2_REFERENCE_REVIEW.md) |

### 2. HR — Reference Candidate #1

| Field | Value |
|-------|-------|
| **Why #2** | Richest workforce lifecycle architecture in BO domain |
| **Teachable patterns** | `employeeManagementService`, `hrPolicyDual`, workforce bridge integration |
| **Promotion path** | Advisory burn-down → plain Reference Candidate vote |

### 3. #AP-BILL-1 Billing Platform Pattern

| Field | Value |
|-------|-------|
| **Why #3** | Only ratified AP reference capability |
| **Teachable patterns** | `subscriptionService`, `featureGatingService`, webhook verification |
| **Promotion path** | Close M02/M05/M07 → plain Reference Capability vote |

### 4. PP-1 Identity & Profile

| Field | Value |
|-------|-------|
| **Why #4** | `identityPolicyDual`, `profileService` — foundation for all user surfaces |
| **Blockers** | MFA not implemented (certificate major) |

### 5. UX Reference #6 — Place

| Field | Value |
|-------|-------|
| **Why #5** | Architecture Reference #5 + UX-L3 strict; dual-surface graph/discovery UX |
| **Promotion path** | Registration prep → council → UX Ref #6 slot |

---

## Secondary reference candidates (watch list)

| Candidate | Notes |
|-----------|-------|
| **Reference Workspace** | Navigation SSOT patterns; 11 advisories |
| **Entitlement resolver (AP)** | Named in AP reference decision; not ratified |
| **Policy Engine** | Would require platform L3 first — not reference-eligible today |
| **NotificationService** | UX Ref #2 — could become platform capability reference after L3 |
| **File Hub L4** | Already Reference Implementation — maintenance only |

---

## Not reference candidates

| Surface | Reason |
|---------|--------|
| **Account Platform umbrella** | Composite — not a copyable teaching artifact |
| **Analytics Capability** | L2 CwF platform capability — reference requires L3 platform row |
| **AI Platform** | L2 deferred — stub executors block reference posture |
| **Notebook** | L3 composition — explicitly not Reference #5 |
| **Notes sub-domain** | L2 dependency |
| **Domain Events / Activity / Search** | Uncertified L1 — reference requires L3 platform row first |
| **Dashboard** | L3 CwF — reference deferred until P4 majors closed |

---

## Reference vs certification distinction

| Action | Reference promotion | L3 certification |
|--------|---------------------|------------------|
| **Purpose** | Teachable patterns for copy | Constitutional compliance proof |
| **Prerequisite** | Usually L3+ on surface | Audit + operation matrix |
| **This refresh** | **Discovery ranking only** | **No execution** |

---

## Recommended reference program sequence (12 months)

| Quarter | Reference action |
|---------|------------------|
| **Q3 2026** | UX Ref #6 Place registration prep (governance) |
| **Q4 2026** | PP-2 reference review charter (post PP2-F05 progress) |
| **Q1 2027** | #AP-BILL-1 plain promotion vote (if majors closed) |
| **Q2 2027** | HR plain Reference Candidate vote; Admin Portal plain promotion |

---

## Related

- [PLATFORM_PORTFOLIO_REFRESH_2026_5.md](./PLATFORM_PORTFOLIO_REFRESH_2026_5.md)
- [PLATFORM_MODERNIZATION_PRIORITY_2026_5.md](./PLATFORM_MODERNIZATION_PRIORITY_2026_5.md)
- [REFERENCE_MODULE_CATALOG.md](../architecture/REFERENCE_MODULE_CATALOG.md)

**Last updated:** 2026-06-22
