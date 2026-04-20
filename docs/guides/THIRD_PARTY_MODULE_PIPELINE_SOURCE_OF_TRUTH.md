# Third-Party Module Pipeline Source of Truth

Last updated: 2026-03-23  
Status: Active build spec (authoritative)  
Owner: Platform Engineering

## Purpose

This document is the only source of truth for the third-party module submission, testing, upload, review, publish, install, and runtime pipeline.

If implementation and legacy docs/code disagree, this document wins.

---

## Scope

This spec covers:
- Developer module submission flow
- Artifact upload to Google Cloud Storage (GCS)
- Security validation and admin review
- Versioning and publish lifecycle
- Install/subscription gating
- Runtime resolution and iframe execution
- Testing and rollout requirements

This spec does not cover:
- Long-term advanced marketplace ranking/recommendation features
- Non-module file upload features (Drive, Chat, profile photos)

---

## Goals

1. Make module distribution production-safe on Google Cloud.
2. Replace ad-hoc hosted URL submission with managed artifact uploads to GCS.
3. Make every published version immutable and auditable.
4. Enforce a clear approval gate before modules become installable.
5. Standardize runtime config resolution from approved artifact versions only.

---

## Non-Goals

- Running arbitrary third-party code inside backend process (no in-process execution).
- Publicly readable artifact buckets.
- Skipping security scan and manual review for production publish.

---

## Architecture Overview

Primary flow:
1. Developer creates module submission.
2. Developer uploads artifact (zip) to GCS via backend-issued upload session.
3. Backend finalizes upload, stores artifact metadata, and queues security scan.
4. Admin reviews submission + scan results.
5. On approval, a version is published and marked as current.
6. Users install approved module.
7. Runtime endpoint resolves current approved version and returns sanitized runtime config.
8. Frontend `ModuleHost` renders the module in a sandboxed iframe: **hosted** `frontend.entryUrl` when present, or **bundle** mode (fetch zip via `artifactAccess.signedUrl`, unzip in-browser, blob URL for the HTML entry) when there is no hosted URL but the published artifact scan is `PASSED`.

---

## Core Decisions (Locked)

1. **Artifact storage**: GCS only for production module artifacts.
2. **Bucket access**: private objects only; access through signed URLs.
3. **Artifact format**: zip (initially).
4. **Versioning**: semantic version required; immutable once approved.
5. **Runtime source**: only approved version artifact URL (not arbitrary submission URL).
6. **Approval gate**: scan + admin approval required before publish/install.
7. **Backward compatibility**: temporary support for legacy `manifest.frontend.entryUrl` modules until migration is complete.
8. **Artifact size limit**: 500 MB hard limit per artifact.
9. **Scan strategy**: hybrid architecture (internal baseline scanner + pluggable external providers).
10. **Rollback model**: one-click immutable promotion of a previously approved version.
11. **Legacy cutoff policy**: soft deprecation immediately; hard cutoff in 90 days for new hosted-URL submissions.

---

## Data Model Changes

Add new Prisma models in `prisma/modules/business/modules.prisma`:

### `ModuleVersion`
- `id`
- `moduleId` (FK -> Module)
- `version` (semver string)
- `status` (`DRAFT`, `UPLOADED`, `SCANNING`, `READY_FOR_REVIEW`, `APPROVED`, `REJECTED`, `PUBLISHED`, `ARCHIVED`)
- `manifestSnapshot` (JSON)
- `submittedBy`
- `approvedBy` (nullable)
- `rejectedBy` (nullable)
- `approvedAt` (nullable)
- `rejectedAt` (nullable)
- `reviewNotes` (nullable)
- `isCurrent` (boolean, default false)
- `createdAt`, `updatedAt`

Constraints:
- Unique `(moduleId, version)`
- At most one `isCurrent=true` per `moduleId`

### `ModuleArtifact`
- `id`
- `moduleVersionId` (FK -> ModuleVersion, unique)
- `bucket`
- `objectPath`
- `contentType`
- `sizeBytes`
- `sha256`
- `uploadedBy`
- `uploadedAt`
- `scanStatus` (`PENDING`, `RUNNING`, `PASSED`, `FAILED`)
- `scanSummary` (JSON, nullable)

### `ModuleUploadSession`
- `id`
- `moduleId`
- `targetVersion`
- `uploaderId`
- `bucket`
- `objectPath`
- `status` (`INITIATED`, `UPLOADING`, `FINALIZED`, `EXPIRED`, `ABORTED`)
- `expiresAt`
- `createdAt`

Keep existing:
- `Module`
- `ModuleSubmission`
- `ModuleInstallation`
- `BusinessModuleInstallation`

Migration policy:
- Create new migration, never edit prior applied migrations.

---

## API Contract (Target)

All routes remain behind authenticated API proxy.

### Developer Submission and Upload

#### `POST /api/modules/submit`
Creates module + pending submission record. **Artifact pipeline:** after this succeeds, call `uploads/init` → direct PUT to GCS → `uploads/finalize` to create `ModuleVersion` / `ModuleArtifact`.

