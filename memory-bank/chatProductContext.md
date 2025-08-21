<!--
This file documents the product context for the Chat module only. For other modules, see their respective context files. See README for the modular context pattern.
-->

<!--
Chat Product Context
See README for the modular context pattern.
-->

# Chat Product Context

## 1. Header & Purpose
- **Purpose**: The chat application serves as a comprehensive communication and collaboration platform that caters to both enterprise organizations and individual users. It provides structured communication through various thread types, organized workspaces, and intuitive navigation.
- **Cross-References**: 
  - [Drive Product Context](./driveProductContext.md) (file sharing)
  - [Dashboard Product Context](./dashboardProductContext.md) (activity widgets)
  - [Marketplace Product Context](./marketplaceProductContext.md) (bots/plugins)
  - [System Patterns](./systemPatterns.md)
  - [API Documentation](./apiDocumentation.md)

## 2. Problem Space
- **Primary Users:**
  - Enterprise admin
  - Team member
  - Guest/external collaborator
  - Individual user (lifestyle/personal)
- **Enterprise Needs:**
  - Structured communication, decision making, documentation
- **Individual Needs:**
  - Personal organization, direct/group communication, file sharing

## 3. User Experience Goals
- Intuitive, panel-based navigation
- Context preservation and quick access
- Clear organizational hierarchy and resource discovery
- Rich, structured threading (message, topic, project, decision, documentation)
- Real-time collaboration and feedback
- Accessibility: Keyboard navigation, screen reader support, color contrast
- Internationalization: Support for multiple languages and locale formats
- **Persistent Floating Chat Icon/Popup:** Chat must be accessible from anywhere in the app via a floating icon or minimized chat window, inspired by Facebook/LinkedIn (see also dashboardProductContext.md).

## 3a. Panel-Based Layout & Navigation

The Chat module uses a panel-based interface for intuitive, efficient navigation and multitasking. The layout is structured as follows:

- **Left Panel:** Conversation/Thread List
  - Shows all conversations, threads, or channels the user is part of
  - Allows quick switching between conversations
- **Main Panel:** Active Conversation/Thread
  - Displays messages, file previews, reactions, and thread replies
  - Supports inline editing, replying, and file sharing
- **Side Panels (optional):**
  - Thread details, participants, or message actions
  - Can be used for thread-specific analytics, pinned messages, or context
- **Panel Features:**
  - Panels are resizable and collapsible
  - State is preserved when switching between panels
  - Responsive design for desktop and mobile
- **Floating Chat Icon/Popup (Global):**
  - A floating chat icon or minimized chat window is always visible throughout the app, regardless of the current module or page.
  - Clicking the icon expands the chat window, allowing users to continue conversations without leaving their current context.
  - The floating chat UI should be non-intrusive, responsive, and accessible on both desktop and mobile.
  - This pattern is inspired by Facebook/LinkedIn and is a core part of the platform's persistent communication vision (see dashboardProductContext.md).

This structure enables users to manage multiple conversations, threads, and resources efficiently, and is a core UX principle for the Chat module.

## 4. Core Features & Requirements
- Organized workspaces and teams
- Threaded conversations (message, topic, project, decision, documentation)
- Real-time messaging and presence
- File sharing and preview (see File Management & Sharing)
- Reactions and emoji support
- Search and resource discovery
- Role-based access and permissions
- Notifications and activity tracking
- Collaborative editing and versioning
- API access and plugin/bot support
- **Floating Chat Icon/Popup:** Always-available chat access via a floating icon or minimized window, integrated globally across the app.

## 4a. Feature Checklist (Implementation Status)

> **Note:** Updated to reflect current implementation progress as of Phase 2c.2 (2024-12-27).

| Feature                                 | Status      | Notes/Location (if implemented)                |
|------------------------------------------|-------------|-----------------------------------------------|
| Data Model & API Foundations             | ✅ Complete | Database models, backend API, TypeScript types |
| Core UI & Navigation                     | ✅ Complete | Three-panel layout, GlobalChat component, proper positioning |
| Basic Messaging                          | 🔄 In Progress | Real-time messaging implementation |
| Presence & Typing Indicators             | ⏳ Planned   | WebSocket service ready |
| File Sharing & Previews                  | 🔄 Partial   | File upload component, Drive integration |
| Reactions & Read Receipts                | ⏳ Planned   | Database models ready |
| Search & Discovery                       | ⏳ Planned   | UI components ready |
| Notifications                            | 🔄 Partial   | Email service implemented |
| Role-based Permissions                   | ⏳ Planned   | Basic structure in place |
| Collaborative Features                   | ⏳ Planned   | Threading models ready |
| **Message Deletion**                     | ✅ Complete | Right-click context menu, drag-to-trash, soft deletion |
| **Message Management**                   | ✅ Complete | Restore from trash, real-time updates, audit trail |
| Extensibility & Integrations             | ⏳ Planned   | API foundation complete |
| Accessibility & Internationalization     | ⏳ Planned   | Basic UI components ready |
| Mobile/PWA Optimization                  | ⏳ Planned   | Responsive layout started |
| Analytics & Activity                     | ⏳ Planned   | Activity models ready |
| AI/Smart Features                        | ⏳ Planned   | Future enhancement |

