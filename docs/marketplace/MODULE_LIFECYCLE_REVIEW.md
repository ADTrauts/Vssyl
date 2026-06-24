# Module Lifecycle Review

**Program:** Marketplace & Module Ecosystem — Phase 0A Discovery  
**Date:** 2026-06-23  
**Status:** Discovery only

---

## 1. Purpose

Document the end-to-end module lifecycle from developer submission through runtime execution, including state machines, gates, and gaps.

---

## 2. Lifecycle overview

```
Developer                    Platform                         User
   │                            │                              │
   ├── submit metadata ────────►│ Module(PENDING)              │
   ├── upload artifact ────────►│ ModuleVersion(READY_FOR_REVIEW)
   │                            ├── baseline scan              │
   │                            ├── certification (advisory)   │
   │                     Admin ─┤ review                       │
   │                            ├── certification gate         │
   │                            ├── PUBLISHED + isCurrent      │
   │                            ├── Module(APPROVED)           │
   │                            ├── AI registry sync           │
   │                            │                              │
   │                            │◄──── install ────────────────┤
   │                            │ ModuleInstallation           │
   │                            │◄──── configure ──────────────┤
   │                            │◄──── runtime request ────────┤
   │                            ├── signed URL / entryUrl      │
   │                            │                              │
   │◄─── partner API calls ─────┼──────────────────────────────┤
   │    (AI context, data)      │         ModuleHost iframe    │
```

---

## 3. State machines

### 3.1 Module status (`ModuleStatus`)

| State | Installable? | Marketplace visible? | Transition triggers |
|-------|--------------|---------------------|---------------------|
| `DRAFT` | ❌ | ❌ | Rare; mostly PENDING on submit |
| `PENDING` | ❌ | ❌ | Submit |
| `APPROVED` | ✅ | ✅ | Admin approve |
| `REJECTED` | ❌ | ❌ | Admin reject |
| `SUSPENDED` | ❌ | ❌ | Admin suspend |

### 3.2 Module version status (`ModuleVersionStatus`)

```
DRAFT → UPLOADED → SCANNING → READY_FOR_REVIEW → APPROVED → PUBLISHED
                                      │                │
                                      └──── REJECTED ◄─┘
PUBLISHED → ARCHIVED (on new publish or rollback)
```

**Invariant:** At most one `isCurrent=true` per `moduleId`.

### 3.3 Upload session status (`ModuleUploadSessionStatus`)

```
INITIATED → FINALIZED | EXPIRED
         → UPLOADING (enum exists; lightly used)
         → ABORTED (enum exists; no abort endpoint found)
```

### 3.4 Artifact scan status (`ModuleScanStatus`)

```
PENDING → RUNNING → PASSED | FAILED
```

Baseline scan runs synchronously on finalize (`moduleArtifactBaselineScan.ts`).

### 3.5 Certification status (`ModuleCertificationStatus`)

```
NOT_RUN → WARNING | FAILED | PASSED
```

Re-validated on promote/rollback when validator version stale.

---

## 4. Lifecycle stages (detailed)

### Stage 1: Developer onboarding

| Step | Implementation | Status |
|------|----------------|--------|
| Create Vssyl account | Standard auth | ✅ |
| Link module to business | `POST /api/modules/link-business` | ✅ |
| Read developer guide | `docs/guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md` | ✅ |
| Developer portal API | `/api/developer` | ✅ Partial |
| Sandbox/test tenant | — | ❌ Not provisioned |
| npm SDK | — | ❌ Docs only |

### Stage 2: Submission

**Endpoint:** `POST /api/modules/submit`  
**Controller:** `moduleSubmissionController.submitModule`

| Check | Status |
|-------|--------|
| Auth required | ✅ |
| `ModuleSecurityService` validation | ✅ |
| Creates Module + ModuleSubmission | ✅ |
| Soft deprecation notice for hosted-only | ✅ (`submissionPolicy`) |
| Mandatory artifact enforcement | ❌ Not yet (90-day policy pending) |

### Stage 3: Artifact upload

**Endpoints:** `uploads/init`, GCS PUT, `uploads/finalize`

| Check | Status |
|-------|--------|
| GCS signed upload URL | ✅ |
| 500 MB size limit | ✅ |
| SHA-256 verification | ✅ |
| Baseline zip scan | ✅ |
| Smart scan layer | ✅ (`moduleArtifactSmartScan.ts`) |
| Docker sandbox | ⚠️ Best-effort; not Cloud Run viable |
| Creates ModuleVersion + ModuleArtifact | ✅ |

**Local dev gap:** Requires GCS configuration; `STORAGE_PROVIDER=local` does not exercise artifact path (`MODULE_PLATFORM_ENVIRONMENT_MATRIX.md`).

### Stage 4: Admin review

**Surfaces:** `/api/modules/submissions`, `/api/admin-portal/modules/submissions`

| Gate | Blocks approval? |
|------|------------------|
| Artifact scan PASSED | ✅ Yes (if version exists) |
| Certification FAILED | ✅ Yes |
| Certification WARNING | ❌ No (allowed) |
| Human interoperability checklist | ✅ Manual (moduleSpecs.md) |
| AI gates G1–G7 (if AI-exposed) | ✅ Manual |

**On approve:**
- Version → PUBLISHED, `isCurrent=true`
- Previous current → ARCHIVED
- Module → APPROVED
- `ModuleRegistrySyncService.syncModule`

### Stage 5: Marketplace discovery

**Endpoint:** `GET /api/modules/marketplace`

Filters: search, category, pricingTier, sortBy, scope (personal/business).

