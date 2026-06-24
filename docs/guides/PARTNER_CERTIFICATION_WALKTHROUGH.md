# Partner Certification Walkthrough

**Program:** Marketplace — Phase 1C-A  
**Audience:** External developers + marketplace operators  
**Validator version:** **1.4.0**

---

## 1. Overview

Certification is **automated structural validation** plus **human admin review**. Hard errors block publish; warnings may proceed with documented exceptions.

---

## 2. Lifecycle gates

```
Submit → Upload finalize → Zip scan → Certification (automatic)
  → Admin review → Approve/Publish → Operator enablement → Probes → Live
```

| Gate | Blocks publish? |
|------|-----------------|
| Artifact scan FAILED | Yes |
| Certification errors | Yes |
| Certification warnings | No |
| Admin rejection | Yes |
| Missing operator flags | No publish block — **delegates inactive** |

---

## 3. Checklist requirements (partner-relevant)

| id | Label | When evaluated | Pass criteria |
|----|-------|----------------|---------------|
| `module_id` | Module id | Always | Valid slug |
| `name` | Display name | Always | Non-empty |
| `version` | Version | Always | Semver |
| `module_scope` | Module scope | Third-party | Valid enum + alignment |
| `contexts` | Supported contexts | Always | Aligns with scope |
| `permissions` | Permissions | Always | Declared array |
| `runtime_api` | Runtime apiVersion | Always | Present |
| `runtime_type` | Runtime type | Always | iframe/bundle path valid |
| `routes` | Routes / entry | Always | entryPoint or entryUrl |
| `search_delegate` | Search delegate | `capabilities.search` | Valid block + URL |
| `workspace_participation` | Workspace | `capabilities.workspace` | Valid block |
| `activity_ingest` | Activity ingest | `capabilities.activity` | Valid block |
| `ai_context` | AI context | AI exposed | G1–G2 providers |
| `notifications_meta` | Notifications | Declared types | Metadata complete |

Full first-party checklist in `memory-bank/moduleSpecs.md` — partners meet applicable subset.

---

## 4. Capability-specific requirements

### Search Delegate

- `capabilities.search: true`
- `searchDelegate.contractVersion: "1"`
- HTTPS `url` (external partners)
- `entityTypes` non-empty; each in `entities[]` with `supportsSearch: true` where applicable

### Workspace Bridge

- `capabilities.workspace: true`
- `workspaceParticipation.contractVersion: "1"`
- `embedMode: "iframe"`
- `supportedContexts` ⊆ manifest contexts

### Activity Ingest

- `capabilities.activity: true`
- `activityIngest.contractVersion: "1"`
- `actionTypes` and `entityTypes` non-empty
- `idempotencyRequired: true` recommended

### Scope

- `moduleScope` required
- Sub-capabilities contexts ⊆ `supportedContexts`

See focused guides in `docs/guides/`.

---

## 5. Admin probes (post-approval)

Operators run from Admin Portal → Marketplace Readiness Card:

| Probe | Validates |
|-------|-----------|
| Search | Manifest + registry + live delegate round-trip |
| Workspace | Bridge init + embed contract |
| Billing | Entitlement path for business scope |
| Activity | Synthetic ingest (probe mode) |

Partner **cannot run probes** — request operator confirmation after approval.

---

## 6. Readiness card fields

| Field | Partner interpretation |
|-------|------------------------|
| `moduleScope` | Your declared scope |
| `certification.passed` | Structural validator ok |
| `searchDelegate.registered` | Platform loaded your delegate |
| `searchDelegate.enabled` | Global flag on |
| `searchDelegate.allowlisted` | Your module id in allowlist |
| Same pattern | workspace, activity |

**All three** (`registered`, `enabled`, `allowlisted`) needed for live delegates.

---

## 7. Common failures

| Error / symptom | Cause | Fix |
|-----------------|-------|-----|
| `module_scope` fail | Missing or mismatched scope | [MODULE_SCOPE_GUIDE.md](./MODULE_SCOPE_GUIDE.md) |
| `search_delegate` fail | Missing block or bad URL | [SEARCH_DELEGATE_GUIDE.md](./SEARCH_DELEGATE_GUIDE.md) |
| `workspace_participation` fail | Missing block | [WORKSPACE_BRIDGE_GUIDE.md](./WORKSPACE_BRIDGE_GUIDE.md) |
| `activity_ingest` fail | Missing block or empty actionTypes | [ACTIVITY_INGEST_GUIDE.md](./ACTIVITY_INGEST_GUIDE.md) |
| Scan FAILED no_html_entry | Bundle without index.html, no entryUrl | Add HTML or hosted URL |
| Publish 400 certification | Hard checklist errors | Fix manifest; re-finalize version |
| Probes pass but users see nothing | Flags/allowlist off | Operator runbook |
| Search empty | Delegate timeout / JWT reject | Fix partner server logs |

---

## 8. Approval criteria (operator)

Admin approves when:

- [ ] Artifact scan **PASSED**
- [ ] Certification **passed** (warnings reviewed)
- [ ] Security review complete
- [ ] Delegate URLs reachable
- [ ] Privacy / tenant scoping documented
- [ ] Probes pass (for full-capability modules)
- [ ] Enablement runbook executed

---

## 9. Partner self-assessment before submit

Use [PARTNER_VALIDATION_STRATEGY.md](./PARTNER_VALIDATION_STRATEGY.md) Layers 1–5, then compare manifest to [full-capability-partner-module.json](./full-capability-partner-module.json).

---

## 10. Related docs

- [PARTNER_DEVELOPER_GUIDE.md](./PARTNER_DEVELOPER_GUIDE.md)
- [PARTNER_OPERATOR_RUNBOOK.md](../marketplace/PARTNER_OPERATOR_RUNBOOK.md)
- [THIRD_PARTY_MODULE_RULEBOOK.md](./THIRD_PARTY_MODULE_RULEBOOK.md)

**Last updated:** 2026-06-24
