# Sidebar Customization System - Implementation Plan

**Status**: Approved - Ready for Implementation  
**Last Updated**: 2025-01-XX

## 📋 Decisions Made

1. **Folder Nesting**: Single level only (no nested folders)
2. **Module Duplication**: Yes - modules can appear in multiple tabs (tab context aware)
3. **Migration**: Preserve current order when migrating to new system
4. **Reset Options**: All three (per-tab, per-sidebar, global)
5. **Business Admin Defaults**: Phase 2 feature (not MVP)
6. **Mobile**: Desktop only customization (hide on mobile)
7. **Performance**: 50+ modules threshold for virtualization

---

## 🏗️ Architecture Overview

### Data Storage Strategy

**MVP Approach**: Store in Dashboard `preferences` JSON field
- **Location**: `Dashboard.preferences.sidebarCustomization`
- **Structure**: See TypeScript interfaces below
- **Migration Path**: Can move to separate model later if needed

### Context Awareness

- **Personal Context**: User-level customization per dashboard tab
- **Business Context**: User-level customization per business dashboard tab
- **Scope**: Each dashboard tab has its own left sidebar configuration

---

## 📐 Data Structures

### TypeScript Interfaces

```typescript
// web/src/types/sidebar.ts

export interface SidebarFolder {
  id: string;              // Unique folder ID (UUID)
  name: string;           // Display name
  icon?: string;          // Optional folder icon (lucide-react icon name)
  modules: Array<{       // Modules inside this folder
    id: string;          // Module ID
    order: number;       // Order within folder (0-indexed)
  }>;
  collapsed: boolean;     // Is folder collapsed?
  order: number;         // Order of folder in sidebar (0-indexed)
}

export interface LeftSidebarConfig {
  folders: SidebarFolder[];
  looseModules: Array<{  // Modules not in folders
    id: string;
    order: number;
  }>;
}

export interface RightSidebarConfig {
  context: 'personal' | string; // 'personal' or businessId
  pinnedModules: Array<{  // Customizable middle section
    id: string;
    order: number;
  }>;
  // Fixed positions (handled in code):
  // - Dashboard: always index 0
  // - AI Assistant, Modules, Trash: always last 3
}

export interface SidebarCustomization {
  leftSidebar: {
    [dashboardTabId: string]: LeftSidebarConfig; // Tab-specific configs
  };
  rightSidebar: {
    [context: string]: RightSidebarConfig; // Context-specific configs
  };
}

// Full structure stored in Dashboard.preferences
export interface DashboardPreferences {
  // ... existing preferences ...
  sidebarCustomization?: SidebarCustomization;
}
```

---

## 🎯 Default Configurations

### Personal Context - Left Sidebar Defaults

```typescript
const PERSONAL_LEFT_DEFAULTS: LeftSidebarConfig = {
  folders: [
    {
      id: 'core-apps',
      name: 'Core Apps',
      icon: 'grid',
      modules: [
        { id: 'drive', order: 0 },
        { id: 'chat', order: 1 },
        { id: 'calendar', order: 2 }
      ],
      collapsed: false,
      order: 0
    },
    {
      id: 'social',
      name: 'Social',
      icon: 'users',
      modules: [
        { id: 'connections', order: 0 }
      ],
      collapsed: false,
      order: 1
    }
  ],
  looseModules: [
    { id: 'dashboard', order: 0 },
    { id: 'todo', order: 1 }
  ]
};
```

### Business Context - Left Sidebar Defaults

```typescript
const BUSINESS_LEFT_DEFAULTS: LeftSidebarConfig = {
  folders: [
    {
      id: 'communication',
      name: 'Communication',
      icon: 'message-square',
      modules: [
        { id: 'chat', order: 0 },
        { id: 'calendar', order: 1 }
      ],
      collapsed: false,
      order: 0
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: 'briefcase',
      modules: [
        { id: 'drive', order: 0 },
        { id: 'todo', order: 1 }
      ],
      collapsed: false,
      order: 1
    },
    {
      id: 'business',
      name: 'Business',
      icon: 'building',
      modules: [
        { id: 'hr', order: 0 },
        { id: 'scheduling', order: 1 },
        { id: 'members', order: 2 }
      ],
      collapsed: false,
      order: 2
    }
  ],
  looseModules: [
    { id: 'dashboard', order: 0 }
  ]
};
```

### Right Sidebar Defaults

**Personal Context:**
```typescript
const PERSONAL_RIGHT_DEFAULTS: RightSidebarConfig = {
  context: 'personal',
  pinnedModules: [
    { id: 'drive', order: 0 },
    { id: 'chat', order: 1 },
    { id: 'calendar', order: 2 },
    { id: 'todo', order: 3 }
  ]
};
```

**Business Context:**
```typescript
const BUSINESS_RIGHT_DEFAULTS: RightSidebarConfig = {
  context: businessId,
  pinnedModules: [
    { id: 'drive', order: 0 },
    { id: 'chat', order: 1 },
    { id: 'hr', order: 2 },
    { id: 'scheduling', order: 3 }
  ]
};
```

