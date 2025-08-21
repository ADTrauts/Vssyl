#!/bin/bash

# Generate a secure random secret
SECRET=$(openssl rand -base64 32)

echo "Setting up environment files with matching JWT secrets..."

# --- Preserve DATABASE_URL from root .env ---
DATABASE_URL_LINE=""
if [ -f ".env" ]; then
  DATABASE_URL_LINE=$(grep '^DATABASE_URL=' .env)
  if [ -n "$DATABASE_URL_LINE" ]; then
    echo "Found DATABASE_URL in root .env, will preserve it."
  fi
fi

# Create web/.env.local
cat > web/.env.local << EOF
# NextAuth.js Configuration
NEXTAUTH_SECRET=${SECRET}
NEXTAUTH_URL=http://localhost:3000

# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# Create server/.env
cat > server/.env << EOF
# Database
${DATABASE_URL_LINE:-DATABASE_URL=postgresql://user:pass@localhost:5432/dbname}

# JWT Configuration - Must match NEXTAUTH_SECRET in frontend
JWT_SECRET=${SECRET}

# Server Configuration
PORT=5000

# Frontend URL
FRONTEND_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

echo "Environment files created with matching JWT secrets!"
echo "Frontend NEXTAUTH_SECRET: ${SECRET}"
echo "Backend JWT_SECRET: ${SECRET}"
echo ""
if [ -n "$DATABASE_URL_LINE" ]; then
  echo "Preserved your DATABASE_URL in server/.env."
else
  echo "Please update your database connection string in server/.env if needed."
fi 