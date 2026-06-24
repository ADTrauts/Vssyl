# Partner Developer Guide

**Program:** Marketplace & Module Ecosystem — Phase 1C-A  
**Audience:** External developers with **zero Vssyl platform knowledge**  
**Status:** Canonical onboarding guide for marketplace partner modules  
**Last updated:** 2026-06-24

---

## 1. What you are building

A **Vssyl partner module** is:

- A **manifest** describing capabilities and permissions  
- A **UI** loaded in a sandboxed iframe (hosted HTTPS or uploaded zip bundle)  
- **Your backend** on your infrastructure (data, APIs, optional AI providers)  
- **Optional platform delegates** so your module participates in Search, Workspace, Activity, and Business billing  

Vssyl **never runs your server code** inside its API process.

---

## 2. Architecture (one page)

```
┌─────────────────────────────────────────────────────────┐
│ Vssyl Platform (trusted)                                 │
│  Submit · Certify · Install · iframe host · JWT issuer   │
│  Search orchestrator · Activity ingest · Billing gates     │
└───────────────┬─────────────────────┬───────────────────┘
                │ iframe + postMessage │ HTTPS delegates
                ▼                      ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│ Your UI (iframe)         │  │ Your APIs (partner SoR)   │
│  Workspace bridge client │  │  Search delegate endpoint │
│  Activity token client   │  │  AI context providers     │
└──────────────────────────┘  └──────────────────────────┘
```

**Trust rule:** Session tokens stay on Vssyl. Your iframe receives **bridge JWTs** only. Your APIs receive **delegate JWTs** only.

---

## 3. Read order

