/**
 * Test script for OpenAI and Anthropic Admin APIs
 * Run with: npx ts-node server/src/services/aiProviderServices/test-provider-apis.ts
 */

import { OpenAIAdminService } from './openAIAdminService';
import { AnthropicAdminService } from './anthropicAdminService';
import { logger } from '../../lib/logger';

function logSrvErr(operation: string, message: string, err: unknown, context?: Record<string, unknown>): void {
  const e = err instanceof Error ? err : new Error(String(err));
  void logger.error(message, {
    operation,
    error: { message: e.message, stack: e.stack },
    ...(context ? { context } : {}),
  });
}
function logSrvWarn(operation: string, message: string, err?: unknown, context?: Record<string, unknown>): void {
  if (err !== undefined) {
    const e = err instanceof Error ? err : new Error(String(err));
    void logger.warn(message, {
      operation,
      error: { message: e.message, stack: e.stack },
      ...(context ? { context } : {}),
    });
  } else {
    void logger.warn(message, { operation, ...(context ? { context } : {}) });
  }
}
function logSrvDebug(operation: string, message: string, context?: Record<string, unknown>): void {
  void logger.debug(message, { operation, ...(context ? { context } : {}) });
}


async function testOpenAI() {
  logSrvDebug('test_provider_apis_n_testing_openai_admin_api', '\\n=== Testing OpenAI Admin API ===');
  const service = new OpenAIAdminService();
  
  const endDate = new Date();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  try {
    logSrvDebug('test_provider_apis_fetching_usage_data', 'Fetching usage data...');
    const usage = await service.getUsageData({ startDate, endDate });
    logSrvDebug('test_provider_apis_openai_usage_received', 'Usage data received', { usage });
  } catch (error: unknown) {
    logSrvErr('test_provider_apis_openai_usage_failed', 'Error fetching usage', error);
  }
  
  try {
    logSrvDebug('test_provider_apis_nfetching_billing_data', '\\nFetching billing data...');
    const billing = await service.getBillingData('month');
    logSrvDebug('test_provider_apis_openai_billing_received', 'Billing data received', { billing });
  } catch (error: unknown) {
    logSrvErr('test_provider_apis_openai_billing_failed', 'Error fetching billing', error);
  }
}

async function testAnthropic() {
  logSrvDebug('test_provider_apis_n_testing_anthropic_admin_api', '\\n=== Testing Anthropic Admin API ===');
  const service = new AnthropicAdminService();
  
  const endDate = new Date();
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
  
  try {
    logSrvDebug('test_provider_apis_fetching_usage_report', 'Fetching usage report...');
    const usage = await service.getUsageReport({ startDate, endDate });
    logSrvDebug('test_provider_apis_anthropic_usage_received', 'Usage report received', { usage });
  } catch (error: unknown) {
    logSrvErr('test_provider_apis_anthropic_usage_failed', 'Error fetching usage', error);
  }
  
  try {
    logSrvDebug('test_provider_apis_nfetching_cost_report', '\\nFetching cost report...');
    const cost = await service.getCostReport({ startDate, endDate });
    logSrvDebug('test_provider_apis_anthropic_cost_received', 'Cost report received', { cost });
  } catch (error: unknown) {
    logSrvErr('test_provider_apis_anthropic_cost_failed', 'Error fetching cost', error);
  }
}

async function main() {
  logSrvDebug('test_provider_apis_starting_api_tests_n', 'Starting API tests...\\n');
  logSrvDebug('test_provider_apis_environment_check', 'Environment check:');
  logSrvDebug('test_provider_apis_openai_key_status', 'OPENAI_ADMIN_API_KEY status', {
    status: process.env.OPENAI_ADMIN_API_KEY ? 'set' : 'missing',
  });
  logSrvDebug('test_provider_apis_anthropic_key_status', 'ANTHROPIC_API_KEY status', {
    status: process.env.ANTHROPIC_API_KEY ? 'set' : 'missing',
  });
  
  await testOpenAI();
  await testAnthropic();
  
  logSrvDebug('test_provider_apis_n_tests_complete', '\\n=== Tests Complete ===');
}

main().catch((error: unknown) => {
  logSrvErr('test_provider_apis_main', 'Provider API tests failed', error);
});
