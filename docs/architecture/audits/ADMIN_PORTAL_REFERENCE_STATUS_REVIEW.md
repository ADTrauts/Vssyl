# Admin Portal Reference Status Review

**Program:** Post-Modernization Promotion Review  
**Date:** 2026-06-18  
**Prior designation:** Reference Candidate (partial) — RD-AP-004

---

## Question 4 — Should the reference designation change?

# Recommend: Reference With Findings

**Sub-designation:** **Control Plane Reference With Findings**

---

## Options evaluated

| Option | Recommendation | Rationale |
|--------|----------------|-----------|
| No Change | **Reject** | Partial candidate reflected AP-F-007 + G9 gaps — both closed |
| Reference Candidate | **Reject** | Downgrade from achieved promotion path |
| Reference Candidate (Enhanced) | Acceptable alternate | Informal; not a ratified BO tier name |
| **Reference With Findings** | **RECOMMEND** | **Explicit RD-AP-004 promotion path** — now satisfied |
| Reference Implementation | **Reject** | L4 = File Hub only; control plane excluded |

---

## RD-AP-004 promotion path — status

| Stage | Requirements | Status (2026-06-18) |
|-------|--------------|---------------------|
| Reference Candidate (partial) | Qualifying subsystems; documented gaps | **Was ratified** |
| **Reference With Findings** | AP-F-007 closed + G9 progress minimum | **AP-F-007 CLOSED; G9 PASS (exceeds minimum)** |
| Certified Reference Module (CP) | Plain L3; G9 PASS; council vote | **Eligible for future vote** — not automatic |
| Reference Implementation | Denied | **Still denied** |

Admin Portal **meets and exceeds** the council-defined threshold for **Reference With Findings**.

---

## Qualifying reference areas (unchanged — now unblocked)

| Area | Evidence | Reference value |
|------|----------|-----------------|
| AI Pipeline admin | 45/45 HTTP tests; policy CRUD; diagnostics | Platform AI governance template |
| Admin audit taxonomy | 30 actions; 20 resource types; single write path | Privileged-mutation audit where module activity N/A |
| Route / service governance | 0 route Prisma; facade pattern; static tests | Monolith extraction for platform ops |
| Dangerous-op safety | Env gate + confirmation + audit deny | High-privilege operator checklist |
| Analytics ownership (0C) | `adminAnalyticsOwnership.ts`; canonical UI | **Newly reference-eligible** subdomain |

Previously disqualifying areas (AP-F-007, G9) are **closed**.

---

## Historical comparison

| Module / System | Reference tier | Admin Portal fit |
|-----------------|----------------|------------------|
| File Hub | L4 Reference Implementation | **Not comparable** — product L4 |
| Chat | Reference Module #2 (L3) | Product module row |
| Calendar | Reference Module #3 + Reference UX #5 | Arch/UX split; AP unified in G9 |
| HR | Reference Candidate #1 (conditional) | **Parallel at ratification**; AP now ahead (0 open findings) |
| Scheduling | Reference Candidate #6 | Same |
| Workforce Communications | Reference Candidate #7 (plain L3) | **Closest L3 precedent** |
| Admin Portal (prior) | Reference Candidate (partial) | **Upgrade warranted** |

**Reference With Findings** aligns with BO **conditional reference** vocabulary while reflecting **resolved** findings — distinct from product **Reference UX Approved w/ Findings** (Calendar) where UX findings may persist independently.

---

## What Reference With Findings does NOT mean

- Not Level 4 Reference Implementation
- Not a Reference Module #N integer (requires separate catalog vote)
- Not a UX Reference #N row (Admin Portal uses adapted G9, not UX-L3 11-gate)
- Does not imply zero residual semantic `gray-*` on chart badges (documented 1A residual)

---

## Reference status decision

| Field | Value |
|-------|-------|
| **Prior** | Reference Candidate (partial) |
| **Recommended** | **Reference With Findings** |
| **Control-plane label** | `Control Plane Reference With Findings` |
| **Next optional tier** | Certified Reference Module (CP) — council vote when desired |

---

**Last updated:** 2026-06-18
