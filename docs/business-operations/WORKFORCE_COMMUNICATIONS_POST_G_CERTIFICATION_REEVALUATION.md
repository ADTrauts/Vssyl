# Workforce Communications Post-Phase-G Certification Re-Evaluation

**Program:** Business Operations — Workforce Communications  
**Re-evaluation date:** 2026-06-14  
**Module id:** `workforce_comms`  
**Prior outcome:** LEVEL 3 CERTIFIED WITH FINDINGS (F-WC-001..005 open)  
**Implementation scope:** Phases A–G complete  
**Scope:** Re-evaluation only — no code, schema, or ledger changes

**Authorities:**

- [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](../architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md)
- [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md)
- [WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md](./WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md)
- [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md)
- [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md)

**Benchmarks:** File Hub (`drive`), Chat (`chat`), HR (`hr`), Scheduling (`scheduling`)

**Note on prior artifacts:** `WORKFORCE_COMMUNICATIONS_CERTIFICATION_EVALUATION.md`, `WORKFORCE_COMMUNICATIONS_CERTIFICATION_AUDIT.md`, `WORKFORCE_COMMUNICATIONS_FINDINGS_REGISTER.md`, and `WORKFORCE_COMMUNICATIONS_PHASE_G_READINESS.md` were referenced in the pre-Phase-G program but were not persisted to the repository. This re-evaluation supersedes that chat-only evaluation using current repository evidence.

---

## Executive summary

Post-Phase-G re-evaluation confirms that all five **prior major findings** (F-WC-001 through F-WC-005) are **verified closed** with repository evidence. Workforce Communications meets the **Level 3 constitutional bar** across canonical services, thin controllers, Policy Engine route coverage, platform integrations (activity, notifications, domain events, V-Link, Global Trash), manifest truthfulness, reporting, optional cross-module bridges, hub UI, and front-page cutover.

Residual gaps are **non-blocking advisory findings** (deferred `workforce_ack_reminder`, server notification grouping parity, taxonomy-only attachment activity, HR policy/announcement bridge wiring deferred by design). No certification blockers were identified.

**Re-evaluation outcome:** **PASS WITH FINDINGS** (advisory only)  
**Certification recommendation:** **LEVEL 3 CERTIFIED** (upgrade from prior WITH FINDINGS status tied to F-WC-001..005)

---

## Primary questions

### 1. Are F-WC-001 through F-WC-005 verified closed?

**Yes — all five verified closed.**

| ID | Finding | Verification | Evidence |
|----|---------|--------------|----------|
| **F-WC-001** | AI registration missing | **Closed** | `registerBuiltInModules.ts`: `id: 'workforce_comms'`, `moduleId: 'workforce_comms'`, providers `workforce_comms_overview` + `workforce_comms_reach` with endpoints `/api/workforce-comms/ai/context/overview` and `/reach`. Test: `workforceCommsCertificationClosure.test.ts`. |
| **F-WC-002** | Notification UI discovery mappings | **Closed** | `web/src/app/notifications/page.tsx` `LEGACY_TYPE_MAPPING` includes all four `workforce_*` types → `workforce_comms`; `CATEGORY_ICONS.workforce_comms`; `web/src/api/notifications.ts` exports `WORKFORCE_NOTIFICATION_TYPE_CATEGORIES`. |
| **F-WC-003** | Manifest truthfulness (`planned: true` on live types) | **Closed** | `builtInModuleManifests.ts` case `workforce_comms`: live types omit `planned`; `workforce_ack_reminder` retains `planned: true`. Taxonomy: `workforceCommsNotificationTaxonomy.ts` with `WORKFORCE_COMMS_LIVE_NOTIFICATION_TYPES` (3 live, 1 planned). Tests: `builtInModuleManifests.workforce.test.ts`, `workforceCommsCertificationClosure.test.ts`. |
| **F-WC-004** | Policy Engine on AI routes | **Closed** | `routes/workforceComms.ts`: `/ai/context/overview` → `WORKFORCE_COMMUNICATION_READ`; `/ai/context/reach` → `WORKFORCE_REPORT_READ`. All 32 route handlers include `checkWorkforceCommsPolicy`. Test: `workforce-comms-reporting.integration.test.ts`. |
| **F-WC-005** | Stale operation matrix | **Closed** | `WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` refreshed (Phase G post-implementation); documents module identity, capabilities, API surface, bridge config, findings closure table. Test asserts `workforce_comms` + Phase G present. |

### 2. Are any blocking findings present?

**No.**

No gate failure comparable to pre-remediation Scheduling (fat controllers with Prisma, manifest lies, missing domain events). All Level 3 **not acceptable** items from [CERTIFICATION_LEDGER.md](../architecture/CERTIFICATION_LEDGER.md) §Certification requirements are satisfied or documented as intentional deferrals within blueprint scope.

