# Business Participant & Organizational Model — Phase 2

**Status:** NON-authoritative evidence / reconciliation history  
**Date:** 2026-09-08  
**Program:** Business Participant & Role-Aware Experience  
**Phase:** 2 — Organizational Authority Reconciliation  
**Baseline HEAD:** `904caef564ec368082fdc10f5347c065b0c10ce6` (Phase 1 audit commit)  
**Constraint:** Documentation only. No Prisma, server, web, PE behavior, permission migration, or role-aware UX implementation.

**Canonical composition SoT (authoritative for this topic):** [`../BUSINESS_PARTICIPANT_COMPOSITION.md`](../BUSINESS_PARTICIPANT_COMPOSITION.md)  
**Phase 1 evidence:** [`BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md`](./BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_1.md) (unchanged)

---

## 1. Purpose

Make the **current** Business participant ownership model explicit and coherent after Phase 1 Conclusion 3: structural facts, transitional permission JSON, and presentation were mixed enough to block safe role-aware product modeling.

This phase documents decisions and authority — it does **not** redesign the org chart, create engines, fix BA UI bugs, or migrate permissions.

---

## 2. Baseline

| Item | Value |
|------|-------|
| Branch | `main` |
| Start HEAD | `904caef56` — Phase 1 audit on `origin/main` (0/0) |
| Unrelated dirty work | Preserved (deploy/auth/GTM, etc.) |
| Implementation truth | Code/tests from Phase 1 remain unchanged |

Authority chain consulted: AGENTS.md, VSSYL_SOURCE_OF_TRUTH, Product Definition, architecture index/SoT, POLICY_ENGINE, APPLICATION_PARTICIPATION_COMPOSITION, Phase 1 audit, BA ownership/reference, HR↔org / workforce identity docs.

---

## 3. Decisions applied

| # | Decision | Documented in |
|---|----------|---------------|
| 1 | Membership without org placement is **valid** | Composition §3.1; Workforce Identity executive summary |
| 2 | BusinessRole and org Position remain **distinct**; Position ≠ AuthZ; Role not derived from Position | Composition §3.2; PE org-facts section |
| 3 | `BusinessModuleInstallation` owns app availability; org dept/position must not become second install authority | Composition §3.3 / §8; Application Participation anti-pattern |
| 4 | “Manager” is contextual (admin / people / approver) — no universal `isManager` | Composition §3.4 / §6 |
| 5 | BA may keep permission **UX surface**; org JSON RBAC must not remain permanent competing AuthZ; PE is AuthZ owner | Composition §3.5; PE; BA ownership; Platform Standards service map |

---

## 4. Participant authority model

| Layer | Owner | Canonical facts |
|-------|-------|-----------------|
| Identity | Auth | `User` |
| Business membership | Members / BA | `BusinessMember`, invitations, BusinessRole, flags |
| Employment | HR | `EmployeeHRProfile` |
| Workforce placement | BA org model | Tiers, Department, Position, EmployeePosition |
| Reporting | BA org structure | `Position.reportsToId` |
| Approval | Approval hierarchy / domain workflow | `ManagerApprovalHierarchy` (+ domain approvers) |
| Authorization | Policy Engine | Explicit policy inputs only |
| Presentation | Workspace / apps | Chrome, BCC, front-page — not AuthZ |

No new participant service invented.

---

## 5. Valid participant states

Documented without new enums (Composition §4):

- **A** Member only  
- **B** Workforce participant (member + active EP)  
- **C** Workforce + HR profile  
- **D** Multi-position (schema-permitted)  
- **E** Former/historical membership and/or EP  

“Employee” remains a product/domain description; no requirement for a Prisma `Employee` aggregate.

---

## 6. Membership vs employment vs placement

| Concern | Distinct? | Notes |
|---------|-----------|-------|
| Membership vs placement | **Yes** | Member-only is valid |
| Placement vs employment | **Yes** | HR profile optional extension of EP |
| Membership vs AuthZ | **Yes** | Membership feeds PE; is not the full AuthZ model |
| Free-text member title/dept vs structure | Compatibility metadata | Not structural SoT |

---

## 7. Role vs position vs manager vs approver

| Term | Meaning after reconciliation |
|------|------------------------------|
| BusinessRole | Coarse membership/admin standing |
| Position / EmployeePosition | Structural seat / assignment |
| OrganizationalTier | Rank grouping ≠ billing `Business.tier` |
| People manager | Occupied reporting relationship |
| Approver | Approval hierarchy / domain workflow |
| Administrative manager | BusinessRole / PE admin-class policies |

No collapse into one manager flag.

---

## 8. Authorization boundary

| Class | Items |
|-------|-------|
| **Canonical** | Policy Engine; membership facts as PE inputs; domain ownership/share proofs; org facts **only when a named policy needs them** |
| **Transitional** | `permissionService` JSON inheritance; Position/Tier/Department permission JSON; dual enforcement bridges; BCC permission-like maps (presentation) |
| **Legacy / unused-looking** | `PermissionManagementRights`, `PermissionChange` (no active service ownership found in Phase 1) |
| **Not AuthZ** | Hiding apps/controls; showing apps; V_Link membership alone |

Migration of transitional RBAC is **documented direction only** — not implemented in this phase.

---

## 9. Business Administration ownership

**Owns:** structure (tiers/depts/positions/reporting), EP assignment writes, membership admin where established, profile/branding/shell/front-page, access **configuration surfaces**.

**Does not own:** platform identity, HR employment truth, domain ops records, application install lifecycle, PE decisions, role-aware/Dashboard personalization product logic.

