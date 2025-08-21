# Environment Setup Guide

## NextAuth.js Configuration

To fix the NextAuth.js SSR errors, you need to create a `.env.local` file in the `web/` directory with the following variables:

```env
# NextAuth.js Configuration
NEXTAUTH_SECRET=your-super-secret-key-change-this-in-production
NEXTAUTH_URL=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Backend Environment

You also need to create a `.env` file in the `server/` directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# JWT Configuration
JWT_SECRET=your-jwt-secret-here

# Server Configuration
PORT=5000

# Email Configuration (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Setup Steps

1. **Create Frontend Environment File:**
   ```bash
   cd web
   cp .env.example .env.local  # if .env.example exists
   # or create .env.local manually with the variables above
   ```

2. **Create Backend Environment File:**
   ```bash
   cd server
   cp .env.example .env  # if .env.example exists
   # or create .env manually with the variables above
   ```

3. **Generate Secure Secrets:**
   ```bash
   # Generate NEXTAUTH_SECRET
   openssl rand -base64 32
   
   # Generate JWT_SECRET
   openssl rand -base64 32
   ```

4. **Restart Development Server:**
   ```bash
   # From root directory
   pnpm dev
   ```

## Important Notes

- **NEXTAUTH_SECRET**: Must be a strong, random string. Used for JWT signing.
- **NEXTAUTH_URL**: Must match your frontend URL exactly.
- **JWT_SECRET**: Must match the backend JWT secret.
- **Database URL**: Update with your actual database credentials.

## Troubleshooting

If you still see NextAuth.js errors after setting up environment variables:

1. **Clear Next.js cache:**
   ```bash
   cd web
   rm -rf .next
   ```

2. **Restart both frontend and backend servers:**
   ```bash
   # Stop current servers (Ctrl+C)
   # Then restart
   pnpm dev
   ```

3. **Check environment variables are loaded:**
   ```bash
   # In web directory
   node -e "console.log(process.env.NEXTAUTH_SECRET)"
   ```

4. **Verify API connectivity:**
   - Frontend should be able to reach backend at `http://localhost:5000`
   - Backend should be running and accessible 