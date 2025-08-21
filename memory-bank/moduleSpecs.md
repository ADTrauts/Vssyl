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
- [roadmap.md](./roadmap.md) (planned features)
- [activeContext.md](./activeContext.md) (current focus)

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
- **See also:** [roadmap.md](./roadmap.md) for planned marketplace enhancements

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