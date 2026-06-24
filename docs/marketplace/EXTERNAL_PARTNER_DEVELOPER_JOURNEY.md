# External Partner — Developer Journey

**Program:** Marketplace & Module Ecosystem — Phase 1C  
**Date:** 2026-06-24  
**Status:** Journey audit — **external developer perspective**  
**Audience:** Marketplace operators, documentation authors, pilot partners

---

## 1. Journey map

```
Developer account
       ↓
Documentation discovery
       ↓
Manifest authoring (scope + capabilities + AI)
       ↓
Build UI + partner HTTPS APIs (delegates)
       ↓
Artifact zip (optional) + hosted entryUrl
       ↓
POST /api/modules/submit
       ↓
POST uploads/init → GCS PUT → uploads/finalize
       ↓
Automated zip scan
       ↓
Admin review + certification gate
       ↓
Publish (APPROVED + isCurrent version)
       ↓
Platform ops: feature flags + allowlist  ← hidden today
       ↓
Business admin: install module
       ↓
Business billing / entitlement (if applicable)
       ↓
Runtime: GET /api/modules/:id/runtime
       ↓
Workspace embed + bridge JWT (postMessage)
       ↓
Search: platform proxy → partner searchDelegate URL
       ↓
Activity: activity-ingest-token → activity-ingest
```

---

## 2. Stage-by-stage audit

### Stage 1 — Developer account & portal

| Step | What partner does | Platform surface | Friction |
|------|-------------------|------------------|----------|
| Register / login | Create Vssyl account | Standard auth | Low |
| Find developer tools | Navigate to developer portal | `/developer-portal` or `/business/{id}/workspace/developer-portal` | **Medium** — portal emphasizes revenue/analytics; submission flow not primary CTA |
| Link developer business | Optional for business-scoped stats | Business membership | **Medium** — not documented in single “start here” path |

**Finding:** Developer portal exists but is **operator/revenue oriented**; submit-module flow is separate from portal landing (EP-03).

---

### Stage 2 — Documentation

| Step | Expected doc | Actual state | Friction |
|------|--------------|--------------|----------|
| Start here | Single onboarding path | [`THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md`](../guides/THIRD_PARTY_MODULE_DEVELOPER_GUIDE.md) (2026-04-21) | **High** — predates Phase 1B delegates |
| Rulebook | Must-pass checklist | [`THIRD_PARTY_MODULE_RULEBOOK.md`](../guides/THIRD_PARTY_MODULE_RULEBOOK.md) | **Medium** — no delegate gates listed |
| Pipeline | Upload/runtime | [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](../guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) | Low for upload; good authority |
| AI contract | Context + executor | [`MODULE_AI_SDK_BOUNDARIES.md`](../guides/MODULE_AI_SDK_BOUNDARIES.md) | Low for AI-only modules |
| **Search delegate** | Partner HTTPS contract | Only `docs/marketplace/` | **Critical** — not in guides index |
| **Workspace bridge** | postMessage + JWT | Only `docs/marketplace/` | **Critical** |
| **Activity ingest** | Token + ingest body | Only `docs/marketplace/` | **Critical** |
| **Module scope** | `moduleScope` enum | [`MODULE_SCOPE_STANDARD.md`](./MODULE_SCOPE_STANDARD.md) | **High** — marketplace doc, not linked from developer guide |

**Finding:** External developer reading **only** `docs/guides/` cannot implement Phase 1B capabilities (EP-04).

---

### Stage 3 — Manifest authoring

| Requirement | Validator | Reference manifest | Friction |
|-------------|-----------|-------------------|----------|
| `moduleScope` + contexts | v1.3.0+ required | `full-ai-contract-module.json` has scope | Partial |
| `searchDelegate` block | v1.2.0+ when `capabilities.search` | **None external** | **Critical** |
| `workspaceParticipation` | v1.2.0+ when `capabilities.workspace` | **None external** | **Critical** |
| `activityIngest` | v1.4.0 when `capabilities.activity` | **None external** | **Critical** |
| AI context G1–G7 | v1.1.0+ | `full-ai-contract-module.json` | Low |
| Entity alignment | entities[] vs delegate types | Undocumented cross-field rules | **High** |

Certification errors (e.g. `UNKNOWN_ACTION`, missing `activityIngest`) are **machine-readable** but **not explained** in partner-facing prose (EP-05).

---

### Stage 4 — Build & host

| Component | Partner builds | Platform expectation | Friction |
|-----------|----------------|---------------------|----------|
| iframe UI | SPA at HTTPS `frontend.entryUrl` or zip entry | Sandbox iframe / bundle | Medium — CORS, CSP on partner side |
| Search delegate API | POST endpoint accepting platform JWT | Fixed URL in manifest at publish | **High** — JWT verification docs internal |
| Workspace iframe | Listen for `vssyl:workspace:v1:host:init` | Bridge JWT in payload | **High** — no starter template in repo for external use |
| Activity ingest | Call platform ingest after token exchange | Platform normalizes to feed | **High** — two-step JWT flow undocumented externally |
| Partner SoR | Tenant-scoped data store | Partner enforces scoping | **Medium** — honor system |

