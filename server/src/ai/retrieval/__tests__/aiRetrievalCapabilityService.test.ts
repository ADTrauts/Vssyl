import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as searchCapabilityService from '../../../services/searchCapabilityService';
import { SearchAccessError } from '../../../services/searchCapabilityService';
import {
  discover,
  isRetrievalConsumerEnabled,
} from '../aiRetrievalCapabilityService';

describe('aiRetrievalCapabilityService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.AI_RETRIEVAL_DISCOVERY_ENABLED;
  });

  it('discovers via executeGlobalSearch with expanded diagnostics', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results: [
        {
          id: 't1',
          title: 'Plan tasks',
          moduleId: 'todo',
          moduleName: 'Tasks',
          url: '/todo/t1',
          type: 'task',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.9,
        },
        {
          id: 'f1',
          title: 'Plan doc',
          moduleId: 'drive',
          moduleName: 'Drive',
          url: '/drive/f1',
          type: 'file',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.7,
        },
      ],
      meta: {
        query: 'plan my week',
        providerCount: 3,
        resultCount: 2,
        providersInvoked: ['todo', 'calendar', 'drive'],
      },
    });

    const result = await discover({
      query: 'plan my week',
      userId: 'user-1',
      dashboardId: 'dash-1',
      intent: 'planning',
      limit: 5,
    });

    expect(result.evidence).toHaveLength(2);
    expect(result.diagnostics.retrievalPathway).toBe('unified_search');
    expect(result.diagnostics.evidenceCount).toBe(2);
    expect(result.diagnostics.modulesContributingEvidence).toEqual(['todo', 'drive']);
    expect(result.diagnostics.retrievalSourceCounts).toEqual({ todo: 1, drive: 1 });
    expect(result.diagnostics.providerParticipation).toEqual({ todo: 1, drive: 1 });
    expect(result.diagnostics.providersUsed).toEqual(['todo', 'calendar', 'drive']);
    expect(result.diagnostics.permissionEnforcementStatus).toBe('enforced');
    expect(result.diagnostics.searchDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.diagnostics.retrievalDurationMs).toBeGreaterThanOrEqual(
      result.diagnostics.searchDurationMs
    );
  });

  it('scopes business and household context in search filters', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results: [],
      meta: { query: 'ops', providerCount: 0, resultCount: 0, providersInvoked: [] },
    });

    await discover({
      query: 'ops',
      userId: 'user-1',
      businessId: 'biz-1',
      householdId: 'hh-1',
    });

    expect(searchCapabilityService.executeGlobalSearch).toHaveBeenCalledWith({
      userId: 'user-1',
      query: 'ops',
      filters: { context: { businessId: 'biz-1', householdId: 'hh-1' } },
    });
  });

  it('returns denied diagnostics on SearchAccessError 403', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockRejectedValue(
      new SearchAccessError('Access denied', 403)
    );

    const result = await discover({
      query: 'secret',
      userId: 'user-1',
      businessId: 'biz-other',
      intent: 'workflow_action',
    });

    expect(result.evidence).toEqual([]);
    expect(result.diagnostics.permissionEnforcementStatus).toBe('denied');
    expect(result.diagnostics.retrievalPathway).toBe('unified_search');
    expect(result.diagnostics.evidenceCount).toBe(0);
  });

  it('returns error diagnostics on unexpected failures', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockRejectedValue(
      new Error('provider exploded')
    );

    const result = await discover({ query: 'fail', userId: 'user-1' });
    expect(result.diagnostics.permissionEnforcementStatus).toBe('error');
  });

  it('respects limit cap', async () => {
    const results = Array.from({ length: 30 }, (_, i) => ({
      id: `id-${i}`,
      title: `Item ${i}`,
      moduleId: 'drive',
      moduleName: 'Drive',
      url: `/drive/${i}`,
      type: 'file',
      metadata: {},
      permissions: [{ type: 'read' as const, granted: true }],
      lastModified: new Date(),
      relevanceScore: 1 - i * 0.01,
    }));

    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results,
      meta: {
        query: 'files',
        providerCount: 1,
        resultCount: 30,
        providersInvoked: ['drive'],
      },
    });

    const result = await discover({ query: 'files', userId: 'user-1', limit: 100 });
    expect(result.evidence).toHaveLength(25);
    expect(result.diagnostics.resultsSelected).toBe(25);
  });

  it('sets consumerDomain for business_operations intent', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results: [
        {
          id: 'm1',
          title: 'Team member',
          moduleId: 'member',
          moduleName: 'Members',
          url: '/members/m1',
          type: 'member',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.8,
        },
      ],
      meta: {
        query: 'our team workforce',
        providerCount: 2,
        resultCount: 1,
        providersInvoked: ['member', 'todo'],
      },
    });

    const result = await discover({
      query: 'our team workforce quarterly results',
      userId: 'user-1',
      businessId: 'biz-1',
      dashboardId: 'dash-1',
      intent: 'business_operations',
    });

    expect(result.diagnostics.consumerDomain).toBe('business_operations');
    expect(result.diagnostics.modulesContributingEvidence).toEqual(['member']);
    expect(searchCapabilityService.executeGlobalSearch).toHaveBeenCalledWith({
      userId: 'user-1',
      query: 'our team workforce quarterly results',
      filters: { context: { businessId: 'biz-1', dashboardId: 'dash-1' } },
    });
  });

  it('sets consumerDomain and diversity for project_assistant intent', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results: [
        {
          id: 'f1',
          title: 'Project brief',
          moduleId: 'drive',
          moduleName: 'Drive',
          url: '/drive/f1',
          type: 'file',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.9,
        },
        {
          id: 't1',
          title: 'Launch task',
          moduleId: 'todo',
          moduleName: 'Tasks',
          url: '/todo/t1',
          type: 'task',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.7,
        },
      ],
      meta: {
        query: 'project status',
        providerCount: 4,
        resultCount: 2,
        providersInvoked: ['drive', 'todo', 'chat', 'calendar'],
      },
    });

    const result = await discover({
      query: 'Help me understand everything related to this project',
      userId: 'user-1',
      dashboardId: 'dash-1',
      intent: 'project_assistant',
    });

    expect(result.diagnostics.consumerDomain).toBe('project_assistant');
    expect(result.diagnostics.retrievalSourceDiversity).toBe(2);
    expect(result.diagnostics.modulesContributingEvidence).toEqual(['drive', 'todo']);
  });

  it('sets consumerDomain and diversity for local_discovery intent', async () => {
    vi.spyOn(searchCapabilityService, 'executeGlobalSearch').mockResolvedValue({
      results: [
        {
          id: 'p1',
          title: 'Yoga Studio',
          moduleId: 'place',
          moduleName: 'Place',
          url: '/place/p1',
          type: 'place_listing',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.95,
        },
        {
          id: 'e1',
          title: 'Workshop event',
          moduleId: 'calendar',
          moduleName: 'Calendar',
          url: '/calendar/e1',
          type: 'event',
          metadata: {},
          permissions: [{ type: 'read' as const, granted: true }],
          lastModified: new Date(),
          relevanceScore: 0.7,
        },
      ],
      meta: {
        query: 'yoga near me',
        providerCount: 3,
        resultCount: 2,
        providersInvoked: ['place', 'calendar', 'vlink'],
      },
    });

    const result = await discover({
      query: 'yoga clubs near me',
      userId: 'user-1',
      dashboardId: 'dash-1',
      intent: 'local_discovery',
    });

    expect(result.diagnostics.consumerDomain).toBe('local_discovery');
    expect(result.diagnostics.retrievalSourceDiversity).toBe(2);
    expect(result.diagnostics.modulesContributingEvidence).toEqual(['place', 'calendar']);
    expect(result.diagnostics.retrievalSourceCounts.place).toBe(1);
  });

  it('exports isRetrievalConsumerEnabled from consumer contract', () => {
    expect(isRetrievalConsumerEnabled('planning')).toBe(true);
  });
});
