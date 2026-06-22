# Dashboard Module — Package 2 Risk Review

**Program:** Dashboard Module Wave 3 — Package 2 Authorization Review  
**Review date:** 2026-06-21  
**Status:** Governance only

---

## Risk register

| ID | Risk | Likelihood | Impact | Mitigation | Owner |
|----|------|------------|--------|------------|-------|
| **P2-R01** | Calendar decouple breaks personal first-run (no primary calendar) | Medium | **High** | Implement Calendar subscriber or sync `ensurePersonalPrimaryCalendar` before removing dashboard create | Calendar + Dashboard |
| **P2-R02** | Workspace seed decouple breaks new business dashboard UX | Medium | **High** | `tab.created` subscriber seeds folder/chat/calendar; integration test | Platform |
| **P2-R03** | `ensureBusinessDashboardForUser` callers rely on sync side effects | Medium | Medium | Audit 6+ call sites; verify subscriber runs before dependent module activity | Cross-module |
| **P2-R04** | Domain event emit before registry registration | Low | **High** | Register types first; unit test `isRegisteredDomainEventType` | Dashboard |
| **P2-R05** | Double emit (activity + domain) ordering wrong | Medium | Medium | Charter: activity first; test harness | Dashboard |
| **P2-R06** | Delete workflow move loses Drive PE ordering | Medium | **High** | Preserve authorize → Drive PE → dashboard delete in service | Dashboard + Drive |
| **P2-R07** | Conversation deleteMany removal causes FK errors | Medium | High | Chat delegation or transactional order documented | Chat + Dashboard |
| **P2-R08** | AI context service extraction breaks AI providers | Low | Medium | Contract tests on overview/widgets shape | Dashboard + AI |
| **P2-R09** | Integration tests assert old create side effects | High | Medium | Update `dashboard-context.integration.test.ts` | Dashboard |
| **P2-R10** | Scope creep into Package 3 (analytics facade) | Medium | Medium | Non-scope gate on PR review | Engineering lead |
| **P2-R11** | G3 PASS claimed but client quick-stats still cross-module | High | Low | Document B3 partial until P3; G5 may stay 2 | Governance |
| **P2-R12** | Household delete cascade complexity in service move | Low | Medium | Keep household logic in `dashboardService`; test owner path | Dashboard |

---

## Highest architectural risk (answer Q7)

### **P2-R01 + P2-R02 — Decouple without replacement hooks**

Removing calendar provision and workspace seed from `createDashboard` without a **proven replacement** is the highest-risk change in Package 2. It affects:

- Every new personal user (calendar)
- Every business dashboard ensure path (drive folder, chat, calendar)
- HR onboarding, org chart, scheduling activity flows that call `ensureBusinessDashboardForUser`

**Mitigation priority:** Define and implement hook/subscriber **in same PR train** as decouple removal, or use interim explicit module API calls (Option B) with deprecation path.

### Second: **P2-R06 — Delete workflow service extraction**

D-07 crosses Dashboard + Drive domains with file migration choices. Moving orchestration must not skip Drive PE or change response shape (`migration` payload).

---

## Migration risks

| Change | Migration concern | Backward compatibility |
|--------|-------------------|------------------------|
| Remove inline calendar create | Existing users unaffected | New users need Calendar hook |
| Remove workspace seed | Existing business dashboards have resources | New business dashboards need seed subscriber |
| Thin AI controller | Response shape must match | AI provider registration unchanged |
| Domain events added | Additive — no API break | Subscribers optional |
| Service delete workflow | HTTP response contract preserved | Client `deleteDashboardWithFiles` unchanged |

---

## Controller impact summary

| Controller | Risk level | Change |
|------------|------------|--------|
| `dashboardController` | Medium | Delete logic extraction only |
| `dashboardAIContextController` | Low | Delegate to service |
| `widgetController` | Low | None |
| `sidebarController` | Low | None |
| `trashController` | Low | Verify only (P1 complete) |

---

## Score risk

| Scenario | Estimated G1–G9 |
|----------|-----------------|
| P2 full success | **~23/27** |
| Decouple without hooks (regression) | **~19/27** — G3 fails, G8 risk |
| Domain events only (no decouple) | **~21/27** — G3 partial |
| AI service only | **~22/27** — M2/M3 remain |

---

## Risk acceptance

| Risk | Accept for P2 ACT? |
|------|-------------------|
| B3 partial until P3 | **Yes** — documented |
| Optional domain events deferred | **Yes** |
| Decouple without hook plan | **No** — blocks merge |
| Re-implementing P1 trash PE | **No** — verification only |

---

**Last updated:** 2026-06-21
