<!--
Update Rules for moduleSpecs.md
- Updated when module or feature specifications change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Module & Feature Specifications

> This file documents specifications for all module-related systems, including module management UI, the dynamic module loader, and the module marketplace. It covers both implemented and planned features, and references related backend and frontend code as well as roadmap phases.

## [2026-04-21] Canonical Module Interoperability Contract

> **Platform standards:** Full constitutional framework — Runtime Kernel, extension boundaries, read/write paths, tiers, drift checklist — in [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md). This section remains the **certification checklist** authority for module interoperability.

> **Implementation status (May 2026):** Migration Batches 1–4 core items shipped — manifest reconcile, all 10 built-ins provisioned, todo/place business workspace, Notes `trashedAt`, todo/notes activity, V_Link resolvers (chat/task/note), `registerPlatformJob()`. See [`memory-bank/progress.md`](progress.md) and constitutional doc §30 for remaining work (service extraction, hr/scheduling events).

This section is the canonical architecture contract for all Vssyl modules (first-party and third-party).  
If any module-specific document conflicts with this section, this section wins unless explicitly superseded here.

### Required lifecycle for privileged actions

Every important module action must follow this sequence:

1. Authorize (tenant + role/permission check)
2. Execute (state mutation)
3. Emit activity event (normalized event envelope)
4. Notify consumers (realtime + notification surfaces as applicable)

Events must only be emitted for successful, authorized actions.

### Canonical normalized activity event envelope

All modules must emit a compatible event shape:

```typescript
interface NormalizedActivityEvent {
  eventId: string;
  timestamp: string; // ISO
  actor: {
    userId: string;
    role?: string;
  };
  action: string; // create|update|delete|share|message|react|...
  target: {
    type: string; // file|folder|message|task|...
    id: string;
  };
  parent?: {
    type: string; // conversation|folder|project|...
    id: string;
  };
  context: {
    dashboardId?: string;
    businessId?: string;
    householdId?: string;
    moduleId: string;
  };
  visibility: {
    scope: 'personal' | 'business' | 'household' | 'direct-share';
  };
  metadata?: Record<string, unknown>;
}
```

### Activity vs Analytics (mandatory separation)

1. **Activity**: immutable event records describing what happened.
2. **Analytics**: derived aggregation/trends built from activity and domain data.

Do not store analytics summaries in activity records, and do not use analytics-only tables as a substitute for activity trails.

### Required module contract areas

Every module must define and implement:

1. **Context scope contract**
   - Personal/business/household support declaration
   - Tenant scoping for reads and writes
2. **Permission contract**
   - Declared permission set
   - Runtime enforcement before actions
3. **Activity contract**
   - Normalized event emission for key actions
   - Queryable event retrieval path for UI
4. **Realtime contract**
   - Event delivery channels by visibility scope
   - Idempotent client update behavior
5. **Notification contract**
   - Notification type metadata in manifest
   - Standardized payload identifiers for navigation
6. **AI context contract**
   - Context providers and response shape aligned with `aiContextSystem.md` and **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**
   - AI-exposed modules: at least one valid `contextProviders` entry (name, endpoint, cacheDuration); structural validation in `moduleContextProviderCertification.ts`
7. **API/auth contract**
   - Proxy-safe API patterns
   - Authenticated identity and context validation
8. **Compliance/observability contract**
   - Structured logs
   - Auditable privileged actions

### Module certification checklist (must-pass)

A module is not considered interoperable unless all are true:

1. Permission checks block unauthorized actions.
2. Tenant scoping is enforced for every persisted query path.
3. Key actions emit normalized activity events.
4. Realtime updates are scoped and authorized.
5. Notification metadata is declared and valid (if module emits notifications).
6. AI context providers are implemented and discoverable (if module is AI-exposed): manifest + registry entry, canonical response shape, admin health check passes. See **`docs/guides/AI_CONTEXT_PROVIDER_API.md`**.
7. Activity and analytics concerns are separated.

### Enforcement path (how this checklist is applied)

| Channel | Responsibility |
|--------|----------------|
| **First-party (monorepo)** | PR review uses the same checklist; agents follow `.cursor/rules/module-interoperability.mdc` + `module-development.mdc`. |
| **Third-party (marketplace)** | Admin approval must not pass if certification items are unmet; structural validator + **`ensureModuleVersionCertificationForActivation`** block `FAILED` on publish/promote/rollback (`moduleVersionCertificationGate.ts`). See `docs/guides/THIRD_PARTY_MODULE_PIPELINE_SOURCE_OF_TRUTH.md`. |
| **Automation** | CI (`prisma migrate deploy`, `type-check`, server vitest ~286, web runtime tests ~22) catches regressions; structural certification is automated — semantic checklist still needs human review. |

**Dry-run references:** `server/src/startup/registerBuiltInModules.ts` (first-party): `docs/test-modules/` sample manifest (third-party-shaped artifact).

## Module Overview
- Purpose and scope of the module/feature.

## Requirements
- Functional and non-functional requirements.

## Design Notes
- Architecture, UI/UX, and integration considerations.

## Module Grouping System [Merged from memory-bank.md]

### Core Components
1. ModuleManager
   - Handles module and group management
   - Supports drag-and-drop reordering
   - Allows adding/removing modules and groups
   - Provides group assignment functionality
   - Includes status toggling (active/inactive)

2. InstalledModulesSidebar
   - Displays hierarchical module structure
   - Supports expandable/collapsible groups
   - Shows ungrouped modules separately
   - Includes mobile-responsive design
   - Features smooth animations for interactions

