# Business Participant Composition

**Status:** Active — composition / navigation reference (not a subsystem)  
**Date:** 2026-09-08  
**Source of Truth for:** How identity, membership, workforce placement, reporting, approval, authorization, and presentation compose for a Business participant  
**Does not own:** Policy Engine decisions, application lifecycle, HR employment records, org-chart CRUD implementation, role-aware UX product design, Dashboard personalization  

**Product language:** [`docs/product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md`](../product/VSSYL_PRODUCT_DEFINITION_AND_CANONICAL_LANGUAGE.md)  
**AuthZ:** [`POLICY_ENGINE.md`](./POLICY_ENGINE.md)  
**BA ownership:** [`../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md`](../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md)  
**Workforce structure (ops):** [`../business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md`](../business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md)  
**App participation:** [`APPLICATION_PARTICIPATION_COMPOSITION.md`](./APPLICATION_PARTICIPATION_COMPOSITION.md)  
**Phase 1 evidence (non-authoritative):** [`audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md`](./audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md)  
**Phase 2 reconciliation (non-authoritative):** [`audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_2.md`](./audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_2.md)

---

## 1. What this document is

This document reconciles **existing** ownership so Business participant facts stay understandable and trustworthy.

It is **not**:

- a Participant Engine, Role Engine, or Responsibility Engine  
- a new Prisma model or service  
- an authorization system  
- a role-aware experience design  

Implementation truth remains code, config, migrations, and tests.

---

## 2. Participant layers (separate concerns)

| Layer | Question | Owner | Canonical facts (as implemented) |
|-------|----------|-------|----------------------------------|
| **Identity** | Who is the platform user? | Auth / Account | `User` |
| **Business membership** | Does this user participate in this Business? | Members / Business Administration boundary | `BusinessMember`, `BusinessInvitation`, coarse `BusinessRole`, `canInvite` / `canManage` / `canBilling` |
| **Employment** | Does Vssyl maintain employment-domain information? | HR | `EmployeeHRProfile` (optional; requires placement) |
| **Workforce placement** | Where does the participant sit structurally? | Business Administration org model | `OrganizationalTier`, `Department`, `Position`, `EmployeePosition` |
| **Reporting** | Which positions report to which? | BA org structure | `Position.reportsToId` / `directReports` |
| **Approval authority** | Who approves a particular workflow/request? | Approval hierarchy and/or domain workflow | `ManagerApprovalHierarchy` (API under `/api/org-chart/approval-hierarchy`); domain-specific approvers where applicable |
| **Authorization** | May the actor perform this protected action? | Policy Engine (+ dual bridges while migrating) | PE decisions; membership/role/flags and occasional org evidence as **explicit policy inputs** |
| **Presentation** | What should the experience emphasize? | Workspace / application surfaces | Role chrome, installed apps, front-page visibility, BCC maps — **never** server AuthZ |

Do **not** invent a new participant aggregation service. Consumers compose these layers through existing owners.

---

## 3. Product decisions (authoritative for composition)

### 3.1 Membership without org placement is valid

A Business participant may have an active `BusinessMember` with **no** `EmployeePosition`.

Examples (illustrative, not an enum): owner/admin not on the workforce hierarchy, contractor, vendor, occasional participant, other deliberately narrow participants.

Do **not** create fake org positions merely to satisfy membership. Membership and workforce placement remain separate.

### 3.2 BusinessRole and org position remain distinct

| Concept | Meaning |
|---------|---------|
| **BusinessRole** | Coarse membership/admin designation (`EMPLOYEE` \| `ADMIN` \| `MANAGER`). May contribute AuthZ facts and broad product chrome. |
| **Org position** | Structural seat (`Position` + optional `EmployeePosition`). Title, department/tier, reporting, workforce placement. May inform experience and domain scoping. |

- Position does **not** automatically equal authorization.  
- BusinessRole must **not** be automatically derived from Position.  
- Platform `User.role` (`USER` \| `ADMIN`) is platform operator standing — not BusinessRole.

### 3.3 Application installation vs organizational relevance

