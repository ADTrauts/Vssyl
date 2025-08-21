import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedRetentionPolicies() {
  try {
    console.log('Seeding retention policies...');

    // Get the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('No admin user found. Creating a test admin user...');
      const testAdmin = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          password: '$2b$10$test', // This is just for seeding
          name: 'Test Admin',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      console.log('Created test admin user:', testAdmin.id);
    }

    const userId = adminUser?.id || (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id;

    if (!userId) {
      throw new Error('No admin user available for seeding');
    }

    // Create sample retention policies
    const policies = [
      {
        name: 'File Retention Policy',
        description: 'Standard file retention policy for uploaded files',
        resourceType: 'file',
        retentionPeriod: 730, // 2 years
        archiveAfter: 365, // Archive after 1 year
        deleteAfter: 1095, // Delete after 3 years
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Message Retention Policy',
        description: 'Chat message retention policy',
        resourceType: 'message',
        retentionPeriod: 365, // 1 year
        archiveAfter: 180, // Archive after 6 months
        deleteAfter: 730, // Delete after 2 years
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Audit Log Retention Policy',
        description: 'Audit log retention for compliance',
        resourceType: 'auditLog',
        retentionPeriod: 2555, // 7 years for compliance
        archiveAfter: 1095, // Archive after 3 years
        deleteAfter: 3650, // Delete after 10 years
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Conversation Retention Policy',
        description: 'Chat conversation retention policy',
        resourceType: 'conversation',
        retentionPeriod: 730, // 2 years
        archiveAfter: 365, // Archive after 1 year
        deleteAfter: 1095, // Delete after 3 years
        isActive: true,
        createdBy: userId
      },
      {
        name: 'Dashboard Retention Policy',
        description: 'Dashboard and widget retention policy',
        resourceType: 'dashboard',
        retentionPeriod: 1095, // 3 years
        archiveAfter: 730, // Archive after 2 years
        deleteAfter: 1825, // Delete after 5 years
        isActive: true,
        createdBy: userId
      }
    ];

    for (const policy of policies) {
      const existingPolicy = await prisma.systemRetentionPolicy.findUnique({
        where: { name: policy.name }
      });

      if (!existingPolicy) {
        await prisma.systemRetentionPolicy.create({
          data: policy
        });
        console.log(`Created retention policy: ${policy.name}`);
      } else {
        console.log(`Retention policy already exists: ${policy.name}`);
      }
    }

    // Create sample data classifications
    const classifications = [
      {
        resourceType: 'file',
        resourceId: 'sample-file-1',
        sensitivity: 'CONFIDENTIAL',
        classifiedBy: userId,
        notes: 'Sample confidential file classification'
      },
      {
        resourceType: 'message',
        resourceId: 'sample-message-1',
        sensitivity: 'INTERNAL',
        classifiedBy: userId,
        notes: 'Sample internal message classification'
      },
      {
        resourceType: 'conversation',
        resourceId: 'sample-conversation-1',
        sensitivity: 'PUBLIC',
        classifiedBy: userId,
        notes: 'Sample public conversation classification'
      }
    ];

    for (const classification of classifications) {
      const existingClassification = await prisma.dataClassification.findUnique({
        where: {
          resourceType_resourceId: {
            resourceType: classification.resourceType,
            resourceId: classification.resourceId
          }
        }
      });

      if (!existingClassification) {
        await prisma.dataClassification.create({
          data: classification
        });
        console.log(`Created data classification: ${classification.resourceType}/${classification.resourceId}`);
      } else {
        console.log(`Data classification already exists: ${classification.resourceType}/${classification.resourceId}`);
      }
    }

    // Create sample backup records
    const backups = [
      {
        backupType: 'database',
        backupPath: '/backups/db_full_20241227_120000.backup',
        backupSize: 52428800, // 50MB
        checksum: 'sha256:abc123def456',
        status: 'completed',
        notes: 'Daily database backup',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: userId
      },
      {
        backupType: 'files',
        backupPath: '/backups/files_full_20241227_120000.backup',
        backupSize: 104857600, // 100MB
        checksum: 'sha256:def456ghi789',
        status: 'completed',
        notes: 'Daily file backup',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdBy: userId
      }
    ];

    for (const backup of backups) {
      const existingBackup = await prisma.backupRecord.findFirst({
        where: {
          backupPath: backup.backupPath
        }
      });

      if (!existingBackup) {
        await prisma.backupRecord.create({
          data: backup
        });
        console.log(`Created backup record: ${backup.backupType}`);
      } else {
        console.log(`Backup record already exists: ${backup.backupType}`);
      }
    }

    console.log('Retention policies seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding retention policies:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedRetentionPolicies(); 