### 3. Certification outcome and recommendation

| Metric | Result |
|--------|--------|
| Constitutional compliance | **High** |
| File Hub pattern compliance | **High** (greenfield module; no legacy fat-controller debt) |
| Outcome | **PASS WITH FINDINGS** (advisory residuals only) |
| Recommendation | **LEVEL 3 CERTIFIED** |

**Rationale for upgrade:** The prior **WITH FINDINGS** designation was anchored to F-WC-001..005 (major). Those are closed. Residual items are advisory or explicitly deferred in blueprint/out-of-scope (ack reminder job, emergency alerts). This matches the promotion bar used when blockers clear and only advisory debt remains — comparable to Scheduling post-remediation, but with fewer open majors than HR/Scheduling.

**Conservative alternative:** Council may record **LEVEL 3 CERTIFIED WITH FINDINGS** if advisory items F-WC-006..009 must remain on the certificate. See [WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md](./WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md).

### 4. Reference candidate?

**Yes — conditional.** Recommended as **Business Operations broadcast reference** (audience, ack, campaign, reporting pattern). Not platform-wide Level 4. See [WORKFORCE_COMMUNICATIONS_REFERENCE_CANDIDATE_RECOMMENDATION.md](./WORKFORCE_COMMUNICATIONS_REFERENCE_CANDIDATE_RECOMMENDATION.md).

### 5. Architecture Council ratification ready?

**Yes — recommendation package ready.** WC implementation is complete for Phases A–G. Ratification should proceed in the same governance batch as HR and Scheduling per [BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md](./BUSINESS_OPERATIONS_CERTIFICATION_FINALIZATION.md). WC does not require HR/Scheduling findings closure before its own L3 row — implementation gate Tier 4 explicitly allowed Phase G with open HR/SCH findings.

### 6. Ledger update recommended?

**Yes.** See [WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md](./WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md).

---

## Level 3 gate evaluation

| # | Requirement | Status | Evidence |
|---|-------------|--------|----------|
| 1 | Canonical service boundaries | **Pass** | `workforceCommunicationService`, `workforceAudienceService`, `workforceAcknowledgementService`, `workforceReadReceiptService`, `workforceCampaignService`, `workforceReportingService`, `workforceBridgeService`, `workforceTrashService`, `workforceVlink*`, `workforceNotificationService`, `workforceActivityService`, `workforceDomainEventService`, `workforceAiContextService` |
| 2 | Thin controllers | **Pass** | `grep 'prisma\\.' server/src/controllers/workforceComms/` → **0**; AI reads delegate to `workforceAiContextService` |
| 3 | Policy Engine | **Pass** | 8 actions in `policyActions.ts`; `workforceCommsPolicyDual.ts`; **100%** route PE coverage in `workforceComms.ts` |
| 4 | Global Trash | **Pass** | `workforceTrashService`; handler in `registerGlobalTrashHandlers.ts` (`communication`, `campaign`) |
| 5 | V-Link | **Pass** | `workforceVlinkAccessService`, `workforceVlinkLifecycleService`; entities `WORKFORCE_COMMUNICATION`, `WORKFORCE_CAMPAIGN` |
| 6 | Platform entities | **Pass** | `platformEntityRegistry.ts`; manifest `entities[]` |
| 7 | Domain events | **Pass** | 17 `workforce.*` types in `domainEventRegistry.ts` incl. `workforce.bridge.created`; emitters in `domainEventEmitters.ts` |
| 8 | Module activity | **Pass** | `workforceActivityService`; 18 taxonomy actions; publish/ack/bridge emitted on success paths |
| 9 | Notifications | **Pass** | `workforceNotificationService` → `NotificationService`; 3 live manifest types |
| 10 | Realtime | **Pass (N/A)** | Manifest does not declare `realtime`; no socket layer in WC |
| 11 | AI compliance | **Pass** | Thin `workforceCommsAiContextController`; reads in `workforceAiContextService`; registered providers |
| 12 | Capability truthfulness | **Pass** | Manifest matches runtime; live vs planned notifications accurate |
| 13 | Tests | **Pass** | 94 server workforce tests (26 files); 9 web tests; tenant-scope integration test |
| 14 | Documentation | **Pass** | Operation matrix + 11 blueprint docs; this re-evaluation package |
| 15 | Legacy retirement | **Partial (acceptable)** | Front-page inline CRUD removed; legacy `companyAnnouncements` JSON field retained until migration complete — documented in matrix |

---

## Phase A–G capability verification

