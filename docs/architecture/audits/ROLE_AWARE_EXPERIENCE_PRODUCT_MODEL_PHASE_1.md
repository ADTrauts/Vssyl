# Role-Aware Experience Product Model — Phase 1

**Status:** NON-authoritative product-modeling evidence  
**Date:** 2026-09-09  
**Program:** Business Participant & Role-Aware Experience  
**Phase:** 5 — Role-Aware Product Model (report title: Phase 1 of role-aware product modeling)  
**Baseline HEAD:** `088e8cb9515fc6cb7a5b00033e673e91df1e86a0`  

**This document is:**

- product-modeling evidence and recommendations  
- **not** architecture source of truth  
- **not** implementation status or proof of shipped behavior  
- **not** a new platform capability, Role Engine, Responsibility Engine, or Dashboard personalization subsystem  

**Authoritative composition (participant layers):** [`../BUSINESS_PARTICIPANT_COMPOSITION.md`](../BUSINESS_PARTICIPANT_COMPOSITION.md)  
**Durable product language:** [`../../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md`](../../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md)  
**AuthZ:** [`../POLICY_ENGINE.md`](../POLICY_ENGINE.md)  
**Prior program evidence:** [`BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md) … [`PHASE_4_REPAIR.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_4_REPAIR.md)

Code and existing ProductContexts were inspected as **behavior evidence** only. No implementation changes were made in this phase.

---

## 1. Purpose

Answer whether “role-aware experience” requires a new Vssyl platform subsystem, or whether it is already expressible as a product principle: applications and surfaces using facts Vssyl already knows.

Pressure-test the provisional **Access / Scope / Emphasis** model against Dashboard, Business workspace/home, HR, Scheduling, Workforce Comms, Chat, Calendar, Todo, Notifications, and AI context patterns.

Desired outcome: a **product principle**, not another platform system.

---

## 2. Baseline

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD / origin/main | `088e8cb95` — Phase 4 org-chart contract repair |
| Org foundation readiness | `READY_WITH_KNOWN_GAPS` (live BA browser smoke still outstanding; not a modeling blocker) |
| Unrelated dirty work | Preserved; not staged |
| Methods | Static inspection of composition/PE/product docs + application layouts/permissions/ProductContexts |
| Runtime testing | Not required for this modeling phase |

Known deferred gaps (not modeling blockers): multi-position semantics, WC BUSINESS audience, transitional org JSON permissions, approval-hierarchy product use, BA live smoke.

---

## 3. Executive conclusion

**CONCLUSION 1 — No new role-aware platform capability is justified.**

Role-aware behavior should be a **product/design principle** implemented by applications and surfaces using:

- existing participant facts (membership, placement, reporting, approval),  
- Policy Engine / domain authorization for Access,  
- application-owned domain state for Scope and situational Emphasis.

**Access / Scope / Emphasis is sufficient.** Evidence does not support a Role Engine, relevance scorer, configurable role templates, or universal manager persona.

Cross-cutting gaps found are **application or product-UX improvements** (e.g. Scheduling ignoring `reportsTo` for manager scope), not missing platform architecture.

---

## 4. Definition of role-aware experience

**Adopted definition:**

> Role-aware experience means Vssyl uses authorized facts it already knows about a participant and their work to choose appropriate scope, defaults, emphasis, and actions — without changing who may act, and without a separate role-configuration system.

This aligns with Product Definition language (experience appropriate to role, responsibilities, context, and authority) while rejecting Salesforce-style presentation configuration.

**Role-aware does *not* mean:**

- a new permission system  
- a universal role hierarchy or `isManager` flag  
- a universal responsibility graph  
- a separate personalization database for role templates  
- business admins configuring every person’s UI  
- AI deciding authorization  
- fixed Owner / Manager / Employee shells of Vssyl  

No adjustment beyond the sentence above is required: “responsibilities” remains ordinary language for reporting, approval, and domain ownership — **not** a Responsibility entity.

---

## 5. Access / Scope / Emphasis model

| Layer | Question | Nature | Primary owners |
|-------|----------|--------|----------------|
| **Access** | May I use or perform this? | Security / authorization | Membership, application lifecycle, Policy Engine, domain AuthZ |
| **Scope** | What part of this app/information is my work? | Application / domain context | HR, Scheduling, WC, Todo, etc. using placement, reporting, ownership, audiences |
| **Emphasis** | Given scope and what is happening, what should be foregrounded? | Experience / presentation | App landings, notifications, tasks, events, Dashboard **projections** of app data |

