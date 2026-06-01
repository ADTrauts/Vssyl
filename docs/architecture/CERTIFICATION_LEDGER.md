# Platform Module Certification Ledger

**Version:** 1.0.0  
**Last updated:** 2026-05-31  
**Status:** Active — executive dashboard for platform architecture health  
**Owner:** Platform Engineering / Architecture Governance

**Related:**

- Constitutional authority: [`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)
- Implementation authority: File Hub audits under [`audits/`](./audits/) (reference: [`FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md))
- Execution roadmap: [`../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md)
- Pattern catalog: [`../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)

---

## Introduction — Dual-authority certification model

Vssyl certifies modules against **two authorities simultaneously**. A module is not “compliant” if it satisfies only one.

### Constitutional Authority

[`VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) defines what the **Runtime Kernel** and every module **must** do:

| Domain | Constitutional sections |
|--------|-------------------------|
| Runtime Kernel | §2 — modules extend, never replace |
| Module Contract | §3 — `authorize → execute → emit → notify/realtime` |
| Policy Engine | §4 — privileged mutations gated |
| V_Link | §5 — relationships ≠ permissions |
| AI Governance | §6 — governed actions via canonical services |
| Global Trash | §7 — `trashedAt` + platform trash API |
| Domain Events | §8 — taxonomy + service emission |
| Canonical service boundaries | §16 — no Prisma in controllers/AI |
| Capability Matrix | §19 — truthful manifest declarations |
| Platform Entity Model | §21 — descriptors + resolvers |
| Platform Job Scheduler | §22 — jobs call services |
| Migration & inventory | §0, §30 |

### Implementation Authority

**File Hub** (module id: `drive`, product name File Hub) is the first **Reference Implementation**. It defines **proven patterns**:

- Canonical service structure (`drive*Service.ts`)
- Thin controllers (FH-6)
- Delete lifecycle (`driveDeleteService`)
- Visibility lifecycle (`driveVisibilityService`)
- Notification lifecycle (`driveNotificationService`)
- V_Link access and lifecycle (`driveVlinkAccessService`, `driveVlinkLifecycleService`)
- AI compliance (visibility reads, upload service writes)
- Global Trash handler registration
- Manifest completeness (`builtInModuleManifests.ts` case `drive`)

**Certification rule:** A module reaches **Level 3 (Certified)** only when constitutional requirements are met **and** File Hub patterns are applied (or documented equivalent with approval). **Level 4** is reserved for modules explicitly designated as reference models for future work.

---

## Certification levels

| Level | Name | Summary | Typical indicators |
|-------|------|---------|-------------------|
| **0** | Legacy | Major constitutional violations | Direct Prisma in controllers; no service layer; no Policy Engine; events/notifications ad hoc in HTTP handlers |
| **1** | Stabilizing | Partial constitutional compliance; major drift | Some kernel integration (e.g. realtime or notifications) but fat controllers, missing trash handlers, manifest lies |
| **2** | Modernized | Core constitutional requirements met | Canonical services for primary mutations; PE on writes; Global Trash field/handler; gaps are platform-wide deps (activity read migration, scheduler registry) |
| **3** | Certified | Constitutionally compliant + File Hub patterns | Thin controllers; service-owned side effects; manifest + tests + module audit doc; legacy paths retired or sunset |
| **4** | Reference Implementation | Certified and approved as platform model | Full operation matrix; extraction patterns in pattern guide; FH-level review sign-off |

**Promotion policy:**

- Level increases require evidence links (audit doc, test run, PR).
- Level **cannot** skip more than one step without Architecture sign-off.
- **Level 4** requires Platform Standards Appendix D / architecture council approval (currently: File Hub only).

---

## Certification matrix

**Scoring key (compliance columns):**

- **High** — Meets constitutional or File Hub standard for this module class
- **Partial** — Implemented with known gaps (documented)
- **Low** — Missing or violates standard
- **N/A** — Not applicable to module type (e.g. Analytics trash)

**Evidence baseline:** [`PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) Section 4 (2026-05-31 repository review).

