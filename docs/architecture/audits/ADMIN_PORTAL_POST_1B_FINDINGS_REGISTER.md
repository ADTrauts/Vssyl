# Admin Portal — Post-1B Findings Register

**Program:** Admin Portal Modernization — Post 1B-E Gate  
**Date:** 2026-06-18  
**Authority:** Repository evidence + stage closeouts (0E, 0B, 0D, 1B-A–D)  
**Constraint:** No certification awarded; no ledger updates

---

## Summary

| Severity | Original | Closed | Remaining |
|----------|----------|--------|-----------|
| **blocking** | 5 | **5** | **0** |
| **major** | 12 | **11** | **1** |
| **advisory** | 13 | **9** | **4** |
| **Total** | **30** | **25** | **5** |

**Blocking count:** **0** — certification review may be scheduled.

---

## Closed findings (25)

| ID | Severity | Closed in | Evidence |
|----|----------|-----------|----------|
| AP-F-001 | blocking | 0E-A | Support customer ticket route admin-gated; `admin-portal-support-customer-auth.test.ts` |
| AP-F-002 | blocking | 0E-B | `enforceDangerousMigrationOpGate`; `admin-portal-dangerous-migration-ops.test.ts` |
| AP-F-003 | blocking | 0B-C | `ADMIN_PORTAL_OPERATION_MATRIX.md` published |
| AP-F-004 | blocking | 1B-C | Facade-only `adminService.ts`; 0 route `prisma.`; service extraction |
| AP-F-005 | blocking | 0E-C | Mock fallbacks removed; `adminPortalMockFallbackHygiene.test.ts` |
| AP-F-006 | major | 0B-A | Satellite mount map (inventory); consolidation deferred |
| AP-F-008 | major | 0D-G | centralized-ai 410 stub; pipeline canonical |
| AP-F-009 | major | 0B-B | Phantom `admin` moduleId removed |
| AP-F-010 | major | 0B-B | `/modules/admin` redirect |
| AP-F-011 | major | 0B-D | Canonical `requireAdmin` + auth matrix |
| AP-F-012 | major | 0E-D | Impersonation policy + deny tests |
| AP-F-013 | major | 1B-B | Audit taxonomy + single write path |
| AP-F-014 | major | 1B-D | Route/service governance + domain contract tests |
| AP-F-015 | major | 0B-E | Duplicate `GET /security/events` removed |
| AP-F-016 | major | 1B-C | Selective PE + waiver documented |
| AP-F-017 | advisory | 0B-E | Unused nav components removed |
| AP-F-018 | advisory | 0B-E | Governance/retention pages canonicalized |
| AP-F-019 | advisory | 0B-E | Impersonation test page deduped |
| AP-F-020 | advisory | 0E-E | Debug pages env-gated (`AdminPortalDebugPageGate`) |
| AP-F-021 | advisory | 0E-E | Testing nav/router debug-gated |
| AP-F-022 | advisory | 0B-A | Emergency mounts inventoried |
| AP-F-027 | major | 1B-D | Test architecture manifest + server domain contracts |
| AP-F-028 | advisory | 0B-B | Admin portal docs reconciled |
| AP-F-029 | advisory | 0D-G | Diagnostics ownership; ai-context UI retired |
| AP-F-030 | major | 1B-D | **45/45** AI Pipeline HTTP coverage |

---

## Remaining findings (5) — do not force close

| ID | Severity | Finding | Owner | Blocks certification review? |
|----|----------|---------|-------|------------------------------|
| **AP-F-007** | major | Analytics surface triplication (`analytics`, `business-intelligence`, `ai-system`, `performance` overlap) | **0C Analytics** | **No** — recommend documented waiver for control-plane scope OR complete 0C before evaluation if analytics is in review scope |
| AP-F-023 | advisory | UX token drift (`gray-*` vs `v-*`) | 1A UX Shell | No |
| AP-F-024 | advisory | No shared EmptyState component | 1A UX Shell | No |
| AP-F-025 | advisory | No shared ConfirmModal | 1A UX Shell | No |
| AP-F-026 | advisory | `seed-modules` uses `window.confirm` | 1A UX Shell | No |

---

## Advisory tails (not counted as open findings)

| Item | Status | Notes |
|------|--------|-------|
| ai-context-debug API (6 handlers) | Transitional retain | Merge optional post-review hygiene |
| `/api/centralized-ai` 410 mount | Compatibility stub | Admin-gated; fence tests pass |
| Fat route LOC (`platform.ts` 1,588; `aiPipeline.ts` 1,203) | Advisory | Services extracted; LOC reduction optional |
| Web page render smoke tests | Stretch | Server contracts sufficient for 1B-D |
| Provider satellite HTTP (`/api/admin/ai-providers`) | Documented | Web hygiene covers governance panel |

---

## Findings by program stage (final)

| Stage | Status |
|-------|--------|
| 0E Compliance & Safety | **Complete** — AP-F-001, 002, 005, 012, 020, 021 closed |
| 0B Boundary & Registry | **Complete** — inventory + cleanup findings closed |
| 0D AI Administration | **Complete** — AP-F-008, 029 closed |
| 1B Governance Architecture | **Complete** — AP-F-004, 013, 014, 016, 027, 030 closed |
| 1B-E Readiness Gate | **Complete** — this register |
| 0C Analytics | **Not started** — AP-F-007 open |
| 1A UX Shell | **Not started** — AP-F-023–026 open |

---

## Cross-reference

- Gate scorecard: [ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md](./ADMIN_PORTAL_CERTIFICATION_READINESS_GATE.md)
- 1B program closeout: [ADMIN_PORTAL_1B_CLOSEOUT_REPORT.md](./ADMIN_PORTAL_1B_CLOSEOUT_REPORT.md)
- Evaluation recommendation: [ADMIN_PORTAL_CERTIFICATION_EVALUATION_RECOMMENDATION.md](./ADMIN_PORTAL_CERTIFICATION_EVALUATION_RECOMMENDATION.md)
- Open-only view: [ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md](./ADMIN_PORTAL_REMAINING_FINDINGS_REGISTER.md)
