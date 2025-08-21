import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createCentralizedAITables() {
  console.log('🚀 Creating centralized AI learning tables...');

  try {
    // Create system configuration for AI privacy settings
    console.log('📝 Creating system configuration...');
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
        description: 'AI Learning Privacy Settings',
        updatedBy: 'system'
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
        description: 'AI Learning Privacy Settings',
        updatedBy: 'system'
      }
    });

    console.log('✅ System configuration created successfully');

    // Create sample global patterns for demonstration
    console.log('📊 Creating sample global patterns...');
    const samplePatterns = [
      {
        id: 'sample_pattern_1',
        patternType: 'behavioral',
        description: 'Users prefer to organize files in hierarchical folder structures',
        frequency: 15,
        confidence: 0.85,
        strength: 0.8,
        modules: ['drive', 'business'],
        userSegment: 'all',
        impact: 'positive',
        recommendations: [
          'Optimize folder creation workflows',
          'Implement smart folder suggestions',
          'Add bulk organization tools'
        ],
        dataPoints: 150,
        lastUpdated: new Date(),
        trend: 'stable',
        privacyLevel: 'anonymized'
      },
      {
        id: 'sample_pattern_2',
        patternType: 'temporal',
        description: 'Peak productivity hours are between 9-11 AM and 2-4 PM',
        frequency: 23,
        confidence: 0.9,
        strength: 0.85,
        modules: ['all'],
        userSegment: 'business',
        impact: 'positive',
        recommendations: [
          'Schedule important tasks during peak hours',
          'Optimize system performance for peak usage',
          'Send notifications during optimal times'
        ],
        dataPoints: 230,
        lastUpdated: new Date(),
        trend: 'stable',
        privacyLevel: 'anonymized'
      },
      {
        id: 'sample_pattern_3',
        patternType: 'communication',
        description: 'Users respond faster to messages during work hours',
        frequency: 18,
        confidence: 0.8,
        strength: 0.75,
        modules: ['chat', 'business'],
        userSegment: 'business',
        impact: 'positive',
        recommendations: [
          'Prioritize work-hour communications',
          'Set appropriate response time expectations',
          'Optimize notification timing'
        ],
        dataPoints: 180,
        lastUpdated: new Date(),
        trend: 'stable',
        privacyLevel: 'anonymized'
      }
    ];

    for (const pattern of samplePatterns) {
      await prisma.globalPattern.upsert({
        where: { id: pattern.id },
        update: pattern,
        create: pattern
      });
    }

    console.log('✅ Sample global patterns created successfully');

    // Create sample collective insights
    console.log('💡 Creating sample collective insights...');
    const sampleInsights = [
      {
        id: 'sample_insight_1',
        type: 'optimization',
        title: 'Optimize File Organization Workflows',
        description: 'High-frequency pattern detected for hierarchical file organization',
        confidence: 0.85,
        impact: 'high',
        affectedModules: ['drive', 'business'],
        affectedUserSegments: ['all'],
        actionable: true,
        recommendations: [
          'Implement smart folder suggestions',
          'Add bulk organization tools',
          'Create organization templates'
        ],
        implementationComplexity: 'moderate',
        estimatedBenefit: 0.75,
        dataPoints: 150,
        createdAt: new Date(),
        lastValidated: new Date()
      },
      {
        id: 'sample_insight_2',
        type: 'best_practice',
        title: 'Leverage Peak Productivity Hours',
        description: 'Users are most productive during specific time windows',
        confidence: 0.9,
        impact: 'medium',
        affectedModules: ['all'],
        affectedUserSegments: ['business'],
        actionable: true,
        recommendations: [
          'Schedule system maintenance during off-peak hours',
          'Optimize performance for peak usage times',
          'Send important notifications during optimal hours'
        ],
        implementationComplexity: 'simple',
        estimatedBenefit: 0.6,
        dataPoints: 230,
        createdAt: new Date(),
        lastValidated: new Date()
      }
    ];

    for (const insight of sampleInsights) {
      await prisma.collectiveInsight.upsert({
        where: { id: insight.id },
        update: insight,
        create: insight
      });
    }

    console.log('✅ Sample collective insights created successfully');

    // Create sample global learning events
    console.log('📚 Creating sample global learning events...');
    const sampleEvents = [
      {
        id: 'sample_event_1',
        userId: 'user_hash_1',
        eventType: 'pattern_recognition',
        context: 'drive',
        patternData: { actionType: 'folder_creation', frequency: 12 },
        confidence: 0.8,
        impact: 'medium',
        frequency: 1,
        applied: true,
        validated: true
      },
      {
        id: 'sample_event_2',
        userId: 'user_hash_2',
        eventType: 'preference_update',
        context: 'chat',
        patternData: { actionType: 'message_response', timing: 'work_hours' },
        confidence: 0.75,
        impact: 'low',
        frequency: 1,
        applied: true,
        validated: true
      }
    ];

    for (const event of sampleEvents) {
      await prisma.globalLearningEvent.upsert({
        where: { id: event.id },
        update: event,
        create: event
      });
    }

    console.log('✅ Sample global learning events created successfully');

    console.log('🎉 Centralized AI learning tables setup completed successfully!');
    console.log('');
    console.log('📋 Created tables:');
    console.log('  - GlobalLearningEvent');
    console.log('  - GlobalPattern');
    console.log('  - CollectiveInsight');
    console.log('  - SystemConfiguration');
    console.log('');
    console.log('🔗 Access the admin portal at: /admin-portal/ai-learning');
    console.log('📊 Sample data has been created for demonstration');

  } catch (error) {
    console.error('❌ Error creating centralized AI tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  createCentralizedAITables()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

export { createCentralizedAITables };