| Module | Module id | Constitutional Compliance | File Hub Compliance | Certification Level | Status | Evidence |
|--------|-----------|---------------------------|---------------------|---------------------|--------|----------|
| **File Hub** | `drive` | **High** | **High** | **4 — Reference Implementation** | Certified | [FH Reference Review](./audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md), [Maturity Assessment](./audits/FILE_HUB_MATURITY_ASSESSMENT.md) |
| **Chat** | `chat` | **High** | **High** | **3 — Certified** | **Reference Module #2** (Level 3) | [CHAT_LEVEL3_CERTIFICATION_REVIEW](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md), [CHAT_OPERATION_MATRIX](./audits/CHAT_OPERATION_MATRIX.md) |
| **Calendar** | `calendar` | **Low** | **Low** | **0 — Legacy** | Wave 1 Phase 1E (2026-06-01) | Thin controller; `calendarIcsService`; AI executor still in controller |
| **Todo** | `todo` | **Low** | **Low** | **0 — Legacy** | Not started (Wave 2) | ~4,401-line controller; AI `toolExecutor` Prisma |
| **Notes** | `notes` | **Low** | **Low** | **1 — Stabilizing** | Not started (Wave 2) | `trashedAt` aligned; no services/handlers |
| **Place** | `place` | **Low** | **Low** | **0 — Legacy** | Not started (Wave 3) | Multi-controller; minimal manifest |
| **Dashboard** | `dashboard` | **Partial** | **Partial** | **1 — Stabilizing** | Not started (Wave 3) | Dual widget registry; weak activity |
| **Analytics** | `analytics` | **Partial** | **N/A** | **1 — Stabilizing** | Not started (Wave 3) | Pseudo-module; subscriber stubs |
| **Business Workspace** | *(composition)* | **Partial** | **Partial** | **1 — Stabilizing** | Not started (Wave 3) | Switch rendering; lifecycle partial |

### Platform systems (non-module rows)

Track cross-cutting certification separately; modules depend on these.

| System | Constitutional Compliance | File Hub Compliance | Level | Status |
|--------|---------------------------|---------------------|-------|--------|
| Global Trash API | High | High (drive + chat handlers) | 2 | Expansion in progress — calendar/todo/notes handlers pending |
| NotificationService | High | High (drive adapter) | 2 | Consolidation — manifest metadata gaps per module |
| V_Link | High | High (drive + chat conversation) | 2 | Expansion — enum wider than resolver coverage |
| Policy Engine | Partial | High (drive + chat dual) | 2 | Rollout — remaining modules need `*PolicyDual` |
| Domain Event Bus | Partial | High (drive taxonomy) | 1 | Taxonomy thin beyond drive |
| Module Activity | Partial | High (drive writes) | 1 | Legacy read paths platform-wide |
| AI Tools / Actions | Low | Partial (drive tools compliant) | 0 | `toolExecutor` / `ActionExecutor` violations |
| Platform Scheduler | Partial | Partial | 1 | Inventory-first per §22 |
| Manifest / Capability governance | Partial | High (drive manifest) | 1 | Reconcile-on-startup incomplete for all built-ins |

---

## Certification requirements (Level 3 gate)

A module **cannot** be promoted to **Level 3 — Certified** unless **all** criteria below are true. Use as PR merge gate and quarterly audit checklist.

| # | Requirement | Constitutional | File Hub pattern |
|---|-------------|----------------|------------------|
| 1 | **Canonical service boundaries** — mutations and side effects in named services | §16 | Pattern 1 |
| 2 | **Thin controllers** — HTTP parse, auth extract, call service, map response only | §16 | Pattern 2 |
| 3 | **Policy Engine** — `authorize()` or `*PolicyDual` before privileged persistence | §4 | Pattern 10 |
| 4 | **Global Trash** — `trashedAt`; handler registered if `trash: true` | §7 | Pattern 5 |
| 5 | **V_Link participation** — access + lifecycle when `vlink: true` | §5 | Pattern 11 |
| 6 | **Platform Entity registration** — descriptor + manifest `entities[]` | §21 | Pattern 13 |
| 7 | **Domain Events** — registered types; emitted from services on success only | §8 | Pattern 7 |
| 8 | **Module Activity** — `emitModuleActivityEvent` on successful writes | §3, `moduleSpecs.md` | Pattern 8 |
| 9 | **Notifications** — `*NotificationService` + manifest `notifications[]` | §3 | Pattern 6 |
| 10 | **Realtime compliance** — matches `realtime: true`; adapter layer, not fat sockets | §3 | Pattern 9 |
| 11 | **AI compliance** — reads/writes via canonical services only | §6 | Pattern 12 |
| 12 | **Capability truthfulness** — manifest, registry, runtime aligned | §19 | Pattern 14 |
| 13 | **Tests** — PE deny, trash, visibility/share where applicable | §12 | Module certification pattern |
| 14 | **Documentation** — constitutional audit + operation matrix (or gap list) | §13 | Linked in ledger |
| 15 | **Legacy path retirement** — deprecated routes/scripts removed or sunset documented | §0, §30 | Pattern 15 |

