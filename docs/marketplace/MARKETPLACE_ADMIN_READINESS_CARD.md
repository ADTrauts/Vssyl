# Marketplace Admin Readiness Card

**Program:** Marketplace & Module Ecosystem — Phase 1B-E.5-F / **1B-F activity probe**  
**Date:** 2026-06-24  
**Status:** ✅ Implemented (activity ingest probe added 1B-F)

---

## 1. Purpose

Minimal Admin Portal surface exposing **marketplace capability readiness** without redesigning the modules governance page.

---

## 2. UI component

**`web/src/components/admin/MarketplaceReadinessCard.tsx`**

| Surface | Placement |
|---------|-----------|
| Submissions list | Compact card per submission |
| Submission detail modal | Full card with probe buttons |

---

## 3. Data source

**API:** `GET /api/admin-portal/modules/:moduleId/marketplace-readiness`  
**Service:** `server/src/marketplace/marketplaceReadinessService.ts`

### Response fields

| Field | Description |
|-------|-------------|
| `moduleScope` | Resolved scope classification |
| `supportedContexts` | Tenant contexts |
| `certification` | Live validator result + stored status |
| `searchDelegate` | Declared / registered / allowlisted |
| `workspaceBridge` | Declared / registered / allowlisted |
| `businessBilling` | Paid applicability + scope compatibility |
| `activityIngest` | Declared / registered / enabled / allowlisted / manifestValid / certificationActive |

---

## 4. Probe actions (detail modal)

| Button | API |
|--------|-----|
| Search probe | `GET .../search-delegate-probe?live=true` |
| Workspace probe | `GET .../workspace-bridge-probe?live=true` |
| Billing probe | `GET .../business-billing-probe` |
| Activity probe | `GET .../activity-ingest-probe?live=true` |

Client: `adminApiService.runSearchDelegateProbe`, `runWorkspaceBridgeProbe`, `runBusinessBillingProbe`, `runActivityIngestProbe`

---

## 5. Badges

- **Scope:** personal / business / both / internal (color-coded)
- **Certification:** passed / warning / failed

---

**Last updated:** 2026-06-24
