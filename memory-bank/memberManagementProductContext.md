# Member Management Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Product type:** Business membership / admin surface (+ unresolved personal relationship capability)  
**Architecture:** Workforce identity architecture, Policy Engine, Business Administration / org chart

---

## Purpose

**Members** owns product intent for **business participation**: who is invited into a business, who has joined, membership status, and directory/visibility of participants.

It does **not** own employment records, workforce placement, or platform authorization.

## User Value

- Invite people into a business and track invitation lifecycle
- See who belongs to the business and manage joining/leaving
- Keep “who participates here” separate from “who is an HR employee” and “who holds which org position”
- (Where co-located) manage personal connection requests without confusing them with business membership

## Core Product Model — Business Membership

Durable business concepts:

- **Invitation** to a business
- **Joining / leaving**
- **Membership lifecycle / status**
- **Business participation** (`BusinessMember`)
- **Directory / visibility** of members
- **Member discovery within the business** where supported

### Workforce identity (do not collapse)

| Concept | Product meaning | Owner |
|--------|-----------------|--------|
| **BusinessMember** | Participation / membership in a business | **Members** |
| **EmployeePosition** | Organizational / workforce placement | Org chart / Business Administration |
| **EmployeeHRProfile** | Employment / HR lifecycle extension | **HR** |

Business membership and HR employment profile are **distinct** concepts. Whether membership without HR representation is a **permanent product invariant** remains an **open product decision** — do not elevate it yet.

Membership **role** (e.g. business admin/manager/member language) describes participation responsibilities. It is **not** Policy Engine authorization law and **not** an org-chart position.

## Context Behavior

- Experienced primarily in **business** contexts (member admin / directory surfaces).
- Hosting a Members view inside a Business Administration shell does **not** transfer membership ownership to Business Administration.
- Platform Admin Portal does **not** replace tenant member management for business owners.

## Personal Connections — Current Co-located Product Intent

The same ProductContext historically also describes **personal connections**:

- discover people
- request / accept / decline
- block

These are **not** business membership.

> Whether personal connections should remain in Member Management or become a separate relationship capability is an **open product decision**.

Until that decision, treat personal connections as **co-located intent**, not as BusinessMember semantics.

## Key Relationships

- **Business / Business Administration:** Business identity and org structure; Members own participation, not hierarchy design.
- **HR:** Employment profile and workforce lifecycle; Members do not own hire/PTO/attendance.
- **Policy Engine:** Authorization for invite/remove/update membership actions and connection actions.
- **Scheduling / Org chart:** Consume placement for workforce planning — not Members ownership.
- **Chat / collaborative apps:** May show member or connection context; they do not own membership.
- **Platform Admin:** Operator oversight of platform users — not tenant member admin.

## Product Invariants

- Changing authorization implementation must not erase **BusinessMember ≠ EmployeePosition ≠ EmployeeHRProfile**.
- Inviting someone to a business is membership, not automatic HR employment or org placement.
- Personal connection actions must not be described as business membership.
- Hosting Members UI under another shell does not change ownership.

## Boundaries

Members does **not** own:

- Employment lifecycle / HR profile
- Workforce placement / org hierarchy
- Platform authorization mechanics (Policy Engine)
- Platform Admin Portal operator tools
- Personal Settings preferences
- Marketplace install or application assignment
- V_Link entity associations (separate relationship bridge)
- Promotions, HR onboarding journeys, or attendance as Members features

## Open Product Decisions

1. Whether personal connections stay here or split into a separate relationship ProductContext.
2. Whether BusinessMember-without-HR-profile is a permanent product invariant.
3. Depth of membership **role** language vs Business Administration permission sets (product framing only; PE remains auth).
4. Household or other non-business participation models (if any) relative to this file.

## Canonical References

- [`docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md`](../docs/business-operations/WORKFORCE_IDENTITY_ARCHITECTURE.md)
- [`docs/architecture/POLICY_ENGINE.md`](../docs/architecture/POLICY_ENGINE.md)
- [`memory-bank/hrProductContext.md`](./hrProductContext.md)
- Business Administration status / org-chart architecture docs
- [`memory-bank/adminProductContext.md`](./adminProductContext.md) — Platform Admin ≠ tenant members
