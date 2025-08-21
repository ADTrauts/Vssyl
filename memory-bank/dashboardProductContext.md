<!--
This is a placeholder for the Dashboard module's product context. Fill this out as the Dashboard module is designed and implemented.
See README for the modular context pattern.
-->

# Dashboard Product Context

## 1. Header & Purpose
- **Purpose:**  
  The Dashboard is the front page and central hub of the Block on Block platform. It provides users with persistent navigation, quick access to core and proprietary modules, and a customizable workspace that adapts to individual needs. The Dashboard is designed to unify the user experience, streamline workflows, and enable efficient multitasking across all modules.

- **Cross-References:**  
  See also:  
  - [chatProductContext.md], [driveProductContext.md], [marketplaceProductContext.md], [databaseContext.md]  
  - [systemPatterns.md] (for architectural and navigation patterns, including persistent sidebars and global layout)  
  - [designPatterns.md] (for UI/UX patterns, sidebar navigation, dashboard layouts, and design inspiration from Google Drive and Facebook/LinkedIn)

## 2. Problem Space
- Users face fragmented navigation and lack a unified workspace in traditional ERP/LRM systems.
- Switching between modules disrupts workflow and reduces productivity.
- There is a need for persistent access to key tools, notifications, and communication (chat) regardless of where users are in the app.
- Personalization and quick access to frequently used features are often missing in legacy dashboards.

## 3. User Experience Goals
- Seamless, persistent navigation across all modules.
- Fast, one-click access to core and high-usage modules.
- Highly customizable dashboard widgets and layout.
- Consistent, always-available chat and notifications.
- Responsive design for desktop and mobile.
- Accessibility for all users (keyboard navigation, screen reader support, etc.).
- Personalization: users can organize sidebars, widgets, and dashboard tabs to fit their workflow.

## 3a. Panel-Based Layout & Navigation (Detailed Vision)

The Dashboard is the front page and central hub of the user experience. The layout is inspired by Google Drive and includes persistent navigation and multitasking features:

- **Main Header Bar (Global, Always Visible):**
  - Block on Block logo (left)
  - Tabs for user-specific dashboards (center/left)
  - User avatar (right), opens dropdown menu
  - Always visible across the app
  - **2024-06:** Now fully refactored for modern design, accessibility, and responsiveness. Uses design token color palette, Heroicons, and is mobile/tablet friendly.

