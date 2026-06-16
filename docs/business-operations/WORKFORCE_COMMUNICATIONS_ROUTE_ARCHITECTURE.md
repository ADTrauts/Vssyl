# Workforce Communications Route Architecture

**Program:** Workforce Communications Engineering Blueprint  
**Module id:** `workforce_comms`  
**Base path:** `/api/workforce-comms`  
**Proxy:** Next.js `/api/[...slug]` — no client bypass  
**Last updated:** 2026-06-14

---

## 1. Router structure

```
server/src/routes/workforceComms.ts
  → server/src/controllers/workforceComms/
       workforceCommsAdminController.ts
       workforceCommsEmployeeController.ts
       workforceCommsAiContextController.ts
       workforceCommsShared.ts
```

Mount in `server/src/index.ts` (or route aggregator): `app.use('/api/workforce-comms', workforceCommsRouter)`.

---

## 2. Middleware stack

| Middleware | Purpose |
|------------|---------|
| `authenticate` | JWT / session — `req.user` required |
| `checkWorkforceCommsFeature` | Business module installation enabled |
| `checkWorkforceCommsAdmin` | Admin / canManage for admin routes |
| `checkWorkforceCommsEmployeeAccess` | Active business member for employee routes |
| `checkWorkforceCommsPolicy(action)` | Policy Engine dual evaluation |
| `requireAuthorizedBusinessId` | Tenant extraction (shared helper) |

Pattern: mirror `schedulingPermissions.ts` + `schedulingPolicyDual.ts`.

---

## 3. Policy actions

Add to `server/src/auth/policyActions.ts`:

```typescript
// Workforce Communications
WORKFORCE_COMMUNICATION_READ: 'workforce:communication.read',
WORKFORCE_COMMUNICATION_CREATE: 'workforce:communication.create',
WORKFORCE_COMMUNICATION_WRITE: 'workforce:communication.write',
WORKFORCE_COMMUNICATION_PUBLISH: 'workforce:communication.publish',
WORKFORCE_COMMUNICATION_DELETE: 'workforce:communication.delete',
WORKFORCE_CAMPAIGN_MANAGE: 'workforce:campaign.manage',
WORKFORCE_ACK_MANAGE: 'workforce:acknowledgement.manage',
WORKFORCE_REPORT_READ: 'workforce:report.read',
WORKFORCE_BRIDGE_MANAGE: 'workforce:bridge.manage',
```

Register handlers in `policyEngine.ts` and `workforceCommsPolicyDual.ts`.

### Permission mapping

| Business role | Default grants |
|---------------|----------------|
| ADMIN | All workforce actions |
| MANAGER | read, ack (self), limited create (dept subtree — optional Phase B) |
| MEMBER | read, ack (self), read receipt (self) |

Manifest permissions: `workforce_comms:read`, `workforce_comms:write`, `workforce_comms:admin`.

---

## 4. Admin routes

| Method | Path | PE action | Controller | Service |
|--------|------|-----------|------------|---------|
| GET | `/admin/communications` | `READ` | `listCommunications` | `listCommunicationsForBusiness` |
| POST | `/admin/communications` | `CREATE` | `createCommunication` | `createCommunicationDraft` |
| GET | `/admin/communications/:id` | `READ` | `getCommunication` | `getCommunicationById` |
| PUT | `/admin/communications/:id` | `WRITE` | `updateCommunication` | `updateCommunicationDraft` |
| DELETE | `/admin/communications/:id` | `DELETE` | `trashCommunication` | `trashCommunicationForBusiness` |
| POST | `/admin/communications/:id/publish` | `PUBLISH` | `publishCommunication` | `publishCommunication` |
| POST | `/admin/communications/:id/schedule` | `WRITE` | `scheduleCommunication` | `scheduleCommunication` |
| POST | `/admin/communications/:id/cancel` | `WRITE` | `cancelCommunication` | `cancelCommunication` |
| PUT | `/admin/communications/:id/audience` | `WRITE` | `setAudience` | `upsertAudienceSpec` |
| POST | `/admin/communications/:id/audience/estimate` | `READ` | `estimateAudience` | `estimateAudienceCount` |
| GET | `/admin/communications/:id/report` | `REPORT_READ` | `getCommunicationReport` | `getCommunicationMetrics` |
| POST | `/admin/communications/:id/attachments` | `WRITE` | `addAttachment` | `addAttachment` |
| DELETE | `/admin/attachments/:attachmentId` | `WRITE` | `removeAttachment` | `removeAttachment` |
| GET | `/admin/campaigns` | `CAMPAIGN_MANAGE` | `listCampaigns` | `listCampaigns` |
| POST | `/admin/campaigns` | `CAMPAIGN_MANAGE` | `createCampaign` | `createCampaign` |
| GET | `/admin/campaigns/:id` | `CAMPAIGN_MANAGE` | `getCampaign` | `getCampaignById` |
| PUT | `/admin/campaigns/:id` | `CAMPAIGN_MANAGE` | `updateCampaign` | `updateCampaign` |
| POST | `/admin/campaigns/:id/complete` | `CAMPAIGN_MANAGE` | `completeCampaign` | `completeCampaign` |
| POST | `/admin/migrate/front-page` | `CREATE` | `migrateFrontPage` | `importFrontPageAnnouncements` |
| GET | `/admin/bridge/templates` | `BRIDGE_MANAGE` | `listBridgeTemplates` | `listBridgeTemplates` |