**Verdict:** Sufficient. Do not invent additional shared layers (relevance engines, persona engines) unless future evidence shows a repeated cross-app contract that cannot live in applications.

Access must never be inferred from Emphasis. Scope must never widen past Access.

---

## 6. Allowed experience inputs

| Fact / category | Classification | Notes |
|-----------------|----------------|-------|
| `BusinessRole`, membership status / flags | **GOOD EXPERIENCE INPUT** (coarse chrome); often **AUTHORIZATION_ONLY** when PE/domain AuthZ consumes them | Admin vs non-admin chrome; not “my team” |
| Active Business membership | **GOOD EXPERIENCE INPUT** | Active Business context |
| `Position`, `Department`, `OrganizationalTier` | **GOOD EXPERIENCE INPUT** | Structural relevance; not AuthZ by itself |
| `EmployeePosition` (active placement) | **GOOD EXPERIENCE INPUT** / **DOMAIN_SPECIFIC** | Workforce identity for ops apps |
| `Position.reportsTo` / direct reports | **GOOD EXPERIENCE INPUT** | People-manager Scope |
| `ManagerApprovalHierarchy` / domain approvers | **DOMAIN_SPECIFIC** | Workflow Access/Scope for that workflow |
| PE allow/deny, domain visibility | **AUTHORIZATION_ONLY** | Never “emphasize because denied” |
| Ownership / share state | **DOMAIN_SPECIFIC** / **GOOD EXPERIENCE INPUT** | Files, tasks, conversations as domain defines |
| Assigned shift, pending PTO, tasks, calendar events, conversation membership, WC audiences | **DOMAIN_SPECIFIC** / **GOOD EXPERIENCE INPUT** | Situational Emphasis |
| Installed applications / enabled features | **GOOD EXPERIENCE INPUT** | Availability of surfaces |
| Existing user preferences only | **GOOD EXPERIENCE INPUT** where they already exist | Do not invent preference frameworks |
| Active Business, active application, route/surface, current user | **GOOD EXPERIENCE INPUT** | Current context |
| Org JSON RBAC / BCC permission maps as AuthZ | **NOT APPROPRIATE** | Transitional; PE owns AuthZ |
| `Position.assignedModules` / dept modules as install authority | **NOT APPROPRIATE** | Install lifecycle owns availability |
| Relevance scores, role UI templates, per-position nav rules | **NOT APPROPRIATE** / **FUTURE** only if strongly justified later | Avoid configuration burden |
| New Responsibility entity | **NOT APPROPRIATE** | Compose existing facts |

Do **not** create new fields for role-aware modeling.

---

## 7. BusinessRole vs Position

| Concept | Experience purpose | Not for |
|---------|-------------------|---------|
| **BusinessRole** | Coarse administrative chrome; access cues to Business Administration; broad business-level defaults; PE/policy **inputs** where encoded | Org structure; people-management Scope; universal “manager experience” |
| **Position / reporting / placement** | Team context; department relevance; people-management views; domain defaults (schedule seat, WC subtree, HR reports) | Permission / AuthZ by itself; deriving BusinessRole |

**Current behavior (evidence):** HR, Scheduling, and Workforce Comms often drive **UI chrome** from `BusinessRole` (and sometimes `canManage`), while **team data Scope** should use reporting/`EmployeePosition`. HR server paths more often resolve managers via `reportsTo`; Scheduling manager middleware historically treats non-admin managers as seeing all employees (known underuse of reporting). That divergence is an **application product gap**, not proof BusinessRole and Position should collapse.

Authorization remains separate (PE + domain).

---

## 8. Contextual manager examples

Do **not** create one universal manager persona.

| Sense | Fact | Example product question |
|-------|------|--------------------------|
| **Administrative manager** | `BusinessRole` / BA flags + PE | “May I configure this Business?” |
| **People manager** | Occupied position with reporting relationships | “Do these people report within my structure?” |
| **Workflow approver** | Approval hierarchy / domain approver rules | “Am I the required approver for this request?” |

