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

## Summary of Major Changes / Update History
- 2025-08: Added Business Workspace UI & Module Navigation tech context (position-aware module filtering, tab navigation, header consolidation, fallback module systems, BusinessConfigurationContext integration).
- 2025-08: Added Admin Portal Fix & System Stability tech context (Next.js App Router error handling, build-time issue resolution, system restart patterns, development environment stability).
- 2025-01: Added Advanced Analytics & Intelligence Platform tech context (real-time analytics, predictive intelligence, business intelligence, AI-powered insights).
- 2025-01: Added Calendar tech context (tab-bound calendars, recurrence/RRULE, timezone handling, ICS, provider sync, sockets).
- 2025-01: Added Module Runtime MVP plan (iframe host, runtime config endpoint, submission hosted URL support) and security constraints.
- 2024-12-28: API Issues Resolution Complete - Fixed 404 errors for audit and privacy endpoints, implemented consistent API proxy patterns
- 2024-12-27: Business Settings Page Enhancement Complete - Professional UX with logo upload, admin access control, and enhanced form validation
- 2024-12-26: Phase 3 Educational Institution Integration Complete - Multi-context dashboard system implemented
- 2024-12-26: Next.js Build Error - Static generation of error pages failing (development server works correctly)
- 2024-12-22: Next.js Static Asset Generation Issue - RESOLVED ✅ (Corrected version from 15.3.0 to 14.1.0)
- 2024-06: Updated for Next.js 14.1.0, clarified module system, and added OAuth 2.0 provider details.
- 2024-06: Authentication & User Management Updates
- Added bcrypt for password hashing (backend)
- JWT for API authentication (backend)
- NextAuth.js credentials provider calls backend for login (frontend)
- Prisma-backed user management (backend)
- User registration, login, and profile editing (full stack)
- 2024-12-22: Chat Module Implementation - Database models, backend API, and core UI foundation completed
- 2024-12-22: Technical Infrastructure - Resolved Prisma client generation and dependency management issues
- 2024-12-27: Business Member Bulk Operations Implemented (bulk invite, bulk role update, bulk remove)
- 2024-12-27: Ongoing 500 error on user search endpoint (`/api/member/users/search`) under investigation
- [Add future major changes here.]

## Cross-References & Modular Context Pattern
- See [systemPatterns.md](./systemPatterns.md) for architecture and design patterns.
- See [projectbrief.md](./projectbrief.md) for project vision and requirements.
- See [moduleSpecs.md](./moduleSpecs.md) for module and feature specifications.
- See [chatProductContext.md](./chatProductContext.md), [driveProductContext.md](./driveProductContext.md), [dashboardProductContext.md](./dashboardProductContext.md), and [marketplaceProductContext.md](./marketplaceProductContext.md) for module-specific technical context.
- Each major proprietary module should have its own technical context section/file as needed (see README for details on the modular context pattern).

---

# Technical Context

## [2025-08] Business Workspace UI & Module Navigation Technologies

### Position-Aware Module Filtering Technologies
**Purpose**: Implement dynamic module navigation based on user position, department, and permissions with robust fallback systems.

**Core Technologies**:
```typescript
// BusinessConfigurationContext integration
import { useBusinessConfiguration } from '../../contexts/BusinessConfigurationContext';

const { configuration, loading: configLoading } = useBusinessConfiguration();

// Dynamic module loading with fallbacks
const getAvailableModules = (): Module[] => {
  if (!configuration || !session?.user?.id) {
    return BUSINESS_MODULES; // Fallback
  }

  const userModules = configuration.enabledModules?.filter(m => m.status === 'enabled') || [];
  const modules: Module[] = userModules.map((bModule: any) => ({
    id: bModule.id,
    name: bModule.name || bModule.id,
    hidden: false
  }));

  return modules.length > 0 ? modules : BUSINESS_MODULES;
};
```

**Integration Technologies**:
- **BusinessConfigurationContext**: Centralized business configuration management
- **PositionAwareModuleProvider**: Module filtering based on user context
- **useSession**: NextAuth.js session management for user identification
- **TypeScript**: Proper typing for module interfaces and configuration

### Tab Navigation & Path Detection Technologies
**Purpose**: Ensure proper tab highlighting and navigation in complex business workspace URL structures.

