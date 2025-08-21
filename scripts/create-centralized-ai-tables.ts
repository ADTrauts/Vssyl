import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleData() {
  try {
    console.log('Creating sample data for centralized AI learning...');

    // Create system configuration
    await prisma.systemConfiguration.upsert({
      where: { key: 'ai_privacy_settings' },
      update: {
        value: JSON.stringify({
          anonymizationLevel: 'standard',
          aggregationThreshold: 5,
          dataRetentionDays: 90,
          userConsentRequired: true,
          crossUserDataSharing: false,
          auditLogging: true
        }),
        description: 'Privacy settings for centralized AI learning'
      },
      create: {
        key: 'ai_privacy_settings',
        value: JSON.stringify({
          anonymizationLevel: 'standard',
          aggregationThreshold: 5,
          dataRetentionDays: 90,
          userConsentRequired: true,
          crossUserDataSharing: false,
          auditLogging: true
        }),
        description: 'Privacy settings for centralized AI learning'
      }
    });

    // Create sample global patterns
    await prisma.globalPattern.upsert({
      where: { id: 'pattern_1' },
      update: {},
      create: {
        id: 'pattern_1',
        patternType: 'behavioral',
        description: 'Users prefer to organize files in the Drive module during morning hours',
        frequency: 15,
        confidence: 0.85,
        strength: 0.72,
        modules: ['drive'],
        userSegment: 'all',
        impact: 'positive',
        recommendations: ['Optimize Drive module performance for morning usage', 'Add morning-specific features'],
        dataPoints: 45,
        lastUpdated: new Date(),
        trend: 'increasing',
        privacyLevel: 'anonymized'
      }
    });

    await prisma.globalPattern.upsert({
      where: { id: 'pattern_2' },
      update: {},
      create: {
        id: 'pattern_2',
        patternType: 'temporal',
        description: 'Peak chat activity occurs between 2-4 PM across all users',
        frequency: 23,
        confidence: 0.78,
        strength: 0.65,
        modules: ['chat'],
        userSegment: 'all',
        impact: 'positive',
        recommendations: ['Schedule important notifications during peak hours', 'Optimize chat performance for afternoon'],
        dataPoints: 67,
        lastUpdated: new Date(),
        trend: 'stable',
        privacyLevel: 'anonymized'
      }
    });

    await prisma.globalPattern.upsert({
      where: { id: 'pattern_3' },
      update: {},
      create: {
        id: 'pattern_3',
        patternType: 'communication',
        description: 'Users prefer concise, actionable responses in business contexts',
        frequency: 31,
        confidence: 0.92,
        strength: 0.88,
        modules: ['business', 'chat'],
        userSegment: 'business',
        impact: 'positive',
        recommendations: ['Optimize AI responses for business users', 'Focus on actionable insights'],
        dataPoints: 89,
        lastUpdated: new Date(),
        trend: 'increasing',
        privacyLevel: 'anonymized'
      }
    });

    // Create sample collective insights
    await prisma.collectiveInsight.upsert({
      where: { id: 'insight_1' },
      update: {},
      create: {
        id: 'insight_1',
        type: 'optimization',
        title: 'Optimize Morning Drive Usage',
        description: 'High-frequency pattern shows users prefer Drive organization in mornings',
        confidence: 0.85,
        impact: 'high',
        affectedModules: ['drive'],
        affectedUserSegments: ['all'],
        actionable: true,
        recommendations: ['Add morning-specific features', 'Optimize performance for morning usage'],
        implementationComplexity: 'moderate',
        estimatedBenefit: 0.75,
        dataPoints: 45,
        createdAt: new Date(),
        lastValidated: new Date()
      }
    });

    await prisma.collectiveInsight.upsert({
      where: { id: 'insight_2' },
      update: {},
      create: {
        id: 'insight_2',
        type: 'best_practice',
        title: 'Business Communication Preferences',
        description: 'Business users prefer concise, actionable AI responses',
        confidence: 0.92,
        impact: 'high',
        affectedModules: ['business', 'chat'],
        affectedUserSegments: ['business'],
        actionable: true,
        recommendations: ['Train AI for concise business responses', 'Focus on actionable insights'],
        implementationComplexity: 'simple',
        estimatedBenefit: 0.88,
        dataPoints: 89,
        createdAt: new Date(),
        lastValidated: new Date()
      }
    });

    // Create sample global learning events
    await prisma.globalLearningEvent.upsert({
      where: { id: 'event_1' },
      update: {},
      create: {
        id: 'event_1',
        userId: 'user_hash_1',
        eventType: 'interaction',
        context: 'drive',
        patternData: { actionType: 'file_organization', timeOfDay: 'morning' },
        confidence: 0.85,
        impact: 'medium',
        frequency: 1,
        applied: true,
        validated: true,
        createdAt: new Date()
      }
    });

    await prisma.globalLearningEvent.upsert({
      where: { id: 'event_2' },
      update: {},
      create: {
        id: 'event_2',
        userId: 'user_hash_2',
        eventType: 'interaction',
        context: 'chat',
        patternData: { actionType: 'conversation', timeOfDay: 'afternoon' },
        confidence: 0.78,
        impact: 'medium',
        frequency: 1,
        applied: true,
        validated: true,
        createdAt: new Date()
      }
    });

    console.log('✅ Sample data created successfully!');
    console.log('📊 Created:');
    console.log('  - 1 System Configuration');
    console.log('  - 3 Global Patterns');
    console.log('  - 2 Collective Insights');
    console.log('  - 2 Global Learning Events');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();
