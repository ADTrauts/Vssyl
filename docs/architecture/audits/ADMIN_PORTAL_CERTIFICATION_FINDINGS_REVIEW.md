# Admin Portal — Certification Findings Review

**Program:** Admin Portal Certification Evaluation  
**Date:** 2026-06-18  
**Authority:** [ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md](./ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md) + repository verification

**Constraint:** Do not force-close open findings.

---

## Summary

| Category | Count at evaluation |
|----------|--------------------:|
| Total original findings | 30 |
| Closed | **25** |
| Open | **5** |
| Blocking at evaluation | **0** |

---

## Closed findings verification (25)

All closed findings verified against repository evidence or stage closeout artifacts. No regressions detected in evaluation greps.

| ID | Severity | Closed in | Evaluation verification |
|----|----------|-----------|---------------------------|
| AP-F-001 | blocking | 0E-A | `authenticateJWT` + `requireAdmin` on customer support route ✅ |
| AP-F-002 | blocking | 0E-B | `enforceDangerousMigrationOpGate` present ✅ |
| AP-F-003 | blocking | 0B-C | Operation matrix exists ✅ |
| AP-F-004 | blocking | 1B-C | 0 route `prisma.`; facade `adminService` ✅ |
| AP-F-005 | blocking | 0E-C | No mock markers in admin-portal pages ✅ |
| AP-F-006 | major | 0B-A | Mount map published ✅ |
| AP-F-008 | major | 0D-G | centralized-ai fence tests ✅ |
| AP-F-009 | major | 0B-B | Registry cleanup (documented) ✅ |
| AP-F-010 | major | 0B-B | Module admin redirect (documented) ✅ |
| AP-F-011 | major | 0B-D | Auth consolidation (documented) ✅ |
| AP-F-012 | major | 0E-D | Impersonation policy + tests ✅ |
| AP-F-013 | major | 1B-B | Audit taxonomy live ✅ |
| AP-F-014 | major | 1B-D | Governance + domain contract tests ✅ |
| AP-F-015 | major | 0B-E | Single security/events route ✅ |
| AP-F-016 | major | 1B-C | PE waiver documented ✅ |
| AP-F-017 | advisory | 0B-E | Nav cleanup (documented) ✅ |
| AP-F-018 | advisory | 0B-E | Governance pages (documented) ✅ |
| AP-F-019 | advisory | 0B-E | Impersonation page dedup (documented) ✅ |
| AP-F-020 | advisory | 0E-E | Debug page gate (tested) ✅ |
| AP-F-021 | advisory | 0E-E | Testing nav gate (tested) ✅ |
| AP-F-022 | advisory | 0B-A | Emergency mount inventory ✅ |
| AP-F-027 | major | 1B-D | Test architecture manifest + contracts ✅ |
| AP-F-028 | advisory | 0B-B | Docs reconciled ✅ |
| AP-F-029 | advisory | 0D-G | Diagnostics ownership ✅ |
| AP-F-030 | major | 1B-D | 45/45 AI Pipeline HTTP ✅ |

---

## Open findings — certification impact

### AP-F-007 — Analytics surface triplication

| Field | Value |
|-------|-------|
| **Severity** | major |
| **Owner** | 0C Analytics |
| **Evidence** | Overlapping surfaces: `analytics/page.tsx`, `business-intelligence/page.tsx`, `ai-system/page.tsx`, `performance/page.tsx` (41 admin-portal pages total) |
| **Blocks certification?** | **No** — for adapted **control-plane L3** |
| **Certification impact** | **Documented major finding** at Level 3 with Findings; operator confusion risk in analytics subdomain only |
| **Promotion impact** | Blocks upgrade to **plain Level 3** (no findings) until closed or formally waived |
| **Recommended disposition** | Accept as certification finding; schedule 0C; optional council waiver for control-plane scope |

---

### AP-F-023 — UX token drift

| Field | Value |
|-------|-------|
| **Severity** | advisory |
| **Owner** | 1A UX Shell |
| **Evidence** | `gray-*` classes across 28+ admin-portal page files |
| **Blocks certification?** | **No** |
| **Certification impact** | Contributes to **G9 FAIL**; documented advisory finding |
| **Recommended disposition** | Close in 1A; required for Reference UX consideration |

---

### AP-F-024 — No shared EmptyState

| Field | Value |
|-------|-------|
| **Severity** | advisory |
| **Owner** | 1A UX Shell |
| **Evidence** | No `EmptyState` imports in admin-portal pages (grep) |
| **Blocks certification?** | **No** |
| **Certification impact** | G9 advisory finding |
| **Recommended disposition** | Close in 1A |

---

### AP-F-025 — No shared ConfirmModal

| Field | Value |
|-------|-------|
| **Severity** | advisory |
| **Owner** | 1A UX Shell |
| **Evidence** | Custom modal on impersonate only; inconsistent confirmation patterns |
| **Blocks certification?** | **No** |
| **Certification impact** | G9 advisory finding |
| **Recommended disposition** | Close in 1A |

---

### AP-F-026 — seed-modules uses window.confirm

| Field | Value |
|-------|-------|
| **Severity** | advisory |
| **Owner** | 1A UX Shell |
| **Evidence** | `seed-modules/page.tsx` L33 — `window.confirm(...)` |
| **Blocks certification?** | **No** |
| **Certification impact** | G9 advisory finding; low-risk ops page |
| **Recommended disposition** | Close in 1A |

---

## Open findings impact matrix

| ID | Severity | Blocks L3? | Blocks plain L3? | Blocks reference candidate? | In certification label? |
|----|----------|------------|------------------|----------------------------|---------------------------|
| AP-F-007 | major | No | Yes (unless waived) | Partial — analytics not reference area | **Yes** |
| AP-F-023 | advisory | No | No | Yes — UX reference | **Yes** |
| AP-F-024 | advisory | No | No | Yes — UX reference | **Yes** |
| AP-F-025 | advisory | No | No | Yes — UX reference | **Yes** |
| AP-F-026 | advisory | No | No | No | **Yes** |

---

## Advisory tails (not open findings)

| Item | Certification impact |
|------|------------------------|
| ai-context-debug API (6 handlers) | None — transitional; documented |
| `/api/centralized-ai` 410 stub | None — compatibility |
| Fat route LOC | None — maintainability |
| Web page render smoke gap | None — server evidence sufficient |
| Provider satellite HTTP | None — documented satellite |

---

## Findings vs gates

| Gate | Open findings affecting gate |
|------|---------------------------|
| G1–G8 | **None** |
| G9 | AP-F-023, AP-F-024, AP-F-025, AP-F-026 |
| Cross-cutting (non-gate) | AP-F-007 |

---

## Cross-reference

- [ADMIN_PORTAL_CERTIFICATION_EVALUATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION.md)
- [ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md](./ADMIN_PORTAL_POST_1B_FINDINGS_REGISTER.md)
- [ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md](./ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md)
