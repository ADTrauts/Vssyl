/** Shared page templates (stored as Notes API pages). */
export const NOTEBOOK_PAGE_TEMPLATES = [
  {
    id: 'meeting-notes',
    name: 'Meeting notes',
    title: 'Meeting notes',
    pageTypeTag: 'type:meeting',
    content: `## Meeting title

**Date / time:** 
**Location:** 
**Attendees:** 

## Agenda
- 

## Notes
- 

## Decisions
- 

## Action items
- [ ] 
- [ ] 
`,
  },
  {
    id: 'daily-standup',
    name: 'Daily standup',
    title: 'Daily standup',
    pageTypeTag: 'type:daily',
    content: `## Standup — [Date]

### Yesterday
- 

### Today
- 

### Blockers
- 
`,
  },
  {
    id: 'project-brief',
    name: 'Project brief',
    title: 'Project brief',
    pageTypeTag: 'type:project',
    content: `## Project brief

### Overview
 

### Goals
- 

### Scope
- In scope: 
- Out of scope: 

### Timeline
- 

### Success criteria
- 
`,
  },
  {
    id: 'blank',
    name: 'Blank page',
    title: 'Untitled page',
    pageTypeTag: 'type:general',
    content: '',
  },
] as const;

export type NotebookPageTemplate = (typeof NOTEBOOK_PAGE_TEMPLATES)[number];
