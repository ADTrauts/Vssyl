# Production Logs and Database (Cloud Run + Cloud SQL)

## Why you’re seeing “missing columns” after a DB reset

You fully reset the DB, so there should be no schema drift. What’s actually happening:

1. **After reset, the DB is empty** (no tables, or only defaults).
2. **The schema is created only when migrations run.**  
   That happens when `prisma migrate deploy` runs successfully (at container startup or in Cloud Build).
3. **If `prisma migrate deploy` fails**, no (or only partial) schema is applied, so the DB never matches the app.
4. The app then sees “column X does not exist” because **the tables/columns were never created**, not because of drift.

So the real issue is: **migrations are failing in production.** Fixing that (and removing the obsolete “resolve” step) is what will fix the missing columns.

---

## How to find Cloud Run logs (migration errors, etc.)

### Option A: Google Cloud Console (browser)

1. Open: **https://console.cloud.google.com**
2. Select project: **vssyl-472202**
3. In the left menu: **Operations** → **Logging** → **Logs Explorer**  
   (Or search the top bar for “Logs Explorer”.)
4. In Logs Explorer:
   - **Resource type**: choose **Cloud Run Revision**.
   - **Service name**: choose **vssyl-server** (or type it).
   - In the query box you can add:  
     `textPayload=~"migration"`  
     or  
     `textPayload=~"Prisma"`  
     to focus on migration/Prisma messages.
5. Set **Time range** (e.g. Last 1 hour).
6. Click **Run query**.  
   Look for lines like:
   - `Migration command failed`
   - `=== Prisma stderr ===`
   - `does not exist in the current database`

That’s where you’ll see the real migration error (e.g. timeout, permission, SQL error).

### Option B: gcloud CLI (terminal)

From your machine (with `gcloud` logged in to the same project):

```bash
# Recent logs for vssyl-server (last 24h)
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vssyl-server" \
  --limit 100 \
  --format="value(textPayload)" \
  --freshness=1d
```

To narrow to migration/Prisma (note: regex in filter uses double quotes):

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=vssyl-server AND textPayload=~\"migration\"" \
  --limit 50 \
  --format="value(timestamp,textPayload)" \
  --freshness=1d
```

---

## Why “connecting through CLI” doesn’t reach the DB

Two different things are often meant:

### 1. Reading logs (gcloud) – this works from your machine

When you run `gcloud logging read ...` in your terminal (or when the AI suggests it in Cursor), it runs **on your machine** using **your** `gcloud` login. As long as you’re logged in and the project is correct, you **can** “connect” to GCP and read logs. No DB connection is involved.

### 2. Connecting to the database (e.g. `psql` or `prisma migrate deploy`) – often doesn’t work from a laptop

Production Postgres is on **Cloud SQL** and is not exposed to the public internet by default. So:

- **Cloud Run** can reach it (VPC / private IP / Cloud SQL connector).
- **Your laptop** usually cannot, unless you:
  - Use **Cloud SQL Auth Proxy** (recommended), or
  - Add your IP to Cloud SQL’s **Authorized networks** and use the public IP.

So:

- **“Can you connect through CLI?”**  
  - For **logs**: yes, via `gcloud` from your machine.  
  - For **database**: only if you run the proxy or open authorized networks; otherwise “connect through CLI” from your laptop will fail, and that’s expected.

---

## What was changed in code (for the reset + single baseline)

- **Obsolete resolve step removed**  
  Startup used to run `prisma migrate resolve --applied 20251026_add_hr_module_schema`, but that migration no longer exists (you only have `20260126230000_initial_schema_baseline`). That step was removed so it doesn’t confuse Prisma or clutter the logs.
- **Only `prisma migrate deploy` runs at startup**  
  On a fresh DB, that should apply the single baseline migration and create all tables.

Next step: deploy, then check the logs (Option A or B above) for the **exact** error from `prisma migrate deploy`. That message will tell you why the schema still isn’t being applied (e.g. timeout, permission, or a SQL error in the baseline).

---

## Run pricing seed in production (empty pricing table)

**Cloud Build does not run the pricing seed.** Deploy only builds and deploys code; it does not populate `pricing_configs`. If the production database was reset (or never seeded), the billing modal and admin Pricing Management page will show no tiers because `pricing_configs` is empty.

**Easiest fix: use the admin portal (no proxy or terminal needed).**

1. Deploy the app (so the latest code with the seed endpoint is live).
2. Log into production as an **admin** user.
3. Go to **Admin Portal → Pricing** (or `/admin-portal/pricing`).
4. Click the **"Seed pricing"** button. The server runs the seed against the production DB directly; you should see a success message and the table will populate.

**Alternative: run the pricing seed once from your machine against the production database.**

### 1. Get production `DATABASE_URL`

From **Secret Manager** (same value Cloud Run uses):

```bash
gcloud secrets versions access latest --secret=database-url --project=vssyl-472202
```

Copy the connection string (starts with `postgresql://`). You will use it in step 3.