**Level 4 additional requirements:**

- Reference Implementation review document (File Hub template)
- Patterns contributed to or validated against [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md)
- No P0 architectural blockers in maturity assessment

**Acceptable PARTIAL at Level 3 (with documented platform ticket):**

- Platform-wide activity **read** migration (File Hub P2 ACT-R1)
- Optional workspace landing hub (File Hub P3 WS-R1)
- Scheduler registry migration when job exists but not yet in registry

**Not acceptable at Level 3:**

- Direct Prisma in controllers or AI for module mutations
- `trash: true` without Global Trash handler
- Missing PE on destructive mutations

---

## Per-module requirement checklist (living)

Copy row into module audit; mark ✅ / ⚠️ / ❌.

| Requirement | File Hub | Chat | Calendar | Todo | Notes | Place | Dashboard | Analytics | Bus. Workspace |
|-------------|----------|------|----------|------|-------|-------|-----------|-----------|----------------|
| Canonical services | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Thin controllers | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ | ⚠️ | ⚠️ | N/A |
| Policy Engine | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Global Trash handler | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | N/A | ⚠️ |
| V_Link (if declared) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | N/A | ⚠️ |
| Platform entities | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Domain events | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Module activity writes | ✅ | ✅ | ❌ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ |
| Notifications | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ | ❌ | N/A | ⚠️ |
| Realtime | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | N/A | ⚠️ |
| AI compliance | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Capability truth | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Tests | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Documentation | ✅ | ✅ | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Legacy retired | ⚠️ | ✅ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |

---

## Wave tracking

Waves align with [`PLATFORM_MODULE_MODERNIZATION_ROADMAP.md`](../plans/PLATFORM_MODULE_MODERNIZATION_ROADMAP.md) Section 10.

**Phase legend per module:**

| Phase | Meaning |
|-------|---------|
| **not started** | No modernization branch / audit |
| **audit** | Constitutional + File Hub gap audit in progress |
| **service extraction** | Canonical services; thin controller migration |
| **compliance** | PE, trash, events, notifications, realtime, AI, manifest |
| **certification** | Level 3 checklist complete; ledger updated |

### Wave 1 — Chat

| Module | not started | audit | service extraction | compliance | certification | Target level |
|--------|-------------|-------|-------------------|------------|---------------|--------------|
| Chat | ○ | ○ | ○ | ○ | ○ | **3 — Certified** |

**Entry criteria:** Ledger v1.0 published; [`MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md`](../guides/MODULE_REFERENCE_PATTERNS_FROM_FILE_HUB.md) available.  
**Exit criteria:** Level 3 row in certification matrix; `CHAT_*` audit linked below.