The same person may be one, two, all three, or none. Applications ask the question that matches the surface. Local `role === 'MANAGER'` checks are presentation shortcuts, **not** a platform `isManager` truth.

---

## 9. Existing application behavior matrix

Static evidence summary (code + ProductContexts). “Obvious gap” only where Vssyl already knows a relevant fact but ignores it.

| Surface | Access behavior | Scope behavior | Emphasis behavior | Participant facts used | Already sensible? | Obvious product gap? |
|---------|-----------------|----------------|-------------------|------------------------|-------------------|----------------------|
| Business workspace / home | Session + membership; hub mount | Business-wide shell; installed apps in nav | Admin-ish setup checklist vs non-admin copy | Primarily `BusinessRole` | PARTIAL | Org-aware front-page visibility exists in code but business home path is hub/setup-oriented, not situational work projection |
| Dashboard | Auth; personal/business context | Widgets call owning module APIs | Personal layout; business hub ≠ rich role home | Installed modules; first EP often for module helpers | YES (projection intent) / PARTIAL (biz home) | Needs product improvement for what to project, not new Dashboard architecture |
| HR | Install + membership; PE/domain dual | Self vs reports vs company by path | Nav/cards often by `BusinessRole` | BusinessRole (UI); EP + reportsTo (many server team/PTO paths) | PARTIAL | People managers with `EMPLOYEE` role get employee chrome; role-MANAGER without reports get manager chrome |
| Scheduling | Membership + scheduling AuthZ / PE dual | Employee: own shifts (can union multiple EPs); manager APIs intended team scope | Nav/copy by BusinessRole | BusinessRole, EP; reportsTo underused for manager Scope | PARTIAL / weak on manager Scope | Manager middleware can treat non-admin managers as all-employees despite known reportsTo |
| Workforce Comms | Membership; publish/admin via role + canManage | Audiences: BUSINESS≈active EPs; role map; MANAGER_SUBTREE via reportsTo | Admin vs employee nav | BusinessRole, canManage, EP, position tree | YES for audience model | BUSINESS audience excludes members without EP (product decision deferred) |
| Chat | Auth + conversation participation | Conversation / dashboard / business context | Context switch personal↔work | Conversation membership; not org role | YES | None for org modeling |
| Calendar | Auth + calendar context membership | Context-bound calendars | Time grid; little role emphasis | Context + membership | YES | Optional future: surface PTO/shifts as domain projections — not a platform gap |
| Todo | Auth + tenancy | Dashboard/business tasks | Assignment/priority | Assignees as users | YES | No reportsTo team queue — only a gap if product wants people-manager work queues |
| Notifications | Auth; per-user inbox | User’s notifications | Urgency/preferences as designed | Emitter → userId | YES | Manager digests optional; notifications already carry situational Emphasis |
| AI context | Module AI access checks | Often business aggregates; self paths may use EP/reportsTo | Does not replace AuthZ | Membership, EP, module providers | PARTIAL | Must remain consumer of authorized context, never AuthZ owner |

---

## 10. Participant examples

Illustrative only — **not** permanent personas or templates.

### Example A — ADMIN, no EmployeePosition

| Layer | Behavior |
|-------|----------|
| Access | Business Administration and policies as PE/membership allow; may lack HR/Scheduling “employee” records that require placement |
| Scope | Business-wide configuration; not a workforce seat |
| Emphasis | Setup, members, apps, billing/admin work — not “my next shift” |

### Example B — One Position, no direct reports

| Layer | Behavior |
|-------|----------|
| Access | Ordinary member + installed apps |
| Scope | Self: my schedule, my HR self-service, my messages/tasks |
| Emphasis | My next work items, unread ops messages, assigned tasks |

### Example C — Supervisor with reports; BusinessRole EMPLOYEE

| Layer | Behavior |
|-------|----------|
| Access | Still EMPLOYEE for BA; PE may deny business admin |
| Scope | People-manager Scope in HR/Scheduling/WC **where reporting is used** |
| Emphasis | Team coverage, approvals in scope, direct-report exceptions — **should not** require BusinessRole.MANAGER |

### Example D — BusinessRole MANAGER, no direct reports

| Layer | Behavior |
|-------|----------|
| Access | Coarse manager chrome / flags as encoded |
| Scope | Not automatically “all people” via reporting |
| Emphasis | Should not fake a people-manager home; admin/ops defaults only if Access allows |

