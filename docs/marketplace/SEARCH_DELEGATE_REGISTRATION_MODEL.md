# Search Delegate — Registration Model

**Program:** Marketplace & Module Ecosystem — Phase 1B-A  
**Date:** 2026-06-23  
**Status:** Architecture design — **implemented in Phase 1B-B** (`searchDelegateRegistry.ts`, `syncPartnerSearchDelegates.ts`)  
**Authority:** [SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md](../search/SEARCH_MODULE_COMPLIANCE_REQUIREMENTS.md) (M-02), `ModuleRegistrySyncService`

---

## 1. Question

How do partner search delegates become discoverable by `searchCapabilityService`?

---

## 2. Options evaluated

### Option A — Static Registration

Partner added manually to `searchProviderRegistry.ts` at platform deploy time.

| Pros | Cons |
|------|------|
| Same as first-party today | Requires platform deploy per partner |
| Maximum review control | Defeats marketplace purpose |
| Simple debugging | Does not scale |

**Verdict:** **Reject for partners.** Retain for first-party and platform providers (member, vlink).

---

### Option B — Manifest Registration

Published `ModuleVersion.manifestSnapshot` declares `searchDelegate`; platform loads at runtime.

| Pros | Cons |
|------|------|
| Single source of truth | Declaration alone does not guarantee safety |
| Developer self-service declaration | Risk of over-claiming `capabilities.search` |
| Aligns with marketplace versioning | Needs validation layer |

**Verdict:** **Required** as declaration layer — not sufficient alone.

---

### Option C — Certification Registration

Search enabled only after admin approval + certification gate + Test Lab probe.

| Pros | Cons |
|------|------|
| Matches existing marketplace trust model | Manual step per version |
| Blocks malicious/broken delegates pre-publish | Reviewer burden |
| Integrates with `moduleVersionCertificationGate` | — |

**Verdict:** **Required** as activation gate.

---

### Option D — Hybrid (recommended)

Combine B + C with static first-party baseline:

| Source | Registration mechanism | Activation |
|--------|------------------------|------------|
| **First-party modules** | Static `searchProviderRegistry.ts` | Deploy + manifest parity tests |
| **Platform providers** | Static (member, vlink) | Deploy |
| **Partner modules** | Manifest `searchDelegate` | Certification + admin approve + sync |

---

## 3. Formal recommendation: Hybrid (Option D)

```
Manifest declares intent (Option B)
        ↓
Certification validates shape (Option C — automated)
        ↓
Admin review + Test Lab probe (Option C — manual)
        ↓
Publish version → syncModule → dynamic registry
        ↓
searchCapabilityService resolves static ∪ dynamic
```

**No static code change per partner.**

---

## 4. Manifest schema

Stored in `ModuleVersion.manifestSnapshot` (authoritative) and mirrored in submission manifest.

```json
{
  "capabilities": {
    "search": true
  },
  "supportedContexts": ["business"],
  "entities": [
    {
      "type": "asset",
      "displayName": "Asset",
      "supportsSearch": true
    }
  ],
  "searchDelegate": {
    "contractVersion": "1",
    "url": "https://api.partner.example.com/vssyl/v1/search",
    "entityTypes": ["asset"],
    "supportedContexts": ["business"],
    "timeoutMs": 2500,
    "maxResults": 10
  }
}
```

### 4.1 Field rules

| Field | Required | Validation |
|-------|----------|------------|
| `capabilities.search` | Yes | Must be `true` to enable |
| `searchDelegate.contractVersion` | Yes | Must be `"1"` |
| `searchDelegate.url` | Yes | HTTPS; public; no IP literals |
| `searchDelegate.entityTypes` | Yes | Non-empty; parity with entities |
| `searchDelegate.supportedContexts` | Yes | Subset of manifest `supportedContexts` |
| `searchDelegate.timeoutMs` | No | Default 2500; max 3000 |
| `searchDelegate.maxResults` | No | Default 10; max 25 |

---

## 5. Lifecycle states

| Module/Version state | Delegate in registry? |
|----------------------|----------------------|
| PENDING / DRAFT | ❌ |
| READY_FOR_REVIEW | ❌ |
| APPROVED but not current | ❌ |
| PUBLISHED + `isCurrent` + scan PASSED + cert pass/warn | ✅ |
| SUSPENDED | ❌ (purged on sync) |
| Prior ARCHIVED version | ❌ |

