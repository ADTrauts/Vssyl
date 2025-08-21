<!--
Drive Product Context
See README for the modular context pattern.
-->

# Drive Product Context

## 1. Header & Purpose

**Purpose:**  
The Drive module is the core file management and storage solution for the Block on Block platform. It enables users to securely upload, organize, share, and collaborate on files and folders within a unified workspace. Drive is designed to support both individual and team workflows, providing granular permissions, real-time updates, and seamless integration with other modules (e.g., Chat for file sharing, Dashboard for widgets, Marketplace for module attachments). The Drive module prioritizes accessibility, extensibility, and a user experience inspired by leading cloud storage platforms.

**Cross-References:**  
- See also:  
  - [chatProductContext.md] (file sharing and references)
  - [dashboardProductContext.md] (Drive widgets and integration)
  - [marketplaceProductContext.md] (future: module attachments)
  - [systemPatterns.md] (navigation, modular context)
  - [designPatterns.md] (UI/UX, sidebar, and layout patterns)
  - [databaseContext.md] (data model and relationships)

## 2. Problem Space
- Users face fragmented navigation and lack a unified workspace for file management in traditional ERP/LRM systems.
- Switching between folders or modules disrupts workflow and reduces productivity.
- There is a need for persistent access to files, folders, sharing, and permissions regardless of where users are in the app.
- Personalization and quick access to frequently used files/folders are often missing in legacy file systems.

## 3. User Experience Goals
- Consistent, accessible UI across devices.
- Robust search and filtering for quick file access.
- Clear feedback for all actions (uploads, sharing, errors, etc.).
- Personalization: users can organize folders, star files, and manage their own Drive layout.

## 3a. Panel-Based Layout & Navigation

The Drive module uses a panel-based layout for file and folder navigation, preview, and management. Typical layout structure:
- **Left Panel/Sidebar:** Folder tree, quick access, starred/recent/trash
- **Main Panel:** File/folder grid or list view, file previews
- **Side Panels (optional):** File details, sharing settings, activity log
- **Panel Features:**
  - Panels are resizable and collapsible
  - Drag-and-drop file/folder operations
  - Responsive design for desktop and mobile

## 4. Core Features & Requirements
- File/folder navigation (grid/list view, breadcrumbs, sidebar).
- File/folder upload, download, rename, move, delete, and restore from trash.
- File/folder sharing with granular permissions (view, edit, share).
- File/folder preview (images, documents, etc.).
- Real-time updates via sockets for collaborative changes.
- Search and filter functionality.
- Activity log for file/folder actions.
- Modular, type-safe UI components.
- Integration with other modules (e.g., file sharing in Chat).
- Responsive design for desktop and mobile.
- Secure, role-based access control.

## 4a. Feature Checklist (Implementation Status)

