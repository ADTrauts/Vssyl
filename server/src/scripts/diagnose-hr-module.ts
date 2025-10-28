/**
 * Diagnostic script to check HR module and installation status
 */

import { prisma } from '../lib/prisma';

async function diagnose() {
  console.log('\n📊 HR Module Diagnostic Report');
  console.log('=====================================\n');
  
  try {
    // Check if HR module exists
    console.log('1️⃣  Checking if HR module exists in database...');
    const hrModule = await prisma.module.findUnique({
      where: { id: 'hr' },
      select: {
        id: true,
        name: true,
        status: true,
        pricingTier: true,
        isProprietary: true
      }
    });
    
    if (hrModule) {
      console.log('✅ HR Module found:');
      console.log(JSON.stringify(hrModule, null, 2));
    } else {
      console.log('❌ HR Module NOT found in database');
      console.log('   This is the problem! Module needs to be seeded.');
    }
    
    // Check business tier
    console.log('\n2️⃣  Checking business tier...');
    const businessId = 'a3c13e53-9e98-4595-94b6-47cecd993611'; // From error log
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (business) {
      const tier = business.subscriptions[0]?.tier || business.tier || 'free';
      console.log(`✅ Business tier: ${tier}`);
      if (['business_advanced', 'enterprise'].includes(tier)) {
        console.log('   ✅ Tier is sufficient for HR module');
      } else {
        console.log(`   ❌ Tier ${tier} is NOT sufficient (needs business_advanced or enterprise)`);
      }
    } else {
      console.log('❌ Business not found');
    }
    
    // Check existing installations
    console.log('\n3️⃣  Checking existing HR installations for this business...');
    const existingInstall = await (prisma as any).businessModuleInstallation.findFirst({
      where: {
        moduleId: 'hr',
        businessId: businessId
      }
    });
    
    if (existingInstall) {
      console.log('⚠️  HR module already installed:');
      console.log(JSON.stringify(existingInstall, null, 2));
    } else {
      console.log('✅ No existing installation found');
    }
    
    // Check migration status (installedBy column)
    console.log('\n4️⃣  Checking business_module_installations table schema...');
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'business_module_installations'
      ORDER BY ordinal_position;
    `;
    console.log('Table columns:');
    console.log(tableInfo);
    
    console.log('\n📋 Diagnostic Summary:');
    console.log('=====================================');
    if (!hrModule) {
      console.log('❌ PROBLEM: HR module not in database - needs seeding');
    } else if (existingInstall) {
      console.log('⚠️  WARNING: Module already installed - use uninstall first');
    } else {
      console.log('✅ Should be able to install (check tier and module status)');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnose();