### 2. Reach the production database

Production Postgres is on Cloud SQL. From your laptop you must either:

- **Option A – Cloud SQL Auth Proxy (recommended)**  
  Start the proxy so `localhost:5432` forwards to Cloud SQL, then use a `DATABASE_URL` that points at `localhost:5432` (same user/password/db name as production).  
  See: [Connect using Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy).

- **Option B – Run from Cloud Shell**  
  In [Google Cloud Console](https://console.cloud.google.com) open **Cloud Shell**. Clone the repo, install deps, then run the seed with `DATABASE_URL` set from step 1. Cloud Shell can use the project’s default access to Cloud SQL if the instance has a public IP and Cloud Shell is in the allowlist, or use the proxy there.

### 3. Run the pricing seed

From the **project root** (where `server/` and `prisma/` live), with `DATABASE_URL` set to the **production** URL:

```bash
cd server
DATABASE_URL="<paste-production-connection-string-here>" pnpm seed:pricing
```

Requirements:

- **At least one ADMIN user** must exist in production (the seed uses the first admin as `createdBy`).
- `DATABASE_URL` must be the production Cloud SQL URL (from Secret Manager).

After it runs, you should see lines like:

- `Created FREE monthly pricing: $0`
- `Created PRO monthly pricing: $29`
- etc.

Then reload the production app: the billing modal and admin Pricing Management page should show all tiers. You only need to run this once after a DB reset or on a fresh production DB; it is not part of the normal deploy.

---

## Stripe connection errors from Cloud Run (“StripeConnectionError”, “retried 3 times”)

If Admin Portal → Pricing shows “Stripe not updated – An error occurred with our connection to Stripe”, the server cannot reach `api.stripe.com`.

**Where Stripe runs:** The secret key is server-only (Express in `server/`). The web app only uses `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`. Any connection/key error is from Cloud Run `vssyl-server`. **Verify key at runtime:** Run `gcloud run services describe vssyl-server --region us-central1 --format="value(spec.template.spec.containers[0].env)"` and confirm `STRIPE_SECRET_KEY` is present. In Cloud Run logs look for `[Stripe] Key loaded at runtime, prefix: sk_test_` or `[Stripe] STRIPE_SECRET_KEY is not set at runtime...`. The backend trims the key so trailing newlines in Secret Manager will not cause "Invalid API Key".

### 1. Run the Stripe status check

As an admin, call **GET /api/pricing/stripe-status** (e.g. from the app’s API or a tool that sends your auth cookie/header). The response includes:

- **raw** – Raw HTTPS request to `api.stripe.com`. If this fails, the problem is **egress/network** (see below).
- **sdk** – Stripe Node SDK call. If **raw** is ok but **sdk** fails, the problem is likely SDK/config.
- **hint** – Short suggestion based on which check failed.

### 2. If raw HTTPS fails (egress/network)

- Cloud Run deploy uses **`--vpc-egress private-ranges-only`**, so traffic to the public internet (Stripe) should not go through the VPC. If you ever switched to **all-traffic-through-vpc**, you must have **Cloud NAT** (or equivalent) so the VPC can reach the internet; otherwise Stripe will fail.
- Check **org policies / firewall** that might block outbound HTTPS from Cloud Run.
- In **Logs Explorer** (resource: Cloud Run Revision, service: vssyl-server), search for `pricing_stripe_status` or `Stripe status check failed` and inspect the `raw` / `sdk` fields in the log entry.

### 3. If raw works but SDK fails

- Confirm **STRIPE_SECRET_KEY** in Secret Manager is the full secret key (no truncation, no extra newline). The key is only used server-side; it is not sent to the browser.
- Redeploy so the new revision picks up the secret again.
