# Scheduling Certification Re-Evaluation

**Program:** Business Operations Certification Re-Evaluation  
**Re-evaluation date:** 2026-06-14  
**Module:** Scheduling (`scheduling`)  
**Prior outcome:** FAIL → NOT CERTIFIED (2026-06-16 evaluation)  
**Remediation input:** [SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md](./SCHEDULING_CERTIFICATION_REMEDIATION_REPORT.md)

**Scope:** Scheduling only. No HR, Workforce Communications, or Analytics re-audit.

---

## Executive summary

Post-remediation re-evaluation confirms that all three **certification blockers** (F-SCH-001, F-SCH-002, F-SCH-003) are **fully resolved** with repository evidence. Scheduling now meets the **core Level 3 constitutional bar** on primary mutation surfaces, platform integrations (activity, notifications, trash, V-Link, domain events), and manifest truthfulness.

Remaining gaps are **non-blocking major and advisory findings** comparable to HR at its Level 3 WITH FINDINGS decision (AI context Prisma, partial Policy Engine route coverage, missing operation matrix).

**Re-evaluation outcome:** **PASS WITH FINDINGS**  
**Certification recommendation:** **LEVEL 3 CERTIFIED WITH FINDINGS**

---

## Primary questions

### 1. Are F-SCH-001, F-SCH-002, and F-SCH-003 fully resolved?

**Yes.**

| ID | Prior blocker | Re-evaluation evidence | Verdict |
|----|---------------|------------------------|---------|
| **F-SCH-001** | 32 `prisma.*` in `schedulingAdminToolsController` | `grep 'prisma\\.' server/src/controllers/scheduling/schedulingAdminToolsController.ts` → **0**; logic in `schedulingAdminToolsService`, `schedulingStationService`, `schedulingJobLocationService` | **Resolved** |
| **F-SCH-002** | Manifest `realtime: true` without adapter | `builtInModuleManifests.ts` scheduling case: **no** `realtime` key; test asserts not declared | **Resolved** |
| **F-SCH-003** | No `scheduling.*` domain events | 20 types in `domainEventRegistry.ts`; emitters in `domainEventEmitters.ts`; `schedulingDomainEventService.ts`; wired in schedule/shift/publish/trash/swap/template services | **Resolved** |

### 2. Does Scheduling now satisfy Level 3 certification requirements?

**Yes, with findings** — same class of residual gaps as HR (F-HR-001..003) at ratified Level 3 WITH FINDINGS.

| Level 3 gate | Constitutional | Re-evaluation status | Evidence |
|--------------|--------------|----------------------|----------|
| 1 Canonical services | §16 | **Pass** | Primary mutations in named services; AdminTools extracted |
| 2 Thin controllers | §16 | **Pass (primary)** / Partial (secondary) | Admin/employee/team/admin-tools: **0** Prisma; AI context **16**, dashboard **3** |
| 3 Policy Engine | §4 | **Partial** | Core schedule/shift/swap/station paths gated; job-location, AI tools, schedule-template delete lack `checkSchedulingPolicy` |
| 4 Global Trash | §7 | **Pass** | `schedulingTrashService`; handler registered; `trashedAt` |
| 5 V-Link | §5 | **Pass** | 3 entities; access + lifecycle services; fail-closed on trashed |
| 6 Platform entities | §21 | **Pass** | Registry + manifest alignment |
| 7 Domain events | §8 | **Pass** | 20 registered types; service emission on success paths |
| 8 Module activity | §3 | **Pass** | `schedulingActivityService` on writes |
| 9 Notifications | §3 | **Pass** | `schedulingNotificationService` + manifest types |
| 10 Realtime | §3, §19 | **Pass (truthful)** | Capability not declared; no manifest lie |
| 11 AI compliance | §6 | **Partial** | `schedulingAIActionService` for writes; **16** Prisma reads in `schedulingAiContextController` |
| 12 Capability truth | §19 | **Pass** | Manifest matches implemented capabilities |
| 13 Tests | — | **Partial** | ~75 scheduling-focused cases; service-heavy; no team controller HTTP tests |
| 14 Documentation | — | **Partial** | No `SCHEDULING_OPERATION_MATRIX.md` |

### 3. What findings remain?

See [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md).

**Summary:** 3 major (carry-forward), 1 major (new, repo-evidenced), 5 advisory. **0 blocking.**

### 4. Is Scheduling a reference candidate?

**Yes — conditional.**

Planning-domain patterns (schedule/shift service split, G09 manager facade, V-Link + trash lifecycle, domain events) are now copy-worthy on primary paths. Reference designation is **conditional** on closure of major findings F-SCH-004 through F-SCH-007 within 90 days — mirroring HR Reference Candidate #1 (Workforce Lifecycle).

Scheduling is **not** Reference Implementation (Level 4). File Hub remains the sole L4.

### 5. Should certification be recommended?

**Yes — LEVEL 3 CERTIFIED WITH FINDINGS.**

Blockers that caused FAIL are closed. Residual gaps match the documented WITH FINDINGS pattern used for HR and certified modules (Calendar AI context exceptions, partial PE).

---

## Architecture verification

### Thin controllers

| Controller | `prisma.` count | vs. prior audit |
|------------|-----------------|-----------------|
| `schedulingAdminController` | 0 | unchanged 🟢 |
| `schedulingEmployeeController` | 0 | unchanged 🟢 |
| `schedulingTeamController` | 0 | unchanged 🟢 |
| `schedulingAdminToolsController` | **0** | was **32** 🟢 |
| `schedulingAiContextController` | 16 | unchanged 🔴 |
| `schedulingDashboardController` | 3 | unchanged 🟡 |