| Feature                                 | Status      | Notes/Location (if implemented)                |
|------------------------------------------|-------------|-----------------------------------------------|
| Data Model & API Foundations             | ✅          | Backend implemented (CRUD, sharing, permissions) |
| Core UI & Navigation                     | ✅          | Implemented in `web/src/app/drive/page.tsx` and `DriveSidebar.tsx` |
| File/Folder Operations                   | ✅          | Backend API and UI implemented (upload, rename, delete, move) |
| Sharing & Permissions                    | ✅          | Backend API and UI fully implemented with granular permissions |
| File Previews & Details                  | ✅          | Basic preview component implemented with PDF.js support |
| Search & Filter                          | 🟡 Partial | Basic search implemented; needs advanced filtering |
| Activity Log                            | ✅          | Activity tracking implemented in backend and Recent page |
| Real-time Updates                       | 🟡 Partial | Basic socket integration; needs more features |
| Mobile Responsiveness                   | ✅          | Fully responsive with touch-friendly UI |
| Accessibility                           | 🟡 Partial | Basic support; needs more testing |
| Integration with Dashboard              | ✅          | Integrated with global layout and navigation |
| Integration with Chat                   | 🟡 Partial | Basic file sharing; needs more features |
| Authentication Integration               | ✅          | Fully integrated with NextAuth across all pages |
| View Toggle Persistence                 | ✅          | localStorage persistence across all Drive pages |
| Auto-Deletion Service                   | ✅          | Scheduled cleanup for trash items older than 30 days |
| Recent Page                             | ✅          | Implemented with activity tracking and UI |
| Shared Page                             | ✅          | Implemented with API endpoint and UI |
| Starred Page                            | ✅          | Implemented with star/unstar functionality |
| Trash Page                              | ✅          | Implemented with restore and permanent delete |
| Design System Consistency               | ✅          | Centralized theme and consistent styling across all pages |
| Empty States                            | ✅          | Reusable EmptyState component implemented |
| Hover Effects                           | ✅          | Consistent hover states across all components |
| **NEW**: Drive Page Layout Redesign     | ✅          | Google Drive-inspired layout with separate folder/file sections |
| **NEW**: Enhanced FolderCard            | ✅          | Updated with star indicators, click handlers, and improved styling |
| **NEW**: FileGrid List/Grid Views       | ✅          | Support for both list and grid view modes with proper table layout |

## 5. Technical Implementation

### Layout Components
- `DriveLayout.tsx`: Integration with global dashboard layout
- `DrivePage.tsx`: Main drive content with separate folder and file sections
- `DriveSidebar.tsx`: Folder navigation and quick access
- `FolderCard.tsx`: Enhanced folder display with star indicators and interactions
- `FileGrid.tsx`: File/folder grid and list views with view mode support
- `FilePreview.tsx`: File preview and details panel

### State Management
- React state for UI interactions
- Local storage for view preferences
- Real-time updates via WebSocket
- File operation state management
- **NEW**: Separated `folders` and `files` state arrays for better organization

### Integration Points
- Dashboard layout integration
- Chat module file sharing
- Activity logging system
- Search and filter system
- File preview system
- **NEW**: DndContext integration for drag-and-drop operations

## 6. Future Considerations
- Advanced file previews
- Enhanced sharing features
- Better mobile experience
- Performance optimizations
- Advanced accessibility features
- Integration with more modules
- **NEW**: Complete drag-and-drop implementation between folders and files
- **NEW**: Bulk operations with multi-select functionality

## 7. Update History
- **2024-06:** Integrated with global dashboard layout
- **2024-06:** Implemented responsive design and touch-friendly UI
- **2024-06:** Added basic file operations and preview
- **2024-06:** Implemented sharing and permissions backend
- **2024-12:** **Comprehensive Enhancement Phase - Complete**
  - **Authentication & API Integration**: Fixed JWT secret issues, refactored frontend to use NextAuth session tokens, resolved 403 errors
  - **UI/UX Design System**: Implemented consistent "Inter" font, lucide-react icons, centralized theme, hover effects, empty states
  - **New Pages**: Implemented Recent, Shared, Starred, and enhanced Trash pages with full functionality
  - **View Toggle Persistence**: Added localStorage persistence for view mode preferences across all Drive pages
  - **Auto-Deletion Service**: Implemented scheduled cleanup for trash items older than 30 days
  - **Design Consistency**: Refactored all authentication pages to use centralized theme and consistent styling
- **2024-12:** **Drive Page Layout Redesign - Complete**
  - **Google Drive-Inspired Layout**: Redesigned main Drive page with separate folder and file sections
  - **Enhanced Components**: Updated FolderCard and FileGrid with improved styling and functionality
  - **Drag & Drop Foundation**: Set up DndContext wrapper for future drag-and-drop operations
  - **Type Safety**: Resolved all TypeScript errors and ensured proper type checking
  - **Build System**: Fixed Next.js cache issues and ensured clean builds

## 8. Recent Enhancements (December 2024)

