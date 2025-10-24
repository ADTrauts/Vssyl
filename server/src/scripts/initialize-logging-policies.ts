/**
 * Initialize Default Logging Policies
 * 
 * This script sets up default log retention policies and critical error alerts
 * Run once after enabling the logging system to establish baseline policies
 * 
 * Usage: node dist/scripts/initialize-logging-policies.js
 */

import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

async function initializeRetentionPolicies() {
  console.log('🔧 Initializing log retention policies...');

  try {
    // Check if a policy already exists
    const existingPolicy = await prisma.logRetentionPolicy.findFirst();

    if (existingPolicy) {
      console.log('✅ Retention policy already exists:', {
        id: existingPolicy.id,
        defaultRetentionDays: existingPolicy.defaultRetentionDays,
        errorRetentionDays: existingPolicy.errorRetentionDays,
        auditRetentionDays: existingPolicy.auditRetentionDays,
        enabled: existingPolicy.enabled,
        autoCleanup: existingPolicy.autoCleanup
      });
      return existingPolicy;
    }

    // Create default retention policy
    const policy = await prisma.logRetentionPolicy.create({
      data: {
        defaultRetentionDays: 30,   // Keep regular logs for 30 days
        errorRetentionDays: 90,      // Keep error logs for 90 days
        auditRetentionDays: 365,     // Keep audit logs for 1 year (compliance)
        enabled: true,
        autoCleanup: true
      }
    });

    console.log('✅ Created default retention policy:', {
      id: policy.id,
      defaultRetentionDays: policy.defaultRetentionDays,
      errorRetentionDays: policy.errorRetentionDays,
      auditRetentionDays: policy.auditRetentionDays
    });

    await logger.info('Log retention policy initialized', {
      operation: 'initialize_retention_policy',
      policyId: policy.id
    });

    return policy;
  } catch (error) {
    console.error('❌ Failed to initialize retention policy:', error);
    throw error;
  }
}

async function initializeCriticalAlerts() {
  console.log('🔧 Initializing critical error alerts...');

  const defaultAlerts = [
    {
      name: 'High Error Rate Alert',
      description: 'Triggers when error rate exceeds 10% over 5 minutes',
      conditions: {
        level: ['error'],
        threshold: 10, // 10 errors in 5 minutes
        timeWindow: 300 // 5 minutes in seconds
      },
      actions: {
        email: ['admin@vssyl.com'],
        threshold: 10
      },
      enabled: true
    },
    {
      name: 'Critical Security Events',
      description: 'Triggers on any critical severity security event',
      conditions: {
        level: ['error'],
        operation: ['security_event'],
        message: 'critical'
      },
      actions: {
        email: ['security@vssyl.com'],
        threshold: 1 // Alert immediately
      },
      enabled: true
    },
    {
      name: 'Authentication Failures',
      description: 'Triggers when login failures exceed threshold',
      conditions: {
        level: ['warn', 'error'],
        operation: ['user_login', 'security_event'],
        message: 'login_failed'
      },
      actions: {
        email: ['security@vssyl.com'],
        threshold: 5 // 5 failed attempts
      },
      enabled: true
    },
    {
      name: 'Database Connection Issues',
      description: 'Triggers on database connection failures',
      conditions: {
        level: ['error'],
        message: 'database'
      },
      actions: {
        email: ['ops@vssyl.com'],
        threshold: 3
      },
      enabled: true
    },
    {
      name: 'Slow API Response Times',
      description: 'Triggers when API response times exceed 5 seconds',
      conditions: {
        level: ['warn'],
        operation: ['api_request']
      },
      actions: {
        email: ['ops@vssyl.com'],
        threshold: 10 // 10 slow requests
      },
      enabled: false // Disabled by default, enable when ready to monitor
    }
  ];

  const createdAlerts = [];

  for (const alertConfig of defaultAlerts) {
    try {
      // Check if alert already exists
      const existingAlert = await prisma.logAlert.findFirst({
        where: { name: alertConfig.name }
      });

      if (existingAlert) {
        console.log(`⏭️  Alert "${alertConfig.name}" already exists, skipping...`);
        continue;
      }

      // Create the alert
      const alert = await prisma.logAlert.create({
        data: {
          name: alertConfig.name,
          description: alertConfig.description,
          conditions: alertConfig.conditions as any,
          actions: alertConfig.actions as any,
          enabled: alertConfig.enabled
        }
      });

      console.log(`✅ Created alert: ${alert.name} (${alert.enabled ? 'enabled' : 'disabled'})`);
      createdAlerts.push(alert);

      await logger.info('Log alert created', {
        operation: 'initialize_alert',
        alertId: alert.id,
        alertName: alert.name
      });
    } catch (error) {
      console.error(`❌ Failed to create alert "${alertConfig.name}":`, error);
    }
  }

  console.log(`✅ Created ${createdAlerts.length} new alerts`);
  return createdAlerts;
}

async function main() {
  console.log('🚀 Starting logging policies initialization...\n');

  try {
    // Initialize retention policies
    await initializeRetentionPolicies();
    console.log('');

    // Initialize critical alerts
    await initializeCriticalAlerts();
    console.log('');

    console.log('✅ Logging policies initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Update alert email addresses in admin portal');
    console.log('2. Enable/disable alerts as needed');
    console.log('3. Adjust retention days if required');
    console.log('4. Monitor logs in /admin-portal/system-logs');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { initializeRetentionPolicies, initializeCriticalAlerts };

