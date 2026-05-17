# Third-party module developer guide

Last updated: 2026-04-21  
Audience: External developers and partners building modules for the Vssyl marketplace  
Status: Entry point (links to authoritative specs)

## What this document is

This guide is the **onboarding index** for third-party module development. It explains what you must implement, where the technical rules live, and how submission and runtime work. **Implementation details** are in the linked documents—not duplicated here.

For the full **submission → scan → review → publish → install → runtime** specification, always read [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) next.

---

## Where to work in the product

- **Global developer portal:** `/developer-portal` (optional `?businessId=` for scoped stats)
- **Business workspace:** `/business/{businessId}/workspace/developer-portal`

Use these entry points to create submissions, manage modules, and track status after your account has marketplace/developer access.

---

## Read this material in order

1. **This guide** — scope, obligations, and links.
2. **[`THIRD_PARTY_MODULE_RULEBOOK.md`](./THIRD_PARTY_MODULE_RULEBOOK.md)** — reviewer must-pass checklist (start here if preparing for approval).
3. **[`../../memory-bank/moduleSpecs.md`](../../memory-bank/moduleSpecs.md)** — canonical module interoperability contract (permissions, events, realtime, notifications, AI context, compliance).
4. **[`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md)** — artifact upload (GCS), versioning, security scan, admin approval, runtime resolution, iframe sandboxing, size limits, legacy `manifest.frontend.entryUrl` behavior.
5. **[`NOTIFICATION_METADATA_GUIDE.md`](./NOTIFICATION_METADATA_GUIDE.md)** — declare notification types in the module manifest so the global notification center can categorize and surface your events.
6. **[`memory-bank/aiContextSystem.md`](../../memory-bank/aiContextSystem.md)** (repository) — **mandatory** AI context: keywords, patterns, context providers, and how the assistant discovers your module. Third-party modules register via the manifest/registry path described there; long-form examples also exist under [`docs/archive/guides-merged-2026/MODULE_AI_CONTEXT_GUIDE.md`](../archive/guides-merged-2026/MODULE_AI_CONTEXT_GUIDE.md) (archived reference).
7. **Operational AI runbooks** (operators / advanced debugging): [`docs/ai/README.md`](../ai/README.md).

---

## Platform constraints you must design for

Summarized from the pipeline source of truth—if anything conflicts, **the pipeline document wins**.

- **No in-process third-party code on the platform backend** — your server logic runs on **your** infrastructure or is invoked via agreed APIs/webhooks; Vssyl does not execute arbitrary partner code inside the API process.
- **Runtime UI** is loaded in a **sandboxed iframe** — hosted `frontend.entryUrl` when configured, or **bundle** mode from an approved artifact zip after scan passes.
- **Artifacts** are stored privately in **GCS**; access is via **signed URLs** after approval.
- **Semantic versioning**; published versions are **immutable**.
- **Approval** requires **security scan + admin review** before install.
- **Artifact size limit:** 500 MB per upload (see pipeline doc for current limits and policies).

---

## What a complete module typically includes

| Area | Requirement | Where to read |
|------|-------------|----------------|
| **Manifest & submission** | Valid metadata, versioning, artifact or hosted entry as allowed | Pipeline source of truth |
| **AI context** | Keywords, patterns, context providers so the assistant can answer questions about your module | `memory-bank/aiContextSystem.md` |
| **Notifications** | Manifest metadata for notification types | `NOTIFICATION_METADATA_GUIDE.md` |
| **Action execution (if applicable)** | Registry / webhook patterns as implemented for your module class | Platform team + archived examples in `docs/archive/guides-merged-2026/` |

Modules that are not AI-aware or that omit required metadata are likely to **fail review**.

---

## Required interoperability contract (must-pass for review)

Third-party modules must implement the same interoperability structure expected of first-party modules.

1. **Permission-first action flow**
   - `authorize -> execute -> emit event -> notify/realtime`
   - No event emission for unauthorized or failed actions
2. **Tenant context scoping**
   - All data access paths must scope by authorized context (personal/business/household)
3. **Normalized activity events**
   - Emit events compatible with the platform canonical event envelope in `memory-bank/moduleSpecs.md`
4. **Activity vs analytics separation**
   - Activity records are immutable "what happened" events
   - Analytics is derived/aggregated data and must not replace activity logging
5. **Realtime compatibility**
   - Realtime updates must be visibility-scoped and authorization-safe
6. **Notification metadata + payload standards**
   - Manifest metadata and event payload IDs must support notification center routing
7. **AI context compliance**
   - AI context providers are mandatory for AI-exposed modules

Modules that fail these contract requirements should be rejected during review until corrected.

---

## Enforcement path (review → approval)

1. **Automated:** Security scan and artifact gates from [`THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`](./THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md) (zip scan, versioning, admin workflow).
2. **Human review:** Approvers confirm the [module certification checklist](../../memory-bank/moduleSpecs.md#module-certification-checklist-must-pass) (same items first-party modules must meet). No publish if permissions, scoping, activity, or AI obligations are missing or undocumented.
3. **Repo tooling:** Internal contributors also follow `.cursor/rules/module-interoperability.mdc` so partner-facing rules and monorepo rules stay aligned.

Partners should expect **request changes** or **reject** until the manifest, declared APIs/webhooks, and privacy/scoping story match the contract.

---

## First-party (internal) vs third-party (partner)

Developers working **inside the Vssyl monorepo** also follow `.cursor/rules/module-development.mdc` and built-in registration patterns. That file is **tooling- and repo-centric**. If you are **only** shipping a marketplace module artifact, treat **this guide + the pipeline source of truth + `aiContextSystem.md`** as your contract; use the internal rulebook only where your team overlaps with core platform code.

---

## Testing and fixtures

- **[`docs/test-modules/README.md`](../test-modules/README.md)** — sample manifests and flows to validate submission, upload finalization, review, and runtime behavior end-to-end where applicable.
- **Deployment smoke / rollout** (operators): [`docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md`](../deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md).

---

## Review, support, and SLAs

- **Review timing** and **escalation** are defined by the **current marketplace operator**—there is no fixed public SLA in this repository. Use the in-app developer/admin flows or your **commercial/partner** agreement for support channels.
- **Policy changes** (scan rules, manifest required fields) will be reflected in the **pipeline source of truth** first; watch that document when preparing a new submission.

---

## Published URL (web app)

The Submit Module page links to this guide using the GitHub `main` copy by default. To point partners at another host (for example a future docs subdomain), set `NEXT_PUBLIC_THIRD_PARTY_DEVELOPER_GUIDE_URL` in the web app environment.

---

## Related index

- All implementation guides: [`docs/guides/README.md`](./README.md)
- Top-level docs map: [`docs/README.md`](../README.md)
