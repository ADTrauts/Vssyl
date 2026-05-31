import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const controllerPath = join(process.cwd(), 'src/controllers/chatController.ts');

describe('chatController contract (Phase 1E)', () => {
  const source = readFileSync(controllerPath, 'utf8');

  it('has no prisma import or usage', () => {
    expect(source).not.toMatch(/from ['"]\.\.\/lib\/prisma['"]/);
    expect(source).not.toMatch(/\bprisma\./);
  });

  it('has no direct notification or activity side effects', () => {
    expect(source).not.toMatch(/NotificationService/);
    expect(source).not.toMatch(/emitModuleActivityEvent/);
    expect(source).not.toMatch(/getChatSocketService/);
  });
});
