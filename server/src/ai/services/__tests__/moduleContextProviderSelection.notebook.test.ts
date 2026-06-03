import { describe, expect, it } from 'vitest';
import { selectContextProvider } from '../moduleContextProviderSelection';

describe('moduleContextProviderSelection notebook', () => {
  const providers = [
    { name: 'recent_pages', endpoint: '/api/notes/ai/context/recent' },
    { name: 'pinned_pages', endpoint: '/api/notes/ai/context/pinned' },
    { name: 'task_overview', endpoint: '/api/todo/ai/context/overview' },
  ];

  it('selects task_overview when query mentions tasks', () => {
    const picked = selectContextProvider('notebook', 'what are my open todo items', providers);
    expect(picked?.name).toBe('task_overview');
  });

  it('selects recent_pages by default', () => {
    const picked = selectContextProvider('notebook', 'open my pages', providers);
    expect(picked?.name).toBe('recent_pages');
  });
});
