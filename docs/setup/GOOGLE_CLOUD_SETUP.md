# Google Cloud Storage Setup Guide

## Overview
This guide explains how to configure Vssyl to use Google Cloud Storage for file storage instead of local filesystem.

## Prerequisites
1. Google Cloud Platform account
2. A Google Cloud project
3. Google Cloud Storage bucket
4. Service account with Storage Admin permissions

## Step 1: Create Google Cloud Storage Bucket

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to Cloud Storage > Buckets
4. Click "Create Bucket"
5. Choose a globally unique name (e.g., `vssyl-storage-{random-string}`)
6. Select a location (recommend: `us-central1` for better performance)
7. Choose "Standard" storage class
8. Set access control to "Uniform"
9. Click "Create"

## Step 2: Create Service Account

1. Go to IAM & Admin > Service Accounts
2. Click "Create Service Account"
3. Enter name: `vssyl-storage-service`
4. Enter description: `Service account for Vssyl file storage`
5. Click "Create and Continue"
6. Grant roles:
   - Storage Admin
   - Storage Object Admin
7. Click "Continue" and "Done"

## Step 3: Generate Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Click "Create"
6. Download the JSON file and save it securely

## Step 4: Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Storage Configuration
STORAGE_PROVIDER="gcs"
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_KEY_FILE="path/to/service-account-key.json"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"

# Other required variables...
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
# ... etc
```

## Step 5: Deploy Service Account Key

For production deployment on Google Cloud Run:

1. Upload the service account key to Google Cloud Secret Manager
2. Update the environment variable to use the secret:
   ```bash
   GOOGLE_CLOUD_KEY_FILE="projects/your-project/secrets/vssyl-storage-key/versions/latest"
   ```

## Step 6: Test Configuration

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Check the server logs for:
   ```
   ✅ Google Cloud Storage initialized
   ```

3. Test file upload through the Drive module

## File Structure

When using Google Cloud Storage, files are organized as follows:

```
your-bucket/
├── files/
│   └── {userId}-{timestamp}-{random}.{ext}
├── profile-photos/
│   └── {userId}-{photoType}-{timestamp}.{ext}
└── other-modules/
    └── ...
```

## Troubleshooting

### Common Issues

1. **"Cannot find module '@google-cloud/storage'"**
   - Run: `cd server && pnpm add @google-cloud/storage`

2. **"Authentication failed"**
   - Check service account key path
   - Verify service account has correct permissions

3. **"Bucket not found"**
   - Verify bucket name in environment variables
   - Check bucket exists in correct project

4. **"Permission denied"**
   - Ensure service account has Storage Admin role
   - Check bucket permissions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG="storage:*"
```

## Security Considerations

1. **Never commit service account keys to version control**
2. **Use Google Cloud Secret Manager in production**
3. **Rotate service account keys regularly**
4. **Use least privilege principle for service account roles**

## Migration from Local Storage

If you have existing files in local storage:

1. Set `STORAGE_PROVIDER="local"` temporarily
2. Export files using the migration script
3. Set `STORAGE_PROVIDER="gcs"`
4. Re-upload files to Google Cloud Storage

## Cost Optimization

1. **Use appropriate storage classes** (Standard, Nearline, Coldline, Archive)
2. **Set up lifecycle policies** for automatic archival
3. **Monitor usage** through Google Cloud Console
4. **Use regional buckets** to reduce egress costs

## Support

For issues with Google Cloud Storage setup:
1. Check Google Cloud Console logs
2. Review service account permissions
3. Verify bucket configuration
4. Contact support with specific error messages
