# Admin Portal — Marketplace Alignment Review

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5  
**Date:** 2026-06-24  
**Status:** Visibility audit — **readiness card implemented in Phase 1B-E.5-F**  
**UI:** [MARKETPLACE_ADMIN_READINESS_CARD.md](./MARKETPLACE_ADMIN_READINESS_CARD.md)  
**Primary surface:** `web/src/app/admin-portal/modules/page.tsx`  
**APIs:** `server/src/routes/admin-portal/adminPortalRoutes.analyticsOps.ts`

---

## 1. Executive summary

Admin Portal **substantially covers** module submission review, structural certification, artifact scan, and version promotion. **Marketplace capability probes** (search delegate, workspace bridge, business billing) exist as **admin APIs** but are **not exposed in the Admin Portal UI**. There is **no unified capability readiness dashboard** and **no module scope classification display**.

---

## 2. Admin Portal marketplace surfaces

| Surface | Path | Status |
|---------|------|--------|
| Module governance hub | `/admin-portal/modules` | ✅ Primary |
| Legacy redirect | `/modules/admin` → admin-portal | ✅ |
| Developer stats | API `/admin-portal/modules/developers/stats` | ✅ API |
| Module analytics | API `/admin-portal/modules/analytics` | ✅ API |
| AI system (module probes mention) | `/admin-portal/ai-system` | 🟡 Tangential |
| Seed modules | `/admin-portal/seed-modules` | ✅ Ops |

---

## 3. Capability visibility matrix

| Capability | Backend support | Admin UI visible? | Notes |
|------------|-----------------|-------------------|-------|
| **Module submission status** | ✅ `GET /modules/submissions` | ✅ List + badges (PENDING/APPROVED/REJECTED) | Filters, bulk actions |
| **Certification status** | ✅ `ModuleCertificationReviewPanel` | ✅ Inline + detail modal | Checklist includes contexts, search, workspace |
| **Sandbox / artifact scan** | ✅ `ModuleArtifact.scanStatus` | ✅ Review checklist — “Artifact scan passed” | Smart scan summary in detail view |
| **Runtime readiness** | ✅ entryUrl or artifact | ✅ “Runtime path ready” row | |
| **Publish readiness** | ✅ scan + certification | ✅ “Publish readiness” row | Blocks approve on certification fail |
| **Version history / promote** | ✅ versions API | ✅ Modal per module | Rollback / promote previous |
| **Search delegate status** | ✅ Registry + certification item `search_delegate` | 🟡 **Checklist only** if `capabilities.search` | No live probe button in UI |
| **Search delegate probe** | ✅ `GET /modules/:id/search-delegate-probe` | ❌ **API only** | `?live=true` for live probe |
| **Workspace bridge status** | ✅ Certification item `workspace_participation` | 🟡 **Checklist only** if `capabilities.workspace` | |
| **Workspace bridge probe** | ✅ `GET /modules/:id/workspace-bridge-probe` | ❌ **API only** | |
| **Business billing readiness** | ✅ `businessModuleSubscriptionService` + probe | ❌ **API only** | `GET /modules/:id/business-billing-probe` |
| **Activity ingest readiness** | 📋 Architecture only (1B-E) | ❌ | No probe or checklist item |
| **Module scope (personal/business)** | 🟡 Certification `contexts` checklist | 🟡 **Message text only** — e.g. `personal, business` | No scope badge or mismatch warning |
| **AI context registry** | ✅ Separate tab | ✅ “AI Context Status” tab | Registration rate, provider health |
| **Developer business link** | ✅ `module.business` | ✅ Badge “Developer Business Linked” | |
| **Security validation** | ✅ `securityValidation` on submission | ✅ Security badge | |
| **Revenue / pricing** | ✅ revenue API | 🟡 Partial in submission grid | pricingTier shown |
| **Module suspend** | ✅ `PATCH /modules/:id/status` | 🟡 Via actions | |

---

## 4. What admins see today (submissions tab)

### 4.1 Review checklist (per submission)

Visible without opening modal:

- Artifact scan status badge
- Developer business linked badge (when applicable)
- ✓ Artifact scan passed
- ✓ Runtime path ready
- ✓ Publish readiness
- Compact `ModuleCertificationReviewPanel` (structural certification)

### 4.2 Certification checklist items (when expanded)

From validator v1.2.0 — relevant marketplace items:

