# Workspace Runtime and Module Contracts

**Status:** Additive foundation (May 2026). Legacy registries and switch-based rendering remain authoritative for UI.

## Core principle

**Module = capability; widget = projection.**

- A **module** is a domain or application capability (Drive, HR, Members). It owns permissions, routes, and optional widgets.
- A **widget** is a **surface projection** of a module on a dashboard grid (Chat widget, Quick Stats). Multiple widgets may reference one module; some modules have no dashboard widget (e.g. Analytics in business workspace only).

## Layout

| Path | Role |
|------|------|
| `web/src/runtime/modules/types.ts` | `ModuleDefinition`, `WidgetDefinition`, `RouteDefinition`, context types |
| `web/src/runtime/modules/coreModuleRegistry.ts` | First-party core modules (`source: 'core'`) |
| `web/src/runtime/modules/moduleRegistry.ts` | Lookup, context filter, `normalizeModuleId` |
| `web/src/runtime/modules/adapters/` | Bridges to `WIDGET_REGISTRY` (read-only) |
| `web/src/runtime/workspace/` | `WorkspaceRuntimeState`, pure helpers, optional React provider |

## ModuleDefinition

Key fields:

- `id`, `name`, `supportedContexts`, `requiredPermissions`
- `widgets` — widget ids owned by this module
- `routes` — business workspace route keys (aligned with `businessWorkspaceNavigation.ts`)
- `source?: 'core' | 'marketplace' | 'custom'`
- `capabilities?: ModuleCapability[]` — e.g. `read`, `write`, `realtime`, `ai`
- `status?: 'active' | 'beta' | 'disabled' | 'experimental'`

## WidgetDefinition

Key fields:

- `componentKey` — legacy widget type for `WidgetShell` / `DashboardClient` (no component migration yet)
- `defaultSize`, `allowedSizes`, `refreshMode`, `visibilityRules`

## WorkspaceRuntime

`WorkspaceRuntimeState` tracks:

- Active context (`personal`, `business`, `household`, `education`, `admin`)
- Dashboard / business / household ids
- `availableModules` / `availableWidgets` (derived from contracts + install list)
- Permission loading and error
- `realtimeSubscriptions`, `activeSocketRooms` — runtime-owned (RT-Q1); shared socket via `web/src/lib/realtimeClient.ts`

Helpers: `canRenderModule`, `canRenderWidget`, `getModulesForContext`, `getWidgetsForContext`.

## Context aliases

| Canonical (`WorkspaceContextType`) | Legacy (`WidgetContext` / DashboardContext) |
|-----------------------------------|---------------------------------------------|
| `education` | `educational` |
| `personal` | `personal` |
| `business` | `business` |
| `household` | `household` |

Use `contextMapping.ts` — do not duplicate string checks.

## What is NOT replaced yet

- `web/src/components/dashboard/widgetRegistry.ts` (`WIDGET_REGISTRY`)
- `BusinessWorkspaceContent` `switch (currentModule)`
- Business front-page `web/src/components/business/widgets/WidgetRegistry.tsx`
- Per-component widget implementations

## Integrations (phase 1)

1. **WidgetPicker** — `getWidgetPickerAvailableEntries()` from contracts; falls back to `getAvailableWidgets()` if empty.
2. **Business workspace** — `getModuleDefinition(normalizeModuleId(currentModule))` for metadata only; rendering unchanged.

## Tests

```bash
pnpm --filter vssyl-web test
```

Scoped to `web/src/runtime/**/__tests__/**/*.test.ts`. Run in CI via `pnpm --filter vssyl-web test` (~22 tests) in the `verify` job.

## Adding a module (checklist)

1. Add `ModuleDefinition` to `coreModuleRegistry.ts` (or future marketplace registry).
2. If it has a dashboard widget, ensure `WIDGET_REGISTRY` still has the entry; adapter picks it up automatically.
3. Add business route in `BusinessWorkspaceContent` switch when full-page surface is ready.
4. Extend `MODULE_ICONS` if sidebar needs an icon.
5. Add unit tests for context filtering and permissions.

## Future migration

1. Register marketplace modules with `source: 'marketplace'` without editing core registry.
2. ~~Mount `WorkspaceRuntimeProvider` at dashboard and business workspace roots; pass `permissionSnapshot` from `BusinessConfigurationContext`.~~ **Done (WR-Q1, May 2026):** `WorkspaceRuntimeScopeBridge`, `BusinessLayoutRuntimeShell`.
3. Replace duplicate `getModuleIcon` / `getModuleName` switches with contract lookups.
4. ~~Wire `realtimeSubscriptions` / `activeSocketRooms` when Socket.IO room policy is centralized.~~ **Done (RT-Q1):** `subscribeRuntimeRoom`, `clearRuntimeSubscriptions`, shared `realtimeClient`.
5. ~~Add `web` runtime tests to CI.~~ **Done:** `.github/workflows/ci.yml` runs `pnpm --filter vssyl-web test`.

## Runtime state boundaries

See **`.cursor/rules/runtime-state-boundaries.mdc`** and `web/src/runtime/workspace/types.ts`.

- **`WorkspaceRuntimeState`** is the canonical derived view for module/widget availability and active selection—not a second permission system.
- **`permissionSnapshot`** is passed **in** via `buildWorkspaceRuntimeState`; do not fork parallel permission maps in feature code.
- **`BusinessConfigurationContext`** remains authoritative for business-tier config and `hasPermission` until fully bridged; when both exist, keep **IDs in sync** (`activeBusinessId`, `businessId` on provider).
- Reset or rebuild runtime state when **dashboard, business, or household** context changes (navigation), so `availableModules` / `availableWidgets` do not leak across tenants.
- Use **`contextMapping.ts`** for `education` ↔ `educational`; never ad-hoc string compares.
- Prefer `realtimeClient` acquire/release and runtime room helpers over ad-hoc `io()` calls; module hooks may still use holder ids until fully migrated to `subscribeRuntimeRoom`.

## Anti-patterns

- Duplicating `getModuleIcon` / `getModuleName` logic instead of contract lookup (legacy switches are transitional only).
- Filtering modules in a feature component with a **different** install list than `installedModuleIds` passed to runtime builders.
- Reading `activeBusinessId` from URL params without matching the provider’s `businessId`.
- Replacing `WIDGET_REGISTRY` or `BusinessWorkspaceContent` switch in a drive-by refactor (explicit migration only).

## Review checklist

- [ ] `ModuleDefinition` in `coreModuleRegistry.ts` (or documented marketplace path)
- [ ] Context aliases via `contextMapping.ts`
- [ ] Hub + switch + icons if business workspace surface (`module-development.mdc`)
- [ ] Runtime unit tests under `web/src/runtime/**/__tests__`
- [ ] No cross-tenant leakage when switching workspace context

**Last updated:** 2026-05-17 (platform hardening closeout — RT-Q1/WR-Q1 + CI web tests)
