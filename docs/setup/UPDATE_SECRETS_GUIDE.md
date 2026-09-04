# Update Google Cloud Secrets - Quick Guide

## 🎯 Purpose
Update existing secrets in Google Cloud Secret Manager with new values.

---

## 📋 Prerequisites

1. **Get your new VirusTotal API key**
   - Go to https://www.virustotal.com/
   - Revoke the old exposed key
   - Generate a NEW API key
   - Copy it to your clipboard

2. **Have your database credentials ready**
   - If you're also changing the database password, have the new one ready

---

## 🔧 Method 1: Using Google Cloud Console (Easiest)

### Step 1: Update VirusTotal API Key

1. Go to: https://console.cloud.google.com/security/secret-manager?project=vssyl-472202
2. Find the secret named `virustotal-api-key`
3. Click on it
4. Click **"New Version"** button
5. Paste your NEW VirusTotal API key
6. Click **"Add new version"**

### Step 2: Verify Cloud Run Can Access It

1. Go to: https://console.cloud.google.com/run?project=vssyl-472202
2. Click on your service (likely `vssyl-server`)
3. Click **"Edit & Deploy New Revision"**
4. Go to **"Variables & Secrets"** tab
5. Verify `VIRUSTOTAL_API_KEY` is referenced from Secret Manager
6. If not, add it:
   - Click "Add Variable"
   - Select "Reference a secret"
   - Secret: `virustotal-api-key`
   - Version: `latest`
   - Mount as: **Environment variable**
   - Name: `VIRUSTOTAL_API_KEY`

7. Click **"Deploy"**

---

## 🔧 Method 2: Using gcloud CLI (Faster)

### Update VirusTotal API Key

```bash
# Replace YOUR_NEW_KEY_HERE with your actual new key
echo -n "YOUR_NEW_KEY_HERE" | gcloud secrets versions add virustotal-api-key \
  --project=vssyl-472202 \
  --data-file=-
```

### Update Cloud Run Service

```bash
gcloud run services update vssyl-server \
  --project=vssyl-472202 \
  --region=us-central1 \
  --update-secrets=VIRUSTOTAL_API_KEY=virustotal-api-key:latest
```

---

## 🗄️ Optional: Update Database Password

If you're also changing your database password:

### 1. Change the password on your database server first

Use Cloud SQL / an authorized admin channel. Do not commit the new password or a credential-bearing URL.

```bash
# Example only — use YOUR_PASSWORD via an interactive/admin session, never commit it
# ALTER USER your_db_user WITH PASSWORD 'YOUR_PASSWORD';
```

### 2. Update the secret in Google Cloud

**Console method:**
1. Go to Secret Manager
2. Find `database-url` secret
3. Click "New Version"
4. Paste the new connection string from an authorized operator channel (never paste real credentials into git-tracked docs)

**CLI method:**
```bash
# Prefer piping an env var you set locally (not committed):
# printf '%s' "$DATABASE_URL" | gcloud secrets versions add database-url --project=vssyl-472202 --data-file=-
gcloud secrets versions add database-url --project=vssyl-472202 --data-file=-
```

### 3. Update Cloud Run Service

```bash
gcloud run services update vssyl-server \
  --project=vssyl-472202 \
  --region=us-central1 \
  --update-secrets=DATABASE_URL=database-url:latest
```

---

## ✅ Verification

### Check that secrets are updated:

```bash
# List all secrets
gcloud secrets list --project=vssyl-472202

# Check latest version of a secret
gcloud secrets versions list virustotal-api-key --project=vssyl-472202
```

### Test the API:

```bash
# Check if Cloud Run service is using new secrets
gcloud run services describe vssyl-server \
  --project=vssyl-472202 \
  --region=us-central1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

## 🎯 Quick Checklist

- [ ] Revoked old VirusTotal API key
- [ ] Generated new VirusTotal API key
- [ ] Updated `virustotal-api-key` secret in Secret Manager
- [ ] (Optional) Changed database password
- [ ] (Optional) Updated `database-url` secret in Secret Manager
- [ ] Updated Cloud Run service to use latest secret versions
- [ ] Verified service is running correctly
- [ ] Tested module submission security pipeline

---

## 🚨 Important Notes

1. **Never commit secrets to git** - Always use Secret Manager
2. **Use `latest` version** - Cloud Run will automatically use the newest version
3. **Restart required** - Cloud Run needs to deploy a new revision to pick up secrets
4. **Test immediately** - Submit a test module to verify the pipeline works

---

## 📚 Next Steps

After updating secrets:

1. **Run database migration** (if schema changed):
   ```bash
   cd /Users/andrewtrautman/Desktop/Vssyl
   pnpm prisma:migrate
   ```

2. **Test the security pipeline**:
   - Go to admin portal → Module Management
   - Submit a test module
   - Verify security scanning works
   - Check Security Dashboard

---

## 🆘 Troubleshooting

**If Cloud Run can't access secrets:**
```bash
# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding virustotal-api-key \
  --project=vssyl-472202 \
  --member="serviceAccount:235369681725-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

**If malware scanning fails:**
- Check the API key is valid on VirusTotal
- Check Cloud Run logs for authentication errors
- Verify `ENABLE_MALWARE_SCANNING=true` is set

---

**Last Updated**: October 25, 2025  
**Status**: Ready to use ✅

