/**
 * Check and optionally update business tier
 * 
 * Usage:
 * - Check tier: npx ts-node scripts/check-business-tier.ts [businessId]
 * - Set tier: npx ts-node scripts/check-business-tier.ts [businessId] enterprise
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBusinessTier() {
  try {
    const businessId = process.argv[2];
    const newTier = process.argv[3];
    
    if (!businessId) {
      console.log('\n📊 Usage:');
      console.log('   Check tier:  npx ts-node scripts/check-business-tier.ts [businessId]');
      console.log('   Update tier: npx ts-node scripts/check-business-tier.ts [businessId] [tier]');
      console.log('\nAvailable tiers: free, business_basic, business_advanced, enterprise\n');
      process.exit(1);
    }
    
    // Get business
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' }
        },
        members: {
          where: { isActive: true }
        }
      }
    });
    
    if (!business) {
      console.error(`\n❌ Business not found: ${businessId}\n`);
      
      // List available businesses
      const allBusinesses = await prisma.business.findMany({
        select: {
          id: true,
          name: true,
          tier: true
        },
        take: 10
      });
      
      console.log('📋 Available businesses:');
      allBusinesses.forEach(b => {
        console.log(`   • ${b.name} (${b.id}) - Tier: ${b.tier}`);
      });
      console.log('');
      process.exit(1);
    }
    
    // Display current state
    console.log('\n📊 Business Tier Information');
    console.log('═══════════════════════════════════════════════\n');
    console.log(`Business: ${business.name}`);
    console.log(`ID: ${business.id}`);
    console.log(`Current Tier (direct): ${business.tier}`);
    
    if (business.subscriptions.length > 0) {
      const activeSub = business.subscriptions[0];
      console.log(`Active Subscription Tier: ${activeSub.tier}`);
      console.log(`Subscription Status: ${activeSub.status}`);
      console.log(`Subscription ID: ${activeSub.id}`);
    } else {
      console.log('Active Subscription: None');
    }
    
    console.log(`Members: ${business.members.length}`);
    console.log('');
    
    // Update tier if requested
    if (newTier) {
      const validTiers = ['free', 'business_basic', 'business_advanced', 'enterprise'];
      
      if (!validTiers.includes(newTier)) {
        console.error(`❌ Invalid tier: ${newTier}`);
        console.log(`Valid tiers: ${validTiers.join(', ')}\n`);
        process.exit(1);
      }
      
      console.log(`🔄 Updating business tier to: ${newTier}...`);
      
      const updated = await prisma.business.update({
        where: { id: businessId },
        data: { tier: newTier }
      });
      
      console.log(`✅ Business tier updated to: ${updated.tier}`);
      
      // Optionally create/update subscription record
      const existingSub = business.subscriptions[0];
      
      if (existingSub) {
        console.log(`🔄 Updating subscription tier...`);
        await prisma.subscription.update({
          where: { id: existingSub.id },
          data: { tier: newTier }
        });
        console.log(`✅ Subscription tier updated to: ${newTier}`);
      } else {
        console.log(`ℹ️  No active subscription found. Business tier updated only.`);
        console.log(`   Tip: Create a subscription record for better tracking.`);
      }
      
      console.log('');
    }
    
    // Show what HR features are available
    console.log('🏥 HR Module Access:');
    const effectiveTier = business.subscriptions[0]?.tier || business.tier || 'free';
    
    if (effectiveTier === 'enterprise') {
      console.log('   ✅ Full HR Suite (Enterprise)');
      console.log('   • Unlimited employees');
      console.log('   • Full attendance tracking');
      console.log('   • Payroll processing');
      console.log('   • Recruitment/ATS');
      console.log('   • Performance management');
      console.log('   • Benefits administration');
    } else if (effectiveTier === 'business_advanced') {
      console.log('   ✅ Limited HR Features (Business Advanced)');
      console.log('   • Max 50 employees');
      console.log('   • Basic time-off management');
      console.log('   • Employee self-service');
      console.log('   ❌ No payroll');
      console.log('   ❌ No recruitment');
      console.log('   ❌ No performance reviews');
    } else {
      console.log('   ❌ No HR Access');
      console.log('   Requires: Business Advanced or Enterprise tier');
    }
    
    console.log('');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkBusinessTier();

