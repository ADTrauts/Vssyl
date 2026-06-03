import { describe, expect, it } from 'vitest';
import { NOTEBOOK_PAGE_TEMPLATES } from '@/components/notebook/notebookTemplates';
import { buildMeetingPageTitle } from '@/lib/notebookMeetingPage';

describe('notebookMeetingPage', () => {
  it('meeting template includes agenda, decisions, and action items', () => {
    const meeting = NOTEBOOK_PAGE_TEMPLATES.find((t) => t.id === 'meeting-notes');
    expect(meeting).toBeDefined();
    expect(meeting?.content).toMatch(/Agenda/);
    expect(meeting?.content).toMatch(/Decisions/);
    expect(meeting?.content).toMatch(/Action items/);
    expect(meeting?.pageTypeTag).toBe('type:meeting');
  });

  it('buildMeetingPageTitle prefixes event title', () => {
    expect(buildMeetingPageTitle({ title: 'Standup' })).toBe('Meeting: Standup');
  });
});