### Example E — Workflow approver only

| Layer | Behavior |
|-------|----------|
| Access | Approver for that workflow |
| Scope | Requests awaiting that approval path |
| Emphasis | Pending approvals — without promoting to BA admin or people manager |

### Example F — Two active Positions

| Layer | Behavior |
|-------|----------|
| Access | Unchanged by multi-seat |
| Scope | Prefer **union** of domain-relevant placements unless a domain needs explicit “acting as” |
| Emphasis | Combined work signals; avoid silently dropping a second seat (`findFirst` pitfalls) |

---

## 11. Business configuration burden

**Strong default:** businesses configure **business facts**, not presentation rules.

| Configure | Do not normally configure |
|-----------|---------------------------|
| Members and invitations | “Managers see widget X / Employees see widget Y” |
| Positions, departments, tiers, reporting | Relevance scores |
| Application installation | Dashboard rules per position |
| Permissions/policy via proper (eventually PE-backed) surfaces | Navigation rules per department |
| Domain assignments (shifts, audiences, approvers as the domain requires) | AI attention weights |

Vssyl/applications should **infer** sensible Access/Scope/Emphasis from those facts plus current domain state. Users may personalize only through **existing** preference mechanisms.

Current product largely matches this direction; friction comes from apps asking the wrong manager question or underusing known reporting — not from missing config UIs.

---

## 12. Application ownership of experience

**Preferred model (confirmed by evidence):**

- **Scheduling** owns my schedule vs team schedule Scope.  
- **HR** owns my HR vs managed-team Scope.  
- **Workforce Comms** owns audiences and message relevance.  
- **Todo / Calendar / Chat** own their tenancy and membership Scope.  
- **Dashboard** **projects** important information from applications; it must not reimplement those domains’ role logic.  
- **AI** may consume authorized participant and domain context; **must not** decide Access or invent Scope.

Pressure-test result: this matches Dashboard ProductContext (“widget = projection”), Application Participation composition, and PE boundaries. Centralizing “role-aware” in a platform runtime would duplicate domain truth and invite AuthZ/presentation collapse.

---

## 13. Dashboard / Business Home assessment

| Question | Answer |
|----------|--------|
| Enough context to eventually project relevant info from app-owned Scope? | **Mostly yes** — widgets already call module summary APIs; business context and membership exist |
| Conceptual information missing for a *platform* architecture? | **No** — missing pieces are product choices about *what* to project and fixing app Scope, not a DashboardProvider |
| Needs architecture work? | **NO** |
| Needs product improvement? | **YES** — business home/hub is setup/admin-forward; situational projections and people-manager signals are uneven; org-aware front-page machinery is not the live home path |

Prefer product improvement over new platform architecture. Do **not** create DashboardProvider or a relevance engine.

---

## 14. Static vs situational relevance

Prefer **contextual** relevance: placement/role facts **plus** current domain state.

A people manager needs Scheduling when there is an uncovered shift, swap, or call-off — not merely because they are “a manager.” An owner should not permanently see every metric merely because they are ADMIN.

Much of this is already represented by ordinary:

- application data and landings  
- notifications  
- tasks  
- events  
- Dashboard projections of those signals  

Do **not** design a relevance scoring algorithm. Situational Emphasis is mostly **product use of existing signals**.

---

## 15. Shared-capability conclusion

**CONCLUSION 1**

No new role-aware platform capability is justified.

Role-aware behavior is a product/design principle implemented by applications and surfaces using existing participant facts, authorization, and domain state.

**Rejected:** CONCLUSION 2 (shared presentation/context contract) and CONCLUSION 3 (shared runtime engine). A thin documentation principle plus composition SoT is enough; a shared runtime would overbuild without demonstrated cross-platform need.

---

## 16. Product principles

1. **Authorization answers “may I?”** — experience never invents or widens Access.  
2. **Applications own domain Scope** from existing participant and domain facts.  
3. **Experience emphasizes relevant work and current state** without changing authority.  
4. **Business structure is input to defaults** — not a presentation rule builder for small businesses.  
5. **Situational work matters as much as static role** — exceptions, approvals, shifts, and messages drive Emphasis.

---

## 17. Highest-value product gaps

