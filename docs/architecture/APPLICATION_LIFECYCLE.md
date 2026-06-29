# Application Lifecycle Architecture

Canonical reference for how Vssyl applications move from discovery to daily use. Complements module classification (`shared/src/types/moduleClassification.ts`) and dashboard tab membership (`web/src/lib/dashboardTabModules.ts`).

**Last updated:** 2026-06-29

---

## Product layers

| Layer | Examples | User can install? | Appears in Application Manager? | Appears in Marketplace? |
|-------|----------|-------------------|-----------------------------------|-------------------------|
| **Platform** | Dashboard, V_Link, Place, AI, Notifications | No | No | No |
| **Core Apps** | Drive, Chat, Calendar | No (always included) | Yes (read-only) | No |
| **Installed Applications** | Todo, Notes, HR, CRM | Yes | Yes | After install: manager only |
| **Marketplace** | Catalog of installable apps | Discovery + Install | No (separate surface) | Yes |

Classification helpers: `shared/src/types/moduleClassification.ts`  
Lifecycle metadata: `shared/src/types/applicationLifecycle.ts`  
Client resolution: `web/src/lib/applicationLifecycle.ts`

---

## Canonical lifecycle

```
Marketplace → Install → Configure → Enable → Dashboard Assignment → Use → Update → Disable → Uninstall
```

| Stage | Owner surface | Status |
|-------|---------------|--------|
| Marketplace | `/modules?tab=marketplace`, `/business/[id]/modules?tab=marketplace` | **Implemented** |
| Install / Uninstall | Application Manager (`/modules`, `/business/[id]/modules`) | **Implemented** |
| Configure | Application Manager → module run/settings | **Partial** (hidden when no manifest settings) |
| Enable / Disable | Application Manager | **Architecture only** (`isEnabled`, `configured.enabled`) |
| Dashboard Assignment | Dashboard build-out modal, tab `selectedModuleIds` | **Implemented** |
| Use | Module runtime routes | **Implemented** |
| Update | Marketplace | **Architecture only** (`hasUpdate`, `latestVersion`) |
| Uninstall warnings | Application Manager | **Architecture only** (`dashboardAssignment.ts`) |

---

## Separation of concerns (non-negotiable)

### Application Manager owns installation

- Lists **Core Apps** and **Installed Applications**
- Actions: Open, Configure (when supported), Manage Dashboards, Uninstall
- Never assigns apps to dashboard tabs directly

### Dashboard picker owns assignment

- `DashboardBuildOutModal` and `ModuleManagementModal` load **installed** applications only
- Uses `filterModulesForDashboardPicker` / `filterAssignableModulesForTabPicker`
- Empty state links: Browse Marketplace, Install Application, Return to Dashboard
- **Does not install** applications during assignment (personal scope)

### Marketplace owns discovery

- Install button only
- Excludes platform capabilities and core apps (`isVisibleInMarketplace`)
- Future: Recently Updated, Recommended, permissions, screenshots

### Dashboard membership source of truth

`dashboard.preferences.selectedModuleIds` — independent from installation records.

Core apps (`drive`, `chat`, `calendar`) are normalized into every personal tab via `normalizeSelectedModuleIds`. Platform module `dashboard` is implicit.

---

## Lifecycle metadata (future-ready)

Optional fields on module API responses and manifests:

```typescript
interface ApplicationLifecycleMetadata {
  installedVersion?: string;
  latestVersion?: string;
  hasUpdate?: boolean;
  isEnabled?: boolean;
  supportsConfiguration?: boolean;
  supportsDashboardAssignment?: boolean;
}
```

Client helpers derive defaults from `module.version`, `manifest.settings`, and `configured.enabled` when explicit lifecycle fields are absent.

---

## Extension points (not implemented)

Designed for without breaking current flows:

- **Permissions** — manifest `permissions` + policy engine gates
- **Licensing / purchases** — marketplace checkout before install
- **Organization-wide installs** — business scope bulk provisioning
- **Disable** — `isEnabled: false` hides from picker/launcher, retains data
- **Update** — `hasUpdate` badge in Application Manager + marketplace version compare
- **Uninstall dependency graph** — `findPersonalDashboardAssignments` for “Used by:” warnings
- **AI recommendations** — marketplace “Recommended” section (UI placeholder exists)

---

## Key files

| Area | Path |
|------|------|
| Classification | `shared/src/types/moduleClassification.ts` |
| Lifecycle types | `shared/src/types/applicationLifecycle.ts` |
| Client lifecycle | `web/src/lib/applicationLifecycle.ts` |
| Dashboard assignment | `web/src/lib/dashboardAssignment.ts` |
| Tab membership | `web/src/lib/dashboardTabModules.ts` |
| Personal Application Manager | `web/src/app/modules/page.tsx` |
| Business Application Manager | `web/src/app/business/[id]/modules/page.tsx` |
| Dashboard tab picker | `web/src/components/DashboardBuildOutModal.tsx` |
| Widget picker | `web/src/components/dashboard/WidgetPicker.tsx` |
| Tests | `web/src/lib/__tests__/applicationLifecycle.test.ts` |

---

## Module development checklist

When adding a new installable application:

1. Set `moduleScope` in manifest (not `internal` unless platform-only)
2. Add to classification table in `moduleClassification.ts` if built-in
3. Declare `manifest.settings` if Configure should appear
4. Register marketplace visibility via scope helpers
5. Do **not** add install logic to dashboard pickers
6. Document business-only vs personal scope if applicable

See also: [MODULE_DEVELOPMENT_GUIDE.md](../guides/MODULE_DEVELOPMENT_GUIDE.md), [VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md](./VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md).
