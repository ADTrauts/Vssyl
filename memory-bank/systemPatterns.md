<!--
Update Rules for systemPatterns.md
- Updated when new architectural patterns, technical decisions, or design patterns are adopted.
- Each new pattern/decision should be clearly dated and described.
- Deprecated patterns should be moved to an "Archive" section at the end.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# System Architecture and Patterns

## Architecture Overview

### Client-Side Architecture
- Next.js App Router
- Module-based UI components
- Real-time updates via Socket.IO
- OAuth client integration

### Server-Side Architecture
- Express.js REST API
- Prisma ORM for database access
- Redis for caching and token storage
- OAuth 2.0 Provider
- WebSocket server for real-time features

## Design Patterns

### Component Patterns
- Atomic Design
- Container/Presenter
- Higher-Order Components
- Custom Hooks

### State Management
- React Context
- Redux for module state
- Socket.IO for real-time state
- Token management

### API Patterns
- RESTful endpoints
- GraphQL for complex queries
- WebSocket events
- OAuth endpoints

### Real-time Patterns
- Room-based presence
- Event-based updates
- State synchronization
- Error recovery

## Code Organization

### Frontend Structure
- Pages (Next.js app router)
- Components (UI elements)
- Modules (feature modules)
- Hooks (custom React hooks)
- Contexts (state management)
- Shared Code (reusable utilities)

### Backend Structure
- Routes (API endpoints)
- Controllers (request handling)
- Services (business logic)
- Middleware (request processing)
- Models (data structures)
- Shared Code (common utilities)

### Shared Code Patterns
- Type Definitions
  - API interfaces
  - Database models
  - Module contracts
  - Utility types

- Constants
  - Environment variables
  - API endpoints
  - Error messages
  - Configuration values

- Utilities
  - Date formatting
  - String manipulation
  - Validation helpers
  - Type guards
  - **Type Safety Enforcement (Drive Module):**
    - All `any` types are forbidden; explicit types or type guards must be used
    - All files must be ESLint clean (`--max-warnings=0`)
    - Shared interfaces and type guards are preferred for cross-component data
    - All drive UI components (FileGrid, FolderGrid, FolderCard, NewFolderButton, etc.) are now type-safe and warning/error free
    - This is a required pattern for all future drive work

- Frontend Shared
  - Component library
  - Custom hooks
  - Styled components
  - Theme system

- Backend Shared
  - Authentication
  - Error handling
  - Logging
  - Validation

## Common Patterns

### Error Handling
- Global error boundary
- API error responses
- Logging system
- Error recovery

### Authentication
- NextAuth.js integration
- JWT validation
- OAuth 2.0 flow
- Session management

### File Operations
- Chunked uploads
- Progress tracking
- Type validation
- Storage management

### Sharing System
- Permission model
- Access control
- Link sharing
- Real-time updates

### OAuth 2.0 Provider Architecture
1. Authorization Server
   - Client registration
   - Authorization endpoint
   - Token endpoint
   - Consent screen
   - Token validation

2. Resource Server
   - Protected resources
   - Token validation
   - Scope enforcement
   - Rate limiting

3. Client Applications
   - Client registration
   - Authorization flow
   - Token management
   - Error handling

### Module System Architecture
1. Module Runtime
   - Module loader
   - Dependency management
   - State isolation
   - Communication protocol

2. Module Marketplace
   - Distribution system
   - Version management
   - Installation process
   - Update mechanism

3. Module UI
   - Dashboard integration
   - Configuration interface
   - State management
   - Error handling

# System Patterns

## Chat Application Architecture

### 1. Organizational Structure
```
Enterprise
├── Organizations
│   ├── Workspaces
│   │   ├── Categories
│   │   │   ├── Conversations
│   │   │   └── Channels
│   │   └── Members
│   └── Teams
└── Individual Users
    ├── Personal Workspace
    │   ├── Categories
    │   └── Collections
    └── Direct Messages
```

### 2. Threading System

#### Thread Types
1. Message Threads (Traditional)
   - Attached to individual messages
   - Linear conversation flow
   - Collapsible/expandable
   - Participant tracking

2. Topic Threads
   - Independent conversation spaces
   - Subject-based organization
   - Pinnable to channels/categories
   - Resource organization