**Path Analysis Technologies**:
```typescript
// Intelligent tab detection
const getCurrentTab = () => {
  const pathParts = pathname.split('/');
  const lastPart = pathParts[pathParts.length - 1];
  
  // Handle main workspace page vs sub-pages
  if (pathParts.length === 4 && lastPart === 'workspace') {
    return 'dashboard'; // Overview tab
  }
  
  return lastPart || 'dashboard';
};

const currentTab = getCurrentTab();
```

**Navigation Technologies**:
```typescript
// Proper navigation mapping
const navigateToTab = (tabId: string) => {
  if (tabId === 'dashboard') {
    router.push(`/business/${business.id}/workspace`); // Main page
  } else {
    router.push(`/business/${business.id}/workspace/${tabId}`); // Sub-pages
  }
};
```

**URL Structure Technologies**:
- **Pathname Parsing**: `usePathname()` hook for route analysis
- **Router Navigation**: `useRouter()` for programmatic navigation
- **Tab State Management**: React state for active tab tracking

### Header Consolidation Technologies
**Purpose**: Eliminate duplicate headers between layout and page components.

**Layout Technologies**:
```typescript
// BusinessWorkspaceLayout - Single header source
<header style={{ /* business branding and tab navigation */ }}>
  {/* Business logo, name, and main tab navigation */}
</header>
```

**Page Technologies**:
```typescript
// workspace/page.tsx - Content only, no headers
return (
  <div className="min-h-screen bg-gray-50">
    {/* Main Content - This page represents the Overview tab */}
    <div className="container mx-auto px-6 py-6">
      {/* Page-specific content without headers */}
    </div>
  </div>
);
```

**Component Architecture**:
- **Layout Components**: Handle navigation, branding, and structure
- **Page Components**: Handle content and user interactions
- **No Duplication**: Single source of truth for headers and navigation

### Fallback Module System Technologies
**Purpose**: Ensure navigation remains functional when business configuration data is unavailable.

**Error Handling Technologies**:
```typescript
// Robust fallback with error handling
try {
  const installedModules = await getInstalledModules({
    scope: 'business',
    businessId: businessId
  });
  businessModules = installedModules.map(/* transform */);
} catch (moduleError) {
  console.warn('Failed to load business modules, using fallback:', moduleError);
  // Use fallback modules
  businessModules = [
    { id: 'dashboard', name: 'Dashboard', /* ... */ },
    { id: 'members', name: 'Members', /* ... */ },
    { id: 'analytics', name: 'Analytics', /* ... */ }
  ];
}
```

**Fallback Strategy Technologies**:
- **Primary Source**: BusinessConfigurationContext.enabledModules
- **Secondary Source**: Hardcoded BUSINESS_MODULES
- **Error Handling**: Try-catch with graceful degradation
- **Logging**: Console warnings for debugging

**Development Stability**:
- **API Failures**: Navigation continues with fallback modules
- **Configuration Loading**: Graceful handling of loading states
- **User Experience**: Consistent navigation regardless of backend status

## [2025-08] Admin Portal Fix & System Stability Technologies

### Next.js App Router Error Handling Technologies
**Purpose**: Resolve build-time errors and ensure proper routing in Next.js App Router.

**Problem Technologies**:
- `global-error.tsx` files with invalid HTML tags (`<html>`, `<body>`)
- Server-side redirects causing routing issues
- Conflicting build artifacts from failed builds

**Solution Technologies**:
```typescript
// Client-side navigation with useEffect
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Proper error boundary components
// error.tsx - Component-level error boundaries
// Avoid global-error.tsx in App Router
```

**Error Page Management**:
- **Remove**: `global-error.tsx` files (not needed in App Router)
- **Use**: Standard `error.tsx` for component-level error boundaries
- **Avoid**: HTML document tags in error components

### System Restart & Build Artifact Cleanup Technologies
**Purpose**: Resolve system instability and ensure clean development environment.

**Cleanup Technologies**:
```bash
# Process management
pkill -f "next dev"        # Kill Next.js development servers
pkill -f "ts-node-dev"     # Kill Express development servers

# Build artifact cleanup
rm -rf .next               # Remove Next.js build directory
rm -rf node_modules/.cache # Remove Node.js cache

# Fresh restart
npm run dev                # Restart development server
```