- **`BusinessModuleInstallation`** (application lifecycle) remains the primary business-level application availability mechanism.  
- Department/position must **not** become a second application installation authority.  
- Organizational facts **may later** influence emphasis, navigation, defaults, projections, and in-application experience.  
- Those influences must **not** silently become server authorization. Explicit domain/PE authorization still gates protected records and actions.  
- Schema fields such as `Position.assignedModules` / `Department.departmentModules` and empty `BusinessConfigurationContext` permission/module maps are **transitional or inactive** relative to AuthZ and install authority (see §8).

### 3.4 “Manager” is contextual

| Manager sense | Canonical fact | Not proof of |
|---------------|----------------|--------------|
| **Administrative manager** | `BusinessRole` / membership admin flags + applicable PE policy | People management or workflow approval |
| **People manager** | Occupied reporting structure (`Position.reportsTo` / direct reports) | Platform/business admin authority |
| **Workflow approver** | `ManagerApprovalHierarchy` or domain-specific approval authority | Structural reporting or BusinessRole |

These may agree but are **not required** to. The consuming domain uses the authority appropriate to its question. Do **not** create a universal `isManager` truth.

### 3.5 BA permission UX may remain; parallel RBAC may not

Business Administration may remain the **configuration surface** where authorized administrators configure access/policy.

Permanent AuthZ direction/owner: **Policy Engine**.

Transitional (must not remain competing permanent AuthZ):

- `permissionService` org JSON inheritance  
- Position / OrganizationalTier / Department permission JSON as parallel authorization  
- Incomplete dual-enforcement bridges  
- BCC maps that look like permissions but are presentation-oriented  

Future BA permissions UI may configure **PE-backed** policy. Migration is **not** defined by this document beyond direction.

---

## 4. Valid participant states (no new enums)

States describe compositions of existing models. “Employee” is a **product/domain description**, not proof that a Prisma `Employee` aggregate must exist.

| State | Composition | Notes |
|-------|-------------|-------|
| **A. Member only** | Active `BusinessMember`; no active `EmployeePosition` | **Valid** business participant |
| **B. Workforce participant** | Member + active `EmployeePosition` | Ops workforce identity for HR/Scheduling/etc. |
| **C. Workforce + HR record** | B + `EmployeeHRProfile` | Employment-domain enrichment |
| **D. Multi-position** | Member + multiple active `EmployeePosition` rows (schema allows) | UI often treats as single; composition permits multi |
| **E. Former / historical** | Inactive membership and/or EP `active=false` / `endDate` as supported | Historical placement ≠ current workforce identity |

HR/Scheduling/PTO “employee” meaning continues to align with **active placement** where those domains require it. That does **not** invalidate Member-only Business participation.

---

## 5. Terminology clarity

| Term | Use for | Do not use as |
|------|---------|---------------|
| **BusinessRole** | Coarse membership/admin standing | Org chart seat or full AuthZ model |
| **Position** | Structural seat | Synonym for BusinessRole or PE permission |
| **EmployeePosition** | Assignment of person ↔ seat | Proof of BusinessRole |
| **Department** | Organizational grouping (`Department` model) | Free-text `BusinessMember.department` (compatibility metadata) |
| **OrganizationalTier** | Structural/rank grouping | Billing/commercial `Business.tier` |
| **People manager** | Occupied reporting relationship when that is the question | Universal manager flag |
| **Approver** | Approval authority for a workflow | Automatic people manager or admin |

---

## 6. Manager authority composition

| Question | Canonical fact |
|----------|----------------|
| Can this person administer the Business (membership/profile/module install-class actions)? | `BusinessRole` / membership flags + applicable **Policy Engine** policy |
| Who reports to this person structurally? | Occupancy of positions linked by `Position.reportsToId` |
| Who approves this request? | `ManagerApprovalHierarchy` and/or domain workflow authority |
| Who should see team-specific information? | Consuming domain uses authorized reporting / domain evidence under AuthZ |
| Should the UI emphasize manager tools? | Presentation may combine role + reporting + permission context — **not** AuthZ by itself |

If facts disagree, the **domain question** determines which authority matters. No universal manager score or precedence table beyond this.

---

## 7. Authorization boundary

### Permanent