3. Project Threads
   - Task/Project specific
   - Milestone tracking
   - Project board integration
   - Progress monitoring

4. Decision Threads
   - Structured decision-making
   - Voting/polling system
   - Approval workflows
   - Action item tracking

5. Documentation Threads
   - Wiki-style collaboration
   - Version control
   - Rich formatting
   - Reference system

### 3. Panel Organization

#### Panel Layout
```
[Main Nav] [Context] [Content] [Details]
   |          |         |         |
   v          v         v         v
Organization  Category  Messages  Thread Info
Workspaces    Channels  Threads   Members
Categories    Resources Docs      Activity
Personal      Team View Quick     Quick Access
```

#### Panel Features
- Collapsible/Expandable
- Customizable widths
- State persistence
- Context awareness
- Responsive design

### 4. API Structure
```
/api/workspaces/[workspaceId]/
  ├── conversations/
  │   ├── route.ts (GET, POST)
  │   └── [conversationId]/
  │       ├── messages/
  │       │   ├── route.ts (GET, POST)
  │       │   └── search/
  │       │       └── route.ts (GET)
```

### 5. Core Features

#### Message Management
- Creation/editing/deletion
- Rich text formatting
- File attachments
- Reactions
- Threading
- Search functionality

#### Real-time Features
- WebSocket integration
- Typing indicators
- Online presence
- Message delivery status
- Read receipts

#### File Management
- Upload/delete
- Progress tracking
- Preview system
- Size limitations
- Type restrictions

#### Access Control
- Role-based permissions
- Hierarchical access
- Resource sharing
- Audit logging
- Compliance features

### 6. Enterprise Capabilities
- SSO integration
- Audit system
- Compliance features
- Analytics
- Resource management
- Cross-org permissions

### 7. Individual Features
- Personal workspace
- Collections
- Saved items
- Cross-org messaging
- Personal settings

### 8. Technical Patterns
- Next.js API routes
- Prisma ORM
- WebSocket integration
- File handling
- Authentication (NextAuth)
- Real-time updates
- Search functionality
- State management

## Architecture

### File Management System

#### Type System
- API Types (`@/types/api.ts`)
  - `File`: Base file type from API
  - `Folder`: Base folder type from API
  - `BreadcrumbFolder`: Simplified folder type for breadcrumb navigation

- UI Types (`@/contexts/ui-context.tsx`)
  - `FileItem`: Extended file type with UI-specific properties
  - `FolderItem`: Extended folder type with UI-specific properties
  - `Item`: Union type of FileItem and FolderItem

#### Type Guards and Converters
- Type Guards (`@/lib/type-guards.ts`)
  - `isFileItem`: Validates FileItem type
  - `isFolderItem`: Validates FolderItem type
  - `isBreadcrumbFolder`: Validates BreadcrumbFolder type

- Type Converters (`@/lib/type-converters.ts`)
  - `toFileItem`: Converts API File to UI FileItem
  - `toFolderItem`: Converts API Folder to UI FolderItem
  - `toItem`: Generic converter with type safety

#### Component Type Integration
- `DriveLayoutWrapper`: Main component managing file/folder state
  - Uses type guards for safe type checking
  - Uses converters for API to UI type conversion
  - Implements proper error handling for type mismatches

- `FileGrid`: Grid display component
  - Accepts API types (File/Folder)
  - Converts to UI types internally
  - Type-safe event handlers

- `Breadcrumbs`: Navigation component
  - Uses BreadcrumbFolder type
  - Type-safe path prop
  - Validates breadcrumb items

## [2024-06-13] File Access Control Pattern (Prisma)

- **Ownership:**
  - To check if a user owns a file: `file.ownerId === req.user.id`
- **Shared Access:**
  - To check if a user has shared access, query the `AccessControl` model:
    ```ts
    const access = await prisma.accessControl.findFirst({
      where: {
        fileId,
        userId: req.user.id,
        access: { in: ['READ', 'WRITE'] },
      },
    });
    if (!access) return res.status(403).json({ error: 'Access denied' });
    ```
- **Do NOT use `file.access` or `FileAccess`**; these are not valid in the Prisma schema.
- Add a TODO in code where shared access logic is needed but not yet implemented.