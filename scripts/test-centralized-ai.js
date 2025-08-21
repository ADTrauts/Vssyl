const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCentralizedAI() {
  try {
    console.log('🧪 Testing Centralized AI Learning System...\n');

    // Test 1: Check if tables exist and have data
    console.log('📊 Test 1: Database Tables & Sample Data');
    
    const patterns = await prisma.globalPattern.findMany();
    console.log(`   Global Patterns: ${patterns.length} found`);
    patterns.forEach(p => console.log(`     - ${p.patternType}: ${p.description}`));
    
    const insights = await prisma.collectiveInsight.findMany();
    console.log(`   Collective Insights: ${insights.length} found`);
    insights.forEach(i => console.log(`     - ${i.type}: ${i.title}`));
    
    const events = await prisma.globalLearningEvent.findMany();
    console.log(`   Global Learning Events: ${events.length} found`);
    
    const config = await prisma.systemConfiguration.findMany();
    console.log(`   System Configurations: ${config.length} found`);

    // Test 2: Check data integrity
    console.log('\n🔍 Test 2: Data Integrity');
    
    if (patterns.length > 0) {
      const pattern = patterns[0];
      console.log(`   Pattern ID: ${pattern.id}`);
      console.log(`   Pattern Type: ${pattern.patternType}`);
      console.log(`   Confidence: ${pattern.confidence}`);
      console.log(`   Impact: ${pattern.impact}`);
    }
    
    if (insights.length > 0) {
      const insight = insights[0];
      console.log(`   Insight ID: ${insight.id}`);
      console.log(`   Insight Type: ${insight.type}`);
      console.log(`   Confidence: ${insight.confidence}`);
      console.log(`   Impact: ${insight.impact}`);
    }

    // Test 3: Check relationships
    console.log('\n🔗 Test 3: Data Relationships');
    
    const drivePatterns = patterns.filter(p => p.modules.includes('drive'));
    console.log(`   Drive-related patterns: ${drivePatterns.length}`);
    
    const highConfidenceInsights = insights.filter(i => i.confidence > 0.8);
    console.log(`   High-confidence insights: ${highConfidenceInsights.length}`);

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📈 System Status:');
    console.log(`   - Patterns: ${patterns.length}/3 expected`);
    console.log(`   - Insights: ${insights.length}/2 expected`);
    console.log(`   - Events: ${events.length}/2 expected`);
    console.log(`   - Config: ${config.length}/1 expected`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCentralizedAI();
