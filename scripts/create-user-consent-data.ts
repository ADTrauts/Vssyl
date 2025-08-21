import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createUserConsentData() {
  try {
    console.log('🔐 Creating user consent data for collective AI learning...\n');

    // Get the first user (admin) to create consent for
    const adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminUser) {
      console.log('❌ No admin user found. Please create a user first.');
      return;
    }

    console.log(`👤 Found admin user: ${adminUser.email}`);

    // Create or update privacy settings for the admin user
    const privacySettings = await prisma.userPrivacySettings.upsert({
      where: { userId: adminUser.id },
      update: {
        allowCollectiveLearning: true,
        allowDataProcessing: true,
        allowAnalytics: true,
        allowAuditLogs: true
      },
      create: {
        userId: adminUser.id,
        allowCollectiveLearning: true,
        allowDataProcessing: true,
        allowAnalytics: true,
        allowAuditLogs: true,
        profileVisibility: 'PUBLIC',
        activityVisibility: 'PUBLIC',
        allowMarketingEmails: false,
        dataRetentionPeriod: 2555
      }
    });

    console.log('✅ Privacy settings updated for admin user');

    // Create explicit consent record for collective AI learning
    const consent = await prisma.userConsent.upsert({
      where: {
        userId_consentType_version: {
          userId: adminUser.id,
          consentType: 'COLLECTIVE_AI_LEARNING',
          version: '1.0'
        }
      },
      update: {
        granted: true,
        grantedAt: new Date(),
        revokedAt: null
      },
      create: {
        userId: adminUser.id,
        consentType: 'COLLECTIVE_AI_LEARNING',
        version: '1.0',
        granted: true,
        grantedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Admin Setup Script'
      }
    });

    console.log('✅ Consent record created for collective AI learning');

    // Create some additional test users with different consent levels
    const testUsers = [
      {
        email: 'test.user1@example.com',
        name: 'Test User 1',
        allowCollectiveLearning: true
      },
      {
        email: 'test.user2@example.com',
        name: 'Test User 2',
        allowCollectiveLearning: false
      }
    ];

    for (const testUser of testUsers) {
      const user = await prisma.user.upsert({
        where: { email: testUser.email },
        update: {},
        create: {
          email: testUser.email,
          name: testUser.name,
          password: 'hashedpassword123', // In real app, this would be properly hashed
          role: 'USER'
        }
      });

      await prisma.userPrivacySettings.upsert({
        where: { userId: user.id },
        update: {
          allowCollectiveLearning: testUser.allowCollectiveLearning
        },
        create: {
          userId: user.id,
          allowCollectiveLearning: testUser.allowCollectiveLearning,
          allowDataProcessing: true,
          allowAnalytics: true,
          allowAuditLogs: true,
          profileVisibility: 'PUBLIC',
          activityVisibility: 'PUBLIC',
          allowMarketingEmails: false,
          dataRetentionPeriod: 2555
        }
      });

      if (testUser.allowCollectiveLearning) {
        await prisma.userConsent.upsert({
          where: {
            userId_consentType_version: {
              userId: user.id,
              consentType: 'COLLECTIVE_AI_LEARNING',
              version: '1.0'
            }
          },
          update: {},
          create: {
            userId: user.id,
            consentType: 'COLLECTIVE_AI_LEARNING',
            version: '1.0',
            granted: true,
            grantedAt: new Date(),
            ipAddress: '127.0.0.1',
            userAgent: 'Test Setup Script'
          }
        });
      }

      console.log(`✅ Created test user: ${testUser.email} (Consent: ${testUser.allowCollectiveLearning})`);
    }

    console.log('\n🎉 User consent data creation completed!');
    console.log('\n📊 Summary:');
    console.log('- Admin user: Full consent for collective learning');
    console.log('- Test User 1: Consents to collective learning');
    console.log('- Test User 2: Does not consent to collective learning');

  } catch (error) {
    console.error('❌ Error creating user consent data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUserConsentData();