At most five. Architecture change required only if a new platform subsystem is needed — for these, **NO**.

### 1. Scheduling manager Scope ignores known reporting

| | |
|--|--|
| Surface | Scheduling |
| Current | Manager UI from BusinessRole; non-admin manager Scope can expand to all employees |
| Known fact | `Position.reportsTo` / direct reports (used elsewhere, e.g. HR) |
| Better | “Do I manage this team’s schedule?” → report-based Scope |
| Why it matters | Ordinary supervisors see too much or the wrong people |
| Architecture? | **NO** |

### 2. BusinessRole chrome ≠ people-manager fact (HR / Scheduling)

| | |
|--|--|
| Surface | HR (primary), Scheduling |
| Current | Nav/cards keyed to ADMIN/MANAGER membership role |
| Known fact | Reporting occupancy vs BusinessRole are distinct |
| Better | Chrome/Scope follow the question the surface asks (admin vs reports vs approver) |
| Why it matters | Example C supervisors under-served; Example D over-served |
| Architecture? | **NO** |

### 3. Business home / Dashboard emphasis

| | |
|--|--|
| Surface | Business workspace hub / Dashboard |
| Current | Setup/admin checklist orientation; limited situational projection of app Scope |
| Known fact | Installed apps, membership, placement, module summary APIs |
| Better | Project authorized, high-signal domain summaries for the participant’s Scope |
| Why it matters | First surface after “work” should reflect actual work, not only setup |
| Architecture? | **NO** (product UX; keep widget-as-projection) |

### 4. Workforce Comms BUSINESS audience

| | |
|--|--|
| Surface | Workforce Comms |
| Current | BUSINESS ≈ active EmployeePositions |
| Known fact | Valid members may have no placement |
| Better | Explicit product choice: workforce-only vs all active members |
| Why it matters | Admins/owners without seats miss or mis-target “whole business” comms |
| Architecture? | **NO** |

### 5. Approval hierarchy underused in product Emphasis

| | |
|--|--|
| Surface | HR/PTO and related workflows |
| Current | Approval APIs exist; little “am I the approver?” foregrounding |
| Known fact | `ManagerApprovalHierarchy` / domain approvers |
| Better | Pending-approval Emphasis for workflow approvers without promoting to BA admin |
| Why it matters | Example E is real; chrome-only MANAGER is a poor proxy |
| Architecture? | **NO** |

---

## 18. Multi-position implication

Role-aware modeling **surfaces** multi-position but does **not** require solving it to adopt the principle.

| Guidance | Detail |
|----------|--------|
| Default inclination | **Union** relevant Scopes across active placements for “my work” |
| When to select | Domain needs an explicit acting seat (rare; define per app when pain appears) |
| Blocking for this phase? | **NO** |
| Risk to watch | Paths that `findFirst` one EP while other paths union many |

Leave detailed semantics deferred until a concrete domain pain forces the decision.

---

## 19. Product decisions still required

Genuine decisions only:

1. **Workforce Comms BUSINESS audience:** all active `BusinessMember`s vs workforce placements only.  
2. **Multi-position:** confirm union-default vs first domain that needs “acting as.”  
3. **Business home content:** how much situational projection vs setup checklist for non-admins (UX, not architecture).  
4. **BA permissions → PE-backed configuration** (AuthZ migration track — **out of band** for role-aware experience).

Not required: relevance engine, role templates, universal manager persona, Responsibility model.

---

## 20. Recommended next phase

**Targeted application product improvement**, not a new platform capability and not Dashboard architecture.

**Suggested order:**

1. Scheduling — manager Scope from `reportsTo` (highest integrity gap).  
2. Align HR/Scheduling chrome with contextual manager senses (ask the right question).  
3. Optional parallel: Business home / Dashboard **product** modeling for projections (still no engine).  

Organizational foundation work is sufficient for modeling; remaining org gaps (BA smoke, WC audience, multi-position, approval UI) proceed as separate product decisions when prioritized.

---

## Footer

**Non-authoritative.** Implementation truth remains repository code. Composition authority remains [`BUSINESS_PARTICIPANT_COMPOSITION.md`](../BUSINESS_PARTICIPANT_COMPOSITION.md). Durable product language remains the Product Definition document. This audit must not be promoted to architecture SoT without an explicit ownership update.
