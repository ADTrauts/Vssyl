# SMTP Email Setup Guide

## Quick Setup (Gmail)

### 1. Enable 2-Factor Authentication
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication if not already enabled
3. Go to "App passwords" section
4. Generate a new app password for "Vssyl"

### 2. Update cloudbuild.yaml
Replace the placeholder values in `cloudbuild.yaml`:

```yaml
SMTP_USER=your-actual-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=Vssyl <noreply@vssyl.com>
```

### 3. Deploy
```bash
git add cloudbuild.yaml
git commit -m "Add SMTP configuration"
git push
```

## Alternative Options

### SendGrid (Recommended for Production)
1. Sign up at [SendGrid](https://sendgrid.com)
2. Create an API key
3. Update cloudbuild.yaml:
```yaml
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Amazon SES
1. Set up AWS SES
2. Create SMTP credentials
3. Update cloudbuild.yaml:
```yaml
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_USER=your-ses-username
SMTP_PASS=your-ses-password
```

## Testing
After deployment, test email sending by:
1. Registering a new user
2. Checking if verification email is sent
3. Checking server logs for any SMTP errors

## Security Notes
- Never commit real SMTP credentials to git
- Use environment variables or Google Secret Manager for production
- Consider using a dedicated email service for better deliverability
