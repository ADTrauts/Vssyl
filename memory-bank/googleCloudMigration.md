# Google Cloud Migration — Historical

**Status:** Historical / sanitized (2026-09 security remediation)  
**Authority:** Not current deployment guidance. Not a secrets or connection-string source.

The original Memory Bank migration document contained obsolete operational details and **credential-bearing configuration**. That material was intentionally removed and is **not** preserved.

## Current guidance

| Topic | Location |
|-------|----------|
| Deployment / Cloud Run / Cloud Build | [`docs/deployment/README.md`](../docs/deployment/README.md) |
| Manual Cloud Build deploy | [`docs/deployment/MANUAL_CLOUD_BUILD_DEPLOY.md`](../docs/deployment/MANUAL_CLOUD_BUILD_DEPLOY.md) |
| Secret Manager updates | [`docs/setup/UPDATE_SECRETS_GUIDE.md`](../docs/setup/UPDATE_SECRETS_GUIDE.md) |
| Production DB / logs orientation | [`docs/deployment/PRODUCTION_LOGS_AND_DB.md`](../docs/deployment/PRODUCTION_LOGS_AND_DB.md) |
| Stack orientation | [`techContext.md`](./techContext.md) |

## Historical outcome (non-secret)

- Vssyl production was migrated onto Google Cloud (Cloud Run, Cloud SQL, Cloud Storage, Secret Manager).
- Runtime database connectivity for `vssyl-server` is supplied via **Secret Manager** (`database-url`), not via repository literals.
- Literal production credentials must **never** be stored in Memory Bank, docs, scripts, or archives.

## Policy

Historical implementation notes may be archived. **Credentials and secret payloads must be redacted**, not preserved as evidence. Placeholders only in documentation; runtime secrets belong in managed secret systems.
