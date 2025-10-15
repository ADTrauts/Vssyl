/**
 * Migration Script: Install Core Modules for Existing Businesses
 * 
 * Purpose: Auto-install Drive, Chat, and Calendar modules for businesses
 *          that were created before the auto-installation feature was implemented.
 * 
 * Usage: node scripts/install-core-modules-existing-businesses.js
 * 
 * IMPORTANT: This is a one-time migration script for existing businesses.
 *            New businesses will automatically get these modules.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Core modules that every business should have
const CORE_MODULES = [
  { 
    moduleId: 'drive', 
    name: 'Drive', 
    category: 'productivity',
    description: 'File management and sharing'
  },
  { 
    moduleId: 'chat', 
    name: 'Chat', 
    category: 'communication',
    description: 'Team messaging and collaboration'
  },
  { 
    moduleId: 'calendar', 
    name: 'Calendar', 
    category: 'productivity',
    description: 'Schedule management and events'
  }
];

async function installCoreModulesForExistingBusinesses() {
  console.log('🔧 Starting core module installation for existing businesses...\n');
  
  try {
    // Get all businesses
    const businesses = await prisma.business.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });
    
    console.log(`📊 Found ${businesses.length} businesses\n`);
    
    if (businesses.length === 0) {
      console.log('ℹ️  No businesses found. Exiting...');
      return;
    }
    
    let totalInstalled = 0;
    let totalSkipped = 0;
    
    // Process each business
    for (const business of businesses) {
      console.log(`\n🏢 Processing: ${business.name} (${business.id})`);
      console.log(`   Created: ${business.createdAt.toISOString()}`);
      
      // Install each core module
      for (const { moduleId, name, category, description } of CORE_MODULES) {
        // Check if already installed
        const existingInstallation = await prisma.businessModuleInstallation.findFirst({
          where: {
            businessId: business.id,
            moduleId: moduleId
          }
        });
        
        if (existingInstallation) {
          console.log(`   ⏭️  ${name} (${moduleId}) - Already installed, skipping`);
          totalSkipped++;
        } else {
          // Install the module
          await prisma.businessModuleInstallation.create({
            data: {
              businessId: business.id,
              moduleId: moduleId,
              installedAt: new Date(),
              enabled: true,
              configured: {
                permissions: ['view', 'create', 'edit', 'delete']
              }
            }
          });
          
          console.log(`   ✅ ${name} (${moduleId}) - Installed successfully`);
          totalInstalled++;
        }
      }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Businesses Processed: ${businesses.length}`);
    console.log(`Total Modules Installed: ${totalInstalled}`);
    console.log(`Total Modules Skipped (Already Installed): ${totalSkipped}`);
    console.log('='.repeat(60));
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verification
    console.log('🔍 Verification:');
    for (const business of businesses) {
      const installedCount = await prisma.businessModuleInstallation.count({
        where: { businessId: business.id }
      });
      console.log(`   ${business.name}: ${installedCount} modules installed`);
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
installCoreModulesForExistingBusinesses()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