| Deliverable | Path (when complete) |
|-------------|----------------------|
| Constitutional audit | [`audits/CHAT_CONSTITUTIONAL_AUDIT.md`](./audits/CHAT_CONSTITUTIONAL_AUDIT.md) ✅ |
| Operation matrix | [`audits/CHAT_OPERATION_MATRIX.md`](./audits/CHAT_OPERATION_MATRIX.md) ✅ |
| Service extraction (Phase 1) | `chat*Service` layer + thin controller + `chatAIActionService` ✅ |
| Global Trash (Phase 2) | [`CHAT_GLOBAL_TRASH_PHASE2.md`](./audits/CHAT_GLOBAL_TRASH_PHASE2.md) ✅ |
| Compliance layer (Phase 3) | Policy Dual (mutations + trash), domain events (service-owned), manifest `notifications[]`, `chatVlinkLifecycleService` ✅ |
| Platform entities (Phase 4) | `registerChatPlatformEntities`, manifest `entities[]` (conversation), `chatVlinkAccessService`, truthful `vlink: true` ✅ |
| Level 3 certification (Phase 5) | [CHAT_LEVEL3_CERTIFICATION_REVIEW.md](./audits/CHAT_LEVEL3_CERTIFICATION_REVIEW.md) — **Certified**; **Reference Module #2** |
| Reference architecture | [CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md](./CHAT_REFERENCE_IMPLEMENTATION_REVIEW.md) ✅ |

**Post–Level 3 punch-list (non-blocking):** thread domain event; message `trashedAt` migration; `ChatWorkspaceLanding.tsx`; Level 4 council review.

### Wave 2 — Calendar, Todo, Notes

| Module | not started | audit | service extraction | compliance | certification | Target level |
|--------|-------------|-------|-------------------|------------|---------------|--------------|
| Calendar | ○ | **●** | ○ | ○ | ○ | 3 |
| Todo | **●** | ○ | ○ | ○ | ○ | 3 |
| Notes | **●** | ○ | ○ | ○ | ○ | 3 |

**Calendar Phase 0 (2026-05-31):** [CALENDAR_CONSTITUTIONAL_AUDIT](./audits/CALENDAR_CONSTITUTIONAL_AUDIT.md), [CALENDAR_OPERATION_MATRIX](./audits/CALENDAR_OPERATION_MATRIX.md).

**Calendar Phase 1A–1B (2026-06-01):** Core write services extracted.

**Calendar Phase 1C (2026-06-01):** `calendarVisibilityService`, `calendarPolicyDual`, read paths migrated.

**Calendar Phase 1D (2026-06-01):** Side-effect adapters + reminder/scheduler services.

**Calendar Phase 1E (2026-06-01):** `calendarIcsService`; `calendarController` has no Prisma or direct side effects.

**Sequencing note:** Phase 1F (AI executor migration) is next; Todo follows Calendar Wave 1 to reuse PE/trash/scheduler patterns.

### Wave 3 — Place, Business Workspace, Dashboard, Analytics

| Module | not started | audit | service extraction | compliance | certification | Target level |
|--------|-------------|-------|-------------------|------------|---------------|--------------|
| Place | **●** | ○ | ○ | ○ | ○ | 2→3 |
| Business Workspace | **●** | ○ | ○ | ○ | ○ | 2 |
| Dashboard | **●** | ○ | ○ | ○ | ○ | 2 |
| Analytics | **●** | ○ | ○ | ○ | ○ | 2 |

**Place** may certify at Level 2 first (validation track) before full Level 3 if product scope excludes trash/V_Link.

### Continuous platform tracks (all waves)

| Track | Owner phase | Status |
|-------|-------------|--------|
| Global Trash handler expansion | compliance | not started |
| Manifest / capability reconcile | compliance | not started |
| AI tool/executor service routing | compliance | not started |
| Notification metadata consolidation | compliance | not started |
| V_Link resolver expansion | compliance | not started |
| Scheduler job inventory (§22) | audit | not started |

---

## Ledger maintenance

| Event | Action |
|-------|--------|
| Module phase complete | Update wave tracking ● → ○ |
| PR merges certification work | Update matrix + checklist row |
| New built-in module | Add matrix row at Level 0 |
| Platform Standards version bump | Re-audit constitutional column |
| Quarterly review | Refresh evidence links; reconcile with §0 inventory |

**Certification sign-off roles (recommended):**

1. **Engineering lead** — tests + service boundaries  
2. **Architecture governance** — constitutional + File Hub parity  
3. **Product owner** — capability truth UX-facing claims  

---

## History

| Date | Change |
|------|--------|
| 2026-05-31 | Ledger v1.0 — initial population from modernization roadmap + File Hub FH-6 certification |

---

*This ledger is the executive dashboard for platform architecture health. Implementation detail lives in the modernization roadmap and File Hub pattern guide.*