**Development Environment Stability**:
- **Port Management**: Frontend (3000), Backend (5000), Database (5556)
- **Service Separation**: Independent development servers per service
- **Health Monitoring**: Regular endpoint testing for system status

### Admin Portal Routing Stability Technologies
**Purpose**: Ensure admin portal routes are always accessible and properly configured.

**Implementation Technologies**:
```typescript
// Admin portal page with proper client-side navigation
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPortalPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/admin-portal/dashboard');
  }, [router]);

  // Provide loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Admin Portal</h1>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
```

**Route Verification Technologies**:
```bash
# Health check for all admin routes
curl -I http://localhost:3000/admin-portal
curl -I http://localhost:3000/admin-portal/dashboard
curl -I http://localhost:3000/admin-portal/ai-learning

# Expected: All routes return 200 OK status
```

### Development Environment Stability Technologies
**Purpose**: Maintain stable development environment with proper separation of concerns.

**Service Architecture**:
```bash
# Frontend development (Next.js)
cd web && npm run dev      # Port 3000

# Backend development (Express)
cd server && npm run dev   # Port 5000

# Database management (Prisma Studio)
npx prisma studio --port 5556
```

**Health Check Technologies**:
```bash
# Frontend health check
curl -I http://localhost:3000/admin-portal

# Backend health check
curl -I http://localhost:5000/api/centralized-ai/patterns

# Expected: Both return 200 OK status
```

**Build Error Resolution Technologies**:
```bash
# Error resolution sequence
1. Identify root cause from build error messages
2. Remove problematic files or configurations
3. Clean build environment and artifacts
4. Test incrementally with small builds
5. Document solutions for future reference
```

### Build Error Prevention Technologies
**Purpose**: Prevent common Next.js build errors and ensure production readiness.

**Prevention Patterns**:
- **Navigation**: Use client-side navigation for dynamic redirects
- **Error Pages**: Avoid HTML document tags in App Router components
- **Server Management**: Maintain single development server per service
- **Artifact Cleanup**: Regular cleanup of build artifacts

**Common Build Issues & Solutions**:
- **Invalid HTML Tags**: Remove `<html>`, `<body>` from App Router components
- **Server-Side Redirects**: Convert to client-side navigation with useEffect
- **Conflicting Artifacts**: Clean `.next` directory and restart fresh
- **Multiple Servers**: Ensure single server per service with proper port management

## Calendar Technologies

### Architecture
- Tab-bound calendars with context mapping to Personal/Business/Household
- Combined overlay defaulting to All Tabs; default event target = active tab’s primary calendar

### Libraries & Utilities
- Recurrence: `rrule` (RRULE/EXDATE support). Installed on server; range expansion returns `occurrenceStartAt`/`occurrenceEndAt` per instance.
- Timezone: `luxon` or `date-fns-tz` for robust timezone/DST handling
- ICS: `ical.js` or `ics` for import/export and subscription parsing
- Drag/Resize: grid/timeline interaction utilities; collision detection and snapping
- Virtualization: windowing for month/year grids

### Integrations
- Provider Sync: Google and Microsoft via OAuth; webhook push + delta cursors; etag conflict handling
- ICS Subscriptions: scheduled refresh cadence; feed parsing and mapping
- Conferencing Links: Meet/Zoom/Teams link handling in event drawer
- Realtime: Socket channels for calendar/event updates; presence for editing

### API Surface (Backend)
- Calendars: CRUD, membership, color/visibility, auto-provision by context
- Events: CRUD, recurrence (RRULE persisted; exceptions planned), attendees, reminders, attachments; RSVP endpoint; comments endpoints
- Utilities: ICS export (`GET /api/calendar/export.ics`), free-busy (`GET /api/calendar/freebusy`)
- Availability: free-busy and suggestions (planned)
- Connections: OAuth connect/disconnect; provider webhooks; ICS import/export/subscriptions (planned)

### Security & Privacy
- Encrypted OAuth tokens; least-privilege scopes; short-lived access
- Free-busy masking; role-based access from Business/Household contexts; household Teen/Child read-only enforcement in controllers (current)
- Full audit logging of calendar and event actions

## Advanced Analytics & Intelligence Platform Technologies