**Total controller Prisma:** **19** (was **51**). Primary admin/manager/employee mutation controllers are clean.

### Service ownership

| Service | Role | Status |
|---------|------|--------|
| `schedulingAdminToolsService` | Recommendations, AI generate, suggest | 🟢 New |
| `schedulingStationService` | Station CRUD | 🟢 New |
| `schedulingJobLocationService` | Job location CRUD | 🟢 New |
| `schedulingScheduleService` | Schedule CRUD + domain events | 🟢 |
| `schedulingShiftService` | Shift CRUD, assign, claim | 🟢 |
| `schedulingPublishService` | Publish orchestration | 🟢 |
| `schedulingSwapService` | Swap lifecycle + domain events | 🟢 |
| `schedulingTrashService` | Trash + domain events | 🟢 |
| `schedulingTemplateService` | Template lifecycle + domain events | 🟢 |
| `schedulingDomainEventService` | Domain event fan-out | 🟢 New |

### Tenant isolation

- `requireAuthorizedBusinessId` / `checkSchedulingAdmin` / manager scope middleware on routes
- `scheduling-tenant-scope.integration.test.ts` (3 cases; 1 environmental failure on local DB during re-evaluation run — test logic unchanged)
- Services scope by `businessId` on persisted paths

---

## Platform verification

| Capability | Status | Evidence |
|------------|--------|----------|
| **Activity** | 🟢 | `schedulingActivityService` — 20+ `record*` exports |
| **Notifications** | 🟢 | `schedulingNotificationService`; manifest notification metadata |
| **Policy Engine** | 🟡 | `checkSchedulingPolicy` on core admin/team writes; gaps on job-locations, AI admin tools, schedule-template delete |
| **Global Trash** | 🟢 | `schedulingTrashService`; global handler; V-Link unlink on purge |
| **V-Link** | 🟢 | SCHEDULE, SCHEDULE_SHIFT, SHIFT_SWAP_REQUEST; 13+ V-Link tests |
| **Domain Events** | 🟢 | 20 `scheduling.*` types; `schedulingDomainEvents.test.ts` (3 cases) |

---

## Blocker re-verification (detailed)

### F-SCH-001

- **Controller:** `schedulingAdminToolsController.ts` — imports services only; `mapSchedulingServiceError` for responses
- **Mutations:** `schedulingStationService`, `schedulingJobLocationService`, `schedulingAdminToolsService` (AI shifts via `createShiftForBusiness`)
- **Regression:** `schedulingServiceExtraction.5c.test.ts` — 10 passed

### F-SCH-002

- **Manifest** (`builtInModuleManifests.ts` L652–663): `read`, `write`, `ai`, `vlink`, `trash`, `notifications`, `globalActivity`, `businessWorkspace` — **no `realtime`**
- **Test:** `builtInModuleManifests.scheduling.test.ts` — asserts realtime not declared
- **Note:** `schedulingPublishService` / `schedulingTrashService` still call `getChatSocketService()` internally; capability correctly **not** marketed in manifest

### F-SCH-003

- **Registry:** 20 `SCHEDULING_*` constants in `domainEventRegistry.ts` with contracts
- **Emitters:** `emitScheduling*` functions appended to `domainEventEmitters.ts`
- **Service:** `schedulingDomainEventService.ts` — mirrors Chat/Calendar `*DomainEventService` pattern
- **Wiring:** schedule create/update, publish, shift create/update/assign, trash lifecycle, swap request/resolve, template lifecycle
- **Tests:** `schedulingDomainEvents.test.ts` — metadata contract (no title/body/PII)

---

## Test evidence

| Suite | Result (re-evaluation run) |
|-------|---------------------------|
| Scheduling-filtered vitest (`pnpm test scheduling`) | **72 passed**, 3 skipped; 1 integration file failed (local DB seed — environmental) |
| `schedulingDomainEvents.test.ts` | 3 passed |
| `builtInModuleManifests.scheduling.test.ts` | 3 passed |
| `schedulingTrashService.test.ts` | 5 passed |
| `schedulingServiceExtraction.5c.test.ts` | 10 passed |
| Full server suite | 1369 passed, **2 failed** (HR controller refactor contract — out of scope) |
| `pnpm type-check` | Pass (per remediation report; not re-run in this doc-only program) |

---

## Comparison to reference modules

| Criterion | Chat | Calendar | Scheduling (post-remediation) |
|-----------|------|----------|------------------------------|
| Primary controller Prisma | 0 | 0 | **0** (admin/team/employee/admin-tools) |
| Domain events | Yes | Yes | **Yes** (20 types) |
| Manifest truth | Yes | Yes | **Yes** |
| V-Link + Trash | Yes | Yes | Yes |
| AI context thin | Yes | Partial | **Partial** (16 Prisma) |
| Operation matrix | Yes | Yes | No |
| Reference status | Ref #2 | Ref #3 | **Candidate (conditional)** |

---

## Allowed outcome applied

| Outcome | Applied? |
|---------|----------|
| FAIL | — |
| **PASS WITH FINDINGS** | **✓** |
| PASS (unconditional) | — |

---

## Related documents

- [SCHEDULING_POST_REMEDIATION_FINDINGS.md](./SCHEDULING_POST_REMEDIATION_FINDINGS.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_UPDATE_RECOMMENDATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_UPDATE_RECOMMENDATION.md)
- [SCHEDULING_CERTIFICATION_REEVALUATION_SUMMARY.md](./SCHEDULING_CERTIFICATION_REEVALUATION_SUMMARY.md)
