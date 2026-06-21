import express from 'express';
import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import contextGraphRouter from '../../routes/context-graph.js';
import {
  createTestUser,
  createAuthHeader,
  cleanupTestUsers,
} from '../../__tests__/helpers/auth.js';
import type { User } from '@prisma/client';

vi.mock('../../context-graph/contextGraphOrchestrator.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../context-graph/contextGraphOrchestrator.js')>();
  return {
    ...actual,
    resolveVLinkBundle: vi.fn(async () => ({
    bundleId: 'bundle-test',
    kind: 'vlink',
    version: '1.0',
    createdAt: new Date().toISOString(),
    root: { kind: 'container', containerType: 'vlink', vlinkId: 'vl-test' },
    tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    composition: {
      depthRequested: 1,
      depthUsed: 1,
      nodeBudgetRequested: 50,
      nodeBudgetUsed: 1,
      edgeBudgetRequested: 50,
      edgeBudgetUsed: 0,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: [],
    edges: [],
    summaries: { stats: { nodeCount: 0, edgeCount: 0, restrictedNodeCount: 0, omittedNodeCount: 0 } },
    provenance: { sources: [], consumer: 'hub_ui' },
    permissionOutcome: { overall: 'empty', gatesApplied: [], restrictedNodes: 0, omittedNodes: 0 },
  })),
  resolveContextBundle: vi.fn(async () => ({
    bundleId: 'bundle-resolve',
    kind: 'resolved',
    version: '1.0',
    createdAt: new Date().toISOString(),
    root: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
    tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
    composition: {
      depthRequested: 1,
      depthUsed: 0,
      nodeBudgetRequested: 50,
      nodeBudgetUsed: 0,
      edgeBudgetRequested: 50,
      edgeBudgetUsed: 0,
      truncated: false,
      nodesOmitted: 0,
    },
    nodes: [],
    edges: [],
    summaries: { stats: { nodeCount: 0, edgeCount: 0, restrictedNodeCount: 0, omittedNodeCount: 0 } },
    provenance: { sources: [], consumer: 'api_client' },
    permissionOutcome: { overall: 'empty', gatesApplied: [], restrictedNodes: 0, omittedNodes: 0 },
  })),
  };
});

function createContextGraphTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/context-graph', contextGraphRouter);
  return app;
}

describe('context graph read API (CG-1A)', () => {
  const app = createContextGraphTestApp();
  let user: User;
  const userIds: string[] = [];

  beforeAll(async () => {
    user = await createTestUser();
    userIds.push(user.id);
  });

  afterAll(async () => {
    await cleanupTestUsers(userIds);
  });

  it('GET /vlinks/:id/bundle requires auth', async () => {
    const res = await request(app).get('/api/context-graph/vlinks/vl-test/bundle');
    expect(res.status).toBe(401);
  });

  it('GET /vlinks/:id/bundle returns bundle envelope', async () => {
    const res = await request(app)
      .get('/api/context-graph/vlinks/vl-test/bundle')
      .set(createAuthHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.kind).toBe('vlink');
    expect(res.headers['x-context-graph-contract-version']).toBe('1.0');
  });

  it('POST /bundle/resolve requires auth', async () => {
    const res = await request(app)
      .post('/api/context-graph/bundle/resolve')
      .send({ tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' }, root: { moduleId: 'drive', entityType: 'file', entityId: 'f1' } });
    expect(res.status).toBe(401);
  });

  it('POST /bundle/resolve validates tenant scope', async () => {
    const res = await request(app)
      .post('/api/context-graph/bundle/resolve')
      .set(createAuthHeader(user))
      .send({ root: { moduleId: 'drive', entityType: 'file', entityId: 'f1' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CG_INVALID_DESCRIPTOR');
  });

  it('POST /bundle/resolve returns bundle', async () => {
    const res = await request(app)
      .post('/api/context-graph/bundle/resolve')
      .set(createAuthHeader(user))
      .send({
        tenantScope: { dashboardId: 'd1', scope: 'PERSONAL' },
        root: { moduleId: 'drive', entityType: 'file', entityId: 'f1' },
        options: { depth: 1 },
      });
    expect(res.status).toBe(200);
    expect(res.body.data.kind).toBe('resolved');
  });

  it('POST /ai/grounding-bundle requires auth', async () => {
    const res = await request(app)
      .post('/api/context-graph/ai/grounding-bundle')
      .send({ vlinkIds: ['vl-test'] });
    expect(res.status).toBe(401);
  });

  it('POST /ai/grounding-bundle returns grounding payloads', async () => {
    const res = await request(app)
      .post('/api/context-graph/ai/grounding-bundle')
      .set(createAuthHeader(user))
      .send({ vlinkIds: ['vl-test'] });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.consumer).toBe('ai_pipeline');
    expect(res.headers['x-context-graph-contract-version']).toBe('1.0');
  });

  it('GET /tags/search requires auth', async () => {
    const res = await request(app).get('/api/context-graph/tags/search?tag=urgent');
    expect(res.status).toBe(401);
  });

  it('GET /tags/search validates tag parameter', async () => {
    const res = await request(app)
      .get('/api/context-graph/tags/search')
      .set(createAuthHeader(user));
    expect(res.status).toBe(400);
  });

  it('GET /tags/search returns index envelope', async () => {
    const res = await request(app)
      .get('/api/context-graph/tags/search?tag=urgent&dashboardId=d1')
      .set(createAuthHeader(user));
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('1.0');
    expect(res.headers['x-context-graph-tag-index-version']).toBe('1.0');
  });
});
