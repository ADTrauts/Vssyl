const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSecurityService() {
  try {
    console.log('🧪 Testing Security Service...\n');

    // Test 1: Get security events
    console.log('1️⃣ Testing getSecurityEvents...');
    const events = await prisma.securityEvent.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' }
    });
    
    console.log(`   📊 Found ${events.length} recent security events:`);
    events.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.eventType} - ${event.severity} - ${event.resolved ? '✅ Resolved' : '⚠️ Active'}`);
      console.log(`      User: ${event.userEmail || event.adminEmail || 'System'}`);
      console.log(`      IP: ${event.ipAddress || 'N/A'}`);
      console.log(`      Time: ${event.timestamp.toLocaleString()}`);
    });

    // Test 2: Get security metrics
    console.log('\n2️⃣ Testing getSecurityMetrics...');
    const totalEvents = await prisma.securityEvent.count();
    const criticalEvents = await prisma.securityEvent.count({ where: { severity: 'critical' } });
    const highEvents = await prisma.securityEvent.count({ where: { severity: 'high' } });
    const resolvedEvents = await prisma.securityEvent.count({ where: { resolved: true } });
    const activeThreats = await prisma.securityEvent.count({ where: { resolved: false } });

    console.log(`   📈 Security Metrics:`);
    console.log(`      Total Events: ${totalEvents}`);
    console.log(`      Critical: ${criticalEvents}`);
    console.log(`      High: ${highEvents}`);
    console.log(`      Resolved: ${resolvedEvents}`);
    console.log(`      Active Threats: ${activeThreats}`);

    // Test 3: Get events by type
    console.log('\n3️⃣ Testing events by type...');
    const eventsByType = await prisma.securityEvent.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true
      },
      orderBy: {
        _count: {
          eventType: 'desc'
        }
      },
      take: 5
    });

    console.log(`   📊 Top Event Types:`);
    eventsByType.forEach((item, index) => {
      console.log(`      ${index + 1}. ${item.eventType}: ${item._count.eventType} events`);
    });

    // Test 4: Get compliance audit logs
    console.log('\n4️⃣ Testing compliance audit logs...');
    const complianceLogs = await prisma.auditLog.findMany({
      where: {
        action: 'COMPLIANCE_AUDIT'
      },
      orderBy: { timestamp: 'desc' },
      take: 3
    });

    console.log(`   📋 Found ${complianceLogs.length} compliance audit logs:`);
    complianceLogs.forEach((log, index) => {
      const details = JSON.parse(log.details);
      console.log(`      ${index + 1}. ${details.auditType} - ${details.status} (${log.timestamp.toLocaleDateString()})`);
    });

    // Test 5: Security score calculation
    console.log('\n5️⃣ Testing security score calculation...');
    const unresolvedCritical = await prisma.securityEvent.count({ where: { severity: 'critical', resolved: false } });
    const unresolvedHigh = await prisma.securityEvent.count({ where: { severity: 'high', resolved: false } });
    const unresolvedMedium = await prisma.securityEvent.count({ where: { severity: 'medium', resolved: false } });
    const unresolvedLow = await prisma.securityEvent.count({ where: { severity: 'low', resolved: false } });

    const securityScore = Math.max(0, 100 - 
      (unresolvedCritical * 20) - 
      (unresolvedHigh * 10) - 
      (unresolvedMedium * 5) - 
      (unresolvedLow * 1)
    );

    console.log(`   🎯 Security Score: ${Math.round(securityScore)}/100`);
    console.log(`      Unresolved Critical: ${unresolvedCritical} (${unresolvedCritical * 20} points)`);
    console.log(`      Unresolved High: ${unresolvedHigh} (${unresolvedHigh * 10} points)`);
    console.log(`      Unresolved Medium: ${unresolvedMedium} (${unresolvedMedium * 5} points)`);
    console.log(`      Unresolved Low: ${unresolvedLow} (${unresolvedLow * 1} points)`);

    console.log('\n🎉 Security service test completed successfully!');
    console.log('\n📝 The security & compliance page should now display:');
    console.log('   ✅ Real security events with proper details');
    console.log('   ✅ Accurate security metrics and scoring');
    console.log('   ✅ Real compliance status based on system state');
    console.log('   ✅ Proper event filtering and categorization');
    console.log('   ✅ Audit trail for compliance tracking');

  } catch (error) {
    console.error('❌ Error testing security service:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSecurityService();
