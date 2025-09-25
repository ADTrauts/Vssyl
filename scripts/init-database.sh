#!/bin/bash

# Database Initialization Script
# This script initializes the database schema using Prisma migrations

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status "Initializing database schema..."

# Set the database URL
export DATABASE_URL="postgresql://vssyl_user:Arthur%26George116%21%21@172.30.0.15:5432/vssyl_production?connection_limit=20&pool_timeout=20"

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma db push

print_success "Database schema initialized successfully!"