| Checklist id | Visible when | Shows scope/capability? |
|--------------|--------------|-------------------------|
| `contexts` | Always | 🟡 Pass message lists context strings |
| `search_delegate` | `capabilities.search` | ✅ URL + entity types |
| `workspace_participation` | `capabilities.workspace` | ✅ Contexts + embed mode |
| `ai_context` | AI-exposed | ✅ Provider validation |
| `notifications_meta` | Notifications declared | ✅ |

### 4.3 Submission detail modal

- Full certification panel
- Version list with per-version scan + certification
- Promote / rollback actions
- Manifest inspection (raw JSON in UI)

### 4.4 AI Context tab (second tab)

- Module list with `aiContextRegistered` boolean
- Provider endpoint list
- Test provider action
- **Does not** show search/workspace/billing/activity participation

---

## 5. Admin APIs without UI (gaps)

| API | Purpose | UI gap |
|-----|---------|--------|
| `GET /admin-portal/modules/:moduleId/search-delegate-probe` | Sandbox/live search delegate test | ❌ No button; admins must use curl/Postman |
| `GET /admin-portal/modules/:moduleId/workspace-bridge-probe` | Workspace JWT + embed validation | ❌ No button |
| `GET /admin-portal/modules/:moduleId/business-billing-probe` | Entitlement + subscription path | ❌ No button |
| `GET /admin-portal/modules/analytics` | Aggregate module metrics | 🟡 Not on modules page |
| `GET /admin-portal/modules/export` | Data export | 🟡 Not prominent |

**`adminApiService.ts`** — no client methods for probe endpoints (confirmed grep).

---

## 6. Alignment gaps (prioritized)

| ID | Gap | Impact |
|----|-----|--------|
| **AP-G01** | No **Marketplace Capability** panel on module detail | Admins cannot run probes without API knowledge |
| **AP-G02** | No **scope classification badge** (Personal / Business / Both) | Wrong-scope modules approved without visibility |
| **AP-G03** | Search/workspace readiness only in certification checklist | Pass/fail buried; no runtime probe result history |
| **AP-G04** | No **billing readiness** in review UI | Business paid modules approved without entitlement probe |
| **AP-G05** | No **activity ingest readiness** (post 1B-E) | Future capability invisible at review |
| **AP-G06** | No **sandbox pilot status** aggregate | `vssyl-pilot-assets` status not surfaced |
| **AP-G07** | AI Context tab isolated from marketplace capabilities | Fragmented admin mental model |
| **AP-G08** | No **allowlist / feature flag** visibility for partner pilots | `PARTNER_*_ALLOWLIST` env not shown |
| **AP-G09** | No scope **mismatch warning** (top-level vs searchDelegate contexts) | Certification pass hides inconsistency |

---

## 7. Recommended Admin Portal additions (architecture only)

### 7.1 Module detail — “Marketplace capabilities” card

| Row | Source |
|-----|--------|
| Scope | `manifest.supportedContexts` → badge: Personal / Business / Both / Household |
| Search delegate | Registry loaded + probe result + allowlist status |
| Workspace bridge | Registry loaded + probe result + allowlist status |
| Business billing | Probe: subscription row + entitlement evaluate |
| Activity ingest | Not enabled / architecture ready / probe (future) |
| Sandbox | Internal pilot URL + last probe timestamp |

### 7.2 Actions

- “Run search delegate probe” → existing API
- “Run workspace bridge probe” → existing API
- “Run billing probe” → existing API
- “Run activity probe” → future API

### 7.3 Submission list — summary chips

Replace buried checklist with at-a-glance chips:

`Scope: Business` · `Search: ✅` · `Workspace: ⚠️` · `Billing: ❌` · `Activity: —`

---

## 8. Current vs target admin workflow

```
Today:
  Submit → Scan → Certification (structural) → Human approve → Publish
  Probes: manual API only

Target:
  Submit → Scan → Certification (+ scope enum) → Capability probes (UI) → Approve → Publish
  Ongoing: capability status on approved module detail
```

---

## 9. Related admin surfaces (out of scope but noted)

| Surface | Marketplace relation |
|---------|---------------------|
| `/admin-portal/ai-pipeline/*` | AI certification — orthogonal |
| `/admin-portal/pricing` | Platform pricing — not per-module billing probe |
| `/admin-portal/developers` | Developer accounts — partial overlap |
| Context Provider Health Panel | AI providers — overlaps AI Context tab |

---

**Last updated:** 2026-06-24