Only `status: APPROVED` modules returned.

### Stage 6: Installation

**Endpoint:** `POST /api/modules/:moduleId/install?scope=personal|business`

| Gate | Status |
|------|--------|
| Module APPROVED | ✅ |
| Business membership | ✅ |
| Policy Engine `module:install` | ✅ |
| Paid: active subscription | ✅ Personal; ⚠️ Business sub never created |
| Proprietary tier bypass (business) | ✅ For Vssyl built-ins |
| HR schedule init side effect | ✅ For hr module |
| Domain event `module.installed` | ✅ |

**Records:**
- Personal: `ModuleInstallation`
- Business: `BusinessModuleInstallation`

**Built-in exception:** Personal scope merges `BUILT_IN_MODULE_IDS` without requiring installation rows.

### Stage 7: Configuration

**Endpoint:** `PUT /api/modules/:moduleId/configure`

Updates: `configured` JSON, `enabled` boolean.  
Emits enable/disable domain events.

### Stage 8: Runtime execution

**Endpoint:** `GET /api/modules/:moduleId/runtime?scope=...&businessId=...`

Resolution order:
1. Current PUBLISHED `ModuleVersion.manifestSnapshot`
2. Fallback: `Module.manifest` (legacy)

Runtime modes:
- **Hosted:** iframe `src = frontend.entryUrl` (HTTPS)
- **Bundle:** fetch zip from signed URL → `mountZipAsBlobEntryHtml` → blob iframe

**Frontend:** `web/src/app/modules/run/[moduleId]/page.tsx` → `ModuleHost`

Sandbox: `allow-forms allow-scripts allow-same-origin`  
postMessage bridge: `host:init`, `host:settings`, resize events.

### Stage 9: Upgrade / rollback

| Action | Endpoint | Status |
|--------|----------|--------|
| Promote specific version | `POST .../versions/:version/promote` | ✅ |
| Rollback to previous | `POST .../versions/promote-previous` | ✅ |
| Developer publish new version | New upload + admin review | ✅ |
| Auto-update installed users | — | ❌ No push update mechanism |

### Stage 10: Uninstall

**Endpoint:** `DELETE /api/modules/:moduleId/uninstall`

PE gate, delete installation record, emit `module.uninstalled`.

Does not delete partner data (partner responsibility).

---

## 5. First-party module lifecycle (parallel path)

Built-in modules bypass marketplace submission:

1. **Startup registration** — `registerBuiltInModulesOnStartup()` ensures DB row
2. **Manifest reconcile** — `reconcileBuiltInManifest()` updates capabilities
3. **Always available** — personal scope without install row
4. **Business bootstrap** — core modules auto-installed on business creation
5. **In-process execution** — no iframe; native React pages

This path is **production-complete** for 12 built-in module IDs.

---

## 6. Lifecycle gaps

| Gap | Impact | Priority |
|-----|--------|----------|
| ~~No `BusinessModuleSubscription.create` anywhere~~ | ~~Business paid modules always 402~~ | ✅ Fixed Phase 1B-D |
| No auto-update push to installed users | Manual re-open for new versions | P2 |
| Upload session ABORTED/UPLOADING unused | Orphan session cleanup unclear | P3 |
| Hosted URL cutoff not enforced | Security immutability bypass | P1 |
| No uninstall data retention policy doc | Partner/user confusion | P2 |
| Third-party not in business workspace switch | Fragmented UX | P1 |
| No marketplace approval SLA tracking | Ops visibility gap | P3 |

---

## 7. Module permissions lifecycle

| Phase | Behavior | Status |
|-------|----------|--------|
| **Declare** | Manifest `permissions[]` at submit/finalize | ✅ |
| **Validate** | Certification validator checks non-empty (warn) | ✅ Partial |
| **Review** | Admin permission audit checklist | ✅ Manual |
| **Expose** | Runtime config returns approved permissions | ✅ |
| **Enforce (platform)** | Install/uninstall PE only | ✅ Partial |
| **Enforce (partner)** | Partner API auth | ✅ External |

Manifest permissions are **declarative**, not wired to Policy Engine for arbitrary partner entity actions.

---

## 8. Module configuration lifecycle

| Config layer | Storage | Scope |
|--------------|---------|-------|
| Module defaults | `manifest.settings` | Global per module |
| User/business overrides | `ModuleInstallation.configured` / `BusinessModuleInstallation.configured` | Per install |
| Runtime handoff | postMessage `host:settings` | Client iframe |

No schema validation on `configured` JSON beyond Prisma JSON type.

---

## 9. Testing coverage

| Area | Test file | Status |
|------|-----------|--------|
| Phase 7 pipeline | `moduleController.phase7.test.ts` | ✅ |
| Certification | `fullAiContractModule.certification.test.ts` | ✅ |
| Built-in manifests | `builtInModuleManifests.*.test.ts` | ✅ |
| Install policy | `moduleInstallPolicyDual` (via controller tests) | ✅ Partial |
| E2E cloud smoke | Phase 7 rollout guide (manual) | ⚠️ Manual |
| Third-party runtime E2E | — | ❌ |

---

## 10. Lifecycle maturity score

| Dimension | Score (0–5) |
|-----------|-------------|
| Submit → publish | 4 |
| Install → configure | 4 |
| Runtime execution | 3 |
| Upgrade/rollback | 4 |
| Uninstall/cleanup | 3 |
| Business billing lifecycle | 3 |
| Partner onboarding | 2 |

**Composite lifecycle maturity: 3.0 / 5**

---

**Last updated:** 2026-06-23