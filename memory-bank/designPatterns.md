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

## Core UI Library

The following components form the foundation of our UI/UX across all modules:

- **Button:** Standardized button with variants (primary, secondary, danger, etc.), loading state, and accessibility support.
- **Toast Notification:** For transient feedback and alerts.
- **Modal/Dialog:** For focused user interactions and confirmations.
- **Table/DataGrid:** For displaying tabular data with sorting, filtering, and pagination.
- **Chart:** For data visualization (bar, line, pie, etc.).
- **Form Inputs:** Standardized text, select, checkbox, radio, date, and file inputs.
- **Avatar:** User profile image with fallback and status indicator.
- **Tabs/Accordion:** For organizing content in panels.
- **Tooltip/Popover:** For contextual help and actions.

> See the "Examples" section for screenshots and usage patterns.

## Design Tokens & Theming

**Color Palette:**

| Role              | Name           | Hex      | Usage                                 |
|-------------------|----------------|----------|---------------------------------------|
| Accent Red        | Coral Red      | #F24E1E  | Warnings, buttons, module highlights  |
| Primary Green     | Forest Green   | #228B22  | Main brand/nav, active elements       |
| Highlight Yellow  | Sunflower      | #FFCD1E  | Notifications, callouts, badges       |
| Secondary Purple  | Orchid Purple  | #A259FF  | Secondary buttons, module accents     |
| Info Blue         | Azure Blue     | #278BEE  | Info states, links, alternate modules |
| Neutral Dark      | Graphite       | #333333  | Headlines, body text                  |
| Neutral Mid       | Slate Gray     | #2E2E2E* | Panel backgrounds, less prominent text|
| Neutral Light     | Cloud White    | #F4F4F4  | Backgrounds, surfaces                 |

**Theming & Style Rules:**
- Use these tokens for all UI elements.
- Favor minimalist layouts, generous whitespace, and clear separation.
- Rounded corners and subtle shadows for cards/panels.
- Large, bold headlines; clear, readable body text.
- Buttons and highlights use accent colors as described above.
- Ensure accessibility and contrast in all color combinations.
- Apply the palette and style rules to all new UI, inspired by the provided template screenshots.

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

> **Note:** The `docs/screenshots/` directory does not yet exist. Screenshots and images will be added as the UI is developed. For now, the following are placeholders for future visual documentation.

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

# Design System Details

## Typography
- Use a single, modern sans-serif font family (e.g., Inter, Roboto, or system-ui) for all UI text.
- Font weights: 400 (regular), 600 (semibold), 700 (bold).
- Headings: Large, bold, and clear. Use consistent sizing scale (e.g., 32/24/20/16/14px).
- Body text: 16px default, 1.5 line height for readability.
- All text should have sufficient color contrast (see color palette above).
- Avoid excessive font styles; keep to regular, semibold, and bold.

## Spacing & Layout
- Use an 8px spacing grid for all margins, paddings, and gaps.
- Standard spacing increments: 4, 8, 16, 24, 32, 40, 48, 64px.
- Generous whitespace between sections and around cards/panels.
- Consistent gutters and padding in all layouts.
- Responsive breakpoints: mobile (<600px), tablet (600–1024px), desktop (>1024px).

## Iconography
- Use a single, consistent icon set (e.g., Tabler, Lucide, or Material Icons).
- All icons should be SVG, scalable, and accessible (aria-labels, titles).
- Icon size: 20–24px standard, with clear minimum touch target (44x44px for mobile).
- Use icons for actions, navigation, and status—not for decoration.

## Animation & Motion
- Use subtle, purposeful animations (e.g., fade, slide, scale) for feedback and transitions.
- Animation duration: 150–300ms, with ease-in-out curves.
- Avoid distracting or excessive motion.
- Respect user preferences for reduced motion (prefers-reduced-motion media query).

## Internationalization (i18n)
- All UI text must be translatable; no hardcoded strings in components.
- Use a standard i18n library (e.g., react-i18next) for string management.
- Support left-to-right and right-to-left layouts.
- Date, time, and number formats must be locale-aware.

## Mobile Responsiveness
- All components and layouts must be fully responsive.
- Touch targets: minimum 44x44px.
- Use mobile-first design principles; test on real devices.
- Avoid hover-only interactions; provide tap alternatives.

## Storybook & Documentation
- All UI components must be documented in Storybook with usage examples and props tables.
- Include accessibility notes and visual guidelines in stories.
- Use Storybook as the single source of truth for UI implementation.

## Accessibility (a11y)
- All interactive elements must be keyboard accessible (tab, enter, space, etc.).
- Use semantic HTML and ARIA roles where appropriate.
- Ensure color contrast meets WCAG AA standards.
- Provide visible focus indicators for all focusable elements.
- Test with screen readers and accessibility tools.

## Contribution Guidelines
- All new UI components must follow the design tokens, patterns, and accessibility rules above.
- PRs must include Storybook stories and pass accessibility checks.
- Use the provided color palette, spacing, and typography tokens.
- Document any new patterns or tokens in this file.

## Visual Style Guide
- The overall look is sleek, simple, and modern, inspired by the provided template screenshots.
- Use the color palette and theming rules above for all UI elements.
- Favor minimalist layouts, clear separation, and generous whitespace.
- Rounded corners and subtle shadows for cards and panels.
- Large, bold headlines; clear, readable body text.
- Buttons and highlights use accent colors as described above.
- All UI should feel cohesive, intuitive, and delightful to use.

> For visual references, see the 'Examples' section above and add new screenshots as the UI evolves. 