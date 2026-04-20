# Module platform: environment matrix (upload, storage, sandbox)

**Purpose:** Align expectations for third-party module upload, artifact storage, and security sandbox behavior with what each deployment environment actually supports. Addresses audit follow-up **A-051** / **F-057**.

## Module artifact upload (ZIP)

- **Code path:** `server/src/controllers/module/moduleArtifactController.ts` — `initModuleArtifactUpload` requires **`storageService.getProvider() === 'gcs'`** and a configured GCS client, or the API returns **503** (`Artifact upload requires configured Google Cloud Storage`).
- **Production:** Use **`STORAGE_PROVIDER=gcs`**, **`GOOGLE_CLOUD_PROJECT_ID`**, **`GOOGLE_CLOUD_STORAGE_BUCKET`**, and a runtime identity that can mint **V4 signed URLs** (see `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md` and production notes on signing + bucket **CORS** for browser PUTs).
- **Local dev:** **`STORAGE_PROVIDER=local`** is fine for many platform features, but **this artifact pipeline is not exercised** the same way without GCS. To test upload/finalize end-to-end locally, point dev at a **non-production GCS bucket** (or accept that ZIP upload is only validated in a GCS-backed environment).

## Baseline scan and review

- **Zip baseline scan** (`runBaselineZipScan`) runs on the artifact bytes after finalize and does **not** depend on Docker.
- **Admin review and publish guardrails** remain authoritative for promotion; see the Phase 7 rollout guide.

## Docker sandbox (`SandboxService`)

- **Implementation:** `server/src/services/sandboxService.ts` uses **dockerode** against the default Docker socket.
- **Invocation:** `server/src/services/moduleSecurityService.ts` calls `testModuleInSandbox` only after a **passed** basic security report; **sandbox errors are caught** and surfaced as recommendations / manual review rather than failing the entire flow outright.
- **Cloud Run / managed containers:** Do **not** assume a Docker daemon is available inside the API container. Treat **container-based sandbox** as **best-effort** where Docker exists (e.g. some self-hosted or local QA hosts), not as a guarantee in standard Cloud Run deployments.
- **Operators:** Rely on **GCS-backed uploads**, **artifact scan results**, **admin checklist**, and **manual review** when sandbox cannot run.

## Related docs

- `docs/deployment/MODULE_UPLOAD_PHASE7_ROLLOUT_GUIDE.md` — rollout and smoke checks
- Coding standards: storage service usage, Prisma migrations, GCS configuration