### Drive Page Layout Redesign (Latest)
- **Folder/File Separation**: Redesigned main Drive page to display folders and files in separate sections
- **Google Drive-Inspired Layout**: Implemented folder grid at top, files section below with view toggles
- **Enhanced FolderCard**: Updated component with proper styling, star indicators, and click handlers
- **FileGrid Improvements**: Added list/grid view support with proper table layout for list mode
- **Drag & Drop Foundation**: Set up DndContext wrapper for future drag-and-drop functionality
- **Type Safety**: Resolved all TypeScript errors and ensured proper type checking
- **Build System**: Fixed Next.js cache issues and ensured clean builds

### Authentication & API Integration Fixes
- **JWT Secret Issues**: Fixed incorrect JWT secret usage in both token signing and verification
- **Frontend Authentication**: Refactored API client to use NextAuth session tokens instead of localStorage
- **Token Expiration**: Increased JWT token expiration from 1h to 24h for better user experience
- **API Integration**: Fixed all Drive API endpoints to properly authenticate with backend
- **Error Resolution**: Resolved persistent 403 Forbidden errors across all Drive operations

### UI/UX Design System Implementation
- **Global Font**: Implemented consistent "Inter" font across all Drive pages
- **Icon Unification**: Standardized on lucide-react icons throughout the application
- **Layout Correction**: Created proper right-hand sidebar for quick access icons
- **Theme Consistency**: Applied official color palette from design system to all components
- **Hover Effects**: Added consistent hover states to FileGrid and FolderCard components
- **Empty States**: Created reusable EmptyState component and integrated across Drive pages

### New Drive Pages Implementation
- **Recent Page**: Implemented activity tracking backend and frontend UI for recent file operations
- **Shared Page**: Created API endpoint and UI for items shared with current user
- **Starred Page**: Enhanced with view toggle functionality and improved UI
- **Trash Page**: Fixed layout issues, route ordering bugs, and added view toggle

### View Toggle Persistence
- **localStorage Integration**: Added persistent view mode preferences across all Drive pages
- **Page Coverage**: Implemented view toggles on main Drive, Trash, Shared, and Starred pages
- **Consistent UX**: Standardized toggle button design and behavior across all pages
- **SSR Safety**: Added proper browser environment checks for localStorage operations

### Auto-Deletion Service
- **Scheduled Cleanup**: Implemented using node-cron to run daily at midnight
- **Database Integration**: Properly queries and deletes old trashed files and folders
- **Server Integration**: Added to main server file for automatic startup
- **User Experience**: Maintains the 30-day trash retention promise shown in UI

### Technical Architecture Improvements
- **Centralized Theme**: Created `shared/src/styles/theme.ts` with official COLORS object
- **Component Reusability**: Implemented reusable EmptyState component
- **Build System**: Resolved all TypeScript and ESLint issues
- **Dependency Management**: Added node-cron for scheduled tasks
- **Code Organization**: Improved file structure and component separation
- **State Management**: Separated folder and file state for better organization
- **Type Safety**: Enhanced type checking and null safety across all components

# Cloud Storage Support (Google Cloud Storage) [2024-06]

## Product Requirements
- The Drive module must support Google Cloud Storage (GCS) as a backend for all file and folder operations (upload, download, delete, preview).
- The storage backend is selected via environment variable (`STORAGE_PROVIDER`).
- All user-facing file operations must work seamlessly whether using local or GCS storage.
- File URLs and previews must be compatible with GCS (e.g., use signed URLs for private files).
- User avatars and other file assets should also be stored in GCS when enabled.

## User Experience Implications
- No change in user workflow; all file operations remain the same from the user's perspective.
- Improved reliability, scalability, and performance for file storage when using GCS.
- File sharing and previews in Chat and other modules must work with GCS URLs.

## Developer Notes
- All file storage logic must use the storage abstraction layer.
- Test all file operations in both local and GCS modes.