**Rule:** Only **one active delegate per moduleId** — the current published version.

---

## 6. Sync integration

### 6.1 Extend `ModuleRegistrySyncService.syncModule`

After existing AI context registry sync:

```
1. Load current PUBLISHED ModuleVersion for moduleId
2. Parse manifestSnapshot.searchDelegate
3. If capabilities.search && searchDelegate valid:
     partnerSearchDelegateRegistry.register(moduleId, config)
   Else:
     partnerSearchDelegateRegistry.unregister(moduleId)
4. Log operation: 'partner_search_delegate_sync'
```

### 6.2 Triggers

| Event | Action |
|-------|--------|
| Admin approve/publish | `syncModule` |
| Admin promote/rollback version | `syncModule` |
| Admin suspend module | `syncModule` → unregister |
| Nightly `syncAllModules` | Reconcile drift |
| Server startup (optional) | Warm registry from DB |

### 6.3 In-memory registry structure

```typescript
interface PartnerSearchDelegateRegistration {
  moduleId: string;
  moduleName: string;
  moduleVersionId: string;
  semver: string;
  delegateUrl: string;
  contractVersion: '1';
  entityTypes: string[];
  supportedContexts: SearchTenantContext[];
  timeoutMs: number;
  maxResults: number;
  registeredAt: string;
}
```

---

## 7. Certification registration gates

### 7.1 Automated (`moduleCertificationValidator` extension)

| Check | Fail/Warn |
|-------|-----------|
| `capabilities.search` without `searchDelegate` | **Fail** |
| `searchDelegate` without `capabilities.search` | **Warn** |
| Invalid URL | **Fail** |
| Empty entityTypes | **Fail** |
| entityTypes parity | **Fail** |
| unsupported context | **Fail** |

### 7.2 Admin (`moduleVersionCertificationGate`)

Existing gate blocks publish on FAILED certification — search checks included.

### 7.3 Test Lab (manual, pre-approve)

Admin portal probe:

1. Issue test JWT for sandbox user
2. POST sample query to delegate URL
3. Validate response against [SEARCH_DELEGATE_RESULT_CONTRACT.md](./SEARCH_DELEGATE_RESULT_CONTRACT.md)
4. Store probe result on `ModuleVersion` metadata (proposed field or certification checklist item)

**Approve blocked** if probe fails (same pattern as artifact scan PASSED).

---

## 8. Unregistration & rollback

| Action | Registry effect |
|--------|-----------------|
| **Promote previous version** without search | Delegate reloaded from prior snapshot or unregistered |
| **Suspend module** | Immediate unregister |
| **Uninstall** (all users) | Delegate still in registry but install gate returns no results (recommended) OR unregister if zero installs — **pilot: keep registered, install gate filters** |

---

## 9. Parity with first-party

| Concern | First-party | Partner |
|---------|-------------|---------|
| Registry location | `searchProviderRegistry.ts` | `partnerSearchDelegateRegistry.ts` |
| `searchMethod` | `visibility_service` | `partner_http_delegate` |
| Manifest claim | `capabilities.search` | Same |
| Parity test | `assertManifestSearchProviderParity` | Extend to dynamic registry |
| Operation matrix | Row per module | Row required at cert |

`getReadySearchProviders()` merges both sources sorted by `providerId`.

---

## 10. Governance ownership

| Role | Responsibility |
|------|----------------|
| **Platform engineering** | Registry, proxy, validator |
| **Admin reviewer** | Test Lab probe + checklist |
| **Partner developer** | Manifest accuracy + delegate SLA |
| **Search capability owner** | Operation matrix + constitution compliance |

---

## 11. Registration readiness

| Level | Criteria | Status |
|-------|----------|--------|
| 0 — Unsupported | — | — |
| 1 — First Party Only | Static registry only | ✅ Today |
| 2 — Architecture Defined | Hybrid model documented | ✅ This phase |
| 3 — Pilot Ready | Sync + registry implemented | ❌ Implementation |
| 4 — Certified Partner Capability | Pilot module certified | ❌ Post-pilot |

---

**Last updated:** 2026-06-24 (Phase 1B-B — hybrid registration implemented)