---

## 🔄 Migration Strategy

### Preserving Current Order

1. **On First Load**:
   - Check if `sidebarCustomization` exists in preferences
   - If not, migrate from current flat module list
   - Preserve module order from `getFilteredModules()`
   - Create default folder structure with current modules

2. **Migration Logic**:
```typescript
function migrateCurrentOrderToFolders(
  currentModules: ModuleConfig[],
  context: 'personal' | 'business'
): LeftSidebarConfig {
  const defaults = context === 'personal' 
    ? PERSONAL_LEFT_DEFAULTS 
    : BUSINESS_LEFT_DEFAULTS;
  
  // Map current modules to default structure
  // Preserve order where possible
  // Place unknown modules in looseModules
}
```

---

## 🛠️ Implementation Phases

### Phase 1: Data Layer & API (Foundation)

**Files to Create:**
- `web/src/types/sidebar.ts` - TypeScript interfaces
- `web/src/api/sidebar.ts` - API client functions
- `server/src/services/sidebarCustomizationService.ts` - Service layer
- `server/src/controllers/sidebarController.ts` - API controllers
- `server/src/routes/sidebar.ts` - API routes

**API Endpoints:**
```
GET  /api/dashboard/[id]/sidebar-config
     - Get sidebar customization for dashboard
     - Returns: SidebarCustomization | null

POST /api/dashboard/[id]/sidebar-config
     - Save sidebar customization
     - Body: SidebarCustomization

PUT  /api/dashboard/[id]/sidebar-config
     - Update sidebar customization (same as POST)

DELETE /api/dashboard/[id]/sidebar-config
     - Reset to defaults
     - Query params: ?scope=tab|sidebar|global
```

**Tasks:**
1. ✅ Create TypeScript interfaces
2. ✅ Create API client functions
3. ✅ Create service layer with default configs
4. ✅ Create API controllers
5. ✅ Add routes to server
6. ✅ Test API endpoints

---

### Phase 2: Left Sidebar Customization

**Files to Create:**
- `web/src/components/sidebar/SidebarCustomizationModal.tsx` - Main modal
- `web/src/components/sidebar/LeftSidebarCustomizer.tsx` - Left sidebar editor
- `web/src/components/sidebar/FolderItem.tsx` - Draggable folder component
- `web/src/components/sidebar/ModuleItem.tsx` - Draggable module component
- `web/src/contexts/SidebarCustomizationContext.tsx` - Context for state management

**Files to Modify:**
- `web/src/app/dashboard/DashboardLayout.tsx` - Load and render custom config
- `web/src/components/business/DashboardLayoutWrapper.tsx` - Load and render custom config

**Features:**
1. Modal with tab switcher (dashboard tabs)
2. Folder management (create, rename, delete)
3. Drag & drop modules between folders
4. Drag & drop to reorder folders
5. Collapse/expand folders
6. Save/Cancel buttons

**Tasks:**
1. ✅ Create customization modal component
2. ✅ Create left sidebar customizer with drag & drop
3. ✅ Create folder and module item components
4. ✅ Integrate with DashboardLayout
5. ✅ Integrate with DashboardLayoutWrapper
6. ✅ Add "Customize" button to left sidebar
7. ✅ Test drag & drop functionality

---

### Phase 3: Right Sidebar Customization

**Files to Create:**
- `web/src/components/sidebar/RightSidebarCustomizer.tsx` - Right sidebar editor

**Files to Modify:**
- `web/src/components/sidebar/SidebarCustomizationModal.tsx` - Add right sidebar tab
- `web/src/app/dashboard/DashboardLayout.tsx` - Load and render custom config
- `web/src/components/business/DashboardLayoutWrapper.tsx` - Load and render custom config

**Features:**
1. Context switcher (Personal/Business)
2. Module pinning interface (middle section only)
3. Fixed positions enforcement (Dashboard top, AI/Module/Trash bottom)
4. Visual indicators for fixed vs customizable

**Tasks:**
1. ✅ Create right sidebar customizer
2. ✅ Add to modal with context switcher
3. ✅ Update right sidebar renderers
4. ✅ Enforce fixed positions
5. ✅ Test context switching

---

### Phase 4: Integration & Polish

**Files to Modify:**
- `web/src/app/profile/settings/page.tsx` - Add sidebar customization link
- Migration utilities
- Default config generators

**Features:**
1. Settings page integration
2. Reset functionality (per-tab, per-sidebar, global)
3. Migration from current order
4. Desktop-only detection
5. Performance optimization (virtualization if 50+ modules)

**Tasks:**
1. ✅ Add settings page link
2. ✅ Implement reset functionality
3. ✅ Implement migration logic
4. ✅ Add desktop-only detection
5. ✅ Performance testing and optimization
6. ✅ Final polish and bug fixes

---

## 🎨 UI/UX Specifications

### Customization Modal

