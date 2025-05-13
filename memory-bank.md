# Memory Bank

## Project Overview
Block on Block is a comprehensive modular platform that enables organizations to build and customize their own collaborative workspace. At its core, it provides:

1. **Modular Architecture**
   - Customizable module system
   - Dynamic module loading
   - Module grouping and organization
   - Module state management
   - Module permissions and access control

2. **Drive System**
   - Central file storage and management
   - File organization and versioning
   - Advanced permission system
   - File sharing and collaboration
   - File preview and editing capabilities

3. **Chat System**
   - Real-time messaging
   - File sharing through Drive integration
   - Message threading and organization
   - User presence and status
   - Message delivery tracking

4. **User Management**
   - Role-based access control
   - User permissions and settings
   - Team and organization management
   - User activity tracking
   - Profile customization

5. **Integration Capabilities**
   - API-first design
   - Third-party integrations
   - Webhook support
   - Custom module development
   - Extension system

6. **Security Features**
   - End-to-end encryption
   - Role-based permissions
   - Audit logging
   - Data protection
   - Secure file handling

7. **Analytics and Insights**
   - Usage tracking
   - Performance monitoring
   - User activity analytics
   - System health metrics
   - Custom reporting

The platform is designed to be:
- Highly customizable
- Scalable and performant
- Secure and compliant
- User-friendly
- Developer-friendly
- Integration-ready

## Core Features

### Drive (Central File Storage)
- Primary file storage system
- File organization and management
- File permission system
- File metadata management
- File versioning (planned)
- File search and filtering
- File preview capabilities
- File sharing controls

### Chat System
- Real-time messaging between users
- File sharing through Drive references
- Message threading and conversation management
- User presence indicators
- Message status tracking (sent, delivered, read)

### File Management
- Centralized file storage in Drive
- File sharing in chat through Drive references
- File preview with thumbnails for images
- File type detection with appropriate icons
- File size limits (10MB) and count limits (5 files)
- Drag-and-drop file upload support
- Upload progress tracking
- File download functionality
- File permission management

### File Sharing Components
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

### File Permission System
- File access control with permission levels
- Permission checking middleware
- File ownership management
- Access level indicators
- Permission-based file operations
- Drive-level permission management
- Chat-level permission inheritance from Drive

### Security Features
- File type validation
- File size limits
- Permission checks
- Secure file URL generation
- Access control enforcement
- Drive-level security policies
- Chat file reference security

## Technical Implementation

### Frontend Architecture
- React-based components
- TypeScript for type safety
- Tailwind CSS for styling
- Component-based architecture
- Responsive design
- Drive integration with chat

### Backend Architecture
- Node.js with Express
- Prisma for database operations
- WebSocket for real-time features
- RESTful API endpoints
- Middleware for authentication and authorization
- Drive file storage system

### Database Schema
- Users table for user management
- Messages table for chat functionality
- Files table for Drive file metadata
- FileAccess table for permission management
- FileReferences table for chat file references
- Drive organization tables

### API Endpoints
- Drive file management
- File permission management
- Chat message handling
- User authentication and management
- File reference creation and management

## Recent Updates
- Implemented comprehensive file sharing system
- Added file preview capabilities
- Enhanced file permission management
- Improved UI/UX for file operations
- Added security features for file handling
- Integrated Drive with chat file sharing

## Next Steps
1. Enhance file preview capabilities
2. Implement file versioning in Drive
3. Add collaborative editing features
4. Improve file search functionality
5. Add file analytics and usage tracking
6. Enhance Drive organization features

## Notes
- File size limit: 10MB per file
- Maximum files per upload: 5
- Supported file types: images, PDFs, text files, Office documents
- Real-time updates for file operations
- Secure file handling and access control
- Drive serves as the central file storage
- Chat uses Drive file references for sharing

## Module Grouping System Implementation

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