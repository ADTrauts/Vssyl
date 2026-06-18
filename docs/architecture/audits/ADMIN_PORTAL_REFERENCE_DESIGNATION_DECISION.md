# Admin Portal — Reference Designation Decision

**Program:** Platform Control Plane Certification Council Ratification  
**Date:** 2026-06-18  
**Council decision:** RD-AP-004  
**Status:** Ratified — governance record only

---

## Decision

# Reference Candidate

**Sub-designation:** **Control Plane Reference Candidate (partial)**

---

## Options evaluated

| Option | Council vote | Rationale |
|--------|--------------|-----------|
| No | Rejected | Strong pattern value; 45/45 AI Pipeline HTTP; audit taxonomy; governance tests |
| **Reference Candidate** | **Ratified** | Qualifying subsystems without full-portal reference readiness |
| Reference With Findings | Deferred | Requires AP-F-007 closure + G9 progress or explicit UX waiver vote |
| Reference Implementation | Rejected | L4 reserved for File Hub; G9 FAIL; open major |

---

## Qualifying areas (ratified)

| Area | Evidence | Reference value |
|------|----------|-----------------|
| **AI Pipeline admin** | 45 handlers; policy CRUD; diagnostics; retention/compliance; 45/45 HTTP tests | Canonical pattern for platform AI governance surfaces |
| **Admin audit taxonomy** | 30 actions; 20 resource types; single write path | Template for privileged-mutation audit where module activity N/A |
| **Route / service governance** | 0 route Prisma; facade deprecation; static enforcement tests | Monolith extraction pattern for platform ops |
| **Dangerous-op safety** | Env gate + confirmation + audit deny | High-privilege operator control checklist |

---

## Disqualifying / deferred areas

| Area | Gap | Impact on designation |
|------|-----|----------------------|
| Analytics ownership | AP-F-007 | Blocks analytics subdomain reference |
| UX shell | G9 FAIL; AP-F-023–026 | Blocks Reference UX; blocks full CP reference |
| Satellite mounts | Documented fragmentation | Advisory — document-only reference OK |
| Level 4 patterns | Not met | Cannot promote to Reference Implementation |

---

## Comparison to certified reference programs

| Program | Admin Portal fit |
|---------|------------------|
| Reference Module #N (`chat`, `calendar`, …) | **N/A** — not a product module |
| Reference UX #N | **Not eligible** until 1A |
| BO Reference Candidate #1/#6/#7 | **Analogous** — candidate with conditions |
| File Hub L4 | **Not eligible** |

**Precedent:** HR ratified as **Reference Candidate #1** with open majors and 90-day plan (RD-BO-004). Admin Portal receives **parallel treatment** with control-plane-specific scope.

---

## Proposed reference label (for ledger / catalog)

```
Control Plane Reference Candidate (partial)
  — AI Pipeline admin governance
  — ADMIN_* audit taxonomy
  — Route/service boundary enforcement
```

**Not assigned a Reference Module #N integer** until promotion council vote — avoids collision with BO #1–#7 and product Reference Module catalog.

---

## Promotion path (post-ratification)

| Stage | Requirements | Status |
|-------|--------------|--------|
| **Prior (ratified)** | Reference Candidate (partial) | **Superseded 2026-06-18** |
| **Reference With Findings** | AP-F-007 closed OR waived at promotion vote; G9 PARTIAL minimum | **ACHIEVED** — AP-F-007 closed; G9 PASS |
| **Certified Reference Module (CP)** | Plain L3; G9 PASS or Reference UX Approved w/ Findings; council vote | **Eligible for future vote** — not automatic |
| **Reference Implementation** | Denied — File Hub only | **Still denied** |

---

## Promotion execution (2026-06-18)

| Field | Prior (ratified) | Promoted |
|-------|------------------|----------|
| Reference designation | Reference Candidate (partial) | **Control Plane Reference With Findings** |
| Certification notation | LEVEL 3 CERTIFIED WITH FINDINGS | **LEVEL 3 CERTIFIED** |
| Open findings | 5 at ratification | **0** |
| G9 | FAIL (non-blocking) | **PASS** |

**Governance record:** [ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md](./ADMIN_PORTAL_REFERENCE_STATUS_RECORD.md)

---

## Conditions of designation (ratification — historical)

1. **90-day AP-F-007 tracking** under 0C Analytics charter  
2. **90-day G9 tracking** under 1A UX Shell charter  
3. **No regression** on G1–G8 gates without certification review  
4. Promotion council required for any tier upgrade  

---

## Cross-reference

- Assessment: [ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md](./ADMIN_PORTAL_CONTROL_PLANE_REFERENCE_ASSESSMENT.md)
- Ratification: [ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md](./ADMIN_PORTAL_CERTIFICATION_COUNCIL_RATIFICATION.md)
- Roadmap: [ADMIN_PORTAL_POST_RATIFICATION_ROADMAP.md](./ADMIN_PORTAL_POST_RATIFICATION_ROADMAP.md)
