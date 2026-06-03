# Vssyl Interaction Standards

**Status:** Wave 0 foundation (2026-06-03)  
**Reference implementations:** Drive / File Hub, Chat (patterns cited below).

---

## Loading behavior

| Context | Pattern |
|---------|---------|
| Initial page load | Skeleton layout matching final UI (`LoadingSkeleton`) |
| Button action | Disable button + spinner; `aria-busy` |
| Background refresh | Subtle indicator; do not block entire workspace |
| Long operations (>3s) | Progress bar or staged status text |

**Avoid:** Full-page spinner when partial skeleton is possible.

---

## Skeleton usage

- Match approximate geometry of cards, rows, and headers.
- Use in Drive file grid and Chat message list loading states.
- Animate with respect for `prefers-reduced-motion` (see [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md)).

---

## Empty states

Required structure (see [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)):

1. Icon (meaningful, not decorative-only)
2. Title (what is empty)
3. Description (why or what to do)
4. Action (optional) — upload, create, connect

**Drive:** Empty folder prompts upload/create.  
**Chat:** Empty channel explains how to start conversation.

---

## Error states

| Severity | Pattern |
|----------|---------|
| Inline field | Below input, `aria-describedby`, danger color |
| Section | `Alert` + retry |
| Page | Error boundary or full-page message with support path |
| API failure | Toast for transient; inline for form submit |

Never expose raw stack traces to end users.

---

## Toast usage

- **Success:** Created, saved, copied
- **Info:** Background job started
- **Warning:** Reversible issues
- **Error:** Quick failures; use modal if user must acknowledge

Providers: `shared/components/ToastProvider`, `react-hot-toast` in app shell.

Do not toast for every realtime event — batch or badge instead.

---

## Confirmation patterns

| Action type | Pattern |
|-------------|---------|
| Destructive irreversible | Modal confirm with explicit verb ("Delete permanently") |
| Destructive reversible | Soft-delete + Global Trash; toast with undo if implemented |
| Bulk destructive | Confirm + count ("Delete 12 files?") |
| Leave unsaved form | `beforeunload` or in-app dialog |

---

## Destructive actions

Align with platform trash contract:

- User data → `trashedAt` soft delete
- List queries exclude trashed
- Global Trash for restore/purge

See `docs/architecture/GLOBAL_TRASH.md`.

---

## Drag-and-drop

**Drive reference:**

- Draggable items use clear grab affordance
- Drop targets highlight with border/background token
- Keyboard alternative required where DnD is essential (or document limitation)
- On drop failure: revert UI + error toast

Use `shared/components/DraggableWrapper` where applicable.

---

## Right-click / context menu

**Drive reference:** `ContextMenu` for file/folder actions.

- Position at cursor; flip if near viewport edge
- Close on Escape, outside click, scroll
- Same actions available elsewhere (not context-only exclusives for critical paths)

---

## Search behavior

| Type | Behavior |
|------|----------|
| Local filter | Debounce 200–300ms; clear button |
| Global search | `GlobalSearchContext`; results grouped by entity type |
| Drive search | Scope to folder/dashboard; show empty state for no results |

Loading indicator in input adornment while fetching.

---

## Pagination / infinite scroll

| Pattern | When |
|---------|------|
| Pagination | Admin tables, audit logs |
| Infinite scroll | Activity feeds, chat history (with "new messages" pill) |

Always indicate end of list or total count when known.

---

## Form validation

- Validate on submit; inline on blur for expensive fields only
- First error receives focus
- Disable submit while invalid + show summary for accessibility
- Server errors map to fields when possible

---

## Optimistic updates

Allowed when:

- Rollback on failure is implemented
- User sees immediate feedback (message sent, file renamed)

Chat message send and Drive rename are reference patterns. On failure: revert + toast.

---

## Realtime update indicators

- Chat: unread badges, "new messages" divider, optional socket reconnect banner
- Drive: refresh folder without full page reload when possible
- Do not steal focus on background updates

Membership and tenancy checks remain server-side — UI indicators only reflect authorized data.

---

## Related

- [`COMPONENT_STANDARDS.md`](./COMPONENT_STANDARDS.md)
- [`ACCESSIBILITY_STANDARDS.md`](./ACCESSIBILITY_STANDARDS.md)
- [`UX_CONSTITUTION.md`](./UX_CONSTITUTION.md)

**Last updated:** 2026-06-03
