# AI Experience UX Patterns (Platform Standard)

**Status:** Wave 6A — extracted from Reference UX #4  
**Authority:** [`UX_REFERENCE_PATTERN_CATALOG.md`](../UX_REFERENCE_PATTERN_CATALOG.md)  
**Registration:** [`REFERENCE_MODULE_AI.md`](../audits/REFERENCE_MODULE_AI.md)

> **Track clarification:** These are **product-surface** AI chat/twin UX patterns. They do **not** replace AI Platform architecture certification ([`AI_PLATFORM_CERTIFICATION_STRATEGY.md`](../../architecture/AI_PLATFORM_CERTIFICATION_STRATEGY.md)).

---

## UX-PAT-AI-001 — Single engine (page + embedded)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-001` |

### Purpose

One `AIChatWorkspace` serves full-page, business embed, and dashboard widget via `AIChatModule` — no duplicate chat UI.

### When to use

- Any module exposing AI conversation surfaces (built-in or marketplace)

### When NOT to use

- Separate legacy `/api/ai/chat` widget implementations

### Required components

- `AIChatModule.tsx` mount
- `variant: 'page' | 'embedded'` on workspace
- Widget: thin wrapper only (`AIWidget` → `AIChatModule`)

### Reference implementations

| Surface | Files |
|---------|-------|
| Page | `/ai-chat`, `AIChatPageShell` |
| Business hub | `AIWorkspaceLanding` |
| Widget | `AIWidget.tsx` |

---

## UX-PAT-AI-002 — Conversation lifecycle (pin, rename, delete)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-002` |

### Purpose

Sidebar row and header menus expose pin, rename, archive/delete with unified confirm on delete.

### Required components

- `DropdownMenu` on row + header (**UX-PAT-DES-008**)
- Delete → **UX-PAT-DES-001**

### Reference implementations

| QA | Cases |
|----|-------|
| Part 2F | AI-11, AI-12, AI-07, AI-08 |

---

## UX-PAT-AI-003 — Streaming composer + attachments

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-003` |

### Purpose

Composer with attach, voice, send; Drive-linked file upload; streaming response indicator.

### Required accessibility

- `aria-label` on attach, voice, send (AI-18)

### Required mobile behavior

- Attach + send reachable at 375px (AI-17)

### Reference implementations

| Files | `AIFileUpload`, `AIThinkingIndicator` |

---

## UX-PAT-AI-004 — Provider / model picker (full vs embed)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-004` |

### Purpose

Full `AIProviderModelPicker` on page and header routes; embedded surfaces may default `provider: 'auto'`.

### Certified exception

| Surface | Rationale |
|---------|-----------|
| Embedded `provider: 'auto'` | Dashboard/widget density — full picker on `/ai-chat` |

### Reference implementations

| Route | Picker |
|-------|--------|
| `/ai-chat` | Full picker |
| Widget/embed | `auto` default |

---

## UX-PAT-AI-005 — Identity control center (`/ai`)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-005` |

### Purpose

Separate route for memory, behavior, and provider settings — **UX-PAT-NAV-004** tabs archetype.

### When to use

- Per-user AI configuration distinct from chat thread UI

### Reference implementations

| Route | `/ai` + `PageHeader` + tabs |

---

## UX-PAT-AI-006 — Explain / policy side panels

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-006` |

### Purpose

Explainability drawer for responses; business policy digest in `WorkspaceAIDrawer`.

### When to use

- Modules exposing AI decisions requiring user-visible rationale or admin policy context

### Reference implementations

| Files | `AIResponseExplainDrawer`, `WorkspaceAIDrawer` |

---

## UX-PAT-AI-007 — Header quick-access twin (certified exception)

| Field | Value |
|-------|-------|
| **Primary reference** | AI #4 |
| **Pattern ID** | `UX-PAT-AI-007` |

### Purpose

`AIChatDropdown` portal for in-context quick chat — must include nav to full workspace.

### See also

**UX-PAT-NAV-005**

### Certified exception

Documented in `REFERENCE_MODULE_AI.md` — not a regression vs page parity.

---

## Related

- [`WORKSPACE_PATTERNS.md`](./WORKSPACE_PATTERNS.md) — UX-PAT-WS-009
- [`CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md`](./CONFIRMATION_AND_DESTRUCTIVE_ACTION_PATTERNS.md)
- [`MOBILE_PATTERNS.md`](./MOBILE_PATTERNS.md)
- [`CROSS_MODULE_INTEGRATION_PATTERNS.md`](./CROSS_MODULE_INTEGRATION_PATTERNS.md)

**Last updated:** 2026-06-03 (Wave 6A)