---

## 5. Employee routes

| Method | Path | PE action | Controller | Service |
|--------|------|-----------|------------|---------|
| GET | `/feed` | `READ` | `getMyFeed` | `listPublishedForUser` |
| GET | `/communications/:id` | `READ` | `getCommunicationForEmployee` | `getPublishedCommunicationForUser` |
| POST | `/communications/:id/read` | `READ` | `recordRead` | `recordRead` |
| POST | `/communications/:id/acknowledge` | `ACK_MANAGE` | `acknowledge` | `acknowledgeCommunication` |
| GET | `/pending-acks` | `READ` | `listPendingAcks` | `listPendingAcksForUser` |

**Feed query:** Join `WorkforceAudienceResolution` where `userId = actor` + active published communications.

---

## 6. Public / front-page routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/public/front-page` | Business member | Published communications where `showOnFrontPage=true` |

Replaces direct JSON read from `BusinessFrontPageConfig.companyAnnouncements` in `AnnouncementsWidget`.

---

## 7. AI context routes

| Method | Path | Middleware | Controller |
|--------|------|------------|------------|
| GET | `/ai/context/overview` | employee access | `getOverviewForAI` |
| GET | `/ai/context/reach` | admin | `getReachForAI` |

All reads delegate to `workforceAiContextService` — **zero Prisma in controller**.

---

## 8. Global trash integration

Trash API uses platform `trashController` with `moduleId: 'workforce_comms'`:

| Type | Handler |
|------|---------|
| `communication` | `workforceTrashService.restoreCommunication` / `purgeCommunication` |
| `campaign` | `workforceTrashService.restoreCampaign` / `purgeCampaign` |

---

## 9. Web client API

```
web/src/api/workforceComms.ts
```

- Native `fetch` to `/api/workforce-comms/...`
- `authHeaders(token)` helper
- No double `/api` prefix

Optional hook: `web/src/hooks/useWorkforceComms.ts`

---

## 10. Route registration checklist

- [ ] `policyActions.ts` — 8 actions
- [ ] `workforceCommsPolicyDual.ts` — dual evaluator
- [ ] `policyEngine.ts` — action handlers
- [ ] `routes/workforceComms.ts` — all routes with PE
- [ ] `scheduling.ts` — **no** WC routes (separate router)
- [ ] `registerBuiltInModules.ts` — AI context providers
- [ ] `registerGlobalTrashHandlers.ts` — WC block

---

## 11. Integration routes (internal hooks)

Called from Scheduling/HR services — not public HTTP:

| Caller | Callee |
|--------|--------|
| `schedulingPublishService` (optional flag) | `workforceBridgeService.onSchedulePublished` |
| HR admin action (future) | `workforceBridgeService.onHrPolicyBroadcastRequested` |

Prefer **in-process service call** over HTTP for monorepo built-ins.

---

## Related

- [WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_SERVICE_ARCHITECTURE.md)
- [WORKFORCE_COMMUNICATIONS_UI_ARCHITECTURE.md](./WORKFORCE_COMMUNICATIONS_UI_ARCHITECTURE.md)