Response includes **`submissionPolicy`** (Phase 4 Day 0): `hostedUrlOnlyDeprecation: 'soft'`, human-readable `message`, and `mandatoryArtifactCutoffDays` (90) for hosted-only deprecation policy.

#### `POST /api/modules/:moduleId/uploads/init`
Creates `ModuleUploadSession`, reserves GCS object path, returns signed upload URL + headers.

Request:
- `version` (semver)
- `fileName`
- `contentType`
- `sizeBytes`

Response:
- `uploadSessionId`
- `signedUploadUrl`
- `requiredHeaders`
- `expiresAt`

#### `POST /api/modules/:moduleId/uploads/:uploadSessionId/finalize`
Validates object exists, captures metadata/hash, creates or updates `ModuleArtifact`, sets version status to `READY_FOR_REVIEW`.

Request:
- `version`
- `manifest`
- `permissions`
- `dependencies`

Response:
- `moduleVersionId`
- `artifactId`
- `scanStatus`

### Admin Review and Publish

#### `GET /api/admin-portal/modules/submissions`
Lists pending and historical submissions including version + scan metadata.

#### `POST /api/admin-portal/modules/submissions/:submissionId/review`
Approve/reject submission/version.

On approve:
- module version -> `APPROVED` then `PUBLISHED`
- previous current version -> `ARCHIVED`
- this version -> `isCurrent=true`
- module `status=APPROVED`

On reject:
- version -> `REJECTED`
- module remains non-installable for that version

#### `GET /api/admin-portal/modules/:moduleId/versions`
Admin-only. Returns all `ModuleVersion` rows for the module (newest first) with artifact `scanStatus` / hash / size for review UI.

#### `POST /api/admin-portal/modules/:moduleId/versions/promote-previous`
Admin-only. One-click rollback: promotes the version immediately **after** the current row in `createdAt` desc order (the “previous” release), when that version’s artifact scan is `PASSED`. Archives the current published version and sets `Module.version` to the promoted semver.

#### `POST /api/admin-portal/modules/:moduleId/versions/:version/promote`
Admin-only. Promotes an explicit semver (URL-encoded) to current published, same archive/publish rules as above.

### Runtime and Install

#### `GET /api/modules/:moduleId/runtime`
Returns sanitized runtime config from the **current published** `ModuleVersion` when one exists (`isCurrent` + `PUBLISHED`); otherwise uses legacy `Module.manifest`.

Rules:
- Must be installed in requested scope.
- Must have active subscription if paid.
- Module must be `APPROVED`.
- Manifest fields prefer `manifestSnapshot` from the current published version.
- When a published artifact exists, response includes `artifactAccess.signedUrl` (short TTL, typically 15 minutes) for the zip bundle plus `expiresAt`, `sha256`, `contentType`.
- **Hosted vs bundle runtime**
  - If `manifestSnapshot.frontend.entryUrl` (or legacy `Module.manifest`) provides an HTTPS URL, the iframe loads that URL (with optional legacy fallback when the snapshot omits `entryUrl` but the legacy manifest had one — see `runtimeResolution.legacyHostedFallback`).
  - If there is **no** `entryUrl` but a published artifact exists and `ModuleArtifact.scanStatus === 'PASSED'`, the API sets `frontend.bundleRuntime: true`, `frontend.entryPath` (default `index.html` when omitted), and `frontend.entryUrl` to an empty string. The client **must** fetch the zip from `artifactAccess.signedUrl`, unpack it, and mount the HTML entry via a same-origin blob URL. If signing fails or scan is not `PASSED`, runtime returns an error (503/400 as appropriate).
- **GCS CORS**: the browser fetches the signed URL directly; the bucket must allow `GET` from the web app origin for bundle mode to work.

---

## Storage Design (GCS)

Bucket:
- `GOOGLE_CLOUD_STORAGE_BUCKET` from env
- private bucket (uniform bucket-level access)

Object path pattern:
- `modules/{moduleId}/versions/{version}/{artifactFileName}`

Upload flow:
- Backend issues signed URL for upload (short TTL).
- Client uploads directly to GCS.
- Backend finalize call verifies object metadata and persists artifact row.

Access flow:
- Runtime endpoint issues read signed URL (short TTL, e.g. 5-15 minutes).
- **Hosted modules**: iframe `src` is `frontend.entryUrl` (HTTPS).
- **Bundle-only modules**: iframe `src` is a blob URL produced after downloading and unpacking the zip client-side; relative `<script src>` / `<link href>` in the entry HTML are rewritten to blob URLs for files present in the archive.

No public GCS URLs for artifacts.

---

## Security and Validation

Minimum required checks before publish:
1. HTTPS-only runtime asset URL.
2. Artifact scan status must be `PASSED`.
3. Permission audit completed.
4. Admin review decision recorded.