### Implementation Details

#### Message Deletion System (Complete) ✅
**Status**: Fully implemented and functional as of 2024-12-27

**Features Delivered**:
- **Right-click Context Menu**: Familiar interface with Reply and Delete options
- **Drag-to-Trash**: Drag individual messages to global trash bin
- **Soft Deletion**: Messages moved to trash with restoration capability
- **Real-time Updates**: Immediate UI updates after message operations
- **Cross-Component Support**: Works in both main chat and global chat
- **Permission Checks**: Proper authentication for all deletion operations
- **Activity Logging**: Complete audit trail for compliance

**Technical Implementation**:
- **Backend**: Extended trash controller with message-specific operations
- **Frontend**: Context menu, hover actions, and drag-and-drop integration
- **Database**: Soft deletion using `trashedAt` timestamp
- **UI Components**: GlobalChatMessageItem with React Hooks compliance
- **Integration**: Seamless integration with global trash system

**User Experience**:
- **Familiar Interface**: Right-click context menu similar to other applications
- **Visual Feedback**: Clear indication of draggable messages and drop zones
- **Easy Recovery**: Trashed messages can be restored from global trash bin
- **Consistent Experience**: Same deletion patterns across all modules
- **Professional UI**: Clean, modern interface with proper spacing and animations

#### Core UI & Navigation (Complete) ✅

**Database Layer:**
- Complete chat data model with Chat, Message, Thread, FileReference entities
- Proper relationships and constraints for enterprise-scale usage
- Migration `20250622125748_add_chat_models` successfully applied
- Indexes and performance optimizations implemented

**Backend API:**
- Full CRUD operations for conversations, messages, and threads
- RESTful API endpoints in `server/src/routes/chat.ts`
- Chat controller with comprehensive business logic
- WebSocket service infrastructure for real-time messaging
- Email notification service for chat events

**Frontend Foundation:**
- Three-panel responsive layout (ChatLayout.tsx)
- Conversation list with search and filtering (ChatLeftPanel.tsx)
- Message display area with real-time updates (ChatMainPanel.tsx)
- Thread details and participant info (ChatRightPanel.tsx)
- File upload integration with Drive module (ChatFileUpload.tsx)
- Complete API client with WebSocket management

**Type Safety:**
- Comprehensive TypeScript types in `shared/src/types/chat.ts`
- API request/response types for all operations
- WebSocket event types for real-time communication
- Cross-platform type safety between frontend and backend

#### 🔄 In Progress Features (Phase 2c.2)

**Technical Infrastructure:**
- ✅ **Resolved**: Prisma client generation and TypeScript module resolution issues
- ✅ **Resolved**: Dependency management and package conflicts
- ✅ **Resolved**: Build system configuration and verification

**Core UI & Navigation:**
- ✅ **Complete**: Three-panel layout implementation
- ✅ **Complete**: Basic component structure and routing
- 🔄 **In Progress**: State management for conversation switching
- 🔄 **In Progress**: Test data creation for development
- ⏳ **Remaining**: Mobile optimization and responsive design polish

**File Sharing & Previews:**
- ✅ **Complete**: File upload component implementation
- ✅ **Complete**: Drive module integration
- 🔄 **In Progress**: File preview functionality
- ✅ **Complete**: Drag-and-drop interface

**Notifications:**
- ✅ **Complete**: Email service implementation
- ✅ **Complete**: Basic notification infrastructure
- ⏳ **Remaining**: Real-time notification delivery via WebSocket

#### ⏳ Planned Features

**Basic Messaging (Phase 2c.3):**
- Real-time message sending and receiving
- Message threading and replies
- Typing indicators and presence
- Message status and read receipts

**Advanced Features (Phase 2c.4):**
- Reactions and emoji support
- Search and discovery capabilities
- Role-based permissions and access control
- Collaborative editing and versioning

**Enterprise Features (Phase 2c.5):**
- Advanced analytics and activity tracking
- Compliance and audit logging
- Mobile/PWA optimization
- Accessibility and internationalization

### Technical Architecture

**Three-Panel Layout:**
- **Left Panel**: Conversation list with search, filtering, and creation
- **Main Panel**: Active conversation with message display and input
- **Right Panel**: Thread details, participants, and file attachments

**Real-time Infrastructure:**
- WebSocket service for instant messaging
- Typing indicators and presence
- Message status updates
- File upload progress

**Integration Points:**
- Drive module for file storage and sharing
- Dashboard for activity tracking
- Authentication system for user management
- Notification system for chat events

### Current Status

- **Database Layer**: ✅ Complete and migrated
- **Backend API**: ✅ Complete and functional
- **Frontend Foundation**: ✅ Complete with core components
- **Real-time Services**: ✅ WebSocket service implemented
- **Type Safety**: ✅ Comprehensive TypeScript coverage
- **UI Layout**: ✅ Three-panel responsive design
- **File Integration**: ✅ Drive module integration complete
- **Technical Infrastructure**: ✅ Dependencies and build issues resolved
- **Development Environment**: ✅ Stable and ready for feature development

