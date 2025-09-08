const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createSecurityTestData() {
  try {
    console.log('🔒 Creating Security Test Data...\n');

    // Get admin user for logging
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found');
      return;
    }

    // Create various security events
    const securityEvents = [
      {
        eventType: 'failed_login_attempt',
        severity: 'medium',
        userEmail: 'suspicious@example.com',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          attemptCount: 5,
          reason: 'Invalid password',
          location: 'New York, NY'
        }
      },
      {
        eventType: 'privilege_escalation_attempt',
        severity: 'high',
        userEmail: 'user@example.com',
        ipAddress: '10.0.0.50',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        details: {
          attemptedRole: 'ADMIN',
          currentRole: 'USER',
          method: 'Direct API call'
        }
      },
      {
        eventType: 'data_export_large',
        severity: 'medium',
        userEmail: 'analyst@company.com',
        ipAddress: '172.16.0.25',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36',
        details: {
          recordCount: 10000,
          dataType: 'user_profiles',
          exportFormat: 'CSV'
        }
      },
      {
        eventType: 'suspicious_api_usage',
        severity: 'high',
        userEmail: 'api@external.com',
        ipAddress: '203.0.113.45',
        userAgent: 'curl/7.68.0',
        details: {
          endpoint: '/api/users',
          requestCount: 1000,
          timeWindow: '1 hour',
          pattern: 'Automated scraping detected'
        }
      },
      {
        eventType: 'admin_action',
        severity: 'low',
        adminEmail: adminUser.email,
        adminId: adminUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          action: 'user_role_changed',
          targetUser: 'user@example.com',
          oldRole: 'USER',
          newRole: 'MODERATOR'
        }
      },
      {
        eventType: 'system_backup',
        severity: 'low',
        adminEmail: adminUser.email,
        adminId: adminUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'System/BackupService',
        details: {
          backupType: 'full',
          size: '2.5GB',
          location: 's3://backups/daily/',
          status: 'completed'
        }
      },
      {
        eventType: 'security_scan',
        severity: 'low',
        adminEmail: adminUser.email,
        adminId: adminUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'SecurityScanner/1.0',
        details: {
          scanType: 'vulnerability',
          vulnerabilitiesFound: 3,
          severity: 'medium',
          status: 'completed'
        }
      },
      {
        eventType: 'unusual_login_location',
        severity: 'medium',
        userEmail: 'user@example.com',
        ipAddress: '198.51.100.42',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        details: {
          location: 'Tokyo, Japan',
          previousLocation: 'New York, NY',
          timeDifference: '2 hours',
          deviceType: 'mobile'
        }
      },
      {
        eventType: 'data_breach_attempt',
        severity: 'critical',
        userEmail: 'attacker@malicious.com',
        ipAddress: '203.0.113.100',
        userAgent: 'Mozilla/5.0 (compatible; Bot/1.0)',
        details: {
          attackVector: 'SQL injection',
          targetTable: 'users',
          blocked: true,
          response: 'IP blocked, account suspended'
        }
      },
      {
        eventType: 'compliance_violation',
        severity: 'high',
        userEmail: 'employee@company.com',
        ipAddress: '192.168.1.200',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          violation: 'GDPR data access without consent',
          dataType: 'personal_information',
          action: 'access_denied',
          complianceFramework: 'GDPR'
        }
      }
    ];

    // Create security events
    console.log('📊 Creating security events...');
    for (const eventData of securityEvents) {
      const event = await prisma.securityEvent.create({
        data: {
          ...eventData,
          timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          resolved: Math.random() > 0.3 // 70% resolved
        }
      });
      console.log(`   ✅ Created: ${event.eventType} (${event.severity})`);
    }

    // Create some audit logs for compliance
    console.log('\n📋 Creating compliance audit logs...');
    const auditLogs = [
      {
        userId: adminUser.id,
        action: 'COMPLIANCE_AUDIT',
        details: JSON.stringify({
          auditType: 'GDPR',
          status: 'passed',
          findings: [],
          recommendations: ['Implement data retention policy']
        })
      },
      {
        userId: adminUser.id,
        action: 'COMPLIANCE_AUDIT',
        details: JSON.stringify({
          auditType: 'SOC2',
          status: 'passed',
          findings: ['Security controls in place'],
          recommendations: ['Regular security training']
        })
      },
      {
        userId: adminUser.id,
        action: 'SECURITY_POLICY_UPDATE',
        details: JSON.stringify({
          policyType: 'password_policy',
          changes: ['Minimum length increased to 12 characters'],
          effectiveDate: new Date().toISOString()
        })
      }
    ];

    for (const logData of auditLogs) {
      const log = await prisma.auditLog.create({
        data: {
          ...logData,
          timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random time in last 30 days
        }
      });
      console.log(`   ✅ Created: ${log.action}`);
    }

    // Create some resolved security events
    console.log('\n🔧 Creating resolved security events...');
    const resolvedEvents = [
      {
        eventType: 'failed_login_attempt',
        severity: 'low',
        userEmail: 'user@example.com',
        ipAddress: '192.168.1.150',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          attemptCount: 2,
          reason: 'Typo in password',
          resolved: true
        },
        resolved: true,
        adminId: adminUser.id
      },
      {
        eventType: 'maintenance_mode_changed',
        severity: 'medium',
        adminEmail: adminUser.email,
        adminId: adminUser.id,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        details: {
          action: 'enabled',
          duration: '2 hours',
          reason: 'Database maintenance'
        },
        resolved: true
      }
    ];

    for (const eventData of resolvedEvents) {
      const event = await prisma.securityEvent.create({
        data: {
          ...eventData,
          timestamp: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000) // Random time in last 14 days
        }
      });
      console.log(`   ✅ Created: ${event.eventType} (resolved)`);
    }

    console.log('\n🎉 Security test data created successfully!');
    console.log('\n📊 Summary:');
    console.log('   • 10 new security events (various severities)');
    console.log('   • 3 compliance audit logs');
    console.log('   • 2 resolved security events');
    console.log('   • Events span last 7-30 days');
    console.log('\n🔍 The security & compliance page should now show real data!');

  } catch (error) {
    console.error('❌ Error creating security test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSecurityTestData();
