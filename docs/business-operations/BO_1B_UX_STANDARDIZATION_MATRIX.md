# BO-1B UX Standardization Matrix

**Program:** Business Operations BO-1B  
**Date:** 2026-06-19

---

## Legend

| Symbol | Meaning |
|--------|---------|
| **C** | Compliant |
| **M** | Migrated in BO-1B |
| **P** | Partial / exception documented |
| **N/A** | Not applicable |

---

## Cross-module UX standards

| Standard | Scheduling | HR | Workforce Comms | Evidence |
|----------|------------|-----|-----------------|----------|
| No native `confirm()` | **M** | C | C | UX shell test |
| No native `prompt()` | **M** | C | C | Swap Modal migration |
| `ConfirmModal` destructive actions | **M** | C | C | useConfirm / ConfirmModal |
| `EmptyState` empty lists | **M** | **M** | **M** | BusinessOperationsEmptyState |
| `v-*` design tokens | **M** | **M** | **M** | Token migration script |
| Shared layout shell | P | P | P | Layout naming advisory (BO-F-D05 closed for patterns) |
| Workspace landing hub | C | C | C | Pre-existing |

---

## Scheduling matrix (selected surfaces)

| Surface | Native dialogs | EmptyState | Tokens | Modal |
|---------|----------------|------------|--------|-------|
| Admin content / builder | M | M | M | useConfirm |
| Employee swaps / open shifts | M | M | M | Modal + ConfirmModal |
| Availability management | M | P | M | useConfirm |
| Team content | C | P | M | — |
| AI assistant | C | P | M | — |

---

## HR matrix (selected surfaces)

| Surface | Native dialogs | EmptyState | Tokens | Modal |
|---------|----------------|------------|--------|-------|
| Onboarding journey view | C | M | M | existing modals |
| Team onboarding tasks | C | M | M | approval modal |
| Analytics dashboards | C | P | M | — |
| HR layout / content | C | P | M | — |

---

## Workforce Communications matrix (selected surfaces)

| Surface | Native dialogs | EmptyState | Tokens | Modal |
|---------|----------------|------------|--------|-------|
| Communication list | C | M | M | ConfirmModal |
| Campaign manager | C | M | M | ConfirmModal |
| Feed | C | M | M | — |
| Composer | C | P | M | ConfirmModal |
| Reporting panels | C | M | M | — |

---

## Shared component

```text
web/src/components/business-operations/BusinessOperationsEmptyState.tsx
  └── shared/components/EmptyState (v-* tokens)
```

---

## Reference alignment

Patterns aligned with:

- Admin Portal 1A UX shell (ConfirmModal, no native dialogs)
- Business Administration 1E (`businessAdministrationUxShell.test.ts` contract)
- UX Modernization Program token bar (`v-*` over `gray-*`)
