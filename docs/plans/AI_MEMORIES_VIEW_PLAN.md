# Plan: “What the AI Knows” (Memories) in AI Control Center

**Status:** Phases 1-3 implemented (February 2025). See memory-bank activeContext.md and progress.md.

**Goal:** Add a single, read-oriented view inside the AI Control Center where users can see everything the system “remembers” about them, with clear sections and smart links to edit. No duplicate forms—reuse Custom Context and Personality for editing.

---

## Principles

1. **One place to look** – One tab that answers “What does the AI know about me?”
2. **Read-first** – Optimized for scanning and understanding; edit via existing tabs.
3. **Reuse, don’t duplicate** – Use existing APIs and the existing Custom Context / Personality surfaces for editing.
4. **Progressive** – Ship a clear v1 (context + personality summary), then add source labels and patterns if useful.

---

## Current State

- **Custom Context** tab (`/ai?tab=context`) – Lists and edits UserAIContext (facts, preferences, instructions, workflows). Same data used by the twin.
- **Personality Profile** tab (`/ai?tab=personality`) – Full questionnaire and save. Used by the twin.
- **No single “memories” view** – Users must open multiple tabs to see “what’s remembered.”
- **UserAIContext** has no “source” field – We can’t yet distinguish “saved from conversation” vs “you added” without a schema/API change.
- **Patterns** – ✅ Implemented: `GET /api/ai/learning/my-patterns` and "Learned patterns" section in Memories view (Phase 3).

---

## Phase 1: Memories Tab (Recommended First)

### 1.1 Add “Memories” tab to AI Control Center

- **File:** `web/src/app/ai/page.tsx`
- Add a 7th tab: **“Memories”** (or “What the AI knows”).
- Icon: e.g. `BookOpen` or `Brain`-style “memory” icon from lucide-react.
- Tab value: `memories`; URL: `/ai?tab=memories`.

### 1.2 New component: `AIMemoriesView`

- **Path:** `web/src/components/ai/AIMemoriesView.tsx`
- **Data (existing APIs only):**
  - `GET /api/ai/context` – List UserAIContext (same as Custom Context).
  - `GET /api/ai/personality/profile` (or existing personality endpoint) – For a short summary (e.g. traits in a compact card).
- **Layout:**
  - **Intro copy** – e.g. “Your Digital Life Twin uses the following to personalize answers. You can edit or add more in Custom Context and Personality Profile.”
  - **Section: “Facts & preferences”** – Group UserAIContext by `contextType`:
    - **Facts** – Cards/list with title + short content preview; “Edit” / “Delete” could open Custom Context with that item or a small inline edit (optional; link is enough for v1).
    - **Preferences** – Same idea.
    - **Instructions** – Same.
    - **Workflows** – Same.
  - **Section: “Personality”** – One compact card: e.g. “Communication style”, “Planning horizon”, and 1–2 key traits (from personality API). CTA: “Edit in Personality Profile” → switch tab to `personality` (or `router.push('/ai?tab=personality')`).
  - **Empty state** – If no context entries and no personality set: “Nothing saved yet. Chat with your AI or add instructions in Custom Context to get started.”
- **Actions:**
  - “Add or edit in Custom Context” → switch to `context` tab (or deep-link).
  - “Edit personality” → switch to `personality` tab.
  - Optional: inline delete for a context entry (call existing delete API and refresh list).

### 1.3 Tab list layout

- With 7 tabs, the grid may get tight. Options:
  - **Option A:** Keep `grid-cols-6` and add Memories as 7th; wrap to two rows if needed, or use a horizontal scroll.
  - **Option B:** Use a dropdown or “More” for less-used tabs and keep Overview, Provider, Memories, Personality, Custom Context, Autonomy, Actions in a sensible order (e.g. put Memories after Overview so it’s discoverable).

Recommendation: Add Memories as 7th tab with `grid-cols-7` or a responsive class (e.g. `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7`) so it fits cleanly.

### 1.4 No backend changes for Phase 1

- Reuse `GET /api/ai/context` and existing personality endpoint(s).
- No new API and no schema change.

---

## Phase 2 (Optional): “From you” vs “From conversations”

### 2.1 Goal

- In the Memories view, label each context entry as either “You added this” or “Saved from a conversation.”

### 2.2 Backend

- **Schema:** Add optional field to UserAIContext, e.g. `source String? // 'user' | 'conversation'`.
- **Migration:** Add column; backfill existing rows (e.g. `user` if created before fact-extraction existed, or leave null and treat null as “unknown”).
- **Fact extraction:** When creating a context entry from a conversation, set `source: 'conversation'`.
- **Custom Context UI:** When user creates/edits an entry, set `source: 'user'`.
- **API:** Return `source` in GET /api/ai/context so the frontend can show the label.

### 2.3 Frontend

- In AIMemoriesView, for each item show a small badge or subtitle: “You added” vs “Saved from a conversation” using `source`.

---

## Phase 3 (Optional): Learned patterns

### 3.1 Goal

- Show a high-level summary of “patterns” the system has learned (e.g. “You often use Drive in the morning”) without exposing raw events.

### 3.2 Backend

- New endpoint, e.g. `GET /api/ai/learning/my-patterns` (or under `/api/ai/...`).
- Returns a small list of user-friendly pattern summaries for the current user (derived from AILearningEvent / pattern logic). Read-only, no PII beyond what the user already has.

### 3.3 Frontend

- In AIMemoriesView, add section “Learned patterns” (or “Insights the AI uses”).
- Call the new endpoint; display as short, readable bullets or cards.
- Optional: “Clear” or “Don’t use this” later (would require backend support).

---

## Implementation order (recommended)

| Step | Task | Effort |
|------|------|--------|
| 1 | Add “Memories” tab to `/ai` and create `AIMemoriesView.tsx` | Small |
| 2 | Implement “Facts & preferences” section (group by contextType, reuse GET /api/ai/context) | Small |
| 3 | Implement “Personality” summary card + link to Personality tab | Small |
| 4 | Empty states and “Edit in Custom Context” / “Edit in Personality” CTAs | Small |
| 5 | Adjust tab layout (e.g. grid-cols-7 or responsive) and copy | Tiny |
| (Later) | Phase 2: source field + labels | Medium |
| (Later) | Phase 3: patterns API + section | Medium |

---

## Files to add/change (Phase 1 only)

| File | Action |
|------|--------|
| `web/src/app/ai/page.tsx` | Add Memories tab; render `<AIMemoriesView />` for `tab=memories`. |
| `web/src/components/ai/AIMemoriesView.tsx` | **New.** Fetch context + personality; render sections and CTAs. |

---

## Copy and UX notes

- **Tab name:** “Memories” is short and clear; “What the AI knows” can be the section title or intro line.
- **Tone:** Reassuring (“You’re in control”) and clear (“This is what we use to personalize”).
- **Accessibility:** Same as rest of AI Control Center (focus order, labels, contrast).
- **Mobile:** Section cards stack; tab bar can scroll or collapse to a select if needed.

---

## Success criteria (Phase 1)

- User can open AI Control Center → Memories and see:
  - All UserAIContext entries grouped by type (fact / preference / instruction / workflow).
  - A short personality summary with a link to the Personality tab.
- User can get to Custom Context and Personality from this tab without retyping or hunting.
- No new API or schema in Phase 1; implementation stays contained to one new component and one tab.