**Dimensions:**
- Width: 800px (desktop)
- Height: 600px (desktop)
- Max-height: 90vh

**Layout:**
```
┌─────────────────────────────────────────┐
│  Customize Sidebars              [X]    │
├─────────────────────────────────────────┤
│  [Left Sidebar] [Right Sidebar]        │ ← Tabs
├─────────────────────────────────────────┤
│                                         │
│  Dashboard Tab ▼                        │ ← Tab selector
│  ┌─────────────────────────────────┐   │
│  │ [📁] Core Apps            [>]  │   │ ← Folder (collapsed)
│  │                                 │   │
│  │ [📁] Social                [v]  │   │ ← Folder (expanded)
│  │   ├ 📄 File Hub                 │   │
│  │   ├ 💬 Chat                     │   │
│  │   └ 📅 Calendar                 │   │
│  │                                 │   │
│  │ 📊 Dashboard                    │   │ ← Loose module
│  │                                 │   │
│  │ [+ New Folder]                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  💡 Drag modules to reorder or move    │
│     into folders                        │
│                                         │
│  [Cancel]              [Save Changes]  │
└─────────────────────────────────────────┘
```

### Right Sidebar Customization

**Layout:**
```
┌─────────────────────────────────────────┐
│  Customize Right Sidebar          [X]    │
├─────────────────────────────────────────┤
│  Context: [Personal ▼]                  │
├─────────────────────────────────────────┤
│                                         │
│  Fixed (Top):                           │
│  ┌─────────────────────────────────┐   │
│  │ 📊 Dashboard                    │   │ ← Locked
│  └─────────────────────────────────┘   │
│                                         │
│  Pinned Modules (Customizable):         │
│  ┌─────────────────────────────────┐   │
│  │ 📁 File Hub                     │   │ ← Draggable
│  │ 💬 Chat                         │   │
│  │ 📅 Calendar                     │   │
│  │ ✅ To-Do                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Fixed (Bottom):                        │
│  ┌─────────────────────────────────┐   │
│  │ 🧠 AI Assistant                  │   │ ← Locked
│  │ 🧩 Modules                       │   │ ← Locked
│  │ 🗑️ Trash                         │   │ ← Locked
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]              [Save Changes]  │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation Details

### Drag & Drop Library

**Using**: `@dnd-kit` (already installed)

**Implementation Pattern:**
```typescript
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
```

### State Management

**Context API** for:
- Current customization state (in modal)
- Loading/saving state
- Error handling

**Dashboard Preferences** for:
- Persistence
- Per-dashboard-tab configuration

### Performance Considerations

1. **Virtualization**: Use `react-window` if 50+ modules
2. **Memoization**: Memoize folder/module components
3. **Debouncing**: Debounce save operations (500ms)
4. **Lazy Loading**: Load customization only when modal opens

---

## 📝 Testing Checklist

### Functional Tests
- [ ] Load existing customization
- [ ] Create new folder
- [ ] Rename folder
- [ ] Delete folder (with module handling)
- [ ] Drag module to folder
- [ ] Drag module out of folder
- [ ] Reorder modules within folder
- [ ] Reorder folders
- [ ] Reorder loose modules
- [ ] Collapse/expand folder
- [ ] Switch between dashboard tabs
- [ ] Save customization
- [ ] Cancel without saving
- [ ] Reset per-tab
- [ ] Reset per-sidebar
- [ ] Reset global
- [ ] Context switching (personal/business)
- [ ] Right sidebar pinning
- [ ] Fixed positions enforcement

### Edge Cases
- [ ] Empty folder
- [ ] All modules in folders
- [ ] All modules loose
- [ ] Duplicate module IDs (shouldn't happen, but handle gracefully)
- [ ] Missing module (module uninstalled)
- [ ] New module added (should appear in available modules)
- [ ] Migration from old system
- [ ] Network error during save
- [ ] Concurrent edits (last write wins)

### Performance Tests
- [ ] 10 modules (baseline)
- [ ] 50 modules (threshold)
- [ ] 100+ modules (virtualization needed)

---

## 🚀 Deployment Checklist

- [ ] Database migration (if using separate model)
- [ ] API endpoints deployed
- [ ] Frontend components built
- [ ] Migration script tested
- [ ] Default configs verified
- [ ] Mobile detection working
- [ ] Performance tested
- [ ] Documentation updated

---

## 📚 Future Enhancements (Phase 2)

1. **Business Admin Defaults**: Allow business admins to set default sidebar configs for employees
2. **Folder Icons**: Custom icon selection for folders
3. **Folder Colors**: Color coding for folders
4. **Module Search**: Search/filter in customization modal
5. **Import/Export**: Share sidebar configurations
6. **Templates**: Pre-built sidebar configurations
7. **Analytics**: Track most-used modules for smart suggestions

---

## 🐛 Known Limitations (MVP)

1. Single level folders only
2. No business admin defaults
3. Desktop only customization
4. No import/export
5. No templates
6. No analytics/suggestions

---

**Ready to begin implementation!** 🎉

