/**
 * Phase 1B — Approval lifecycle E2E for share_file through Twin + /approvals/:id/respond
 */
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { User } from '@prisma/client';

const { grantFileShareByEmail } = vi.hoisted(() => ({
  grantFileShareByEmail: vi.fn(async () => ({
    file: { id: 'file-phase1b-1', name: 'Doc' },
  })),
}));

vi.mock('../../services/driveFileShareService', async () => {
  const actual = await vi.importActual<typeof import('../../services/driveFileShareService')>(
    '../../services/driveFileShareService'
  );
  return {
    ...actual,
    grantFileShareByEmail,
  };
});

import {
  cleanupTestUsers,
  createAuthHeader,
  createTestAdminUser,
  createTestUser,
} from '../../__tests__/helpers/auth';
import { prisma } from '../../lib/prisma';
import {
  clearFakeProviders,
  cleanupAiPhase1bArtifacts,
  createTwinRealStackApp,
  installFakeProviders,
} from '../../ai/__tests__/helpers/phase1bTwinTestApp';

describe('Phase 1B — share_file approval lifecycle E2E', () => {
  const app = createTwinRealStackApp();
  const userIds: string[] = [];
  let owner: User;
  let other: User;

  beforeAll(async () => {
    owner = await createTestAdminUser({ name: 'Phase1B Share Owner' });
    other = await createTestUser({
      name: 'Phase1B Share Other',
      email: `share-other-${Date.now()}@test.com`,
    });
    userIds.push(owner.id, other.id);
  });

  beforeEach(() => {
    grantFileShareByEmail.mockClear();
    grantFileShareByEmail.mockResolvedValue({
      file: { id: 'file-phase1b-1', name: 'Doc' },
    });
  });

  afterEach(() => {
    clearFakeProviders();
  });

  afterAll(async () => {
    await cleanupAiPhase1bArtifacts({ userIds });
    await cleanupTestUsers(userIds);
  });

  it('propose → approve → execute once; duplicate approve replays', async () => {
    installFakeProviders([
      {
        type: 'tool_calls',
        toolCalls: [
          {
            id: 'tc_share_1',
            name: 'share_file',
            arguments: {
              fileId: 'file-phase1b-1',
              targetUserEmail: other.email,
            },
          },
        ],
      },
      { type: 'text', response: 'I need your approval to share that file.' },
    ]);

    const twinRes = await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(owner))
      .send({
        query: 'Share my file with the other user',
        provider: 'openai',
        context: {},
      });

    expect(twinRes.status).toBe(200);
    expect(grantFileShareByEmail).not.toHaveBeenCalled();

    const pending = twinRes.body?.data?.metadata?.pendingToolApprovals as
      | Array<{ approvalId: string }>
      | undefined;
    let approvalId = pending?.[0]?.approvalId;
    if (!approvalId) {
      const row = await prisma.aIApprovalRequest.findFirst({
        where: { userId: owner.id, requestType: 'share_file', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
      });
      approvalId = row?.id;
    }
    expect(approvalId).toBeTruthy();

    const execBefore = await prisma.aIActionExecution.findFirst({
      where: { approvalId: approvalId!, userId: owner.id },
    });
    expect(execBefore?.status).toBe('AWAITING_APPROVAL');

    const approveRes = await request(app)
      .post(`/api/ai/approvals/${approvalId}/respond`)
      .set(createAuthHeader(owner))
      .send({ response: 'approve' });

    expect(approveRes.status).toBe(200);
    expect(grantFileShareByEmail).toHaveBeenCalledTimes(1);

    const execAfter = await prisma.aIActionExecution.findFirst({
      where: { approvalId: approvalId! },
    });
    expect(execAfter?.status).toBe('COMPLETED');
    expect(execAfter?.executed).toBe(true);

    const approveAgain = await request(app)
      .post(`/api/ai/approvals/${approvalId}/respond`)
      .set(createAuthHeader(owner))
      .send({ response: 'approve' });

    expect(approveAgain.status).toBe(200);
    expect(approveAgain.body.idempotentReplay || approveAgain.body.execution?.idempotentReplay).toBeTruthy();
    expect(grantFileShareByEmail).toHaveBeenCalledTimes(1);
  });

  it('reject does not execute share', async () => {
    installFakeProviders([
      {
        type: 'tool_calls',
        toolCalls: [
          {
            id: 'tc_share_2',
            name: 'share_file',
            arguments: { fileId: 'file-phase1b-2', targetUserEmail: other.email },
          },
        ],
      },
      { type: 'text', response: 'Waiting for approval' },
    ]);

    await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(owner))
      .send({ query: 'Share again', provider: 'openai', context: {} });

    const row = await prisma.aIApprovalRequest.findFirst({
      where: { userId: owner.id, requestType: 'share_file', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    expect(row).toBeTruthy();

    const rejectRes = await request(app)
      .post(`/api/ai/approvals/${row!.id}/respond`)
      .set(createAuthHeader(owner))
      .send({ response: 'reject', reasoning: 'No thanks' });

    expect(rejectRes.status).toBe(200);
    expect(grantFileShareByEmail).not.toHaveBeenCalled();

    const exec = await prisma.aIActionExecution.findFirst({ where: { approvalId: row!.id } });
    expect(exec?.status).toBe('REJECTED');
  });

  it('other user cannot approve', async () => {
    installFakeProviders([
      {
        type: 'tool_calls',
        toolCalls: [
          {
            id: 'tc_share_3',
            name: 'share_file',
            arguments: { fileId: 'file-phase1b-3', targetUserEmail: other.email },
          },
        ],
      },
      { type: 'text', response: 'Awaiting' },
    ]);

    await request(app)
      .post('/api/ai/twin')
      .set(createAuthHeader(owner))
      .send({ query: 'Share third', provider: 'openai', context: {} });

    const row = await prisma.aIApprovalRequest.findFirst({
      where: { userId: owner.id, requestType: 'share_file', status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    const res = await request(app)
      .post(`/api/ai/approvals/${row!.id}/respond`)
      .set(createAuthHeader(other))
      .send({ response: 'approve' });

    expect(res.status).toBe(403);
  });

  it('expired approval returns 410', async () => {
    const expired = await prisma.aIApprovalRequest.create({
      data: {
        userId: owner.id,
        requestType: 'share_file',
        actionData: {
          tool: 'share_file',
          args: { fileId: 'x', targetUserEmail: other.email },
        },
        affectedUsers: [],
        reasoning: 'expired fixture',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const res = await request(app)
      .post(`/api/ai/approvals/${expired.id}/respond`)
      .set(createAuthHeader(owner))
      .send({ response: 'approve' });

    expect(res.status).toBe(410);
  });
});