### Architecture
- **Layered Analytics Architecture**: Four distinct engines working together for comprehensive business intelligence
- **Real-Time Processing**: Live data streaming with configurable metrics and alerts
- **Predictive Intelligence**: ML-based forecasting and anomaly detection
- **Business Intelligence**: KPI dashboards and advanced reporting
- **AI-Powered Insights**: Automated pattern discovery and recommendations

### Core Analytics Engines

#### **Real-Time Analytics Engine**
- **DataStream**: Configurable data streams with real-time processing
- **DataPoint**: Individual data points with metadata and quality metrics
- **RealTimeMetric**: Configurable metrics with thresholds and alerting
- **AnalyticsDashboard**: Interactive dashboards with customizable widgets
- **StreamProcessor**: Real-time data processing and transformation
- **RealTimeAlert**: Configurable alerting with acknowledgment and resolution

#### **Predictive Intelligence Platform**
- **ForecastingModel**: ML models for time series forecasting (ARIMA, LSTM, Random Forest)
- **AnomalyDetectionModel**: Statistical and ML-based anomaly detection
- **PredictivePipeline**: Orchestrated ML pipelines with scheduling and execution
- **ModelExperiment**: A/B testing and model performance tracking
- **IntelligenceInsight**: AI-generated insights from predictive models

#### **Business Intelligence Suite**
- **BusinessMetric**: Business KPIs and performance metrics
- **KPIDashboard**: Interactive KPI dashboards with real-time updates
- **ReportTemplate**: Advanced reporting engine with customizable templates
- **BusinessInsight**: AI-generated business insights with actionable recommendations
- **ChartWidget**: Configurable chart widgets for data visualization

#### **AI-Powered Insights Engine**
- **PatternDiscovery**: AI-discovered patterns using ML algorithms
- **IntelligentInsight**: AI-generated business insights with correlations
- **Recommendation**: Actionable business recommendations with implementation tracking
- **ContinuousLearning**: Self-improving AI systems with feedback integration
- **InsightValidation**: Validation and feedback systems for insights

### Analytics API Architecture
- **Comprehensive REST API**: `/api/centralized-ai/*` endpoints for all analytics capabilities
- **Real-Time Endpoints**: Data streams, metrics, dashboards, and alerts
- **Predictive Endpoints**: Forecasting models, anomaly detection, and pipelines
- **Business Intelligence Endpoints**: Metrics, dashboards, insights, and reports
- **AI Insights Endpoints**: Pattern discovery, insights, recommendations, and learning

### Data Processing Technologies
- **Event-Driven Architecture**: EventEmitter-based real-time processing
- **Stream Processing**: Real-time data stream processing with configurable processors
- **Batch Processing**: Non-critical data processed in batches for performance
- **Caching Strategy**: Multi-level caching for frequently accessed data
- **Async Processing**: Non-blocking operations for real-time responsiveness

### Machine Learning Integration
- **Pattern Discovery Algorithms**: K-means clustering, DBSCAN, association rules, LSTM
- **Statistical Analysis**: Correlation analysis, trend detection, anomaly scoring
- **Model Performance Tracking**: Accuracy, precision, recall, F1-score monitoring
- **Continuous Learning**: Feedback integration for model improvement
- **A/B Testing**: Model experimentation and performance comparison

### Performance Optimization
- **In-Memory Processing**: Critical metrics processed in memory for speed
- **Real-Time Responsiveness**: <100ms response time for real-time analytics
- **Scalable Architecture**: Horizontal scaling support for high-volume data
- **Efficient Data Storage**: Optimized data structures for analytics queries
- **Caching Strategy**: Multi-level caching for performance optimization

### Integration with Centralized AI Learning
- **Learning Event Forwarding**: Analytics events automatically sent to centralized learning
- **Pattern Correlation**: Analytics patterns correlated with global user behavior
- **Insight Enhancement**: Collective insights enhance individual analytics
- **Privacy Preservation**: All integration maintains user privacy and consent

## Technology Stack

### **Block ID System Technologies** 🆕
**Status**: ✅ Implemented

