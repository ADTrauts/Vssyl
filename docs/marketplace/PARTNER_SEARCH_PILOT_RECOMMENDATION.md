# Partner Search Pilot — Recommendation

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Recommendation only — **no implementation**  
**Authority:** [SEARCH_DELEGATE_ARCHITECTURE.md](./SEARCH_DELEGATE_ARCHITECTURE.md), [MARKETPLACE_STRATEGIC_POSITIONING.md](./MARKETPLACE_STRATEGIC_POSITIONING.md)

---

## 1. Pilot objective

Validate the Search Delegate architecture end-to-end with **one low-risk partner module** before enabling dynamic registration for all certified marketplace modules.

**Success criteria:**
1. Partner entity appears in global search results for authorized business user
2. Same hit maps to `AIRetrievalEvidence` without code changes
3. Cross-tenant query returns zero hits
4. Suspend module removes results within sync window
5. Delegate failure does not break global search for first-party modules

---

## 2. Candidate evaluation

| Candidate | Isolation | Searchable entities | Permission complexity | Cross-module deps | Risk |
|-----------|-----------|---------------------|----------------------|-------------------|------|
| **Asset Management** | ✅ High | Assets, serial #, location | Low (`asset:read`) | None required | **Low** |
| **Inventory** | ✅ High | SKUs, bins, quantities | Low–medium | Overlap confusion with Place/commerce | Low–medium |
| **CRM** | ⚠️ Medium | Contacts, deals, companies | Medium (PII, sharing rules) | Member search overlap | Medium |
| **Property Management** | ⚠️ Medium | Units, leases, tenants | Medium (PII) | Calendar/V_Link expectations | Medium |
| **Healthcare** | ❌ Low | Patients, records | High (HIPAA, BAA) | Compliance blockers | **High** |
| **Manufacturing** | ⚠️ Medium | Work orders, machines | Medium | IoT integration expectations | Medium |

---

## 3. Recommendation

### Primary: **Asset Management** module (`acme-assets` working title)

**Rationale:**

1. **Isolated SoR** — assets live entirely in partner database; no Vssyl module overlap
2. **Low risk permissions** — single read scope; no write/search side effects in pilot
3. **Clear searchable fields** — name, serial number, asset tag, location, category
4. **Business-scoped naturally** — matches typical B2B pilot on business workspace
5. **Minimal PII** — equipment metadata vs. CRM/healthcare patient data
6. **Easy QA** — create two businesses with distinct assets; verify isolation
7. **Demonstrates intelligence stack** — search → retrieval evidence → optional graph inference without V_Link complexity

### Alternate: **Inventory (SKU)** module

Choose if product narrative prefers commerce-adjacent vertical. Slightly higher confusion risk with Place module scope — document boundary in pilot README.

### Defer: CRM, Property, Healthcare, Manufacturing

- **CRM / Property:** PII + user expectation of member/V_Link integration
- **Healthcare:** compliance gate not designed
- **Manufacturing:** scope creep toward IoT/scheduling

---

## 4. Pilot module profile

| Attribute | Value |
|-----------|-------|
| **moduleId** | `vssyl-pilot-assets` (platform-owned pilot) or design-partner id |
| **Category** | `PRODUCTIVITY` or `FINANCE` |
| **Contexts** | `business` only (pilot scope) |
| **Pricing** | `free` (pilot) |
| **Permissions** | `vssyl-pilot-assets:read` |
| **Entity types** | `asset` |
| **Delegate URL** | Partner Cloud Run service (design partner) OR internal Vssyl sandbox service simulating partner |

### 4.1 Minimum entity model (partner SoR)

```
Asset {
  id: string
  businessId: string
  name: string
  serialNumber?: string
  location?: string
  category?: string
  status: 'active' | 'retired'
  updatedAt: datetime
}
```

### 4.2 Search behavior

- Query matches `name`, `serialNumber`, `location`, `category` (case-insensitive contains)
- Excludes `status: retired`
- Max 10 results
- Response time target <500 ms p95

---

## 5. Pilot architecture options

### Option A — Design partner (preferred for ecosystem validation)

External developer builds Asset module + delegate on their Cloud Run.

| Pros | Cons |
|------|------|
| Validates real partner path | Requires partner coordination |
| Tests developer guide gaps | Timeline dependency |

### Option B — Internal sandbox partner (preferred for speed)

Vssyl engineering hosts `vssyl-partner-sandbox` Cloud Run service simulating third-party delegate.

| Pros | Cons |
|------|------|
| Fast iteration | Does not test external developer friction |
| Controlled security tests | Less credible as ecosystem proof |

**Recommendation:** **Option B for first implementation sprint** → **Option A for certification sign-off** (both use same contract).

---

## 6. Pilot test plan (implementation phase)

| # | Test | Expected |
|---|------|----------|
| T1 | Business user searches asset name | Hit in global search |
| T2 | User in Business B searches Business A asset | Zero hits |
| T3 | User without `search:read` | 403 before delegate |
| T4 | Module suspended | No hits after sync |
| T5 | Delegate timeout | Global search still returns drive/chat hits |
| T6 | AI retrieval `discover()` same query | Evidence includes `sourceModule: vssyl-pilot-assets` |
| T7 | Invalid delegate response | Logged; zero partner hits |
| T8 | Admin Test Lab probe | Pass before approve |

---

## 7. Pilot governance

| Gate | Owner |
|------|-------|
| Architecture sign-off | Platform engineering (this phase ✅) |
| Security review | Platform + admin |
| Manifest + delegate cert | Admin portal |
| Feature flag allowlist | Ops |
| Production enable | Program lead after T1–T8 pass |

**Pilot module marked `isProprietary: false`, `pricingTier: free`** — avoids business billing blocker during search-only pilot.

---

## 8. Out of scope (pilot)

- Personal scope search
- Context Graph bridge enablement in production (dev flag only)
- V_Link linking to assets
- Activity feed ingest
- Business workspace embed (parallel Phase 1B track — deep links may use `/modules/run` initially)
- Multiple partner modules simultaneously

---

## 9. Timeline estimate (post-approval)

| Sprint | Deliverable |
|--------|-------------|
| **Sprint 1** | Registry + proxy + normalizer + flag off |
| **Sprint 2** | Validator + sync + Test Lab probe |
| **Sprint 3** | Sandbox partner service + internal pilot |
| **Sprint 4** | Design partner pilot + certification sign-off |

**Total:** ~6–8 weeks engineering after Phase 1B-A approval.

---

## 10. Recommendation summary

| Item | Choice |
|------|--------|
| **Pilot vertical** | Asset Management |
| **Pilot moduleId** | `vssyl-pilot-assets` |
| **Scope** | Business-only, read-only, single entity type |
| **Partner hosting** | Internal sandbox first → design partner second |
| **Billing** | Free tier (avoid BusinessModuleSubscription blocker) |

---

**Last updated:** 2026-06-23
