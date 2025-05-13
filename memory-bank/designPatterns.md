<!--
Update Rules for designPatterns.md
- Updated when design or UX patterns change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Design & UX Patterns

## UI/UX Principles

1. **Modularity**
   - All UI components and layouts should be modular and reusable across contexts (personal, business, education, etc.).
   - Favor composition over inheritance; build complex UIs from simple, well-defined building blocks.

2. **Consistency**
   - Use a shared component library and design tokens for colors, spacing, and typography.
   - UI patterns (navigation, forms, dialogs, etc.) should look and behave the same across modules.

3. **Accessibility**
   - All interactive elements must be accessible via keyboard and screen readers.
   - Follow WCAG guidelines for color contrast, focus management, and ARIA roles.

4. **Responsiveness**
   - The UI must adapt gracefully to all device sizes, from mobile to desktop.
   - Use responsive layouts, flexible grids, and scalable components.

5. **Clarity & Simplicity**
   - Prioritize clear information hierarchy and intuitive navigation.
   - Minimize cognitive load by reducing unnecessary complexity and visual clutter.

6. **Feedback & Delight**
   - Provide immediate, meaningful feedback for user actions (e.g., loading spinners, toasts, error messages).
   - Use subtle animations and micro-interactions to enhance the user experience without distraction.

7. **Extensibility**
   - Design components and patterns to be easily extended for new modules, features, or contexts.
   - Document extension points and best practices for customization.

## Reusable Patterns

### Navigation
- Top navigation bar (tabs, user menu)
- Sidebar navigation (collapsible, context-aware)
- Breadcrumbs for hierarchical navigation
- Context switching (personal, education, business dashboards)

### Layouts & Containers
- Dashboard grid and card layouts
- Panel/container patterns (resizable, collapsible)
- Modal, drawer, and dialog overlays
- Responsive/adaptive layouts

### Forms & Inputs
- Standardized input fields (text, select, checkbox, radio, date, etc.)
- Form validation and error display
- Multi-step/wizard forms
- File uploaders and pickers

### Feedback & Messaging
- Toast notifications
- Alerts and banners
- Loading spinners and skeletons
- Error boundaries and error displays

### Data Display
- Table/DataGrid components
- List and card views
- Pagination controls
- Tag/badge components

### User & Presence
- User avatar and profile components
- Presence/online indicators
- Context menus and dropdowns

### Search & Filtering
- Search bars and advanced filters
- Search result lists
- Sorting and filtering controls

### Miscellaneous
- Tooltip and popover components
- Progress bars and sliders
- Tabs and accordions
- Charts and data visualizations

## Examples

> **Note:** Add screenshots, diagrams, or code snippets here to illustrate each pattern. To add a screenshot, use the following markdown:
> `![Pattern Name](../path/to/screenshot.png)`

### Navigation
- ![Top Navigation Bar](../docs/screenshots/ui-top-nav.png)
- ![Sidebar Navigation](../docs/screenshots/ui-sidebar.png)
- ![Breadcrumbs](../docs/screenshots/ui-breadcrumbs.png)
- ![Context Switching Tabs](../docs/screenshots/ui-context-tabs.png)

### Layouts & Containers
- ![Dashboard Grid](../docs/screenshots/ui-dashboard-grid.png)
- ![Panel Container](../docs/screenshots/ui-panel-container.png)
- ![Modal Dialog](../docs/screenshots/ui-modal.png)
- ![Responsive Layout](../docs/screenshots/ui-responsive.png)

### Forms & Inputs
- ![Standard Input Fields](../docs/screenshots/ui-inputs.png)
- ![Form Validation](../docs/screenshots/ui-form-validation.png)
- ![File Uploader](../docs/screenshots/ui-file-uploader.png)

### Feedback & Messaging
- ![Toast Notification](../docs/screenshots/ui-toast.png)
- ![Alert Banner](../docs/screenshots/ui-alert.png)
- ![Loading Spinner](../docs/screenshots/ui-spinner.png)
- ![Error Boundary](../docs/screenshots/ui-error-boundary.png)

### Data Display
- ![Table/DataGrid](../docs/screenshots/ui-table.png)
- ![Card View](../docs/screenshots/ui-card-view.png)
- ![Pagination](../docs/screenshots/ui-pagination.png)
- ![Tag/Badge](../docs/screenshots/ui-badge.png)

### User & Presence
- ![User Avatar](../docs/screenshots/ui-avatar.png)
- ![Presence Indicator](../docs/screenshots/ui-presence.png)
- ![Context Menu](../docs/screenshots/ui-context-menu.png)

### Search & Filtering
- ![Search Bar](../docs/screenshots/ui-search-bar.png)
- ![Advanced Filters](../docs/screenshots/ui-advanced-filters.png)
- ![Search Results](../docs/screenshots/ui-search-results.png)

### Miscellaneous
- ![Tooltip](../docs/screenshots/ui-tooltip.png)
- ![Progress Bar](../docs/screenshots/ui-progress-bar.png)
- ![Tabs](../docs/screenshots/ui-tabs.png)
- ![Chart](../docs/screenshots/ui-chart.png)

## Navigation & Context Switching (Detailed Guidance)

- **Context Switching:**
  - Each dashboard (Education, Job/Business, Life) auto-organizes its own set of modules.
  - Users can edit and move modules to customize each dashboard (future feature).
  - Top navigation bar tabs allow switching between dashboards/contexts.

- **Navigation Structure:**
  - **Top Nav Bar:** Always visible; used for context switching and global navigation.
  - **Right Slim Sidebar:** Always visible; shows built-in modules.
  - **Left Sidebar:** Shows installed modules for the current dashboard; retracts to give extra space.
  - Top nav and right sidebar are persistent; left sidebar changes per dashboard.

## Dashboard Layouts & Customization (Detailed Guidance)

- **Block Customization:**
  - Users can modify block size, location, and visible content (future feature).
  - Each dashboard can have its own layout.
  - Default templates are provided for each dashboard type (e.g., student, business owner).

- **Block Templates:**
  - Each module provides a block with key information (e.g., Finances = balances, Drive = recent files).
  - Users can drag and drop blocks on an invisible grid, similar to Squarespace's builder. 