- Policy Engine = authorization direction/owner  
- Membership facts may feed policy  
- Domain ownership/share facts may feed policy  
- Organizational facts **may** feed policy **only when a protected policy explicitly needs them**

Example: “actor occupies a position with direct reports” may be evidence for an **HR manager** policy. It does **not** imply “actor can administer all of Vssyl.”

Organization facts are **not** automatically permissions.

### Transitional (do not expand)

- Org-chart `permissionService` JSON inheritance as parallel AuthZ  
- Dual enforcement bridges until PE parity  
- Frontend BCC `positionPermissions` / `tierPermissions` / `departmentModules` as presentation maps  

Hiding a control or application is **not** server authorization. Showing one does **not** guarantee permission to every action.

Detail: [`POLICY_ENGINE.md`](./POLICY_ENGINE.md).

---

## 8. Application availability boundary

```
Business installs/enables application (BusinessModuleInstallation / lifecycle)
  → application available under lifecycle + membership rules
  → server APIs still authorize via PE / feature gates / domain rules
  → presentation may later emphasize by role/position/department/context
```

| Mechanism | Authority today |
|-----------|-----------------|
| `BusinessModuleInstallation` | **Canonical** business app availability |
| Membership + PE for install/uninstall | **Canonical** AuthZ for those actions |
| `Position.assignedModules` / `Department.departmentModules` | **Transitional / inactive** for install & AuthZ — must not become second install authority |
| BCC empty permission/module maps | **Presentation** — not AuthZ SoT |

Composition with app participation: [`APPLICATION_PARTICIPATION_COMPOSITION.md`](./APPLICATION_PARTICIPATION_COMPOSITION.md).

---

## 9. Business Administration — configuration surface vs ownership

BA **owns** (configuration of the business):

- Organizational structure (tiers, departments, positions, reporting)  
- `EmployeePosition` assignment writes  
- Business membership administration where current ownership establishes it  
- Business profile / branding / workspace shell / front-page configuration  
- Policy/access **configuration surfaces** (UI) for tenant admins  

BA does **not** own:

- Platform identity (`User`)  
- HR employment truth (`EmployeeHRProfile` and HR workflows)  
- Domain operational records (shifts, PTO, broadcasts, Drive files, …)  
- Application installation lifecycle authority ([`APPLICATION_LIFECYCLE.md`](./APPLICATION_LIFECYCLE.md))  
- Protected authorization decisions (Policy Engine)  
- Role-aware experience product logic / Dashboard personalization  

BA can be a **surface** that configures structure without owning every consumer or every AuthZ decision. Living detail: [BA Ownership Model](../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md).

---

## 10. Responsibility (no new entity)

Vssyl does **not** currently require a universal generic `Responsibility` model.

Responsibility semantics today are a **composition** of existing facts where domains need them:

- position / reporting occupancy  
- approval hierarchy / domain approval  
- workforce audiences  
- domain assignments and ownership  

Future product work may identify a missing responsibility concept; it must be justified by concrete domain use cases — not created preemptively.

---

## 11. Anti-patterns

- Creating fake positions for every member  
- Collapsing BusinessRole, people manager, and approver into one `isManager`  
- Treating org position as the permission model  
- Treating BusinessRole as the org chart  
- Treating BCC / UI chrome as Policy Engine  
- Treating department/position module JSON as application installation  
- Creating a Participant / Role / Responsibility Engine beside existing owners  

---

## 12. Related documents

| Concern | Document |
|---------|----------|
| Product terminology | Product Definition & Canonical Language |
| AuthZ | `POLICY_ENGINE.md` |
| App lifecycle / install | `APPLICATION_LIFECYCLE.md` |
| App participation composition | `APPLICATION_PARTICIPATION_COMPOSITION.md` |
| BA ownership | `BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md` |
| HR ↔ org boundary | `HR_ORG_CHART_BOUNDARY_ANALYSIS.md` |
| Workforce identity stack | `WORKFORCE_IDENTITY_ARCHITECTURE.md` |
| Phase audits | `audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_*.md` |

**Last updated:** 2026-09-08 (Phase 2 — organizational authority reconciliation)
