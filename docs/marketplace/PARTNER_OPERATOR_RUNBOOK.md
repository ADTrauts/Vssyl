# Partner Operator Runbook

**Program:** Marketplace — Phase 1C-A  
**Audience:** Vssyl platform operators, marketplace admins  
**Status:** Active  
**Addresses finding:** EP-02 (post-publish enablement visibility)

---

## 1. Purpose

Document **internal steps after partner module approval** so Search Delegate, Workspace Bridge, and Activity Ingest go live safely. Partners receive a summary checklist from this runbook via [PARTNER_DEVELOPER_GUIDE.md](../guides/PARTNER_DEVELOPER_GUIDE.md) §12.

---

## 2. Prerequisites

| Item | Required |
|------|----------|
| Module `status` | `APPROVED` |
| Current version | `PUBLISHED`, `isCurrent=true` |
| Artifact scan | `PASSED` (if artifact used) |
| Certification | Passed (warnings reviewed) |
| Target environment | Production or staging with GCS |

---

## 3. Certification approval

### 3.1 Admin review

1. Open **Admin Portal → Modules → Submissions**  
2. Open submission detail modal  
3. Verify:
   - Artifact scan badge **PASSED**
   - Certification panel **passed** (or warnings accepted)
   - **Marketplace Readiness Card** scope + capability flags

### 3.2 Approve / publish

```
POST /api/admin-portal/modules/submissions/:submissionId/review
{ "action": "approve", ... }
```

Blocked if certification hard errors.

### 3.3 Version promotion / rollback

- Promote explicit version: `POST .../versions/:version/promote`  
- Rollback: `POST .../versions/promote-previous`  
- Certification re-validates on promote when stale  

---

## 4. Allowlists

Set comma-separated module ids (no spaces):

```bash
PARTNER_SEARCH_DELEGATE_MODULE_ALLOWLIST=asset-register,vssyl-pilot-assets
PARTNER_WORKSPACE_BRIDGE_MODULE_ALLOWLIST=asset-register,vssyl-pilot-assets
PARTNER_ACTIVITY_INGEST_MODULE_ALLOWLIST=asset-register,vssyl-pilot-assets
```

**Rule:** Module id must match submitted slug exactly.

---

## 5. Feature flags

```bash
PARTNER_SEARCH_DELEGATE_ENABLED=true
PARTNER_WORKSPACE_BRIDGE_ENABLED=true
PARTNER_ACTIVITY_INGEST_ENABLED=true
```

Optional TTL overrides:

```bash
# PARTNER_SEARCH_DELEGATE_JWT_TTL_SECONDS=60
# PARTNER_WORKSPACE_BRIDGE_JWT_TTL_SECONDS=120
# PARTNER_ACTIVITY_INGEST_JWT_TTL_SECONDS=90
```

**Default in `.env.example`:** all `false` — fail-closed.

---

## 6. Deploy / restart

After env change:

1. Update Cloud Run service env (or Secret Manager refs)  
2. Redeploy or rolling restart `vssyl-server`  
3. Confirm startup log: partner registry sync completed  

Registry also syncs on module publish via `ModuleRegistrySyncService`.

---

## 7. Probe execution

From Admin Portal submission detail → **Marketplace Readiness Card**:

| Button | API | Live? |
|--------|-----|-------|
| Search probe | `GET /api/admin-portal/modules/:moduleId/search-delegate-probe?live=true` | Yes |
| Workspace probe | `GET .../workspace-bridge-probe?live=true` | Yes |
| Billing probe | `GET .../business-billing-probe` | Synthetic |
| Activity probe | `GET .../activity-ingest-probe?live=true` | Yes (probe mode) |

**Pass criteria:** `probe.ok === true` (or documented warning accepted).

### 7.1 Readiness API

```
GET /api/admin-portal/modules/:moduleId/marketplace-readiness
```

Verify for each capability:

- `declared: true`
- `registered: true` (after sync)
- `enabled: true` (global flag)
- `allowlisted: true`
- `manifestValid: true`
- `certificationActive: true` (activity)

---

## 8. Rollout checklist

```
[ ] Module APPROVED + current version PUBLISHED
[ ] Certification passed
[ ] Module id added to three allowlists (as applicable)
[ ] Three PARTNER_*_ENABLED flags true in target env
[ ] Server restarted / deployed
[ ] marketplace-readiness shows registered + allowlisted
[ ] All four probes executed (live where applicable)
[ ] Test business: install module (scope=business)
[ ] Test user: workspace embed loads
[ ] Test user: unified search returns partner hits
[ ] Test action: activity event in feed (optional live test)
[ ] Partner notified enablement complete
```

---

## 9. Rollback

| Action | Effect |
|--------|--------|
| Remove module id from allowlists | Delegates stop for that module |
| Set flags `false` | All partner delegates off globally |
| `promote-previous` version | Revert manifest snapshot |
| `PATCH` module status `SUSPENDED` | Install + runtime blocked; registry purged on sync |

Prefer **allowlist removal** for single-module rollback without global impact.

---

## 10. Diagnostics

| Symptom | Check |
|---------|-------|
| `registered: false` | Publish sync; manifest delegate blocks; certification |
| `allowlisted: false` | Env allowlist typo |
| `enabled: false` | Global flag |
| Search probe fail | Partner URL egress; JWT; timeout |
| Activity probe fail | Manifest actionTypes; registry |
| Billing probe fail | pricingTier + business install |

Server logs: `operation` contains `partner_activity_ingest`, `search_delegate`, `workspace_bridge`.

---

## 11. Partner communication template

After successful rollout, send partner:

```
Module: {moduleId}
Environment: {staging|production}
Enabled: Search / Workspace / Activity (as applicable)
Allowlisted: yes
Probes: all passed {date}
Test business id: {optional}
Notes: {any warnings}
```

---

## 12. Related docs

- [PARTNER_DEVELOPER_GUIDE.md](../guides/PARTNER_DEVELOPER_GUIDE.md)
- [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md)
- [PARTNER_CERTIFICATION_WALKTHROUGH.md](../guides/PARTNER_CERTIFICATION_WALKTHROUGH.md)

**Last updated:** 2026-06-24
