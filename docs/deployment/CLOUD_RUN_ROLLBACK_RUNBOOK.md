# Cloud Run rollback and release recovery

Operational reference for Vssyl production on **Google Cloud Run** (see `cloudbuild.yaml` for image names and regions).

## Preconditions

- `gcloud` authenticated with access to project **`vssyl-472202`** (or your active deploy project).
- Know which service failed: **`vssyl-server`**, **`vssyl-web`**, or both.

## List recent revisions

```bash
gcloud run revisions list --service=vssyl-server --region=us-central1 --project=vssyl-472202
gcloud run revisions list --service=vssyl-web --region=us-central1 --project=vssyl-472202
```

Note the last **healthy** revision name (traffic was 100% there before the bad deploy).

## Roll back traffic to a previous revision

Point **100% traffic** at a known-good revision (replace `REVISION_NAME`):

```bash
gcloud run services update-traffic vssyl-server \
  --region=us-central1 \
  --project=vssyl-472202 \
  --to-revisions=REVISION_NAME=100
```

Repeat for **`vssyl-web`** if the frontend image was bad.

Alternatively, use **Cloud Console → Cloud Run → service → Revisions → Manage traffic** and move traffic to the previous revision.

## Failed startup / database migrations

Production server **fails fast** if migrations or DB readiness checks fail (`server/src/index.ts` bootstrap). Symptoms:

- New revision fails readiness; **Dockerfile** healthcheck uses **`GET /api/ready`** (database-backed).

**Do not** roll forward until the cause is fixed (migration SQL, `DATABASE_URL`, or Cloud SQL connectivity).

1. Roll back traffic to the last good revision (above).
2. Fix migration or schema in a branch; run **`pnpm prisma migrate status`** / **`migrate deploy`** against a staging DB before redeploying.
3. Redeploy via your normal pipeline after CI passes.

## Stripe / webhooks after a rollback

- **Webhook signature verification** uses the same `STRIPE_WEBHOOK_SECRET` as at deploy time; rolling back the server does not change secrets unless you changed them.
- If events were missed during an outage, use **Stripe Dashboard → Developers → Events** to identify failures and **replay** after the service is healthy.

## Pre-deploy checklist (minimum)

- CI green: **`pnpm type-check`**, **`pnpm test`**, and migrations applicable to the target DB (see `README` / `.github/workflows/ci.yml`).
- Confirm **secrets** and **env vars** for the Cloud Run service match what the release needs (no accidental localhost URLs in production).

## Related

- **Artifact Registry** images: `us-central1-docker.pkg.dev/$PROJECT_ID/vssyl/vssyl-server` and `vssyl-web` (tags `latest` and `$BUILD_ID`).
- **Memory bank:** `memory-bank/` and `docs/plans/SYSTEM_AUDIT_SOURCE_OF_TRUTH.md` (F-060, F-061, F-064).
