# Workforce Communications Execution Roadmap

**Program:** Workforce Communications Engineering Blueprint  
**Module id:** `workforce_comms`  
**Last updated:** 2026-06-14  
**Scope:** Build sequence only — no implementation in this document

---

## 1. Roadmap overview

```
Phase A  Data model + migration foundation
    ↓
Phase B  Core services (communication, audience, ack, read)
    ↓
Phase C  Routes + Policy Engine + controllers
    ↓
Phase D  Activity + notifications + domain events
    ↓
Phase E  V-Link + Global Trash
    ↓
Phase F  UI + workspace hub + front-page cutover
    ↓
Phase G  Reporting + Scheduling/HR bridges + operation matrix
```

**Parallel constraint:** Phases A→C are sequential. D and E can overlap after C stabilizes. F requires B+C. G requires D.

---

## 2. Phase A — Data model

**Goal:** Persisted WC entities; no user-facing UI.

| Deliverable | Exit criteria |
|-------------|---------------|
| `prisma/modules/workforce_comms/core.prisma` | All 8 entity models |
| Migration applied | Tables exist in dev/staging |
| Enum types | Communication type, status, audience type |

**Dependencies:** None (identity org-chart tables exist).

**Tests:** Schema validation; migration rollback plan documented.

---

## 3. Phase B — Core services

**Goal:** Business logic for draft → publish → read → ack without HTTP layer.

| Deliverable | Exit criteria |
|-------------|---------------|
| `workforceAudienceService` | Resolves DEPARTMENT, BUSINESS, EP, MANAGER_SUBTREE |
| `workforceCommunicationService` | Draft CRUD + publish materializes resolutions |
| `workforceAcknowledgementService` | Ack only for resolved users |
| `workforceReadReceiptService` | Idempotent read |
| `workforceMigrationService` | Imports sample `companyAnnouncements` JSON |

**Dependencies:** Phase A.

**Tests:** `workforceAudienceService.test.ts`, `workforceCommunicationService.test.ts`, `workforceMigrationService.test.ts`.

---

## 4. Phase C — Routes + PE

**Goal:** Authorized HTTP API; thin controllers.

| Deliverable | Exit criteria |
|-------------|---------------|
| `policyActions` + `workforceCommsPolicyDual` | 8 actions registered |
| `routes/workforceComms.ts` | Admin + employee routes |
| Controllers | Zero Prisma |
| `builtInModuleIds` | `workforce_comms` added |

**Dependencies:** Phase B.

**Tests:** `workforceCommsPolicyDual.test.ts`, tenant-scope integration test.

---

## 5. Phase D — Activity + notifications

**Goal:** Full `authorize → execute → emit → notify` contract.

| Deliverable | Exit criteria |
|-------------|---------------|
| `workforceActivityService` | 15+ action types |
| `workforceDomainEventService` | 14 domain event types registered |
| `workforceNotificationService` | `workforce_communication_published` fan-out |
| Notification UI metadata | `workforce_*` in notifications page |

**Dependencies:** Phase C publish path.

**Tests:** Activity, domain event, notification service tests.

---

## 6. Phase E — V-Link + Trash

**Goal:** Platform interoperability certification readiness.

| Deliverable | Exit criteria |
|-------------|---------------|
| `workforceTrashService` | Soft trash + global handler |
| V-Link enum migration | `WORKFORCE_COMMUNICATION`, `WORKFORCE_CAMPAIGN` |
| Access + lifecycle services | Fail-closed trashed |
| Resolver + registry | Entity resolution works |

**Dependencies:** Phase B communication IDs stable.

**Tests:** Trash + V-Link suites.

---

## 7. Phase F — UI

**Goal:** First-class Business Workspace module; front-page cutover.

| Deliverable | Exit criteria |
|-------------|---------------|
| `WorkforceCommsWorkspaceLanding` | Hub renders |
| `BusinessWorkspaceContent` switch | Module navigable |
| Composer + AudiencePicker | Admin can publish with dept audience |
| Employee feed + ack | Members read and ack |
| `AnnouncementsWidget` | Reads WC API |
| `FrontPageContentEditor` | Announcement CRUD removed |

**Dependencies:** Phases C + D (API + notifications).

**Cutover strategy:**

1. Dual-read: widget reads WC API, falls back to JSON
2. Run migration per business
3. Remove JSON CRUD; deprecate field

---

## 8. Phase G — Reporting + bridges

**Goal:** Campaign reporting; cross-module broadcast hooks.

| Deliverable | Exit criteria |
|-------------|---------------|
| `CommunicationReport` UI | Read/ack rates |
| `workforceBridgeService` | Schedule publish hook (feature-flagged) |
| `builtInModuleManifests` | Complete manifest |
| `WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` | Certification prep doc |
| Emergency alert spike | **Evaluate** — go/no-go doc only |

**Dependencies:** Phases D + F.

---

## 9. Capability phase mapping

| Capability | Roadmap phase |
|------------|---------------|
| Announcements | A + B + F |
| Department announcements | B (resolver) + F (picker) |
| Leadership messages | B (type enum) + F |
| Audience targeting | B |
| Notification fan-out | D |
| Acknowledgements | B + F |
| Read tracking | B + F |
| Schedule publication broadcasts | G |
| HR broadcasts | G |
| Campaign reporting | G |
| Emergency alerts | G (evaluate only) |
| SMS / email campaigns | Future |

---

## 10. Prerequisites (from establishment plan)

Do not start Phase A until:

| Prerequisite | Status (planning assumption) |
|--------------|------------------------------|
| Scheduling G09 publish reliability | Stage 2 complete |
| HR / Scheduling L3 path underway | In progress |
| FALSE POSITIVE governance adopted | Phase 0D constitution |
| Identity trust (G02) | Org chart baseline |

---

## 11. Milestones and checkpoints

| Milestone | Phases | Validation |
|-----------|--------|------------|
| **M1 — Publishable API** | A+B+C | Postman publish with BUSINESS audience |
| **M2 — Observable lifecycle** | +D | Activity + notification on publish |
| **M3 — Platform citizen** | +E | Trash + V-Link tests pass |
| **M4 — User-facing module** | +F | Hub + feed + front-page widget |
| **M5 — Full domain** | +G | Reporting + bridges + operation matrix |

---

## 12. What this roadmap does not include

- Certification evaluation
- SMS / email escalation
- Full emergency alert system (evaluate in G)
- Chat module changes
- Notification transport rearchitecture
- Org chart schema changes

---

## Related

- [WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md](./WORKFORCE_COMMUNICATIONS_FILE_TARGET_MATRIX.md)
- [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md)