#### **Backend Technologies**
- **Node.js + Express**: REST API for Block ID management and admin operations
- **TypeScript**: Full type safety throughout the Block ID system
- **Prisma ORM**: Database schema with location models and audit logs
- **PostgreSQL**: Primary database with extended schema for Block ID system
- **JWT Authentication**: Secure token-based authentication for admin operations

#### **External Services**
- **ipapi.co**: IP-based geolocation service for automatic location detection
- **Fallback System**: Default location assignment when geolocation fails
- **Error Handling**: Comprehensive error handling for geolocation failures

#### **Database Schema Extensions**
```sql
-- Location hierarchy tables
CREATE TABLE countries (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  phone_code VARCHAR UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE regions (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL, -- 3-digit code
  country_id UUID REFERENCES countries(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_id, code)
);

CREATE TABLE towns (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL, -- 3-digit code
  region_id UUID REFERENCES regions(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(region_id, code)
);

CREATE TABLE user_serials (
  id UUID PRIMARY KEY,
  town_id UUID REFERENCES towns(id),
  last_serial INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(town_id)
);

-- User table extensions
ALTER TABLE users ADD COLUMN user_number VARCHAR UNIQUE;
ALTER TABLE users ADD COLUMN country_id UUID REFERENCES countries(id);
ALTER TABLE users ADD COLUMN region_id UUID REFERENCES regions(id);
ALTER TABLE users ADD COLUMN town_id UUID REFERENCES towns(id);
ALTER TABLE users ADD COLUMN location_detected_at TIMESTAMP;
ALTER TABLE users ADD COLUMN location_updated_at TIMESTAMP;
```

#### **API Endpoints**
```typescript
// Block ID Management
POST /api/auth/register          // Generate Block ID on registration
GET  /api/location/countries     // Get all countries
GET  /api/location/regions/:id   // Get regions by country
GET  /api/location/towns/:id     // Get towns by region
GET  /api/location/user-location // Get user's current location

// Admin Operations
GET  /api/admin/users/block-ids           // Get all users with Block IDs
PUT  /api/admin/users/:id/location        // Update user location (admin only)
GET  /api/admin/users/:id/audit-logs      // Get user audit logs
GET  /api/admin/block-ids/:id/audit-logs  // Get Block ID audit logs
```

#### **Frontend Technologies**
- **Next.js**: React framework for Block ID display and management
- **TypeScript**: Full type safety for Block ID components
- **Tailwind CSS**: Styling for Block ID display components
- **React Hooks**: State management for Block ID functionality
- **Clipboard API**: Copy-to-clipboard functionality for Block IDs

#### **Key Libraries & Dependencies**
```json
{
  "axios": "^1.6.0",           // HTTP client for geolocation API
  "prisma": "^6.10.1",         // Database ORM
  "@prisma/client": "^6.10.1", // Prisma client
  "jsonwebtoken": "^9.0.0",    // JWT token handling
  "bcrypt": "^5.1.0",          // Password hashing
  "react-hot-toast": "^2.4.0"  // Toast notifications for copy feedback
}
```

#### **Development Tools**
- **TypeScript Compiler**: Strict type checking for Block ID system
- **ESLint**: Code linting and style enforcement
- **Prisma Studio**: Database management and inspection
- **Postman/Insomnia**: API testing for Block ID endpoints

### **Payment & Billing System Technologies**

### **Backend Technologies**
- **Runtime**: Node.js v20.19.2
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **Payment Processing**: Stripe API integration
- **Real-time**: Socket.io for WebSocket connections
- **AI Integration**: OpenAI GPT-4o, Anthropic Claude-3.5-Sonnet
- **Package Manager**: pnpm workspace

### **Frontend Technologies**
- **Framework**: Next.js 14.1.0 with React 18.3.1
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom components
- **State Management**: React Context API
- **Payment UI**: Stripe Elements integration
- **Real-time**: Socket.io client
- **Package Manager**: pnpm

### **Development Tools**
- **TypeScript**: 5.8.3 for type safety
- **ESLint**: Code linting and formatting
- **Prisma**: Database schema management and migrations
- **ts-node-dev**: Development server with hot reload
- **Playwright**: End-to-end testing

## Architecture Overview

