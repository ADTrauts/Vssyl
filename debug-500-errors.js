#!/usr/bin/env node

/**
 * Debug script to identify the root cause of 500 errors
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBusinessIssues() {
  const businessId = 'a3c13e53-9e98-4595-94b6-47cecd993611';
  
  console.log('🔍 Debugging Business Issues...');
  console.log('Business ID:', businessId);
  console.log('');
  
  try {
    // Check if business exists
    console.log('1. Checking if business exists...');
    const business = await prisma.business.findUnique({
      where: { id: businessId }
    });
    
    if (!business) {
      console.log('❌ Business not found!');
      console.log('   This explains the 500 errors - the business does not exist in the database.');
      return;
    }
    
    console.log('✅ Business found:', business.name);
    console.log('');
    
    // Check org chart data
    console.log('2. Checking org chart data...');
    const tiers = await prisma.organizationalTier.findMany({
      where: { businessId }
    });
    console.log('   Organizational tiers:', tiers.length);
    
    const departments = await prisma.department.findMany({
      where: { businessId }
    });
    console.log('   Departments:', departments.length);
    
    const positions = await prisma.position.findMany({
      where: { businessId }
    });
    console.log('   Positions:', positions.length);
    
    console.log('');
    
    // Check business AI data
    console.log('3. Checking business AI data...');
    const businessAI = await prisma.businessAIDigitalTwin.findUnique({
      where: { businessId }
    });
    
    if (!businessAI) {
      console.log('❌ Business AI not found!');
      console.log('   This explains the 500 error for /api/business-ai/employee-access');
    } else {
      console.log('✅ Business AI found:', businessAI.name);
    }
    
    console.log('');
    
    // Check business members
    console.log('4. Checking business members...');
    const members = await prisma.businessMember.findMany({
      where: { businessId, isActive: true }
    });
    console.log('   Active members:', members.length);
    
    if (members.length === 0) {
      console.log('❌ No active business members found!');
      console.log('   This could cause access issues.');
    } else {
      console.log('✅ Active members found');
      members.forEach(member => {
        console.log(`   - ${member.role}: ${member.userId}`);
      });
    }
    
    console.log('');
    
    // Check user data
    console.log('5. Checking user data...');
    const userId = 'ef79dcd1-f499-4860-a663-52e7484946e9'; // From logs
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) {
      console.log('❌ User not found!');
    } else {
      console.log('✅ User found:', user.email);
    }
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('   Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

async function debugOrgChartService() {
  console.log('🔍 Testing Org Chart Service...');
  
  try {
    const { default: orgChartService } = await import('./server/src/services/orgChartService.ts');
    const businessId = 'a3c13e53-9e98-4595-94b6-47cecd993611';
    
    console.log('Testing getOrgChartStructure...');
    const structure = await orgChartService.getOrgChartStructure(businessId);
    console.log('✅ Org chart structure retrieved successfully');
    console.log('   Business:', structure.business?.name);
    console.log('   Tiers:', structure.tiers?.length || 0);
    console.log('   Departments:', structure.departments?.length || 0);
    console.log('   Positions:', structure.positions?.length || 0);
    
  } catch (error) {
    console.error('❌ Org Chart Service error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

async function main() {
  console.log('🚨 500 Error Debug Script');
  console.log('==========================\n');
  
  await debugBusinessIssues();
  console.log('');
  await debugOrgChartService();
  
  console.log('\n🏁 Debug complete!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { debugBusinessIssues, debugOrgChartService };
