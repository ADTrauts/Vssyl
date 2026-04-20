/**
 * Test Script: Verify Action Executor Registration
 * 
 * This script helps verify that action executors are being registered correctly.
 * Run this after submitting and approving the test module.
 */

import { actionExecutorRegistry } from '../../server/src/ai/core/ActionExecutorRegistry';

async function testExecutorRegistration() {
  console.log('🧪 Testing Action Executor Registration\n');

  // 1. List all registered modules
  console.log('📋 Registered Modules:');
  const modules = actionExecutorRegistry.listModules();
  if (modules.length === 0) {
    console.log('   ⚠️  No modules registered yet');
    console.log('   💡 Make sure you have:');
    console.log('      1. Submitted a module with aiActionExecutor in manifest');
    console.log('      2. Approved the module in admin portal');
    console.log('      3. Module sync has run (happens automatically on approval)\n');
  } else {
    modules.forEach(moduleId => {
      console.log(`   ✅ ${moduleId}`);
    });
    console.log();
  }

  // 2. Check specific module
  const testModuleId = 'test-action-executor';
  console.log(`🔍 Checking module: ${testModuleId}`);
  
  if (actionExecutorRegistry.has(testModuleId)) {
    const executor = actionExecutorRegistry.get(testModuleId);
    if (executor) {
      console.log('   ✅ Module is registered');
      console.log(`   📝 Executor Type: ${executor.executorType}`);
      console.log(`   📋 Supported Operations: ${executor.supportedOperations.join(', ')}`);
      console.log(`   📅 Registered At: ${executor.registeredAt}`);
      
      if (executor.executorType === 'webhook' && executor.webhookConfig) {
        console.log(`   🔗 Webhook URL: ${executor.webhookConfig.executorUrl}`);
      }
    }
  } else {
    console.log('   ❌ Module not found in registry');
    console.log('   💡 This could mean:');
    console.log('      - Module hasn\'t been approved yet');
    console.log('      - Module sync hasn\'t run');
    console.log('      - Module manifest doesn\'t have aiActionExecutor');
  }

  console.log();

  // 3. Test operation support
  if (actionExecutorRegistry.has(testModuleId)) {
    console.log('🧪 Testing Operation Support:');
    const testOperations = ['create_test_item', 'update_test_item', 'invalid_operation'];
    
    testOperations.forEach(operation => {
      const supported = actionExecutorRegistry.supportsOperation(testModuleId, operation);
      console.log(`   ${supported ? '✅' : '❌'} ${operation}: ${supported ? 'Supported' : 'Not supported'}`);
    });
  }

  console.log('\n✅ Test complete!');
}

// Run if called directly
if (require.main === module) {
  testExecutorRegistration().catch(console.error);
}

export { testExecutorRegistration };