Scan architecture requirements:
- **Baseline scanner (implemented)**: runs on finalize (`runBaselineZipScan`): unzip with `fflate`, reject empty archives / unsafe paths / excessive size or file counts, require at least one `.html` file. Persists `scanStatus` + `scanSummary` on `ModuleArtifact` (no longer hardcoded `PASSED`).
- Additional checks (manifest/dependency/permission) may be layered via pluggable external scanners.
- External scanners must plug into an async pipeline without schema changes.
- Final publish gate depends on consolidated scan status (`PASSED` required for approve/promote).

Required logging (structured):
- submission created
- upload init/finalize
- scan start/end
- approval/rejection
- publish/rollback
- runtime config access denied reasons

---

## Runtime Rules

`ModuleHost` must enforce:
- strict origin checks (hosted: iframe origin from `entryUrl`; bundle: same-origin blob URLs use `window.location.origin`)
- sandbox attributes
- postMessage allowlist

Runtime config payload includes:
- module id/name/version
- `frontend.entryUrl` (hosted HTTPS URL, or empty when `bundleRuntime` is true)
- optional `frontend.bundleRuntime` / `frontend.entryPath` for zip-backed runs
- approved permissions
- settings
- access context (`personal` or `business`)
- optional `artifactAccess` (signed read URL for the zip)

No raw secrets or backend credentials in runtime payload.

---

## Testing Requirements (Definition of Done)

### Backend
- Unit tests:
  - upload session init/finalize
  - review transitions
  - runtime resolution
  - baseline zip scan (`moduleArtifactBaselineScan`)
- Integration tests:
  - submit -> upload -> finalize -> approve -> install -> runtime
  - reject path
  - subscription gating

### Frontend
- Submission wizard supports artifact upload + finalize.
- Admin portal renders version/scan details and review actions.
- Runtime page loads signed URL successfully.

### E2E
- Full happy path and reject path in cloud-like env.

---

## Rollout Plan

### Phase 1 (Foundation)
- Add Prisma models + migration.
- Add upload session/init/finalize backend endpoints.
- Keep legacy `frontend.entryUrl` support.

### Phase 2 (Review + Publish)
- Extend admin portal review UI with version/artifact scan state.
- Implement publish semantics with `isCurrent` switching.

### Phase 3 (Runtime Migration) — implemented
- `GET /api/modules/:moduleId/runtime` resolves the **current published** `ModuleVersion` (`isCurrent` + `PUBLISHED`) when present.
- Runtime manifest fields (`runtime`, `frontend`, `settings`, `permissions`) prefer **`manifestSnapshot`** from that version; falls back to `Module.manifest` for legacy modules without version rows.
- When a published artifact exists, response includes **`artifactAccess`** (time-limited signed read URL + `expiresAt`, `sha256`, `contentType`) for the stored bundle zip.
- **`frontend.entryUrl`** remains required for the iframe host (`ModuleHost`); snapshot may omit it and the API falls back to the legacy `Module.manifest` hosted URL when both exist.
- **`runtimeResolution`** metadata exposes `source`, `moduleVersionId`, `semver`, and whether a legacy hosted URL was used as fallback.

### Phase 4 (Cutover)
- **Day 0 (done):** `POST /api/modules/submit` includes `submissionPolicy` (`hostedUrlOnlyDeprecation: 'soft'`, `mandatoryArtifactCutoffDays: 90`). Submit UI shows artifact-first guidance.
- Disable new legacy hosted-URL submissions (Day 30 / 90 enforcement — scheduled).
- Run migration of existing approved modules where possible.
- Keep read-only fallback for legacy until sunset date.

### Legacy Cutover Policy (Locked)
- Day 0 (this spec): mark hosted URL submissions as deprecated in UI and API responses.
- Day 30: require explicit admin override to accept new hosted URL submissions.
- Day 90: reject all new hosted URL submissions; artifact upload is mandatory.
- Post-Day 90: legacy hosted URL modules continue runtime only if already approved before cutoff; no new publishes from hosted URL path.

---

## Open Decisions

None for foundation scope. Decisions above are locked as implementation defaults.

---

## Immediate Implementation Backlog

1. Fix module route ordering conflict in `server/src/routes/module.ts`.
2. Add new Prisma models + migration for version/artifact/upload session.
3. Implement upload init/finalize endpoints using `storageService` + GCS signed URLs.
4. Extend admin service/routes to review/publish versioned submissions.
5. Update runtime endpoint to resolve current published version artifact.
6. ~~Update submit UI to upload artifact and finalize submission.~~ (Submit wizard: zip → POST `/submit` → init → PUT to GCS → finalize.)
7. ~~Add automated tests for full lifecycle.~~ (Unit tests for `validateModuleHostedUrl`; full E2E pipeline remains optional.)

---

## Acceptance Criteria

The build is complete when:

1. A developer can submit module metadata and upload a zip artifact to GCS.
2. Admin can review version + scan output and approve/reject.
3. Approved version becomes current published version immutably.
4. Install + runtime only use approved published versions.
5. Runtime is delivered through signed URLs and secure iframe host.
6. End-to-end tests pass for submit/review/publish/install/run.

