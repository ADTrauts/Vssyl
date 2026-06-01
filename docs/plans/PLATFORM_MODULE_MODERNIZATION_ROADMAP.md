# Platform Module Modernization Roadmap

**Version:** 1.0.0  
**Last updated:** 2026-05-31  
**Status:** Active — master execution roadmap  
**Authority pairing:**

| Reference | Role |
|-----------|------|
| [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) | **Constitutional authority** — what the platform requires |
| File Hub (`drive`) + [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](../architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) | **Implementation authority** — how compliant modules are built |

**Related:** [`MODULE_INTEROPERABILITY_ALIGNMENT_PHASED_PLAN.md`](./MODULE_INTEROPERABILITY_ALIGNMENT_PHASED_PLAN.md) (complete), [`FILE_HUB_MATURITY_ASSESSMENT.md`](../architecture/audits/FILE_HUB_MATURITY_ASSESSMENT.md), [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md), [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md), [`memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md)

---

## Section 1 — Executive Summary

### Benchmark and objective

**File Hub** (module id: `drive`) is the designated **Reference Implementation** for Vssyl first-party modules (FH-6 certified, maturity ~87/100). It demonstrates canonical service boundaries, thin controllers, Global Trash handler registration, Policy Engine dual-enforcement, permission-aware visibility reads, owned + shared + PE paths, V_Link lifecycle participation, domain events, normalized module activity writes, centralized notifications, realtime fan-out, truthful capability declarations, and audit-grade documentation.

The **Vssyl Platform Standards and Module Contract** document is the **constitutional source of truth** for what every module and platform system must satisfy. File Hub is the **implementation source of truth** for how to satisfy it without architectural drift.

**Objective:** Platform-wide **certification** — every product module and shared platform system evaluated on **two axes**:

1. **Constitutional Compliance** — “Does this satisfy the Platform Standards?”
2. **File Hub Compliance** — “Does this follow proven patterns from File Hub?”

**Goal:** Eliminate architectural drift (fat controllers, parallel permission models, fragmented schedulers, AI Prisma bypasses, manifest lies, missing trash handlers, stub event subscribers) and converge on the **Runtime Kernel** mutation contract: `authorize → execute → emit normalized activity → notify/realtime`.

**Governance artifacts:** Certification status → [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md). Implementation patterns → [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md).

### Modernization strategy (four stages)

| Stage | Question | Outcome |
|-------|----------|---------|
| **1. Constitutional Compliance** | Does it use kernel services correctly? | Gaps mapped to §0–§30 standards |
| **2. File Hub Compliance** | Does it mirror reference service patterns? | Gaps mapped to FH extraction patterns |
| **3. Platform Readiness** | Does it participate in cross-cutting systems? | Notifications, trash, V_Link, scheduler, AI, entities, search |
| **4. Certification** | Is it documented, tested, and drift-free? | Merge gate + capability truthfulness |

### Repository baseline (2026-05-31)

Evidence used for scorecards and priorities:

- **File Hub:** Reference Implementation — `driveDeleteService`, `driveVisibilityService`, `driveUploadService`, `driveNotificationService`, `drivePolicyDual`, Global Trash handler registered.
- **Global Trash handlers:** Only `drive` registered in `registerGlobalTrashHandlers.ts` despite other modules declaring `trash: true` in manifests.
- **Policy Engine dual-enforcement:** Only `drivePolicyDual` exists; other modules use legacy inline checks.
- **Controller mass:** `chatController.ts` ~1,663 lines; `calendarController.ts` ~1,713; `todoController.ts` ~4,401; `notesController.ts` ~429 — all with heavy inline Prisma vs File Hub thin controllers.
- **Domain events:** Registry includes `chat.message.sent`, `calendar.event.created`; todo/notes/place lifecycle largely unregistered.
- **Provisioning:** `BUILT_IN_MODULE_IDS` lists all 10 built-ins (Section 0.4 item 1 partially remediated); manifest **notification metadata blocks** remain sparse for chat/calendar/todo vs drive.
- **Business workspace:** `BusinessWorkspaceContent.tsx` includes `drive`, `chat`, `calendar`, `notes`, `todo`, `place` cases (Section 0.4 item 3 partially remediated).
- **Notes trash:** Controller uses `trashedAt` (Global Trash field aligned); **no** Global Trash module handler registered.
- **AI violations:** `toolExecutor.ts` and `ActionExecutor.ts` still contain direct Prisma mutation paths per Platform Standards §16.

---

## Section 2 — Modernization Framework

Every module and platform system passes **four evaluation layers**. Findings must cite both constitutional sections and File Hub pattern IDs (from FH Part 9 extraction table).

### Layer 1 — Constitutional Compliance

| Area | Constitutional source | Pass criteria |
|------|----------------------|---------------|
| Module Contract | §3 | Lifecycle, tenancy, `authorize → execute → emit → notify` |
| Service Boundaries | §16 | No business logic or Prisma in controllers/AI |
| Policy Engine | §4 | `authorize()` / dual-enforcement on privileged mutations |
| Global Trash | §7 | `trashedAt` + handler registration + restore/permanent-delete |
| V_Link | §5 | Resolver + lifecycle; membership ≠ content access |
| Notifications | §3 + manifest | `NotificationService` + manifest metadata |
| Domain Events | §8 | Taxonomy registered; emit on important mutations |
| Module Activity | §3 + `moduleSpecs.md` | `emitModuleActivityEvent` on success only |
| Scheduler | §22 | Jobs call canonical services; registry inventory |
| AI Requirements | §6 | Context providers + actions via services only |

### Layer 2 — File Hub Compliance

**Implementation checklist:** All File Hub compliance reviews MUST use [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) (Patterns 1–15) as the implementation checklist. Constitutional gaps alone are insufficient for certification.

| Pattern | File Hub source | Pass criteria |
|---------|-----------------|---------------|
| Thin controllers | FH-6 | HTTP parse/auth/map only |
| Canonical services | `drive*Service.ts` | One service per domain concern |
| Delete lifecycle | `driveDeleteService` | PE → persist → activity → event → notify → realtime → V_Link |
| Visibility services | `driveVisibilityService` | Owned + shared + PE filtered reads |
| Shared read paths | FH-4 | Browse/search/AI use visibility, not raw Prisma |
| Event emission | `domainEventEmitters` | Service-owned, not controller-owned |
| Notification flow | `driveNotificationService` | Adapter; no self-notify; manifest types |
| Realtime flow | `driveRealtimeService` | Collaborator-safe fan-out |
| AI compliance | Upload/visibility/share tools | No direct Prisma in tools/executors |
| Documentation quality | FH audits + operation matrix | Operation matrix or equivalent module audit |

### Layer 3 — Platform Readiness

Participation checklist: Notifications · Realtime · V_Link · Global Trash · Scheduler · AI · Platform Entity Model · Search · Analytics (where declared).

Capability declarations in `builtInModuleManifests.ts` must match runtime behavior (§19).

### Layer 4 — Certification

| Gate | Requirement |
|------|-------------|
| Documentation | Module audit doc + operation matrix or gap list |
| Tests | Service-level tests for delete/share/visibility/PE |
| Capability accuracy | Manifest + registry reconcile on startup |
| Manifest accuracy | Full `notifications[]`, `entities[]` where applicable |
| Architectural drift | No parallel trash/permission/registration paths |
| Legacy path removal | Deprecated routes removed or formally sunset |

**Status legend (scorecards):** 🟢 Compliant · 🟡 Partial / in progress · 🔴 Non-compliant or missing

---

## Section 3 — Platform-Wide Remediation Track

Foundation: Platform Standards **§0 Current System Inventory and Legacy Cleanup** + File Hub FH-6 governance audits.

### Track A1 — Provisioning Mismatch

| Field | Detail |
|-------|--------|
| **Problem** | Historical `moduleProvisionController` treated only a subset of built-ins as always-installed; marketplace install friction for core modules. |
| **Impact** | Fresh tenants missing modules; inconsistent “installed” state vs runtime registration. |
| **Constitutional violation** | §0.4 #1; §29 governance |
| **Recommended resolution** | Treat `BUILT_IN_MODULE_IDS` as sole provisioning source; startup `ensureModuleExists` upserts all built-ins; remove install requirement for built-ins in UI/API. |
| **Priority** | **P1** — largely remediated in code; verify UI/marketplace paths and document |

### Track A2 — Manifest Drift

| Field | Detail |
|-------|--------|
| **Problem** | `builtInModuleManifests.ts` declares capabilities (e.g. `trash`, `notifications`, `vlink`) without matching `notifications[]` / `entities[]` blocks for chat, calendar, todo, place, dashboard. |
| **Impact** | Discovery gaps, notification settings incomplete, certification false positives. |
| **Constitutional violation** | §19 Capability Matrix; `module-development.mdc` |
| **Recommended resolution** | Reconcile-on-startup copies full canonical manifest shape (drive pattern); add notification metadata per type; entity descriptors for linkable types. |
| **Priority** | **P0** |

### Track A3 — Business Workspace Gaps

| Field | Detail |
|-------|--------|
| **Problem** | §0.4 listed `todo`, `place` missing from workspace switch; dead `*WorkspaceLanding.tsx` vs live layouts. |
| **Impact** | Business users land on wrong surfaces; contract confusion for module hubs. |
| **Constitutional violation** | §10 UI; `module-development.mdc` hub pattern |
| **Recommended resolution** | Confirm all product modules in `BusinessWorkspaceContent`; standardize one hub pattern (`*ModuleWrapper` or thin `WorkspaceLanding`); remove dead landing files or wire them. |
| **Priority** | **P2** — switch cases exist for todo/place; hub pattern standardization remains |

### Track A4 — Domain Event Gaps

| Field | Detail |
|-------|--------|
| **Problem** | Taxonomy thin beyond drive; chat/calendar have minimal types; todo/notes/place/hr/scheduling lack lifecycle coverage. |
| **Impact** | Subscribers stubbed; cross-module automation and analytics inputs incomplete. |
| **Constitutional violation** | §8 Domain Events |
| **Recommended resolution** | Per-module event matrix in `domainEventRegistry.ts`; emitters only from canonical services; enable notification/analytics subscribers incrementally. |
| **Priority** | **P1** |

### Track A5 — Module Activity Gaps

| Field | Detail |
|-------|--------|
| **Problem** | hr, scheduling, todo, notes, place lack normalized write emissions; platform feed still reads legacy `prisma.activity` in places. |
| **Impact** | Broken or inconsistent activity feeds; weak AI ambient signals. |
| **Constitutional violation** | §3 Module Contract; `module-interoperability.mdc` |
| **Recommended resolution** | Module-specific `*ActivityService` adapters; 100% write path `emitModuleActivityEvent`; platform read migration batch (File Hub P2 ACT-R1 pattern). |
| **Priority** | **P1** |

### Track A6 — Policy Engine Coverage

| Field | Detail |
|-------|--------|
| **Problem** | Only `drivePolicyDual` in production; chat/calendar/todo/notes use legacy role/membership checks in controllers. |
| **Impact** | Authorization bypass risk; inconsistent fail-closed behavior. |
| **Constitutional violation** | §4 Permissions; §0.6 dual permission models |
| **Recommended resolution** | Introduce `*PolicyDual.ts` per module; expand `policyEngine.ts` actions; route all mutations through `evaluate*PolicyDual` before Prisma. |
| **Priority** | **P0** |

### Track A7 — Duplicate Registration Paths

| Field | Detail |
|-------|--------|
| **Problem** | `registerBuiltInModules.ts` vs `scripts/register-built-in-modules.ts` vs `seed*Module.ts` manifests. |
| **Impact** | AI context and notification definitions drift between paths. |
| **Constitutional violation** | §0.3; §30 Migration |
| **Recommended resolution** | Single startup path; deprecate scripts; delete or archive seed scripts after reconcile proven. |
| **Priority** | **P1** |

### Track A8 — Runtime Registry Gaps

| Field | Detail |
|-------|--------|
| **Problem** | `place` (and partial modules) absent or incomplete in `coreModuleRegistry` / widget metadata switches. |
| **Impact** | Dashboard/widget resolution failures; capability resolution lies. |
| **Constitutional violation** | §19; §17 state ownership |
| **Recommended resolution** | Register all built-ins in `coreModuleRegistry.ts`; unify with `builtInModuleManifests` reconcile. |
| **Priority** | **P2** |

### Track A9 — AI Direct Prisma Violations

| Field | Detail |
|-------|--------|
| **Problem** | `toolExecutor.ts` creates tasks/files directly; `ActionExecutor.ts` embeds large Prisma surfaces. |
| **Impact** | Bypasses PE, events, audit; highest-risk inconsistency per §0.6. |
| **Constitutional violation** | §6 AI; §16 mutation contract |
| **Recommended resolution** | AI Tools/Actions track: every write routes through canonical module services; executor becomes dispatcher only. |
| **Priority** | **P0** |

### Track A10 — Scheduler Fragmentation

| Field | Detail |
|-------|--------|
| **Problem** | Crons in `index.ts`, `cleanupService`, scattered `setInterval`; jobs mutate domain tables directly. |
| **Impact** | Duplicate runs, untracked failures, non-auditable side effects. |
| **Constitutional violation** | §22 Platform Job Scheduler |
| **Recommended resolution** | Inventory → Platform Job Registry; migrate trash cleanup and module jobs to service calls; no new `setInterval`. |
| **Priority** | **P2** (inventory first; no runtime rewrite) |

---

## Section 4 — Compliance Scorecards

### Scorecard template

Copy per module during phase audits:

| Standard | Constitutional Compliance | File Hub Compliance | Status |
|----------|---------------------------|---------------------|--------|
| Thin Controllers | | | |
| Canonical Services | | | |
| Global Trash | | | |
| Policy Engine | | | |
| Domain Events | | | |
| Module Activity | | | |
| Notifications | | | |
| Realtime | | | |
| Platform Entity Registration | | | |
| V_Link | | | |
| Capability Matrix | | | |
| AI Compliance | | | |
| Scheduler Integration | | | |
| Documentation | | | |
| Tests | | | |

### File Hub (`drive`) — Reference baseline

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🟢 | 🟢 | 🟢 |
| Canonical Services | 🟢 | 🟢 | 🟢 |
| Global Trash | 🟢 | 🟢 | 🟢 |
| Policy Engine | 🟢 | 🟢 | 🟢 |
| Domain Events | 🟢 | 🟢 | 🟢 |
| Module Activity | 🟡 writes 🟢 / reads legacy | 🟡 | 🟡 |
| Notifications | 🟢 | 🟢 | 🟢 |
| Realtime | 🟢 | 🟢 | 🟢 |
| Platform Entity Registration | 🟢 | 🟢 | 🟢 |
| V_Link | 🟢 | 🟢 | 🟢 |
| Capability Matrix | 🟢 | 🟢 | 🟢 |
| AI Compliance | 🟢 | 🟢 | 🟢 |
| Scheduler Integration | 🟡 trash job canonical | 🟡 | 🟡 |
| Documentation | 🟢 | 🟢 | 🟢 |
| Tests | 🟢 | 🟢 | 🟢 |

### Chat — Priority 1

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🔴 ~1,663-line controller, ~41 Prisma calls | 🔴 | 🔴 |
| Canonical Services | 🔴 only `chatSocketService` | 🔴 | 🔴 |
| Global Trash | 🟡 manifest `trash: true`; no handler | 🔴 | 🔴 |
| Policy Engine | 🔴 no `chatPolicyDual` | 🔴 | 🔴 |
| Domain Events | 🟡 `chat.message.sent` only | 🟡 | 🟡 |
| Module Activity | 🟡 partial emits in controller | 🔴 | 🟡 |
| Notifications | 🟡 types in UI; sparse manifest | 🟡 | 🟡 |
| Realtime | 🟢 `chatSocketService` mature | 🟡 no `chatRealtimeService` adapter | 🟡 |
| Platform Entity Registration | 🔴 | 🔴 | 🔴 |
| V_Link | 🔴 not integrated | 🔴 | 🔴 |
| Capability Matrix | 🟡 declares vlink pending | 🔴 | 🟡 |
| AI Compliance | 🟡 context controller; executor paths | 🔴 | 🟡 |
| Scheduler Integration | 🟡 | 🔴 | 🟡 |
| Documentation | 🔴 no operation matrix | 🔴 | 🔴 |
| Tests | 🟡 route integration tests | 🔴 | 🟡 |

### Calendar — Priority 2

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🔴 ~1,713-line controller | 🔴 | 🔴 |
| Canonical Services | 🔴 | 🔴 | 🔴 |
| Global Trash | 🟡 field usage; no handler | 🔴 | 🔴 |
| Policy Engine | 🔴 | 🔴 | 🔴 |
| Domain Events | 🟡 `calendar.event.created` | 🟡 | 🟡 |
| Module Activity | 🔴 | 🔴 | 🔴 |
| Notifications | 🟡 | 🟡 | 🟡 |
| Realtime | 🟡 partial | 🟡 | 🟡 |
| Platform Entity Registration | 🔴 | 🔴 | 🔴 |
| V_Link | 🟡 declared; resolver gaps | 🟡 | 🟡 |
| Capability Matrix | 🟡 | 🟡 | 🟡 |
| AI Compliance | 🟡 providers exist | 🔴 | 🟡 |
| Scheduler Integration | 🟡 reminders need registry | 🔴 | 🟡 |
| Documentation | 🔴 | 🔴 | 🔴 |
| Tests | 🟡 domain event tests | 🔴 | 🟡 |

### Todo / Tasks — Priority 3

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🔴 ~4,401-line controller | 🔴 | 🔴 |
| Canonical Services | 🟡 ancillary only (`todoRecurrenceService`, etc.) | 🔴 | 🔴 |
| Global Trash | 🟡 manifest; no handler | 🔴 | 🔴 |
| Policy Engine | 🔴 | 🔴 | 🔴 |
| Domain Events | 🔴 | 🔴 | 🔴 |
| Module Activity | 🟡 sparse | 🔴 | 🔴 |
| Notifications | 🔴 manifest omits notifications | 🔴 | 🔴 |
| Realtime | 🔴 | 🔴 | 🔴 |
| Platform Entity Registration | 🔴 | 🔴 | 🔴 |
| V_Link | 🔴 | 🔴 | 🔴 |
| Capability Matrix | 🟡 `tasks` vs `todo` executor alias | 🟡 | 🟡 |
| AI Compliance | 🔴 `toolExecutor` task create | 🔴 | 🔴 |
| Scheduler Integration | 🟡 smart scheduling service | 🟡 | 🟡 |
| Documentation | 🟡 legacy plans in `docs/plans/` | 🔴 | 🟡 |
| Tests | 🟡 integration tests | 🔴 | 🟡 |

### Notes — Priority 4

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🟡 smaller but Prisma-inline | 🟡 | 🟡 |
| Canonical Services | 🔴 | 🔴 | 🔴 |
| Global Trash | 🟡 uses `trashedAt`; no handler | 🔴 | 🟡 |
| Policy Engine | 🔴 | 🔴 | 🔴 |
| Domain Events | 🔴 | 🔴 | 🔴 |
| Module Activity | 🟡 limited emits | 🔴 | 🟡 |
| Notifications | 🟡 manifest flag only | 🟡 | 🟡 |
| Realtime | 🔴 | 🔴 | 🔴 |
| Platform Entity Registration | 🔴 | 🔴 | 🔴 |
| V_Link | 🔴 | 🔴 | 🔴 |
| Capability Matrix | 🟡 | 🟡 | 🟡 |
| AI Compliance | 🟡 | 🟡 | 🟡 |
| Scheduler Integration | 🔴 | 🔴 | 🔴 |
| Documentation | 🔴 | 🔴 | 🔴 |
| Tests | 🟡 folder context test | 🔴 | 🟡 |

### Place — Priority 5

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🔴 many controllers | 🔴 | 🔴 |
| Canonical Services | 🔴 | 🔴 | 🔴 |
| Global Trash | 🔴 | 🔴 | 🔴 |
| Policy Engine | 🔴 | 🔴 | 🔴 |
| Domain Events | 🔴 | 🔴 | 🔴 |
| Module Activity | 🔴 | 🔴 | 🔴 |
| Notifications | 🔴 | 🔴 | 🔴 |
| Realtime | 🔴 | 🔴 | 🔴 |
| Platform Entity Registration | 🔴 | 🔴 | 🔴 |
| V_Link | 🔴 | 🔴 | 🔴 |
| Capability Matrix | 🟡 minimal manifest | 🔴 | 🟡 |
| AI Compliance | 🟡 `placeAIController` | 🔴 | 🟡 |
| Scheduler Integration | 🔴 | 🔴 | 🔴 |
| Documentation | 🔴 | 🔴 | 🔴 |
| Tests | 🟡 calendar link integration | 🔴 | 🟡 |

### Dashboard — Platform hub

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🟡 | 🟡 | 🟡 |
| Canonical Services | 🟡 dual widget registry | 🟡 | 🟡 |
| Global Trash | 🟡 widgets | 🟡 | 🟡 |
| Policy Engine | 🟡 | 🟡 | 🟡 |
| Domain Events | 🟡 | 🟡 | 🟡 |
| Module Activity | 🔴 | 🔴 | 🔴 |
| Notifications | 🔴 | 🔴 | 🔴 |
| Realtime | 🟡 | 🟡 | 🟡 |
| Platform Entity Registration | 🟡 lightweight entities | 🟡 | 🟡 |
| V_Link | 🔴 | 🔴 | 🔴 |
| Capability Matrix | 🟡 | 🟡 | 🟡 |
| AI Compliance | 🟡 | 🟡 | 🟡 |
| Scheduler Integration | 🟡 | 🟡 | 🟡 |
| Documentation | 🟡 | 🟡 | 🟡 |
| Tests | 🟡 | 🟡 | 🟡 |

### Analytics — Cautious track

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | 🟡 | N/A | 🟡 |
| Canonical Services | 🟡 derived reads | N/A | 🟡 |
| Global Trash | N/A | N/A | — |
| Policy Engine | 🟡 must gate reads | N/A | 🟡 |
| Domain Events | 🟡 subscriber stubs | N/A | 🟡 |
| Module Activity | 🔴 must not substitute analytics | N/A | 🟡 |
| Notifications | N/A | N/A | — |
| Realtime | N/A | N/A | — |
| Platform Entity Registration | 🟡 | N/A | 🟡 |
| V_Link | N/A | N/A | — |
| Capability Matrix | 🟡 pseudo-module | N/A | 🟡 |
| AI Compliance | 🔴 defer advanced | N/A | 🟡 |
| Scheduler Integration | 🟡 batch jobs | N/A | 🟡 |
| Documentation | 🟡 | N/A | 🟡 |
| Tests | 🟡 | N/A | 🟡 |

### Business Workspace — Cross-cutting

| Standard | Constitutional | File Hub | Status |
|----------|----------------|----------|--------|
| Thin Controllers | N/A (composition) | 🟡 | 🟡 |
| Canonical Services | N/A | 🟡 | 🟡 |
| Global Trash | 🟡 | 🟡 | 🟡 |
| Policy Engine | 🟡 module install | 🟡 | 🟡 |
| Domain Events | 🟡 install/uninstall | 🟡 | 🟡 |
| Module Activity | 🟡 | 🟡 | 🟡 |
| Notifications | 🟡 | 🟡 | 🟡 |
| Realtime | 🟡 | 🟡 | 🟡 |
| Platform Entity Registration | 🟡 | 🟡 | 🟡 |
| V_Link | 🟡 | 🟡 | 🟡 |
| Capability Matrix | 🟡 | 🟡 | 🟡 |
| AI Compliance | 🟡 | 🟡 | 🟡 |
| Scheduler Integration | 🟡 | 🟡 | 🟡 |
| Documentation | 🟡 | 🟡 | 🟡 |
| Tests | 🟡 | 🟡 | 🟡 |

---

## Section 5 — Module Modernization Roadmaps

Each module follows the same document structure: **Current State → Constitutional Gaps → File Hub Pattern Gaps → Risks → Required Corrections → Modernization Phases → Acceptance Criteria → Deferred Work**.

---

### 5.1 Chat (Priority 1)

#### Current State

- Mature **realtime** via `chatSocketService`; notification types consumed in `notifications/page.tsx` (`chat_message`, `chat_reaction`, `chat_mention`).
- **Fat controller** owns conversations, messages, threads, reactions, read state, and Prisma (~1,663 lines).
- Partial **domain event** (`chat.message.sent`) and **module activity** emits from controller.
- Manifest declares trash, realtime, notifications, AI — **no** `notifications[]` metadata block, **no** entities, **no** Global Trash handler.
- No **Policy Engine dual** layer; **partial V_Link** resolver (`CHAT_CONVERSATION` only, no lifecycle service); no **platform entity** registration.
- Trash via **`trashController` inline Prisma** (no `registerGlobalTrashModuleHandler` for `chat`).

#### Constitutional Gaps

- §16 service boundaries violated (controller mutations).
- §4 PE not enforced on chat mutations.
- §7 Global Trash handler missing despite capability.
- §8 incomplete domain event taxonomy (edit/delete/thread/archive).
- §21 entity model not registered for conversations/messages.
- §5 V_Link not wired for conversation/message link types.

#### File Hub Pattern Gaps

- No `chatDeleteService` / trash lifecycle mirroring `driveDeleteService`.
- No `chatVisibilityService` for membership-safe reads.
- No `chatNotificationService` adapter.
- No `chatRealtimeService` separation from socket transport.
- Activity/notification/event ordering not centralized in services.

#### Risks

- **High:** Authorization inconsistency in group/channel permissions; socket events leaking across tenants if membership checks drift.
- **High:** AI chat actions bypassing services.
- **Medium:** Trash restore UX absent for deleted conversations.
- **Medium:** Cross-module file attachments (drive) without unified visibility.

#### Required Corrections

1. Extract canonical services (see Phase 1).
2. Add `chatPolicyDual` + PE actions for conversation/message mutations.
3. Register Global Trash handler for conversation (and thread if applicable) types.
4. Register platform entities + manifest notification metadata.
5. Route AI chat writes through services.
6. Publish Chat Operation Matrix audit doc.

#### Modernization Phases

**Phase 0 — Audit (1–2 weeks)** — **Complete (2026-05-31)**

- Inventory: `chatController.ts`, `chat.ts` routes, `chatSocketService.ts`, notification types, manifest, AI context/executors, trash fields on models, tests.
- Deliverables:
  - [`docs/architecture/audits/CHAT_CONSTITUTIONAL_AUDIT.md`](../architecture/audits/CHAT_CONSTITUTIONAL_AUDIT.md)
  - [`docs/architecture/audits/CHAT_OPERATION_MATRIX.md`](../architecture/audits/CHAT_OPERATION_MATRIX.md)
- **Phase 1A (design):** [`CHAT_SERVICE_EXTRACTION_PLAN.md`](../architecture/audits/CHAT_SERVICE_EXTRACTION_PLAN.md) — complete (2026-05-31).
- **Phase 1B (core domain services):** complete (2026-05-31) — `chatPermissionService`, `chatConversationService`, `chatMessageService`, `chatThreadService`; controller delegates mutations.
- **Phase 1C (visibility + attachments + PolicyDual pilot):** complete (2026-05-31) — `chatVisibilityService`, `chatAttachmentService`, `chatPolicyDual`; read paths + AI context + search; `sendMessage` dual + Drive attachment validation.
- **Phase 1D (infrastructure adapters):** complete (2026-05-31) — `chatActivityService`, `chatNotificationService`, `chatRealtimeService`, `chatDomainEventService`; socket reaction/read → `chatMessageService`; activity on conversation/thread create.
- **Phase 1E (controller collapse):** complete (2026-05-31) — zero Prisma/side effects in `chatController.ts`; `chatUserSearchService`, `chatAnalyticsService`; contract test; `CHAT_OPERATION_MATRIX` HTTP rows → **P**.
- **Phase 1F (AI executor migration):** complete (2026-05-31) — `chatAIActionService`; `ActionExecutor` chat ops → services; integration tests; Wave 1 service extraction closed in ledger.
- **Phase 2 (Global Trash):** complete (2026-05-31) — `chatTrashService`, handler registration, `trashController` delegation; see [`CHAT_GLOBAL_TRASH_PHASE2.md`](../architecture/audits/CHAT_GLOBAL_TRASH_PHASE2.md).
- **Phase 3 (compliance layer):** complete (2026-05-31) — full `chatPolicyDual` on mutations/trash; domain events (service-owned); manifest `notifications[]`; `chatVlinkLifecycleService` on permanent conversation delete.
- **Phase 4 (platform entities):** complete (2026-05-31) — `registerChatPlatformEntities` (`conversation` only); manifest `entities[]` + `vlink: true`; `chatVlinkAccessService` wired in `vlinkEntityResolverService`.
- **Phase 5 (Level 3 closeout):** complete (2026-05-31) — [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](../architecture/audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md); browse/list PE; ledger **Level 3 Certified**; **Reference Module #2**.
- **Deferred:** `message`, `CHAT_THREAD` platform entities; Level 4 council review for full Reference Implementation parity with File Hub.
- **Reference doc:** [CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md](../architecture/CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md) ✅
- **Next module:** Calendar (Wave 2) — Phase 0 audit complete; implementation not started.

**Phase 1 — Canonical Service Layer (3–4 weeks)**

Extract (File Hub naming convention):

| Service | Responsibility |
|---------|----------------|
| `chatConversationService` | Create/update/archive conversations; membership |
| `chatMessageService` | Send/edit/delete messages; attachments linkage |
| `chatThreadService` | Threads and replies |
| `chatPermissionService` | Membership roles; invite/remove |
| `chatVisibilityService` | List/read paths; shared + owned filtering |
| `chatAttachmentService` | Drive file references; PE on file ids |
| `chatActivityService` | `emitModuleActivityEvent` wrapper |
| `chatNotificationService` | `NotificationService` adapter |
| `chatRealtimeService` | Fan-out; wraps socket broadcast |

Controllers become thin HTTP adapters.

**Phase 2 — Trash Alignment (1–2 weeks)**

- Align soft trash/restore/permanent-delete on conversation (and messages policy).
- Register `registerGlobalTrashModuleHandler({ moduleId: 'chat', ... })`.
- Wire business + personal trash views to Global Trash API.

**Phase 3 — Policy Engine and Visibility (2–3 weeks)**

- Implement `chatPolicyDual.ts`.
- Migrate all reads (including AI context providers) to `chatVisibilityService`.

**Phase 4 — Events, Activity, Notifications, Realtime (2 weeks)**

- Expand `domainEventRegistry` (message edited/deleted, conversation archived, member added/removed).
- Emit only after successful service transactions.
- Reconcile manifest `notifications[]` with runtime types.

**Phase 5 — AI Compliance (1–2 weeks)**

- `ActionExecutor` chat paths → `chatMessageService` / `chatConversationService`.
- Context providers: bounded, auth’d, visibility-filtered.

**Phase 6 — Tests and Documentation (1–2 weeks)**

- Service unit tests (PE deny, trash, notify self-suppression).
- Integration tests for socket + API parity.
- Reference patterns section in module audit.

#### Acceptance Criteria

- Zero Prisma in `chatController.ts`.
- All mutations pass `evaluateChatPolicyDual`.
- Global Trash handler registered and e2e restore tested.
- Domain events for all operations in operation matrix.
- Manifest notifications + entities complete.
- Module certification checklist (`moduleSpecs.md`) passes with File Hub parity review.

#### Deferred Work

- Advanced search indexing for message content (platform search batch).
- E2E encryption / compliance modes.
- Third-party chat bridges.

---

### 5.2 Calendar (Priority 2)

#### Phase 0 — Audit (2026-05-31) — Complete

- [CALENDAR_CONSTITUTIONAL_AUDIT.md](../architecture/audits/CALENDAR_CONSTITUTIONAL_AUDIT.md)
- [CALENDAR_OPERATION_MATRIX.md](../architecture/audits/CALENDAR_OPERATION_MATRIX.md)
- **Level 0 — Legacy**; **Reference Module #3 candidate** post–Wave 1
- **No code changes** in Phase 0

#### Current State

- Large `calendarController.ts` (~1,713 lines) with inline Prisma.
- Domain event: `calendar.event.created` only.
- Manifest: vlink, trash, notifications declared; no notification metadata array.
- Place integration test exists for meeting/calendar link.
- Scheduler-related reminders likely fragmented across controller/cron.

#### Constitutional Gaps

- §16, §4, §7, §8, §22 (scheduler), §5 V_Link invite/attendee semantics.

#### File Hub Pattern Gaps

- No `calendarVisibilityService`, `calendarDeleteService`, `calendarNotificationService`.
- No PE dual; no trash handler registration.

#### Risks

- **High:** Scheduling conflicts and permission leaks on shared calendars.
- **Medium:** V_Link event types promised but resolver incomplete.

#### Required Corrections

- Canonical services for event CRUD, attendees, visibility.
- PE on create/update/delete/share.
- Scheduler jobs for reminders via job registry calling services.
- V_Link lifecycle on event delete.

#### Modernization Phases

1. **Audit** — controllers, routes, reminders, external provider hooks, manifest.
2. **Canonical services** — `calendarEventService`, `calendarAttendeeService`, `calendarVisibilityService`, `calendarNotificationService`, `calendarActivityService`.
3. **Visibility services** — owned + shared + business calendars.
4. **Policy Engine** — `calendarPolicyDual`.
5. **Notifications** — manifest + adapter; invite/update/cancel types.
6. **Scheduler integration** — register reminder jobs; no direct Prisma in crons.
7. **Trash lifecycle** — Global Trash handler for events.
8. **AI compliance** — reads via visibility; writes via services.
9. **Tests + docs** — operation matrix; domain event coverage.

#### Acceptance Criteria

- Thin controller; PE on all writes; trash handler; V_Link compliant deletes; reminder jobs in registry inventory.

#### Deferred Work

- **Advanced provider sync** (Google/Outlook bi-directional).
- **Booking/resources** (rooms, equipment pools).

---

### 5.3 Todo / Tasks (Priority 3)

#### Current State

- `todoController.ts` ~4,401 lines — largest drift hotspot.
- Ancillary services: recurrence, smart scheduling, AI prioritization, chat integration.
- `toolExecutor.ts` direct `prisma.task.create` — constitutional violation.
- Manifest lacks `notifications`, `vlink`, `realtime` truth alignment.
- Executor accepts both `tasks` and `todo` module ids.

#### Constitutional Gaps

- §16 extreme violation; §6 AI; §8 events; §5 V_Link for task links; assignment permissions (§4).

#### File Hub Pattern Gaps

- Entire service layer missing for core CRUD.
- No delete/trash service; no visibility service for assigned/shared tasks.

#### Risks

- **Critical:** AI and API paths can create tasks without PE or activity.
- **High:** Assignment permission bugs across business/household contexts.

#### Required Corrections

- Decompose controller into `todoTaskService`, `todoAssignmentService`, `todoVisibilityService`, `todoDeleteService`, `todoNotificationService`, `todoActivityService`.
- Reminders via scheduler registry.
- V_Link integration for task entities.
- Fix AI executor to call services only; standardize module id `todo`.

#### Modernization Phases

1. Audit + operation matrix.
2. Canonical services (batch extractions from controller).
3. Assignment permissions + `todoPolicyDual`.
4. Reminders → scheduler registry.
5. V_Link + entity registration.
6. Notifications + manifest metadata.
7. AI compliance (remove `toolExecutor` Prisma).
8. Trash handler + Global Trash.
9. Tests + docs.

#### Acceptance Criteria

- Controller <200 lines per resource area or split routers; no direct Prisma in AI paths; assignment PE tests green.

#### Deferred Work

- Gantt/critical-path views.
- External project management sync.

---

### 5.4 Notes (Priority 4)

#### Current State

- `notesController.ts` ~429 lines; uses `trashedAt` (aligned with Global Trash field).
- Share/folder subcontrollers separated modestly.
- No Global Trash handler; no `notesPolicyDual`.
- Manifest claims trash + notifications without full metadata.

#### Constitutional Gaps

- §7 handler missing; §16 services; §5 V_Link; §8 events.

#### File Hub Pattern Gaps

- No `notesDeleteService`, `notesVisibilityService`, `notesNotificationService`.

#### Risks

- **Medium:** Shared note leakage without visibility service.
- **Medium:** Inconsistent trash UX vs File Hub.

#### Modernization Phases

1. Audit (folder/share/trash paths).
2. Canonical services layer.
3. Global Trash handler registration.
4. Visibility + `notesPolicyDual`.
5. V_Link + entity registration.
6. Events + activity + notifications.
7. AI compliance.
8. Tests + docs.

#### Acceptance Criteria

- Notes trash flows through Global Trash API end-to-end; PE on share/write/delete.

#### Deferred Work

- Rich collaborative editing (OT/CRDT).
- Version history beyond activity feed.

---

### 5.5 Place (Priority 5)

#### Current State

- Multiple controllers: listing, community, discovery, meeting, transaction, analytics, AI.
- Minimal manifest (no trash/vlink/notifications declared).
- Business workspace case exists in `BusinessWorkspaceContent.tsx`.

#### Constitutional Gaps

- §16 boundaries; capability truthfulness; §5 V_Link for listings/meetings.

#### File Hub Pattern Gaps

- No unified delete/visibility/notification services.

#### Modernization Phases

1. Service boundary validation audit.
2. V_Link validation for meeting/listing entities.
3. Notification validation (if product-required).
4. AI provider validation.
5. Capability/manifest reconciliation.
6. PE + visibility for public/private listing reads.

#### Acceptance Criteria

- Manifest matches runtime; AI reads bounded; no unauthorized cross-tenant listing access.

#### Deferred Work

- **Marketplace expansion**
- **Transaction systems** (`placeTransactionController` remains isolated until product priority)

---

### 5.6 Dashboard (Platform hub)

#### Current State

- Dual registry: `coreModuleRegistry` + `widgetRegistry` (§0.3 transitional).
- Widget trash and AI surfaces exist; weak module activity.

#### Focus (not redesign)

- Widget contracts and capability declarations.
- Module API stability for widget providers.
- Realtime validation where widgets claim live updates.
- Notification integration for widget-triggered events.

#### Modernization Phases

1. Widget contract audit vs §19.
2. Registry consolidation plan (single lookup path).
3. Realtime subscription validation.
4. Notification metadata for widget events.
5. Tests for install/uninstall + widget lifecycle.

#### Acceptance Criteria

- One authoritative capability resolution path; widgets cannot bypass module services for mutations.

#### Deferred Work

- **Dashboard redesign** (visual/IA overhaul).

---

### 5.7 Analytics (Cautious track)

#### Current State

- Pseudo-module; derives from activity/events/storage; domain event subscribers partly stubbed.

#### Focus

- Source validation (activity vs analytics separation per `moduleSpecs.md`).
- Permission enforcement on analytics APIs.
- Canonical read paths through services.

#### Modernization Phases

1. Data source inventory.
2. PE-read gating.
3. Subscriber activation behind real event coverage.
4. Documentation of metric definitions.

#### Acceptance Criteria

- No storage of partner-only analytics in module activity log; reads tenant-scoped.

#### Deferred Work

- **Advanced AI analytics** (predictive, autonomous insights).

---

### 5.8 Business Workspace

#### Current State

- Switch-based module rendering; several modules use `*ModuleWrapper` / layouts.
- Module install/uninstall emits some domain events.

#### Focus

- Module lifecycle (install, enable, disable) via PE.
- Permission snapshots for workspace runtime.
- Workspace synchronization with manifest capabilities.
- Capability visibility in branded dashboard.

#### Modernization Phases

1. Lifecycle audit (`moduleProvisionController`, `registerBuiltInModules`).
2. PE for install/uninstall (extend existing tests).
3. Capability visibility UI vs manifest reconcile.
4. Hub pattern standardization doc.

#### Acceptance Criteria

- Every built-in product module renders in business context when enabled; capabilities shown match manifest.

#### Deferred Work

- **Org chart expansion** (HR domain — separate from workspace shell).

---

## Section 6 — Platform System Modernization

### 6.1 Global Trash Expansion

| | |
|-|-|
| **Current State** | Canonical `trashController`; only **drive** handler in `registerGlobalTrashHandlers.ts`. |
| **Constitutional Requirements** | §7 — modules register handlers; `trashedAt` universal; module views are filters. |
| **File Hub Patterns** | `driveDeleteService` + handler registration template (FH Part 9). |
| **Gaps** | chat, calendar, todo, notes declare `trash: true` without handlers. |
| **Phases** | (1) Handler interface checklist per module (2) Register chat → calendar → todo → notes (3) Retire module-local trash APIs (4) Empty-trash and permanent-delete parity tests |
| **Acceptance Criteria** | All modules with `trash: true` have working handlers; deprecated module trash routes removed per module audit. |

### 6.2 Notifications Consolidation

| | |
|-|-|
| **Current State** | `NotificationService` canonical; drive has full manifest metadata; chat types exist in UI but manifest incomplete. |
| **Constitutional Requirements** | Centralized creation; `[module]_[event]` types; manifest discovery. |
| **File Hub Patterns** | `driveNotificationService` — collaborator collection, safe payloads, no self-notify. |
| **Gaps** | Manifest drift; grouping service may not cover all module types; domain event subscriber stubs. |
| **Phases** | (1) Type inventory (2) Manifest reconciliation on startup (3) Per-module `*NotificationService` (4) Enable domain-event-driven notifications where appropriate (5) Update `notifications/page.tsx` + client metadata |
| **Acceptance Criteria** | Every notification type used in code appears in manifest with metadata; module adapters own payload shaping. |

### 6.3 Vssyl_Link Expansion

| | |
|-|-|
| **Current State** | `vlinkService` canonical; drive resolvers complete; enum wider than resolver coverage. |
| **Constitutional Requirements** | §5 — membership ≠ access; lifecycle on trash/delete. |
| **File Hub Patterns** | `driveVlinkAccessService`, `driveVlinkLifecycleService`. |
| **Gaps** | Chat, calendar, todo, notes entities not registered; restricted fallback over-promised types. |
| **Phases** | (1) Entity registration per module (2) Access adapters (3) Lifecycle hooks on delete/trash (4) UI indicator parity (enterprise optional) |
| **Acceptance Criteria** | No `vlink: true` capability without working resolver; hard-delete unlinks automated. |

### 6.4 Platform Scheduler

| | |
|-|-|
| **Current State** | Fragmented crons per §0.3; `cleanupService` trash job partially canonical for drive. |
| **Constitutional Requirements** | §22 — registry inventory; jobs call services only. |
| **File Hub Patterns** | Trash cleanup via canonical delete service (target end state). |
| **Gaps** | Direct Prisma in jobs; duplicate scheduling risk. |
| **Phases** | (1) Job inventory doc (2) Classify P0/P1 jobs (3) Route trash/reminder jobs through services (4) Register in Platform Job Registry — **no runtime rewrite** |
| **Acceptance Criteria** | New jobs added only via registry; zero new `setInterval` in module code. |

### 6.5 AI Tools / Actions Compliance

| | |
|-|-|
| **Current State** | Twin/orchestrator canonical; `toolExecutor` and `ActionExecutor` violate §16. |
| **Constitutional Requirements** | §6 — governed actions through services + PE. |
| **File Hub Patterns** | `driveUploadService`, `driveVisibilityService`, `share_file` → share service. |
| **Gaps** | Direct task/file mutations; fat executor map. |
| **Phases** | (1) Violation inventory (2) Per-module service routing (3) Executor slim-down to dispatcher (4) Contract tests mirroring `toolExecutor.shareFile.test.ts` pattern |
| **Acceptance Criteria** | No new direct Prisma writes in `server/src/ai/**`; existing paths migrated per module wave. |

### 6.6 Platform Entity Registration

| | |
|-|-|
| **Current State** | `platformEntityRegistry.ts` with drive entities; sparse elsewhere. |
| **Constitutional Requirements** | §21 — descriptors + manifest `entities[]` + V_Link types aligned. |
| **File Hub Patterns** | Manifest `entities[]` block for file/folder. |
| **Gaps** | Capability claims precede resolver registration. |
| **Phases** | (1) Entity descriptor template (2) Register per module as services stabilize (3) Reconcile startup manifest upsert |
| **Acceptance Criteria** | `resolveEntityAccess` works for every declared linkable type. |

### 6.7 Manifest and Capability Governance

| | |
|-|-|
| **Current State** | `builtInModuleManifests.ts` + `registerBuiltInModulesOnStartup`; drift vs `coreModuleRegistry`. |
| **Constitutional Requirements** | §19, §30 additive migration. |
| **File Hub Patterns** | Full manifest with capabilities, entities, notifications, routes. |
| **Gaps** | todo/place/chat/calendar incomplete blocks; `place` registry gap. |
| **Phases** | (1) `resolveModuleCapabilities()` helper (2) Startup reconcile tests (3) CI drift check comparing manifest to registry (4) Deprecate seed scripts |
| **Acceptance Criteria** | Fresh deploy manifests match File Hub completeness standard for each built-in. |

---

## Section 7 — Priority Matrix

| Rank | Item | User Impact | Platform Risk | Arch. Drift | AI Exposure | Realtime Exposure | Delete Complexity | Dependency Risk | Recommended Priority |
|------|------|-------------|---------------|-------------|-------------|-------------------|-------------------|-----------------|------------------------|
| 1 | **Chat** | High | High | Critical | High | **Critical** | Medium | Medium | **P0** |
| 2 | **Calendar** | High | High | Critical | Medium | Medium | Medium | Medium | **P0** |
| 3 | **Tasks (todo)** | High | **Critical** | **Critical** | High | Low | Medium | High (AI toolExecutor) | **P0** |
| 4 | **Notes** | Medium | Medium | High | Medium | Low | Low | Low | **P1** |
| 5 | **Global Trash Expansion** | High | High | High | Low | Low | **Critical** | Low (blocks trash UX) | **P0** (parallel) |
| 6 | **Notifications** | High | Medium | Medium | Low | Medium | Low | Medium | **P1** (continuous) |
| 7 | **V_Link** | Medium | High | Medium | Medium | Low | Medium | High (calendar/chat) | **P1** |
| 8 | **AI Tools / Actions** | Medium | **Critical** | High | **Critical** | Low | Low | Blocks module waves | **P0** (parallel) |
| 9 | **Place** | Medium | Medium | High | Medium | Low | Low | Medium | **P2** |
| 10 | **Business Workspace** | High | Medium | Medium | Low | Low | Low | Medium | **P2** |
| 11 | **Dashboard** | Medium | Medium | Medium | Medium | Medium | Low | High (widgets) | **P2** |
| 12 | **Analytics** | Low | Medium | Medium | Medium | Low | N/A | High (data deps) | **P3** |
| 13 | **Scheduler** | Medium | Medium | Medium | Low | Low | Medium | Medium | **P2** (inventory first) |
| 14 | **Manifests / Capability Governance** | Medium | High | High | Low | Low | Low | **Critical** (enables cert) | **P0** (continuous) |

**Adjustment note:** Repository evidence elevates **Global Trash**, **AI Tools/Actions**, and **Manifest governance** to run **in parallel** with Chat (not strictly sequential) because Chat Phase 2–4 depend on handler and manifest truthfulness.

---

## Section 8 — Certification Requirements

A module is **modernized and certified** at **Level 3** only when it satisfies the **Level 3 certification gate** in [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md) (15 criteria: canonical services, thin controllers, Policy Engine, Global Trash, V_Link when declared, platform entities, domain events, module activity, notifications, realtime, AI compliance, capability truthfulness, tests, documentation, legacy retirement).

**Authoritative checklist:** Do not duplicate criteria here — update the ledger when requirements change.

**Reference Implementation (Level 4):** File Hub (FH-6) — 9 YES, 3 PARTIAL, 0 NO. Acceptable PARTIAL only for platform-wide migrations (activity read paths, optional workspace landing), not for missing handlers or fat controllers.

### Modernization acceptance (recurring)

After **each completed modernization phase** for any module:

1. Update **certification level** and compliance columns in [`CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).
2. Update **wave progress tracking** (not started → audit → service extraction → compliance → certification).
3. Link new audit docs (`{MODULE}_CONSTITUTIONAL_AUDIT.md`, `{MODULE}_OPERATION_MATRIX.md`) in the ledger evidence column.

---

## Section 9 — Deferred Work

Explicitly **out of scope** for this roadmap wave (do not block certification):

| Area | Deferred item | Reason |
|------|---------------|--------|
| Calendar | Provider sync expansion | External API scope |
| Calendar | Booking/resources | Product feature |
| Place | Marketplace expansion | Business model |
| Place | Transaction systems | Financial/compliance scope |
| Dashboard | Visual redesign | UX program separate |
| Analytics | Advanced AI analytics | Depends on event coverage |
| AI | Autonomous write systems | Constitutional Tier 4 non-canonical |
| Platform | Scheduler infrastructure rewrite | §22 inventory-first policy |
| Platform | Major workflow engine replacement | `WorkflowAutomationService` non-canonical |
| File Hub | `DriveWorkspaceLanding.tsx` | P3 UX polish |
| File Hub | Legacy activity read migration | Platform-wide batch |
| HR / Scheduling | Full modernization | Not in product module list for this wave |

---

## Section 10 — Now / Next / Later

### Now

- **Chat modernization** — Phase 0 audit + Phase 1 service extraction (Priority 1).
- **Parallel platform tracks:** Manifest/capability reconciliation (A2), AI tool routing inventory (A9), Global Trash handler template for next module (A10 prep).

### Next

- **Calendar** → **Tasks** → **Notes** (sequential module waves after Chat Phase 1 foundation).
- **Global Trash Expansion** — register handlers as each module completes delete services.
- **Notifications consolidation** — manifest metadata aligned per completed module.

### Later

- **Place** → **Business Workspace** shell hardening → **Dashboard** hub → **Analytics** cautious pass.

### Continuous

- **Notifications** — type registry and manifest reconcile on every module merge.
- **Trash** — handler registration gate for certification.
- **Scheduler** — job inventory and service-routing migration (no rewrite).
- **V_Link** — resolver registration ahead of capability claims.
- **AI compliance** — executor/tool migration per module.
- **Capability governance** — startup reconcile + CI drift detection.

---

## Appendix A — File Hub patterns to clone (quick reference)

| Pattern | Source file |
|---------|-------------|
| Delete/trash | `server/src/services/driveDeleteService.ts` |
| Share | `server/src/services/driveFileShareService.ts` |
| Visibility | `server/src/services/driveVisibilityService.ts` |
| Upload/write | `server/src/services/driveUploadService.ts` |
| Notifications | `server/src/services/driveNotificationService.ts` |
| V_Link access | `server/src/services/driveVlinkAccessService.ts` |
| V_Link lifecycle | `server/src/services/driveVlinkLifecycleService.ts` |
| Realtime | `server/src/services/driveRealtimeService.ts` |
| PE dual | `server/src/auth/drivePolicyDual.ts` |
| Trash registration | `server/src/startup/registerGlobalTrashHandlers.ts` |
| Manifest | `server/src/startup/builtInModuleManifests.ts` case `drive` |

**Pattern guide:** [`docs/guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md). **Certification ledger:** [`docs/architecture/CERTIFICATION_LEDGER.md`](../architecture/CERTIFICATION_LEDGER.md).

---

## Appendix B — Document maintenance

| Trigger | Action |
|---------|--------|
| Module certified | Update scorecard row to 🟢; link audit doc |
| Platform Standards version bump | Reconcile Section 3 tracks |
| File Hub post-reference changes | Update Appendix A |
| Quarterly | Refresh §0 inventory alignment per Platform Standards §0 intro |

---

*End of roadmap.*
