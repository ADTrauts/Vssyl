# Workforce Communications File Target Matrix

**Program:** Workforce Communications Engineering Blueprint  
**Status:** Authoritative file-level scope — no implementation  
**Last updated:** 2026-06-14  
**Row count:** 72  
**Master blueprint:** [WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md](./WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md)

---

## Legend

| Column | Values |
|--------|--------|
| **Layer** | Prisma, Server, Auth, Events, Startup, Web, Test, Doc |
| **Change** | CREATE, MODIFY, DELETE, TEST, MIGRATE |
| **Phase** | A–G per execution roadmap |

---

## Phase A — Data model

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Prisma | `prisma/modules/workforce_comms/core.prisma` | CREATE | A | Core WC models |
| Prisma | `prisma/schema.prisma` | MODIFY | A | Import workforce_comms module |
| Prisma | `prisma/migrations/*_workforce_comms_core/migration.sql` | MIGRATE | A | Apply WC tables |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_DATA_MODEL.md` | CREATE | A | Data model spec (this program) |

---

## Phase B — Core services

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Server | `server/src/services/workforceServiceShared.ts` | CREATE | B | Shared types, errors, includes |
| Server | `server/src/services/workforceAudienceService.ts` | CREATE | B | Audience spec + org-chart resolver |
| Server | `server/src/services/workforceCommunicationService.ts` | CREATE | B | Communication CRUD + publish |
| Server | `server/src/services/workforceCampaignService.ts` | CREATE | B | Campaign lifecycle |
| Server | `server/src/services/workforceAcknowledgementService.ts` | CREATE | B | Ack recording + pending list |
| Server | `server/src/services/workforceReadReceiptService.ts` | CREATE | B | Read tracking |
| Server | `server/src/services/workforceAttachmentService.ts` | CREATE | B | Attachment CRUD |
| Server | `server/src/services/workforceReportingService.ts` | CREATE | B | Reach/ack metrics |
| Server | `server/src/services/workforceMigrationService.ts` | CREATE | B | Phase 1 JSON import |
| Server | `server/src/services/workforceControllerUtils.ts` | CREATE | B | HTTP error mapping |
| Server | `server/src/services/workforceAiContextService.ts` | CREATE | B | AI bounded reads |

---

## Phase C — Routes + Policy Engine

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Auth | `server/src/auth/policyActions.ts` | MODIFY | C | `workforce:*` actions |
| Auth | `server/src/auth/workforceCommsPolicyDual.ts` | CREATE | C | PE dual evaluator |
| Auth | `server/src/auth/policyEngine.ts` | MODIFY | C | WC action handlers |
| Server | `server/src/middleware/workforceCommsPermissions.ts` | CREATE | C | Admin/employee middleware |
| Server | `server/src/middleware/workforceCommsFeatureGating.ts` | CREATE | C | Module installation gate |
| Server | `server/src/controllers/workforceComms/workforceCommsShared.ts` | CREATE | C | `requireAuthorizedBusinessId` |
| Server | `server/src/controllers/workforceComms/workforceCommsAdminController.ts` | CREATE | C | Thin admin handlers |
| Server | `server/src/controllers/workforceComms/workforceCommsEmployeeController.ts` | CREATE | C | Thin employee handlers |
| Server | `server/src/controllers/workforceComms/workforceCommsAiContextController.ts` | CREATE | C | Thin AI handlers |
| Server | `server/src/routes/workforceComms.ts` | CREATE | C | REST router + PE middleware |
| Server | `server/src/index.ts` | MODIFY | C | Mount `/api/workforce-comms` |
| Server | `server/src/constants/builtInModuleIds.ts` | MODIFY | C | Add `workforce_comms` |

---

## Phase D — Activity + notifications + domain events

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Server | `server/src/services/workforceActivityService.ts` | CREATE | D | Module activity adapter |
| Server | `server/src/services/workforceNotificationService.ts` | CREATE | D | `workforce_*` fan-out |
| Server | `server/src/services/workforceDomainEventService.ts` | CREATE | D | Domain event wrappers |
| Events | `server/src/events/domainEventRegistry.ts` | MODIFY | D | `workforce.*` types + contracts |
| Events | `server/src/events/domainEventEmitters.ts` | MODIFY | D | WC emitter functions |
| Server | `web/src/app/notifications/page.tsx` | MODIFY | D | `workforce_*` metadata |
| Server | `web/src/api/notifications.ts` | MODIFY | D | Type union for workforce |

---

## Phase E — V-Link + Trash

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Server | `server/src/services/workforceTrashService.ts` | CREATE | E | Soft trash / restore / purge |
| Server | `server/src/services/workforceVlinkAccessService.ts` | CREATE | E | V-Link read resolution |
| Server | `server/src/services/workforceVlinkLifecycleService.ts` | CREATE | E | Unlink on purge |
| Server | `server/src/platform/registerWorkforceCommsPlatformEntities.ts` | CREATE | E | Entity descriptors |
| Server | `server/src/services/vlinkEntityResolverService.ts` | MODIFY | E | WC entity cases |
| Server | `server/src/startup/registerGlobalTrashHandlers.ts` | MODIFY | E | WC trash handler block |
| Prisma | `prisma/migrations/*_workforce_vlink_entity_types/migration.sql` | MIGRATE | E | VLink enum values |

---

## Phase F — UI + workspace hub

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Web | `web/src/components/workforce-comms/WorkforceCommsWorkspaceLanding.tsx` | CREATE | F | Module hub (required) |
| Web | `web/src/components/workforce-comms/WorkforceCommsLayout.tsx` | CREATE | F | Layout shell |
| Web | `web/src/components/workforce-comms/CommunicationComposer.tsx` | CREATE | F | Authoring UI |
| Web | `web/src/components/workforce-comms/AudiencePicker.tsx` | CREATE | F | Org-chart audience UI |
| Web | `web/src/components/workforce-comms/WorkforceCommsFeed.tsx` | CREATE | F | Employee feed |
| Web | `web/src/components/workforce-comms/CommunicationDetail.tsx` | CREATE | F | Detail + ack |
| Web | `web/src/components/workforce-comms/CommunicationReport.tsx` | CREATE | F | Admin reporting |
| Web | `web/src/components/workforce-comms/CampaignManager.tsx` | CREATE | F | Campaign admin |
| Web | `web/src/components/workforce-comms/PendingAckBanner.tsx` | CREATE | F | Pending ack UX |
| Web | `web/src/api/workforceComms.ts` | CREATE | F | API client |
| Web | `web/src/hooks/useWorkforceComms.ts` | CREATE | F | Data hooks |
| Web | `web/src/app/business/[id]/workforce-comms/page.tsx` | CREATE | F | Hub route |
| Web | `web/src/app/business/[id]/workforce-comms/feed/page.tsx` | CREATE | F | Feed route |
| Web | `web/src/app/business/[id]/workforce-comms/admin/page.tsx` | CREATE | F | Admin route |
| Web | `web/src/components/business/BusinessWorkspaceContent.tsx` | MODIFY | F | `case 'workforce_comms'` |
| Web | `web/src/components/BrandedWorkDashboard.tsx` | MODIFY | F | Icon + module name |
| Web | `web/src/components/business/widgets/AnnouncementsWidget.tsx` | MODIFY | F | Read from WC API |
| Web | `web/src/components/business/FrontPageContentEditor.tsx` | MODIFY | F | Remove announcement CRUD |

---

## Phase G — Reporting + bridges + startup

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Server | `server/src/services/workforceBridgeService.ts` | CREATE | G | Scheduling/HR hooks |
| Server | `server/src/services/schedulingPublishService.ts` | MODIFY | G | Optional WC bridge call |
| Startup | `server/src/startup/builtInModuleManifests.ts` | MODIFY | G | `case 'workforce_comms'` manifest |
| Startup | `server/src/startup/registerBuiltInModules.ts` | MODIFY | G | AI context + module registration |
| Startup | `server/src/startup/seedWorkforceCommsModule.ts` | CREATE | G | Default installation seed |
| Doc | `docs/architecture/audits/SCHEDULING_OPERATION_MATRIX.md` | — | — | N/A (WC matrix separate) |
| Doc | `docs/architecture/audits/WORKFORCE_COMMUNICATIONS_OPERATION_MATRIX.md` | CREATE | G | Operation matrix (certification prep) |

---

## Tests

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Test | `server/src/services/__tests__/workforceAudienceService.test.ts` | TEST | B | Resolver unit tests |
| Test | `server/src/services/__tests__/workforceCommunicationService.test.ts` | TEST | B | Publish lifecycle |
| Test | `server/src/services/__tests__/workforceAcknowledgementService.test.ts` | TEST | B | Ack rules |
| Test | `server/src/services/__tests__/workforceNotificationService.test.ts` | TEST | D | Fan-out |
| Test | `server/src/services/__tests__/workforceActivityService.test.ts` | TEST | D | Activity envelope |
| Test | `server/src/events/__tests__/workforceDomainEvents.test.ts` | TEST | D | Metadata contract |
| Test | `server/src/services/__tests__/workforceTrashService.test.ts` | TEST | E | Trash lifecycle |
| Test | `server/src/services/__tests__/workforceVlinkAccessService.test.ts` | TEST | E | V-Link access |
| Test | `server/src/auth/__tests__/workforceCommsPolicyDual.test.ts` | TEST | C | PE rules |
| Test | `server/src/routes/__tests__/workforce-comms-tenant-scope.integration.test.ts` | TEST | C | Tenant isolation |
| Test | `server/src/startup/__tests__/builtInModuleManifests.workforce.test.ts` | TEST | G | Manifest truth |
| Test | `server/src/services/__tests__/workforceMigrationService.test.ts` | TEST | B | Front-page import |

---

## Blueprint docs (this program)

| Layer | File | Change | Phase | Purpose |
|-------|------|--------|-------|---------|
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_ENGINEERING_BLUEPRINT.md` | CREATE | — | Master blueprint |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md` | CREATE | — | Services |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_ROUTE_ARCHITECTURE.md` | CREATE | — | Routes |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_UI_ARCHITECTURE.md` | CREATE | — | UI |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_NOTIFICATION_ARCHITECTURE.md` | CREATE | — | Notifications |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_ACTIVITY_AND_EVENTS.md` | CREATE | — | Activity/events |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_VLINK_ARCHITECTURE.md` | CREATE | — | V-Link |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md` | CREATE | — | Build order |
| Doc | `docs/business-operations/WORKFORCE_COMMUNICATIONS_EXECUTIVE_SUMMARY.md` | CREATE | — | Executive summary |

---

## Risk summary

| Risk | Files | Mitigation |
|------|-------|------------|
| **High** | `workforceCommunicationService`, `workforceAudienceService`, publish path | Integration tests + tenant scope |
| **High** | Prisma migrations | Staged deploy; backfill migration |
| **Medium** | Front-page widget switch | Feature flag dual-read during migration |
| **Medium** | `schedulingPublishService` bridge | Optional flag; default off |
| **Low** | Manifest, icons, docs | Standard module registration |

---

## Out of scope (explicit)

| File / area | Reason |
|-------------|--------|
| `server/src/controllers/chat/*` | Chat boundary — no broadcast in Chat |
| `server/src/services/chatNotificationService.ts` | Notifications delivery only |
| `prisma/modules/business/business.prisma` `companyAnnouncements` | Deprecated after migration — field retained until cutover |
| SMS / email campaign services | Future phase |

---

## Row count

**72 rows** (target 40–80 met)

---

## Related

- [WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md](./WORKFORCE_COMMUNICATIONS_EXECUTION_ROADMAP.md)
