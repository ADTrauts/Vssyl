import { beforeEach, describe, expect, it, vi } from 'vitest';
import { actionExecutorRegistry } from '../ActionExecutorRegistry';
import type { AIAction, UserContext } from '../DigitalLifeTwinService';
import { verifyWebhookSignature, WEBHOOK_SIGNATURE_HEADER } from '../../../services/webhookSigning';

describe('ActionExecutorRegistry webhook executor (Phase 4C)', () => {
  beforeEach(() => {
    actionExecutorRegistry.clear();
    vi.restoreAllMocks();
  });

  it('posts signed payload to webhook executor and returns result', async () => {
    const secret = 'executor-signing-secret';
    let capturedBody = '';
    let capturedSignature: string | null = null;

    vi.spyOn(global, 'fetch').mockImplementation(async (_url, init) => {
      capturedBody = String(init?.body ?? '');
      const headers = init?.headers as Record<string, string>;
      capturedSignature = headers[WEBHOOK_SIGNATURE_HEADER] ?? null;

      return new Response(
        JSON.stringify({
          actionId: 'action-1',
          success: true,
          metadata: {
            executionTime: 12,
            module: 'test-action-executor',
            operation: 'create_test_item',
            affectedUsers: [],
            rollbackAvailable: false,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    });

    actionExecutorRegistry.register({
      moduleId: 'test-action-executor',
      supportedOperations: ['create_test_item'],
      executorType: 'webhook',
      webhookConfig: {
        executorUrl: 'https://partner.example.com/execute',
        signingSecret: secret,
        timeout: 5000,
      },
    });

    const action: AIAction = {
      id: 'action-1',
      type: 'module_action',
      module: 'test-action-executor',
      operation: 'create_test_item',
      parameters: { title: 'Demo' },
      requiresApproval: false,
      reasoning: 'User asked to create a test item',
      affectedUsers: [],
    };

    const userContext = { userId: 'user-1' } as UserContext;
    const result = await actionExecutorRegistry.execute(action, userContext);

    expect(result.success).toBe(true);
    expect(capturedBody).toContain('create_test_item');
    expect(
      verifyWebhookSignature({
        secret,
        rawBody: capturedBody,
        signatureHeader: capturedSignature,
      })
    ).toBe(true);
  });
});
