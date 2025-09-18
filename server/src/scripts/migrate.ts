#!/usr/bin/env ts-node

/**
 * Database Migration Script for Production
 * This script runs Prisma migrations on startup in production
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🔄 Starting database migration...');
    
    // Check if database is accessible
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Run Prisma migrations
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ Database migrations completed successfully');
    
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations();
}

export { runMigrations };