| # | Document | Purpose |
|---|----------|---------|
| 1 | **This guide** | End-to-end map |
| 2 | [THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | Upload, scan, publish, runtime |
| 3 | [full-capability-partner-module.json](./full-capability-partner-module.json) | Canonical manifest example |
| 4 | [REFERENCE_PARTNER_MODULE_SPEC.md](./REFERENCE_PARTNER_MODULE_SPEC.md) | Asset Register reference spec |
| 5 | [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md) | Scope rules |
| 6 | [SEARCH_DELEGATE_GUIDE.md](./SEARCH_DELEGATE_GUIDE.md) | Unified Search participation |
| 7 | [WORKSPACE_BRIDGE_GUIDE.md](./WORKSPACE_BRIDGE_GUIDE.md) | Business workspace embed |
| 8 | [ACTIVITY_INGEST_GUIDE.md](./ACTIVITY_INGEST_GUIDE.md) | Platform activity feed |
| 9 | [BUSINESS_BILLING_GUIDE.md](./BUSINESS_BILLING_GUIDE.md) | Business subscriptions |
| 10 | [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md) | Pre-submit validation |
| 11 | [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md) | Certification + probes |
| 12 | [MODULE_AI_SDK_BOUNDARIES.md](./MODULE_AI_SDK_BOUNDARIES.md) | AI context + webhooks (if AI-exposed) |
| 13 | [THIRD_PARTY_MODULE_RULEBOOK.md](./THIRD_PARTY_MODULE_RULEBOOK.md) | Reviewer must-pass list |

---

## 4. Module lifecycle

| Phase | You do | Platform does |
|-------|--------|---------------|
| **Design** | Choose scope, capabilities, entities | — |
| **Build** | UI + APIs + manifest | — |
| **Validate** | [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md) | — |
| **Submit** | `POST /api/modules/submit` | Creates pending module |
| **Upload** | init → GCS PUT → finalize | Scan artifact |
| **Certify** | Fix manifest errors | Validator v1.4.0 |
| **Review** | Respond to admin | Approve / reject |
| **Publish** | — | `APPROVED`, current version |
| **Enable** | Coordinate with operator | Flags + allowlists |
| **Install** | Business admin installs | Entitlement + installation |
| **Operate** | Monitor delegates | Probes, runtime, search |

**Important:** **Publish ≠ delegates live.** See [Post-publish enablement](#12-post-publish-enablement).

---

## 5. Getting started

### 5.1 Accounts

1. Create a Vssyl user account  
2. Access developer surfaces: `/developer-portal` or business workspace developer portal  
3. Link a developer business if required for your commercial model  

### 5.2 Environments

| Environment | Artifact upload | Notes |
|-------------|-----------------|-------|
| Production | GCS required | Standard path |
| Local dev without GCS | Upload returns **503** | Use staging bucket or hosted-only entryUrl testing |

See [MODULE_PLATFORM_ENVIRONMENT_MATRIX.md](./MODULE_PLATFORM_ENVIRONMENT_MATRIX.md).

### 5.3 Reference manifest

Copy and adapt:

**[full-capability-partner-module.json](./full-capability-partner-module.json)**

Replace all `example-partner.com` URLs with your HTTPS endpoints.

---

## 6. Submission process

### Step 1 — Submit metadata

```http
POST /api/modules/submit
Authorization: Bearer <user-token>
Content-Type: application/json
```

Body: top-level fields from reference manifest (`name`, `version`, `category`, `permissions`, `manifest`, `pricingTier`, …).

### Step 2 — Upload artifact (recommended)

```http
POST /api/modules/:moduleId/uploads/init
POST <signed-url>  (direct to GCS)
POST /api/modules/:moduleId/uploads/:sessionId/finalize
```

Include manifest snapshot in finalize body.

**Alternative:** Hosted-only module with valid `manifest.frontend.entryUrl` (see pipeline doc for deprecation policy).

### Step 3 — Wait for scan

Artifact `scanStatus` must reach **PASSED** before approval.

### Step 4 — Admin review

Platform admin reviews certification checklist, security, and probes (for capability modules).

---

## 7. Scope requirements

Every third-party module **must** declare:

```json
{
  "moduleScope": "business",
  "supportedContexts": ["business"]
}
```

Full rules: [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md)

Misaligned scope is the **#1 certification failure** for new partner manifests.

---

## 8. Search Delegate

Participate in **Unified Search** by hosting a POST endpoint Vssyl calls server-side.

| Topic | Guide |
|-------|-------|
| Manifest | [SEARCH_DELEGATE_GUIDE.md](./SEARCH_DELEGATE_GUIDE.md) |
| JWT | `aud: vssyl:search-delegate:v1` |
| Contract | [SEARCH_DELEGATE_RESULT_CONTRACT.md](../marketplace/SEARCH_DELEGATE_RESULT_CONTRACT.md) |

---

## 9. Workspace Bridge

Embed in **business workspace** (when scope allows) via iframe + postMessage.

| Topic | Guide |
|-------|-------|
| Manifest | [WORKSPACE_BRIDGE_GUIDE.md](./WORKSPACE_BRIDGE_GUIDE.md) |
| Messages | `vssyl:workspace:v1:host:init` |
| Security | Never use Vssyl session token in iframe |

---

## 10. Activity Ingest

Publish to the **platform activity feed**:

1. `POST .../activity-ingest-token` (user session)  
2. `POST .../activity-ingest` (activity JWT + event body)  

Guide: [ACTIVITY_INGEST_GUIDE.md](./ACTIVITY_INGEST_GUIDE.md)

---

## 11. Business billing

| Tier | Behavior |
|------|----------|
| `free` | Auto subscription on business install |
| `premium` / `enterprise` | Stripe subscribe before install |

Guide: [BUSINESS_BILLING_GUIDE.md](./BUSINESS_BILLING_GUIDE.md)

**Pilot recommendation:** Start with `pricingTier: free`.

---

## 12. Post-publish enablement

After admin approval, **platform operators** must:

1. Add your `moduleId` to delegate allowlists  
2. Set feature flags to `true` in target environment  
3. Restart or redeploy server  
4. Run admin probes (Search, Workspace, Billing, Activity)  

**Partners:** Request confirmation using [PARTNER_OPERATOR_RUNBOOK.md](../marketplace/PARTNER_OPERATOR_RUNBOOK.md) checklist.

Without this step, your module **installs and runs in iframe** but **Search / Activity delegates are inactive**.

---

## 13. Sandbox testing

| Test | How |
|------|-----|
| Manifest | [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md) |
| Artifact fixtures | `pnpm module-fixtures:build` (monorepo) or manual zip with `index.html` |
| Staging submit | GCS-backed staging environment |
| Delegate endpoints | External curl + contract tests |
| End-to-end | After operator enablement + business install |

---

## 14. Admin review (what to expect)

Admins verify:

- Scan passed  
- Certification checklist (validator 1.4.0)  
- Security / privacy narrative  
- Marketplace Readiness Card + probes  
- Scope and billing alignment  

Prepare: README in submission, tenant scoping statement, HTTPS endpoint list.

Walkthrough: [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)

---

## 15. AI-exposed modules

If your module is AI-aware:

- Complete `aiContext` + `contextProviders`  
- Webhook `aiActionExecutor` only (no in-process code)  
- Gates G1–G7: [MODULE_AI_SDK_BOUNDARIES.md](./MODULE_AI_SDK_BOUNDARIES.md)  

Reference: [full-ai-contract-module.json](../test-modules/full-ai-contract-module.json) (AI-only; add delegates from full-capability manifest).

---

## 16. Out of scope (today)

Do not plan for these in your first module:

- V_Link entity linking  
- Context Graph adapters  
- Platform notifications from partner activity ingest  
- AI-readable partner activity in retrieval  
- Open marketplace self-enablement without operator allowlist  

---

## 17. Quick troubleshooting

| Problem | Check |
|---------|-------|
| Upload 503 | GCS not configured in environment |
| Certification fail scope | [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md) |
| iframe blank | entryUrl HTTPS, CSP, scan passed |
| Search never shows hits | Operator flags + allowlist + delegate logs |
| Activity 403 | actor.userRef, businessId, entitlement |
| Runtime 402 | Paid module — business subscription |

---

## 18. Support model

- **Structural rules:** This guide + pipeline source of truth  
- **Review timing:** Via marketplace operator / commercial agreement  
- **Policy changes:** Pipeline doc updated first  

---

## 19. Success checklist

Before requesting production approval:

```
[ ] Manifest matches full-capability reference (if claiming all capabilities)
[ ] PARTNER_VALIDATION_STRATEGY sign-off complete
[ ] Staging scan PASSED
[ ] HTTPS delegates reachable from internet
[ ] Workspace iframe tested with mock init
[ ] Operator enablement scheduled
[ ] Business install tested on staging
```

---

**Canonical example:** [full-capability-partner-module.json](./full-capability-partner-module.json) · **Reference spec:** [REFERENCE_PARTNER_MODULE_SPEC.md](./REFERENCE_PARTNER_MODULE_SPEC.md)

**Last updated:** 2026-06-24
