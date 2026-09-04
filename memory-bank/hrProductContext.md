# HR Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** HR operation matrix, workforce identity architecture, Policy Engine, Workspace Routing Contract

---

## Purpose

HR is Vssyl’s **workforce lifecycle** application for businesses: employment records, onboarding, time-off, and attendance on top of organizational placement.

It **extends** org-chart placement. It does **not** create or own the business’s department/position hierarchy, and it does **not** own business membership.

### What HR is for

- Recording and operating **employment** after someone is placed in the organization
- Running onboarding, time-off, attendance, and related employee/manager workflows
- Giving the business a coherent workforce lifecycle surface separate from membership admin and shift planning

### What HR is not

- Not the org chart / department designer
- Not the business membership product
- Not the Policy Engine
- Not workforce Scheduling
- Not Vssyl Place

## User Value

- One place for employment-related records and workflows after someone is placed in the organization
- Admin directory and company-wide HR operations
- Manager team views for approvals and exceptions without self-approval
- Employee self-service for profile, time-off, punches, and onboarding tasks
- Clear separation from “who is a business member” and “who should work which shift”

## Core Product Model

### Workforce identity (do not collapse)

| Concept | Product meaning |
|--------|------------------|
| **Business membership** | Participation in a business context (invite / member role). Owned by Business / Members — not HR. |
| **Organizational placement** | Who holds which position and reporting relationship (`EmployeePosition` / org chart). Owned by org chart / Business Administration — not HR. |
| **HR employment profile** | Lifecycle extension of a placement (hire metadata, employment status/type, HR workflows). **Owned by HR.** |

A business member can exist without an HR profile; whether that is an explicit product invariant is an open decision (identity architecture supports the stack distinction).

### Durable HR capabilities

- **Employee HR profile** — employment lifecycle extension of an organizational placement
- Employment metadata (hire date, employment status, employment type)
- **Onboarding** — journeys, checklists/tasks, and related documents for new hires
- **Time-off / PTO** — request, balance, and approval lifecycle (system of record for leave)
- **Attendance** — **historical workforce truth** (punches, who actually worked, policies, exceptions)
- **Employee documents** — employment-related files where the product supports them
- **Employee self-service** — profile, time-off, attendance punches, and onboarding participation
- **Manager approval experiences** — team-scoped reviews informed by reporting relationships
- **Employment lifecycle** — hire through active employment and offboarding-related records at product level
- Soft **retention / compliance** expectations for employment records (product intent; legal detail lives elsewhere)
- AI may provide workforce **context** (e.g. who’s off) within the user’s HR authority — not a separate HR AI product

### Reporting relationships (product meaning)

Product-level manager experiences may use **who reports to whom** to scope team views and approvals.

That does **not** mean organizational position defines platform authorization. Access for protected HR actions follows **Policy Engine / current authorization architecture**.

### Aspirational enterprise suite

Recruitment, payroll, performance, benefits, and similar suite areas may appear as **future / deferred product direction**. Do not treat them as shipped HR product.

## Context Behavior

- **Business-only.** HR is not a personal-life application.
- Surfaces typically include admin/company HR operations, manager team views, and employee self-service.
- Commercial packaging may gate features; packaging matrices live in commercial docs, not as ProductContext law.
- Persona differences are about responsibility and experience — not about owning platform authorization.

## Key Relationships

- **Org chart / Business Administration:** Owns structure and placement. HR **reads** hierarchy for manager scope and requires placement before an employment profile. HR does not create departments, positions, or reporting trees.
- **Members / Business:** Owns membership and seats; HR does not own invites or member identity.
- **Scheduling:** Owns future shift planning and **work availability** preferences. HR owns PTO and attendance truth. Scheduling may **reference** approved time-off for conflict awareness; automatic block behavior is an open decision.
- **Calendar:** May display PTO or related items via a bridge; Calendar owns **Calendar events**.
- **File Hub:** Documents and attachments for employment files.
- **Policy Engine:** Determines access for protected HR actions. Organizational position does **not** itself define platform authorization.
- **To-Do:** Not the owner of employment or attendance records.
- **Vssyl Place:** Unrelated external graph; not workforce org or facilities.

## Product Invariants

- Changing authorization implementation must not erase the distinction between **business membership**, **organizational placement**, and **HR employment profile**.
- HR attendance remains past-focused truth; it does not become workforce Scheduling.
- Time-off remains an HR-owned request/approval lifecycle even if Scheduling or Calendar display related information.
- Manager product experiences may use reporting structure; they must not redefine PE as org-chart checkbox RBAC.
- Self-service must not allow a person to approve their own time-off or attendance exceptions as a product rule of thumb.
- User-facing removal of HR records should follow platform soft-retention / trash expectations where the lifecycle applies—not ad-hoc hard delete as the default product story.

## Boundaries

HR does **not** own:

- Department / position / reporting hierarchy creation
- Business membership / invites / seats
- Platform authorization (Policy Engine / current auth architecture)
- Workforce **schedules**, **shifts**, or **work availability** preferences (Scheduling)
- Calendar event system of record
- To-Do tasks / work items
- Vssyl Place graph / listings
- Org-chart permission-system design docs as authorization law

## Open Product Decisions

1. Whether HR is strictly employment-lifecycle or a broader people/org product beyond extending placement.
2. Whether “BusinessMember without HR profile” is an explicit product invariant (vs technical possibility).
3. Depth of HR’s product relationship to org hierarchy beyond consuming placement/reporting.
4. Whether approved PTO automatically blocks Scheduling availability (cross-product policy).
5. Exact conflict behavior when HR time-off, Scheduling shifts, and Calendar displays overlap.

## Canonical References

- [`docs/architecture/audits/HR_OPERATION_MATRIX.md`](../docs/architecture/audits/HR_OPERATION_MATRIX.md)
- [`docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md`](../docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
- [`docs/architecture/WORKSPACE_ROUTING_CONTRACT.md`](../docs/architecture/WORKSPACE_ROUTING_CONTRACT.md)
- Historical HR framework notes: [`docs/archive/hr-merged-2026/`](../docs/archive/hr-merged-2026/)
- Scheduling / Calendar / To-Do product boundaries: respective ProductContexts