### **Monorepo Structure**
```
block-on-block/
├── server/          # Backend API (Express + TypeScript)
│   ├── src/
│   │   ├── controllers/    # API route handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # Express routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── config/         # Configuration files
│   │   └── types/          # TypeScript type definitions
│   ├── prisma/             # Database schema
│   └── package.json
├── web/            # Frontend (Next.js + React)
│   ├── src/
│   │   ├── app/           # Next.js app router
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   ├── api/           # API client functions
│   │   └── lib/           # Utility functions
│   └── package.json
├── shared/         # Shared components and utilities
│   ├── src/
│   │   ├── components/    # Shared UI components
│   │   ├── utils/         # Shared utilities
│   │   └── types/         # Shared type definitions
│   └── package.json
└── memory-bank/    # Project documentation
```

### **Database Schema**
- **PostgreSQL**: Primary database
- **Prisma ORM**: Type-safe database access
- **Migrations**: Version-controlled schema changes
- **Relationships**: Complex relationships between users, businesses, modules, and billing

### **API Architecture**
- **RESTful Design**: Standard REST API patterns
- **JWT Authentication**: Secure token-based authentication
- **Middleware**: Request validation, authentication, error handling
- **WebSocket**: Real-time communication for chat and notifications

## Payment System Architecture

### **Stripe Integration**
- **Payment Processing**: Stripe Elements for secure payment collection
- **Subscription Management**: Automatic subscription lifecycle management
- **Webhook Handling**: Real-time payment event processing
- **Customer Management**: Automatic customer creation and management

### **Billing Infrastructure**
- **Subscription Models**: Core platform and module-specific subscriptions
- **Usage Tracking**: Monitor feature usage and API calls
- **Revenue Sharing**: 70/30 split for third-party module subscriptions
- **Invoice Management**: Automatic invoice generation and tracking

### **Feature Gating**
- **Usage-Based Access**: Control feature access based on subscription tiers
- **Rate Limiting**: Prevent abuse of premium features
- **Usage Analytics**: Track feature usage for billing and optimization

## AI System Architecture

### **Multi-Provider AI Stack**
- **OpenAI GPT-4o**: Primary AI provider for general tasks
- **Anthropic Claude-3.5-Sonnet**: Alternative provider for specific use cases
- **Local Processing**: Sensitive data processed locally for privacy
- **Hybrid Architecture**: Cloud and local processing based on data sensitivity

### **AI Components**
- **CrossModuleContextEngine**: Gathers context across all modules
- **DigitalLifeTwinCore**: Central AI consciousness
- **AutonomyManager**: Manages AI autonomy levels
- **ApprovalManager**: Human oversight for AI actions
- **AdvancedLearningEngine**: Continuous learning and pattern recognition

### **AI Features**
- **Personality Modeling**: User personality analysis and adaptation
- **Predictive Intelligence**: Anticipate user needs and schedule
- **Intelligent Recommendations**: Multi-category recommendations
- **Natural Language Processing**: Advanced text analysis and generation

## Module System Architecture

### **Dynamic Module Loading**
- **Permission-Based**: Modules loaded based on user permissions
- **Context-Aware**: Dashboard context respects selected modules
- **Plugin Architecture**: Extensible system for new modules
- **Marketplace Integration**: Browse and install modules
- **Runtime (MVP)**: Frontend iframe host + `GET /api/modules/:id/runtime` returning sanitized manifest
- **Submission**: Hosted URL accepted now; artifact upload later; gating via install/subscription on runtime endpoint

### **Module Development**
- **Developer Portal**: Revenue analytics and payout management
- **Module Submission**: Submit modules for marketplace review
- **Version Control**: Module versioning and updates
- **Revenue Sharing**: Automatic revenue distribution

## Real-time Communication

### **WebSocket Infrastructure**
- **Socket.io**: Real-time bidirectional communication
- **Room Management**: Chat rooms and conversation management
- **Event Broadcasting**: Real-time updates across connected clients
- **Connection Management**: Handle connection lifecycle and reconnection

### **Real-time Features**
- **Live Chat**: Real-time messaging with file sharing
- **Notifications**: Real-time notifications and alerts
- **Status Updates**: Live status updates and presence indicators
- **Collaboration**: Real-time collaborative features

## Security Architecture

### **Authentication & Authorization**
- **NextAuth.js**: OAuth and JWT-based authentication
- **Role-Based Access**: Granular permissions based on user roles
- **Session Management**: Secure session handling
- **Token Refresh**: Automatic token refresh and renewal