- **Right Sidebar (Global, Always Visible):**
  - Skinny vertical bar with icons for core, proprietary, and frequently used modules
  - Persistent throughout the app for quick access (like Google's right-side bar)
  - **2024-06:** Now uses Heroicons, is collapsible/touch-friendly, and follows modern UI/UX patterns.

- **Left Sidebar (Organized, Rearrangeable, Contextual):**
  - Organized list of modules, grouped into categories
  - User can rearrange modules/categories
  - Can shrink/hide (auto-hides on navigation, always accessible)
  - **2024-06:** Now uses Heroicons, is collapsible/touch-friendly, and follows modern UI/UX patterns. Supports user customization (reorder, show/hide modules).
  - **2024-06:** Optimized width (180px expanded, 20px collapsed) for better space utilization.

- **Main Content Area (Dashboard Widgets):**
  - Widgets from modules (Drive, Chat, Analytics, etc.)
  - User can add, remove, resize, and organize widgets
  - Fully customizable per user

- **Chat Pop-Up (Global, Always Accessible):**
  - Chat window pops up from the bottom (like Facebook/LinkedIn)
  - Accessible from anywhere in the app

- **Responsiveness:**
  - All elements are responsive for desktop and mobile
  - **2024-06:** All panels tested for responsiveness and usability

- **Personalization:**
  - Users can customize dashboard widgets and sidebar organization

- **Inspiration:**
  - Google Drive (layout/navigation)
  - Facebook/LinkedIn (chat pop-up)

## 4. Core Features & Requirements

### Navigation & Layout
- Persistent global navigation (header, sidebars)
- Collapsible sidebars with smooth transitions
- Mobile-responsive design with touch-friendly targets
- Keyboard navigation and accessibility support
- Module-specific layouts and navigation patterns

### Widgets & Customization
- Drag-and-drop widget arrangement
- Widget resizing and customization
- Module-specific widget types
- Widget state persistence
- Real-time widget updates

### Integration & Extensibility
- Module integration via widgets
- Real-time updates across modules
- Event system for cross-module communication
- Plugin system for custom widgets
- API for third-party integrations

## 4a. Feature Checklist (Implementation Status)

| Feature                                 | Status      | Notes/Location (if implemented)                |
|------------------------------------------|-------------|-----------------------------------------------|
| Global Navigation & Layout               | ✅          | Implemented in `web/src/app/dashboard/DashboardLayout.tsx` |
| Responsive Design                       | ✅          | Mobile/tablet support with touch-friendly UI   |
| Sidebar Customization                   | ✅          | Collapsible, reorderable modules              |
| Widget System                           | 🟡 Partial | Basic widget support, needs more module types |
| Real-time Updates                       | 🟡 Partial | Basic support, needs more module integration  |
| Accessibility                           | 🟡 Partial | Basic support, needs more testing             |
| Module Integration                      | 🟡 Partial | Drive and Chat integrated, more coming        |
| Customization & Settings                | 🟡 Partial | Basic settings, needs more options            |

## 5. Technical Implementation

### Layout Components
- `DashboardLayout.tsx`: Global layout with persistent navigation
- `DashboardClient.tsx`: Main dashboard content and widgets
- `HydrationHandler.tsx`: Client-side hydration management
- `UserMenu.tsx`: User avatar and dropdown menu

### State Management
- Local storage for sidebar preferences
- React state for UI interactions
- Next.js App Router for navigation
- Module-specific state management

### Integration Points
- Module registration system
- Widget registration and rendering
- Event system for cross-module communication
- API endpoints for data fetching

## 6. Future Considerations
- Advanced widget customization
- More module integrations
- Enhanced mobile experience
- Performance optimizations
- Advanced accessibility features

## 7. Integration & Compatibility
- Widgets integrate with Chat, Drive, Analytics, Marketplace, and any future modules.
- Quick-access icons in the right sidebar reflect both core and user-favorite modules.
- Dashboard layout and preferences are stored per user (future: in database).
- Compatible with mobile and desktop browsers.
- Designed for extensibility: new modules/widgets can be added without major redesign.

## 7a. Data Model Reference

- See [databaseContext.md](./databaseContext.md) and `prisma/schema.prisma` for full details.
- **Key entities for Dashboard:**
  - **Dashboard**: Contains widgets, user preferences, and layout state
  - **Widget**: Represents a chart, feed, or module integration
  - **User**: Owns or collaborates on dashboards
- **Important relationships:**
  - A dashboard can have many widgets
  - Widgets can be shared across dashboards
  - User preferences and access are stored per dashboard

## 8. Technical Constraints & Decisions
- Must be built with responsive, accessible UI components.
- Persistent layout components (header, sidebars, chat) should use a global layout system.
- Widget system should support dynamic loading and real-time data.
- User preferences and layouts should be persisted (local storage initially, then database).
- Should support future third-party widgets/plugins.
- Must be performant even with many widgets/modules.

## 9. Success Metrics
- User engagement (time spent on dashboard, widget usage).
- Reduction in navigation time between modules.
- User satisfaction (feedback, NPS).
- Adoption rate of dashboard customization features.
- Performance metrics (load time, responsiveness).
- Accessibility compliance.

## 10. Design & UX References
- Google Drive (persistent navigation, sidebar organization)
- Facebook/LinkedIn (chat pop-up, notifications)
- [designPatterns.md] (detailed UI/UX and layout patterns, including screenshots and extension points)
- [systemPatterns.md] (system architecture, navigation, and modular context pattern)
- Material Design, Tailwind UI (component inspiration)

## 10a. Global Components & Integration Points
- Main header, right sidebar, and chat pop-up are global and must be implemented as persistent layout components.
- Widgets integrate with core/proprietary modules (Chat, Drive, Analytics, Marketplace, etc.).
- User preferences and layouts should be persisted (future data model).
- See also: [chatProductContext.md], [driveProductContext.md], [marketplaceProductContext.md].

## 11. Testing & Quality
- Unit and integration tests for all layout and widget components.
- End-to-end (E2E) tests for navigation, personalization, and chat pop-up.
- Accessibility testing (keyboard, screen reader, color contrast).
- Responsive testing (desktop, tablet, mobile).
- Performance and load testing for dashboards with many widgets.

## 12. Update History & Ownership
- **2024-06:** Major update to reflect new dashboard vision, layout, and requirements.  
  Owner: [Your Name/Team]
- **2024-06:** Feature checklist reordered and expanded for best-practice rebuild. All features marked as planned. Status will be updated as features are re-implemented.