| Phase | Capability | Verified |
|-------|------------|----------|
| A | Data model (8 entities) | Yes — `prisma/modules/workforce_comms/` |
| B | Core services + publish lifecycle | Yes — communication, audience, ack, read, campaign services |
| C | Routes + Policy Engine | Yes — 32 routes, dual evaluator tests |
| D | Activity + notifications + domain events | Yes — adapters + taxonomy tests |
| E | V-Link + Global Trash | Yes — access/lifecycle/trash tests |
| F | UI + hub + front-page cutover | Yes — `BusinessWorkspaceContent`, `AnnouncementsWidget`, hub tests |
| G | Reporting + bridges + analytics foundation | Yes — `workforceReportingService`, 4 report APIs, reporting UI, `workforceBridgeService`, scheduling/HR hooks |

### Reporting (Phase G)

- Service: `workforceReportingService.ts` (summary, communications, campaigns, acknowledgements)
- APIs: `/admin/reports/summary|communications|campaigns|acknowledgements`
- UI: `web/src/components/workforce-comms/reporting/*`
- Analytics derives from persisted WC state + module activity log + domain events (no parallel pipeline)

### Bridges (Phase G)

- `workforceBridgeService.ts` with opt-in `BusinessModuleInstallation.configured`
- Wired: `schedulingPublishService`, `schedulingScheduleService`, `schedulingShiftService`, `hrOnboardingService` (onboarding only)
- Exported but not HR-wired: `onHrPolicyBroadcastRequested`, `onHrAnnouncementBroadcastRequested` (intentional — HR remains source; callable API)

### Front-page cutover (Phase F)

- `AnnouncementsWidget.tsx` reads WC API
- `FrontPageContentEditor.tsx` redirects to Workforce Communications; legacy JSON noted
- `BusinessFrontPage.tsx` links to WC detail routes

### Tenant isolation

- `workforce-comms-tenant-scope.integration.test.ts`
- Services scope by `businessId` + `dashboardId` patterns per `workforceServiceShared`

---

## Comparison to HR and Scheduling

| Dimension | HR (L3 w/ findings) | Scheduling (L3 w/ findings) | Workforce Comms (post-G) |
|-----------|---------------------|----------------------------|------------------------|
| Controller Prisma (primary) | 0 main / 15 AI | 0 primary / 16 AI | **0 all controllers** |
| PE route coverage | Partial | Partial | **Full (32/32)** |
| Domain events | Present | 20 types | 17 types |
| Operation matrix | Partial | Missing (SCH) | **Present** |
| Open major findings at cert | 3 | 4 | **0** |
| Prior cert major findings | N/A | 3 closed in remediation | **5 closed in Phase G** |

WC is **at or above** HR/Scheduling on several gates (PE coverage, operation matrix, controller thinness) while sharing the same Business Operations governance context (unratified ledger rows).

---

## Comparison to reference modules (Chat / Calendar / File Hub)

| Pattern | File Hub | Chat | WC |
|---------|----------|------|-----|
| Thin controllers | Yes | Yes | Yes |
| Dedicated notification adapter | Yes | Yes | Yes |
| V-Link access + lifecycle | Yes | Yes | Yes |
| Global Trash handler | Yes | Yes | Yes |
| Operation matrix in `audits/` | Yes | Yes | In `business-operations/` (see F-WC-009) |
| Level 4 reference | Yes | L3 ref #2 | Not requested |

---

## Final decision table

| Question | Answer |
|----------|--------|
| F-WC-001 through F-WC-005 closed? | **YES** |
| Blocking findings? | **NO** |
| Certification outcome? | **PASS WITH FINDINGS** (advisory only) |
| Certification recommendation? | **LEVEL 3 CERTIFIED** |
| Reference candidate? | **YES** (Business Operations broadcast) |
| Reference implementation (L4)? | **NO** |
| Ledger update recommended? | **YES** |
| Council ratification ready? | **YES** |
| Next initiative? | Architecture Council ratification batch + ledger row |

---

## Related

- [WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md](./WORKFORCE_COMMUNICATIONS_POST_G_FINDINGS_REGISTER.md)
- [WORKFORCE_COMMUNICATIONS_REFERENCE_CANDIDATE_RECOMMENDATION.md](./WORKFORCE_COMMUNICATIONS_REFERENCE_CANDIDATE_RECOMMENDATION.md)
- [WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md](./WORKFORCE_COMMUNICATIONS_LEDGER_UPDATE_RECOMMENDATION.md)
- [WORKFORCE_COMMUNICATIONS_POST_G_EXECUTIVE_SUMMARY.md](./WORKFORCE_COMMUNICATIONS_POST_G_EXECUTIVE_SUMMARY.md)