### **Module Runtime Security (MVP)**
- **Iframe Sandbox**: Strict `sandbox`/`allow` attributes, origin allowlist bound to `frontend.entryUrl` origin
- **Token Sharing**: Disabled by default; opt‑in short‑lived JWT scoped to module origin and allowed actions
- **Runtime Config**: Sanitized manifest, install/subscription/status checks, signed asset URLs when applicable

### **Data Protection**
- **Input Validation**: Comprehensive input validation and sanitization
- **SQL Injection Prevention**: Parameterized queries with Prisma
- **XSS Protection**: Content Security Policy and input sanitization
- **CSRF Protection**: Cross-Site Request Forgery protection

### **Privacy & Compliance**
- **Data Encryption**: Encrypt sensitive data at rest and in transit
- **GDPR Compliance**: Data deletion and export capabilities
- **Audit Logging**: Comprehensive audit trails for compliance
- **Consent Management**: User consent tracking and management

## Performance Optimization

### **Frontend Optimization**
- **Code Splitting**: Dynamic imports for reduced bundle size
- **Image Optimization**: Next.js image optimization
- **Caching Strategy**: Browser and CDN caching
- **Lazy Loading**: Load components and data on demand

### **Backend Optimization**
- **Database Indexing**: Optimized database queries with proper indexing
- **Connection Pooling**: Efficient database connection management
- **Caching**: Redis caching for frequently accessed data
- **Rate Limiting**: Prevent API abuse and ensure fair usage

### **Infrastructure Optimization**
- **CDN Integration**: Content delivery network for static assets
- **Load Balancing**: Horizontal scaling with load balancers
- **Monitoring**: Real-time performance monitoring and alerting
- **Logging**: Comprehensive logging for debugging and analytics

## Development Workflow

### **Development Environment**
- **Local Development**: Hot reload for both frontend and backend
- **Database**: Local PostgreSQL instance with Prisma migrations
- **Environment Variables**: Separate configuration for development and production
- **Debugging**: Comprehensive error handling and logging

### **Testing Strategy**
- **Unit Testing**: Jest for backend unit tests
- **Integration Testing**: API endpoint testing
- **End-to-End Testing**: Playwright for full application testing
- **Type Safety**: TypeScript for compile-time error detection

### **Deployment Pipeline**
- **Version Control**: Git with feature branch workflow
- **CI/CD**: Automated testing and deployment
- **Environment Management**: Separate environments for development, staging, and production
- **Monitoring**: Real-time monitoring and alerting in production

## Technical Constraints

### **Browser Compatibility**
- **Modern Browsers**: Support for Chrome, Firefox, Safari, Edge
- **Mobile Responsive**: Responsive design for mobile devices
- **Progressive Enhancement**: Graceful degradation for older browsers

### **Performance Requirements**
- **Page Load Time**: < 2 seconds for initial page load
- **API Response Time**: < 200ms for most API calls
- **Real-time Latency**: < 100ms for WebSocket messages
- **Database Queries**: Optimized queries with proper indexing

### **Scalability Requirements**
- **Horizontal Scaling**: Stateless API design for easy scaling
- **Database Scaling**: Read replicas and connection pooling
- **Caching Strategy**: Multi-layer caching for performance
- **Load Balancing**: Support for multiple server instances

## Integration Points

### **External Services**
- **Stripe**: Payment processing and subscription management
- **AI Providers**: OpenAI and Anthropic for AI capabilities
- **Email Service**: Transactional email delivery
- **File Storage**: Cloud storage for file uploads

### **Third-Party APIs**
- **OAuth Providers**: Google, GitHub, Microsoft for authentication
- **Social Media**: Integration with social platforms
- **Business Tools**: Integration with popular business applications
- **Analytics**: Google Analytics and custom analytics

### **Monitoring & Logging**
- **Application Monitoring**: Real-time application performance monitoring
- **Error Tracking**: Comprehensive error tracking and alerting
- **User Analytics**: User behavior and feature usage analytics
- **Business Metrics**: Revenue, subscription, and usage metrics

This technical context provides a comprehensive overview of the technology stack, architecture, and development practices used in the Block on Block platform. 