# Partner Validation Strategy

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers  
**Status:** Architecture / process — **no CLI tooling in this phase**  
**Addresses finding:** EP-18

---

## 1. Goal

Detect manifest, scope, and delegate misconfiguration **before** submission — without access to Vssyl internal tools or platform team review.

---

## 2. Validation layers

```
Layer 1 — Local manifest lint (partner-owned checklist + JSON schema mindset)
Layer 2 — Contract self-test (partner HTTPS endpoints + JWT fixtures)
Layer 3 — Staging submit (GCS-backed environment)
Layer 4 — Certification preview (post-finalize admin panel or future API)
Layer 5 — Operator probes (post-approval enablement)
```

---

## 3. Layer 1 — Manifest validation

**Input:** Your manifest object (inner `manifest` from submission JSON)

| Check | Rule | Fail action |
|-------|------|-------------|
| M1 | `name`, `version`, semver valid | Fix before submit |
| M2 | `moduleScope` present (third-party) | Required |
| M3 | `supportedContexts` aligns with scope | See [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md) |
| M4 | `permissions[]` non-empty, namespaced | e.g. `asset-register:read` |
| M5 | `frontend.entryUrl` HTTPS **or** plan bundle with `index.html` | Runtime blocked otherwise |
| M6 | `capabilities.search` → valid `searchDelegate` | [SEARCH_DELEGATE_GUIDE.md](./SEARCH_DELEGATE_GUIDE.md) |
| M7 | `capabilities.workspace` → valid `workspaceParticipation` | [WORKSPACE_BRIDGE_GUIDE.md](./WORKSPACE_BRIDGE_GUIDE.md) |
| M8 | `capabilities.activity` → valid `activityIngest` | [ACTIVITY_INGEST_GUIDE.md](./ACTIVITY_INGEST_GUIDE.md) |
| M9 | `entities[].type` covers all delegate entity types | Cross-reference tables |
| M10 | Delegate `supportedContexts` ⊆ manifest contexts | Certification fail |
| M11 | `aiContext` + ≥1 provider if AI-exposed | [MODULE_AI_SDK_BOUNDARIES.md](./MODULE_AI_SDK_BOUNDARIES.md) |
| M12 | Compare against [full-capability-partner-module.json](./full-capability-partner-module.json) | Diff missing keys |

**Tooling (future):** `vssyl-manifest-lint` CLI — not in scope 1C-A. Until then, use manual checklist + JSON diff.

---

## 4. Layer 2 — Scope validation

| Check | How to verify |
|-------|---------------|
| S1 | `moduleScope: business` → no `personal` in contexts | Static |
| S2 | Install test plan documents business admin + businessId | Process |
| S3 | Marketplace browse uses business filter | After staging publish |

---

## 5. Layer 3 — Search Delegate validation

| Step | Action |
|------|--------|
| SD1 | Deploy HTTPS POST handler at manifest URL |
| SD2 | Implement JWT verify: `aud=vssyl:search-delegate:v1`, `iss=vssyl-platform` |
| SD3 | Unit test: reject wrong `aud`, expired token |
| SD4 | Integration test: POST sample body → return 1 valid `PartnerSearchResultItem` |
| SD5 | Verify `type` in `entityTypes`; `permissions[].granted` present |
| SD6 | Confirm endpoint reachable from public internet (Cloud Run egress simulation: curl from external VPS) |

**Pre-submit:** You cannot receive real platform JWTs without install — use **contract tests** with mocked claims matching documented shape.

---

## 6. Layer 4 — Workspace validation

| Step | Action |
|------|--------|
| WS1 | iframe loads at `entryUrl` with CSP allowing Vssyl parent origin |
| WS2 | postMessage listener handles `host:init` |
| WS3 | Manual test with mock init payload (structure from [WORKSPACE_BRIDGE_GUIDE.md](./WORKSPACE_BRIDGE_GUIDE.md)) |
| WS4 | Sends `module:ready` after init |
| WS5 | UI reads tenant from init context, not URL params alone |

---

## 7. Layer 5 — Activity validation

| Step | Action |
|------|--------|
| AC1 | Document idempotency key strategy per event |
| AC2 | Unit test ingest body against [ACTIVITY_INGEST_GUIDE.md](./ACTIVITY_INGEST_GUIDE.md) schema |
| AC3 | Verify `actor.userRef` equals expected user id format |
| AC4 | Staging: after operator enablement, call token + ingest APIs end-to-end |

---

## 8. Layer 6 — Certification readiness

After `uploads/finalize`, certification runs automatically. Partner-visible signals:

| Signal | Where |
|--------|-------|
| Checklist pass/fail | Admin feedback on rejection; developer may not see until review |
| Self-assessment | Compare manifest to [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md) |

**Recommended pre-submit ritual:**

1. Complete Layers 1–5 locally  
2. Submit to **staging** environment with GCS  
3. Request operator dry-run certification feedback before production submit  

**Future (EP-18 closure):** Public `POST /api/modules/certification/preview` returning validator output without persist — **architecture placeholder**; not implemented in 1C-A.

---

## 9. Validation matrix (summary)

| Area | Local | Staging submit | Post-approval |
|------|-------|----------------|---------------|
| Manifest | ✅ Layer 1 | Auto scan | — |
| Scope | ✅ Layer 2 | Install test | — |
| Search | ✅ Layer 3 | Admin probe | Live search |
| Workspace | ✅ Layer 4 | Admin probe | User embed |
| Activity | ✅ Layer 5 | Admin probe | Live feed |
| Billing | ✅ Tier declared | Install | Entitlement |

---

## 10. Sign-off template

Before production submit, partner completes:

```
[ ] Manifest diffed against full-capability-partner-module.json
[ ] Scope guide satisfied
[ ] Search delegate contract tests pass
[ ] Workspace iframe mock init tested
[ ] Activity ingest payloads validated
[ ] HTTPS endpoints reachable externally
[ ] Read OPERATOR enablement doc — understand post-publish flags
[ ] Staging submit + scan PASSED
```

---

## 11. Related docs

- [PARTNER_CERTIFICATION_WALKTHROUGH.md](./PARTNER_CERTIFICATION_WALKTHROUGH.md)
- [PARTNER_DEVELOPER_GUIDE.md](./PARTNER_DEVELOPER_GUIDE.md)

**Last updated:** 2026-06-24