## 5. Integration & Compatibility
- **Drive:** File storage, sharing, and preview in chat (see Drive Product Context)
- **Dashboard:** Activity widgets, chat summaries, and notifications
- **Marketplace:** Bots, plugins, and third-party integrations
- **API:** REST and WebSocket endpoints for real-time and batch operations
- **Mobile/Desktop:** Responsive design, PWA support, cross-platform compatibility
- **Shared Components:** Uses shared UI primitives, analytics, and presence modules

## 5a. Data Model Reference

- See [databaseContext.md](./databaseContext.md) and `prisma/schema.prisma` for full details.
- **Key entities for Chat:**
  - **Conversation**: Has many participants, messages, and can belong to a workspace.
  - **Message**: Belongs to a conversation, can have file references, reactions, read receipts, and status.
  - **Thread**: Can be nested, has participants, messages, and analytics.
  - **FileReference**: Links chat messages to files in Drive.
  - **User**: Can participate in many conversations and threads.
- **Important relationships:**
  - A user can participate in many conversations and threads.
  - Messages can reference multiple files (via FileReference).
  - Permissions are enforced at the thread/conversation level.
  - Threads and messages can have reactions and read receipts.

## 6. Technical Constraints & Decisions
- Built with React/Next.js, TypeScript, and WebSockets for real-time features
- Modular architecture for extensibility (plugins, bots)
- Role-based access control and permission inheritance
- Data encryption in transit and at rest
- Audit logging for compliance
- Multi-tenant support and resource isolation
- Known limitations: Large file uploads (10MB limit), max 5 files per message

## 7. Success Metrics
1. User Engagement
   - Active users
   - Message volume
   - Thread activity
   - Feature usage
2. Performance
   - Load times
   - Response times
   - Resource usage
   - Error rates
3. Collaboration
   - Team activity
   - Resource sharing
   - Thread participation
   - Decision completion

## 8. Design & UX References
- [Design System/Component Library](../designPatterns.md)
- Figma links (add here if available)
- Screenshots or diagrams (add here if available)
- Notable UI patterns: Panel-based layout, thread navigation, file preview modals

## 9. Testing & Quality
- Unit and integration tests for core features (messaging, threads, file sharing)
- End-to-end tests for user flows (Cypress/Playwright)
- Linting and type safety enforced (ESLint, TypeScript)
- Manual accessibility and cross-browser testing
- Known edge cases: Large threads, file upload failures, offline/online transitions

## 10. Future Considerations & Ideas
- AI-powered message suggestions and summarization (cross-link to systemPatterns.md)
- Advanced search and filtering (semantic, contextual)
- Deeper analytics integration (thread/user insights, cross-link to analyticsProductContext.md)
- Enhanced mobile experience (native app or improved PWA)
- More granular permissions and guest access (cross-link to permissionsModel.md)
- Integration with external calendars and task managers
- Archive/deprecate legacy thread types as needed
- Periodic review of chat features for usability and business value
- Visual drag-and-drop previews and enhancements (planned)
- Auto-refresh for last activity and folder changes (planned)

## 11. Update History & Ownership
- Last updated: 2024-06
- **2024-06:** Reviewed for completeness, clarity, and actionability. Marked as ready for ongoing development.
- **2024-06:** Added explicit documentation for persistent floating chat icon/popup (Facebook/LinkedIn style) as a global requirement, cross-referenced with dashboardProductContext.md.
- **2024-06:** Feature checklist reordered and expanded for best-practice rebuild. All features marked as planned. Status will be updated as features are re-implemented.
- Owner: Product/Engineering Team (update as needed)
- Major changes:
  - 2024-06: Modular context pattern adopted, template applied, cross-references added
  - 2024-06: File sharing and integration details expanded

## File Management & Sharing
- Centralized file storage in Drive
- File sharing in chat through Drive references
- File preview with thumbnails for images
- File type detection with appropriate icons
- File size limits (10MB) and count limits (5 files)
- Drag-and-drop file upload support
- Upload progress tracking
- File download functionality
- File permission management

## File Sharing Components
1. **FilePreview Component**
   - Displays file previews with type-specific icons
   - Shows image thumbnails for image files
   - Displays file size and type information
   - Includes download button
   - Supports multiple size variants (sm, md, lg)
   - Works with Drive-stored files
2. **FileShareButton Component**
   - Handles file selection and upload to Drive
   - Supports drag-and-drop through FileDropZone
   - Shows upload progress for multiple files
   - Implements file validation (type, size, count)
   - Displays total file size and count
   - Includes "Clear All" functionality
   - Shows error messages via toast notifications
   - Creates Drive references for chat sharing
3. **FileUploadProgress Component**
   - Displays individual file upload progress
   - Shows progress bar and percentage
   - Supports upload cancellation
   - Displays file name and status
4. **FileDropZone Component**
   - Provides drag-and-drop functionality
   - Shows visual feedback for drag states
   - Handles file validation
   - Supports disabled state 