#!/bin/bash

# Database Migration Script for Vssyl
# This script runs Prisma migrations on the production database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_error ".env.production not found. Please create it first."
    echo "You can copy from env.production.template and fill in your values."
    exit 1
fi

# Load environment variables safely
set -a
source .env.production
set +a

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    print_error "DATABASE_URL not found in .env.production"
    exit 1
fi

print_status "Running database migrations..."
print_status "Database: $DATABASE_URL"

# Build Prisma schema
print_status "Building Prisma schema..."
npm run prisma:build

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run migrations
print_status "Running Prisma migrations..."
npx prisma migrate deploy

print_success "Database migrations completed successfully!"

# Optional: Seed database with initial data
read -p "Do you want to seed the database with initial data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Seeding database..."
    # Add your seed script here
    # node scripts/seed.js
    print_success "Database seeded successfully!"
fi

print_success "Database setup completed!"
echo ""
echo "You can now:"
echo "1. View your database in Prisma Studio: npx prisma studio"
echo "2. Check your database connection"
echo "3. Deploy your application"
