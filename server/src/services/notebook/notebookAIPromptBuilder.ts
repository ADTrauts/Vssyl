import type { NotebookGroundedAIContext } from './notebookAIContextService';

export function buildGroundingPreamble(ctx: NotebookGroundedAIContext): string {
  const lines: string[] = [
    'You are assisting with a Notebook page in Vssyl.',
    `Page title: ${ctx.page.title}`,
    `Tags: ${ctx.page.tags.length ? ctx.page.tags.join(', ') : '(none)'}`,
  ];
  if (ctx.warnings.length) {
    lines.push('Warnings:', ...ctx.warnings.map((w) => `- ${w}`));
  }
  lines.push(
    'Only use information provided below. Do not invent tasks, files, events, or people not present in the context.',
    'Do not claim access to restricted or trashed entities.'
  );
  return lines.join('\n');
}

export function buildSummarizePrompt(ctx: NotebookGroundedAIContext): {
  system: string;
  user: string;
} {
  const system = `${buildGroundingPreamble(ctx)}

Respond with valid JSON only:
{
  "summary": "string",
  "keyDecisions": ["string"],
  "openTasks": ["string"],
  "risksAndFollowUps": ["string"]
}`;
  const user = `Page content:\n${ctx.page.content}\n\nLinked tasks:\n${formatTasks(ctx)}\n\nLinked files:\n${formatFiles(ctx)}\n\nLinked events:\n${formatEvents(ctx)}`;
  return { system, user };
}

export function buildExtractActionItemsPrompt(
  ctx: NotebookGroundedAIContext,
  selectedText?: string
): { system: string; user: string } {
  const system = `${buildGroundingPreamble(ctx)}

Extract concrete action items. Respond with valid JSON only:
{
  "proposals": [
    { "title": "string", "description": "string or null", "dueDate": "ISO date or null", "priority": "LOW|MEDIUM|HIGH|URGENT or null" }
  ]
}
Do not include items already fully captured as linked tasks unless the text adds new work.`;
  const focus = selectedText?.trim()
    ? `Selected text:\n${selectedText}`
    : `Page content:\n${ctx.page.content}`;
  const user = `${focus}\n\nExisting linked tasks:\n${formatTasks(ctx)}`;
  return { system, user };
}

export function buildMeetingRecapPrompt(ctx: NotebookGroundedAIContext): {
  system: string;
  user: string;
} {
  const system = `${buildGroundingPreamble(ctx)}

Generate a meeting recap. Respond with valid JSON only:
{
  "recap": "string",
  "decisions": ["string"],
  "actionItems": [{ "title": "string", "description": "string or null", "dueDate": null, "priority": null }],
  "followUpAgenda": ["string"]
}`;
  const user = `Page content:\n${ctx.page.content}\n\nLinked calendar event:\n${formatEvents(ctx)}\n\nLinked tasks:\n${formatTasks(ctx)}`;
  return { system, user };
}

export function buildSuggestLinksPrompt(
  ctx: NotebookGroundedAIContext,
  candidates: string
): { system: string; user: string } {
  const system = `${buildGroundingPreamble(ctx)}

Suggest links the user might add. Only use candidate IDs from the list. Respond with valid JSON only:
{
  "suggestions": [
    { "targetType": "TASK|FILE|CALENDAR_EVENT", "targetId": "uuid", "label": "string", "reason": "string" }
  ]
}
Return an empty array if nothing is appropriate.`;
  const user = `Page title: ${ctx.page.title}\nPage content (excerpt):\n${ctx.page.content.slice(0, 4000)}\n\nAlready linked:\n${formatTasks(ctx)}\n${formatFiles(ctx)}\n${formatEvents(ctx)}\n\nCandidates (not yet linked):\n${candidates}`;
  return { system, user };
}

function formatTasks(ctx: NotebookGroundedAIContext): string {
  if (!ctx.tasks.length) return '(none)';
  return ctx.tasks
    .map((t) => `- [${t.status}] ${t.title}${t.dueDate ? ` (due ${t.dueDate})` : ''}`)
    .join('\n');
}

function formatFiles(ctx: NotebookGroundedAIContext): string {
  if (!ctx.files.length) return '(none)';
  return ctx.files.map((f) => `- ${f.name}${f.mimeType ? ` (${f.mimeType})` : ''}`).join('\n');
}

function formatEvents(ctx: NotebookGroundedAIContext): string {
  if (!ctx.events.length) return '(none)';
  return ctx.events
    .map((e) => `- ${e.title} ${e.startTime} – ${e.endTime}${e.location ? ` @ ${e.location}` : ''}`)
    .join('\n');
}