3. ClientLayout
   - Manages module and group state
   - Handles localStorage persistence
   - Provides responsive layout adjustments
   - Coordinates between components

### Features
1. Module Groups
   - Create and rename groups
   - Assign modules to groups
   - Expandable/collapsible folders
   - Visual hierarchy in sidebar
   - Persistent group organization

2. Module Management
   - Add/remove modules
   - Toggle module status
   - Drag-and-drop reordering
   - Group assignment
   - Status indicators

3. UI/UX
   - Folder icons for groups
   - Active state indicators
   - Smooth animations
   - Mobile-responsive design
   - Intuitive navigation

4. State Management
   - localStorage persistence
   - TypeScript type safety
   - Clean component communication
   - Efficient state updates

### Technical Implementation
1. Data Structure
   ```typescript
   interface Module {
     id: string;
     name: string;
     icon: string;
     status: 'active' | 'inactive';
     path: string;
     groupId?: string;
   }

   interface ModuleGroup {
     id: string;
     name: string;
     modules: Module[];
   }
   ```

2. State Management
   - Modules and groups stored in localStorage
   - Automatic state persistence
   - Efficient updates and re-renders
   - Type-safe state handling

3. Responsive Design
   - Mobile-first approach
   - Collapsible sidebar
   - Touch-friendly interactions
   - Adaptive layouts

### Next Steps
1. Potential Enhancements
   - Search/filtering capabilities
   - Module sorting within groups
   - Group customization (colors, icons)
   - Additional mobile optimizations

2. Future Considerations
   - Module permissions
   - Group sharing
   - Module dependencies
   - Advanced sorting options 

## Example: Module Specification (InstalledModulesSidebar)

### Module Overview
The InstalledModulesSidebar displays the hierarchical structure of installed modules, supporting expandable/collapsible groups and mobile responsiveness. It provides users with intuitive navigation and quick access to all modules, grouped or ungrouped.

### Requirements
- Display all installed modules, grouped and ungrouped
- Support expand/collapse for groups
- Show status indicators (active/inactive)
- Mobile-responsive design
- Smooth animations for interactions
- Accessible via keyboard and screen readers

### Design Notes
- Follows design patterns in [designPatterns.md](./designPatterns.md)
- Uses icons for groups and modules (see Iconography section)
- Sidebar layout adapts for mobile (collapsible, touch-friendly)
- Integrates with ModuleManager for group/module management
- State is persisted in localStorage

---

## Related Documentation
- [designPatterns.md](./designPatterns.md) (UI/UX, tokens, patterns)
- [permissionsModel.md](./permissionsModel.md) (future: module permissions)
- [activeContext.md](./activeContext.md) (current focus; historical roadmap archived)
- [marketplaceProductContext.md](./marketplaceProductContext.md) (marketplace product intent)

---

## Archived Module Specs / Change History
- [Add archived or deprecated module specs here, with date and summary.]

---

## Module Spec Template (for Contributors)

### Module Overview
[Brief description of the module/feature.]

### Requirements
- [List functional and non-functional requirements.]

### Design Notes
- [Architecture, UI/UX, integration notes.]

---

## Module Loader & Marketplace

### Module Runtime (MVP)
- **Purpose:** Safely runs third‑party UI modules as micro‑frontends inside the app.
- **Key Additions:**
  - Backend: `GET /api/modules/:id/runtime` (sanitized manifest, gating, signed assets)
  - Frontend: `web/src/components/ModuleHost.tsx` (iframe host), `web/src/app/modules/run/[moduleId]/page.tsx`
  - Manifest: `runtime.apiVersion`, `frontend.entryUrl`, `permissions`, `capabilities`, `settings`
- **Features:**
  - Install/subscription gating before launch
  - Iframe sandbox with strict origin allowlist and postMessage bridge
  - No token by default; optional short‑lived scoped token with explicit permission
- **Status:** Planned (this repo) — to be implemented as Phase A

### Module Marketplace
- **Purpose:** Allows users to submit, browse, approve, and install modules via a marketplace interface.
- **Key Files:**
  - Backend: `server/src/controllers/moduleController.ts`, `server/src/routes/module.ts`
  - Frontend: `web/src/app/modules/page.tsx`, `web/src/app/modules/[id]/page.tsx`, `web/src/app/modules/submit/page.tsx`
- **Features:**
  - Module submission, approval, rejection, and search
  - Tracks module health, security, developer/reviewer info
  - Integrates with loader/runtime to make approved modules available
- **Status:** Partially implemented; submission/install/review/listing exist. Runtime (MVP) to be added in Phase A.
- **See also:** [`marketplaceProductContext.md`](./marketplaceProductContext.md) for marketplace product intent (historical roadmap archived)

--- 

## [2024-07-08] Chat Module Specification Update

### Module Overview
- The chat module provides real-time messaging, conversation management, and thread details in a three-panel layout.

### Requirements
- Left panel: conversation list, new chat button, search/filter
- Middle panel: active conversation, message list, message input, empty state UI
- Right panel: conversation/thread details, participants, files, threads
- Responsive design for all screen sizes
- Panels must stop at the right sidebar and not flex underneath

### Design Notes
- Uses flexbox for robust panel layout
- Left: fixed 260px (64px collapsed), Middle: flex-1, Right: fixed 320px
- Container width: calc(100vw - 40px) to respect right sidebar
- Chat bubble icon and empty state UI are visually centered
- All panel widths and layout logic are robust and consistent
- Sidebar width is dynamic for different workspace contexts

--- 