---

### Stage 5 — Artifact & submission

| Step | API | Friction |
|------|-----|----------|
| Submit metadata | `POST /api/modules/submit` | Low if JSON valid |
| Init upload | `POST /api/modules/:id/uploads/init` | **503 without GCS** on local/default env (EP-06) |
| PUT artifact | Signed URL to GCS | **Bucket CORS** must allow browser PUT (EP-07) |
| Finalize | `POST .../uploads/:sessionId/finalize` | Medium — manifest snapshot at finalize |
| Scan | Automated baseline | Low; fixtures in repo (`pnpm module-fixtures:build`) but **repo-only** |

**Finding:** Partner without GCS-backed staging cannot test upload path end-to-end (EP-06).

---

### Stage 6 — Certification

| Check | Partner visibility | Friction |
|-------|-------------------|----------|
| Structural validator | Admin portal panel after finalize | Partner sees results **only via admin feedback** |
| Scope alignment | Checklist item `contexts` | Error messages require reading validator source or marketplace docs |
| Delegate blocks | `search_delegate`, `workspace_participation`, `activity_ingest` | **No partner-facing checklist** (EP-08) |
| Publish gate | Hard block on errors | Good safety; poor discoverability pre-submit |

**Walkthrough conclusion:** Certification is **enforceable** but **not understandable** without internal knowledge today.

---

### Stage 7 — Admin review & sandbox

| Step | Actor | Friction |
|------|-------|----------|
| Review submission | Platform admin | Low — mature admin UI |
| Run readiness card | Admin | **Partner cannot self-serve** |
| Run probes | Admin | Partner blocked until ops runs probes |
| Approve / publish | Admin | Low |
| Enable delegate flags | **Platform ops** | **Critical hidden step** (EP-02) |

Docker sandbox (`SandboxService`) is **best-effort** — not guaranteed on Cloud Run (EP-09).

---

### Stage 8 — Install & runtime

| Step | API / UI | Friction |
|------|----------|----------|
| Browse marketplace | Scoped by `moduleScope` | Low |
| Install business module | Install API + membership | Medium — business admin role required |
| Entitlement | Free vs paid | Paid requires Stripe config (EP-10) |
| Runtime config | `GET /api/modules/:id/runtime` | Low |
| Bundle mode | Client unzip + blob URL | **Undocumented in developer guide** detail (in pipeline doc) |

Scope enforcement rejects wrong-context installs — **good** but partner must declare scope correctly upfront.

---

### Stage 9 — Search participation

| Step | Flow | Friction |
|------|------|----------|
| User searches | `POST /api/search` | Transparent to partner |
| Platform | PE `search:read` → issue delegate JWT → POST partner URL | Partner must verify JWT |
| Partner returns | `PartnerSearchResultItem[]` | Contract in marketplace doc only |
| Normalization | Platform pins `moduleId` | Partner cannot spoof module |

Failure mode: empty partner slice — partner may not know search failed silently (EP-11).

---

### Stage 10 — Workspace embed

| Step | Flow | Friction |
|------|------|----------|
| Business workspace route | `PartnerModuleWorkspaceEmbed` | Business context only |
| Host → iframe | postMessage init + bridge JWT | Partner must implement listener |
| Partner UI | Uses JWT claims for tenant | No external SDK / npm package |

---

### Stage 11 — Activity ingest

| Step | Flow | Friction |
|------|------|----------|
| Session user action | Partner requests token | `POST .../activity-ingest-token` |
| Partner POST event | `POST .../activity-ingest` + JWT | Idempotency key required |
| Platform | normalize → `emitModuleActivityEvent` | Partner never writes DB directly |

Two-step JWT flow + actor.userRef matching token subject — **easy to get wrong** without examples (EP-12).

---

## 3. Friction heat map

| Severity | Stages affected |
|----------|-----------------|
| **Critical** | Documentation (delegates), manifest templates, ops enablement |
| **High** | Workspace bridge implementation, activity token flow, GCS local dev |
| **Medium** | Developer portal discoverability, certification error interpretation, paid billing |
| **Low** | Core submit API, admin approval UI, scope enforcement |

---

## 4. Minimum viable external path (today)

A developer **can** succeed today if they:

1. Read pipeline + AI guides for **iframe-only AI module** (no delegates), **or**
2. Receive **undocumented** marketplace contract docs + operator enablement for delegates

**Full capability participant path is not self-service.**

---

## 5. Related documents

- [EXTERNAL_PARTNER_PILOT_PLAN.md](./EXTERNAL_PARTNER_PILOT_PLAN.md)
- [EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md](./EXTERNAL_PARTNER_DOCUMENTATION_AUDIT.md)
- [EXTERNAL_PARTNER_FINDINGS_REGISTER.md](./EXTERNAL_PARTNER_FINDINGS_REGISTER.md)

---

**Last updated:** 2026-06-24
