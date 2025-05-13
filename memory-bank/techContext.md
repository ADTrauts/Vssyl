<!--
Update Rules for techContext.md
- Updated when the tech stack, dependencies, or technical constraints change.
- All updates should be specific (e.g., "Upgraded Next.js from 14 to 15.3.0 on 2024-06-10").
- Avoid duplicating architectural patterns—reference systemPatterns.md if needed.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Technical Context

## Technology Stack

### Frontend (web/)
- **Framework**: Next.js 15.3.0 with Turbopack
- **Module System**: Custom module loader and manager
- **State Management**: React Context + Redux for module state
- **Real-time**: Socket.IO Client
- **UI Components**: Custom components with Tailwind CSS
- **Module Marketplace**: Custom store implementation
- **Notifications**: React Hot Toast
- **HTTP Client**: Axios
- **Authentication**: NextAuth.js

### Backend (server/)
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Session
- **Module System**: Custom module runtime
- **Real-time**: Socket.IO Server
- **Module Storage**: Local filesystem + CDN
- **Validation**: Express Validator
- **Logging**: Winston
- **OAuth 2.0 Provider**: Custom implementation

## Development Setup

### Environment Variables
```env
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_MODULE_STORE_URL=http://localhost:5001

# Backend (.env)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=your-jwt-secret
PORT=5000
MODULE_STORE_PORT=5001
```

### Project Structure
```
├── web/                  # Frontend Next.js application
│   ├── src/
│   │   ├── app/         # Next.js app router pages
│   │   ├── components/  # React components
│   │   ├── modules/     # Built-in modules
│   │   └── hooks/      # Custom React hooks
│   └── public/         # Static assets
│
├── server/             # Backend Express application
│   ├── routes/        # API routes
│   ├── modules/       # Module implementations
│   ├── middleware/    # Express middleware
│   └── utils/         # Utility functions
│
├── shared/            # Shared code between frontend and backend
│   ├── types/         # Shared TypeScript types
│   ├── constants/     # Shared constants
│   ├── utils/         # Shared utility functions
│   ├── config/        # Shared configuration
│   ├── frontend/      # Frontend-specific shared code
│   │   ├── components/# Shared React components
│   │   ├── hooks/     # Shared React hooks
│   │   └── styles/    # Shared styles
│   └── backend/       # Backend-specific shared code
│       ├── middleware/# Shared Express middleware
│       ├── services/  # Shared business logic
│       └── validators/# Shared validation logic
│
└── prisma/            # Database schema and migrations
```

### Shared Code Organization

#### Types
- API request/response types
- Database model types
- Module interface types
- Shared utility types

#### Constants
- API endpoints
- Environment variables
- Error messages
- Configuration values

#### Utils
- Date formatting
- String manipulation
- Validation helpers
- Type guards

#### Frontend Shared
- Common React components
- Custom hooks
- Styled components
- Theme configuration

#### Backend Shared
- Authentication middleware
- Error handling
- Logging utilities
- Validation services

## Key Technical Decisions

### Module Architecture
1. Modules as isolated micro-frontends
2. Shared state management system
3. Module communication bus
4. Module versioning system
5. Module dependency resolution

### Authentication Flow
1. User authentication via NextAuth.js
2. OAuth 2.0 for third-party applications
3. JWT for API authentication
4. Session management with cookies

### Module System
1. Module manifest format
2. Module installation process
3. Module update mechanism
4. Module isolation boundaries
5. Module communication protocol

### Real-time Updates
1. Socket.IO for bidirectional communication
2. Module-specific event channels
3. State synchronization
4. User presence tracking
5. Collaborative features

### Database Schema
- Schema file MUST be located at `/prisma/schema.prisma` (root level)
- DO NOT create schema files in other locations
- Users table for authentication
- Modules table for installed modules
- ModuleSettings table for configuration
- ModuleData table for module-specific data
- Activities table for audit log
- Marketplace table for available modules
- OAuth clients and tokens

## Known Technical Constraints
1. Module size limited to 5MB for initial load
2. Local module storage (with CDN option)
3. Single server deployment
4. Session-based real-time tracking
5. Module dependency complexity

## OAuth Implementation
- Authorization Code Flow
- Token-based authentication
- Rate limiting
- Secure token storage
- Client registration system
- Consent screen
- Token validation
- Refresh token support

## File Handling
- Multer for file uploads
- Local file storage
- File type validation
- Size limits

## API Endpoints
- Authentication
- File operations
- Folder management
- User management
- OAuth endpoints
- Real-time updates

## Security Measures
- Rate limiting
- Token validation
- CSRF protection
- Secure headers
- Input validation
- Error handling

## Environment Variables
- Database connection
- JWT secrets
- OAuth configuration
- Redis connection
- API endpoints
- File storage paths

## API Endpoints
- Authentication
- File operations
- Folder management
- User management
- OAuth endpoints
- Real-time updates

## Security Measures
- Rate limiting
- Token validation
- CSRF protection
- Secure headers
- Input validation
- Error handling 