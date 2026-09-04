# Deployment orientation

**Status:** Active Memory Bank orientation / index  
**Last verified:** 2026-09-04  
**Authority:** Navigation only — **not** deployment implementation truth

Operational truth lives under [`docs/deployment/`](../docs/deployment/).  
Do **not** infer production configuration, secrets, or procedures from Memory Bank history.

## Environment orientation (high level)

| Environment | Meaning |
|-------------|---------|
| **Local** | Developer workstation — see setup/dev guides; `pnpm dev` from repo root |
| **Production** | Hosted services — operate only via committed deployment docs and managed secrets |

## Where to start

| Need | Committed source |
|------|------------------|
| Folder index | [`docs/deployment/README.md`](../docs/deployment/README.md) |
| Production | [`docs/deployment/PRODUCTION_DEPLOYMENT.md`](../docs/deployment/PRODUCTION_DEPLOYMENT.md) |
| GCP / Cloud Run | [`docs/deployment/GOOGLE_CLOUD_DEPLOYMENT.md`](../docs/deployment/GOOGLE_CLOUD_DEPLOYMENT.md) |
| Module deploy checklist | [`docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md`](../docs/deployment/MODULE_DEPLOYMENT_CHECKLIST.md) |
| Rollback | [`docs/deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md`](../docs/deployment/CLOUD_RUN_ROLLBACK_RUNBOOK.md) |
| Migrations / auto-deploy notes | [`docs/deployment/AUTOMATIC_MIGRATION_DEPLOYMENT.md`](../docs/deployment/AUTOMATIC_MIGRATION_DEPLOYMENT.md) |
| External setup | [`docs/setup/`](../docs/setup/) |

## Safety boundary

Never commit secrets. Prefer newest committed guides over archived Memory Bank or session deploy diaries. Uncommitted local deploy experiments are not canonical until committed under `docs/deployment/`.