Updated living doc: [`../../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md`](../../business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md).

Approval hierarchy: **API implemented** (corrected from stale “unowned/unwired”); **no admin UI**.

---

## 10. Application availability boundary

Install/enable via lifecycle (`BusinessModuleInstallation`) → available under membership/lifecycle rules → server AuthZ still required → presentation may later emphasize by role/position/department.

| Field / map | Classification |
|-------------|----------------|
| `Position.assignedModules` | TRANSITIONAL / inactive for install & AuthZ |
| `Department.departmentModules` | TRANSITIONAL / inactive for install & AuthZ |
| BCC `departmentModules` / position/tier permission maps | Presentation; currently empty — not AuthZ SoT |

---

## 11. Transitional/legacy org concepts

| Item | Classification | Current consumer | Intended end-state | Runtime verify before retire? |
|------|----------------|------------------|--------------------|-------------------------------|
| `BusinessMember.title` | COMPATIBILITY | Members UI / invites | Display metadata; structural title = `Position.title` | Optional |
| `BusinessMember.department` (string) | COMPATIBILITY | Members UI | Prefer `Department` model for structure | Optional |
| `Job` model | LEGACY / UNKNOWN | Near-orphan; optional member include | Insufficient evidence for retirement plan | Yes if retirement proposed |
| `Position.permissions` / tier / dept JSON | TRANSITIONAL | `permissionService`, front-page requiredPermission | PE-backed policy / retire parallel AuthZ | Yes |
| `PermissionSet` | TRANSITIONAL | Org PermissionManager | PE-backed or templates only | Yes |
| `Position.assignedModules` / `departmentModules` | TRANSITIONAL | Schema/UI stubs; BCC empty | Not install authority; possible presentation later | Yes |
| BCC permission maps | TRANSITIONAL (presentation) | PositionAwareModuleProvider | Stay presentation; hydrate carefully | Yes |
| `PermissionManagementRights` | LEGACY / UNKNOWN | No TS service usage found | TBD after verify unused | **Yes** |
| `PermissionChange` | LEGACY / UNKNOWN | No TS usage found | TBD | **Yes** |
| Dual member APIs | TRANSITIONAL | `/api/business/.../members` + `/api/member` | Single surface preferred | Yes before delete |
| Org JSON as PE competitor | TRANSITIONAL | Documented | PE sole permanent AuthZ | Yes during migration |

No deletions in this phase.

---

## 12. Responsibility conclusion

**Current model:** Composition of reporting, approval, audiences, domain assignments/ownership.

**New generic Responsibility entity needed:** **NO** (not preemptively).

Future need must be justified by concrete domain use cases.

---

## 13. Remaining runtime verification

Carried from Phase 1 (still needed; not done in Phase 2):

1. BA Employees tab assign/remove/transfer against live session  
2. Visual reporting drag with auth (missing Authorization header)  
3. Whether live data populates position/tier permission JSON affecting UX  
4. Synthetic `member-*` placeholders in employee list UX  
5. Multi-position: which position presentation selects  
6. Member-only participants: which ops features correctly degrade  
7. Confirm unused status of `PermissionManagementRights` / `PermissionChange` / `Job` before any retirement  

---

## 14. Targeted UI/API implementation gaps

Already evidenced in Phase 1 (not fixed here):

1. Assign: client `effectiveDate` vs server `startDate`  
2. Remove: client `POST` vs server `DELETE`  
3. Display field drift (`name`/`capacity`/`isActive` vs `title`/`maxOccupants`/`active`)  
4. Visual reportsTo update missing Authorization header  
5. Permission/module assignment UI stubs vs empty BCC maps  

These are **implementation gaps**, not open architecture authority problems.

---

## 15. Role-aware product modeling readiness

### **READY**

Architecture is coherent enough that, **after targeted runtime/UI verification** (and preferably fixing the evidenced BA UI/API contracts), role-aware **product modeling** can begin.

Not READY would require an unresolved authority conflict. Phase 2 closed the primary conflicts:

- membership vs placement  
- BusinessRole vs Position  
- manager senses  
- PE vs org JSON RBAC (direction)  
- install vs org module assignment  
- approval hierarchy ownership/status  

**Do not** start designing role-aware screens in this phase. Next recommended sequence remains: runtime verify → targeted BA UI contract fixes → role-aware product modeling.

---

## Documents created / updated (this phase)

**Created**

- `docs/architecture/BUSINESS_PARTICIPANT_COMPOSITION.md`  
- `docs/architecture/audits/BUSINESS_PARTICIPANT_ORG_MODEL_PHASE_2.md` (this file)

**Updated**

- `docs/business-administration/BUSINESS_ADMINISTRATION_OWNERSHIP_MODEL.md`  
- `docs/architecture/POLICY_ENGINE.md`  
- `docs/architecture/ARCHITECTURE_SOURCE_OF_TRUTH.md`  
- `docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`  
- `docs/architecture/README.md`  
- `docs/architecture/APPLICATION_PARTICIPATION_COMPOSITION.md`  
- `docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md` (permissionService transitional note)  
- `docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md`  
- `docs/business-operations/HR_ORG_CHART_BOUNDARY_ANALYSIS.md`

**Explicitly unchanged**

- Product Definition  
- Phase 1 audit  
- All application/server/web/Prisma/test code  

---

**End of Phase 2 audit.** Non-authoritative. Composition SoT is `BUSINESS_PARTICIPANT_COMPOSITION.md`.
