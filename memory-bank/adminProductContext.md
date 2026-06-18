<!--
Admin Product Context
See README for the modular context pattern.
-->

# Admin Product Context

**Description:**
This file documents the product context for all admin-facing features, including user/org management, system settings, and monitoring.

## 1. Header & Purpose
- **Purpose:**  
  The Admin Portal provides a comprehensive platform control plane at `/admin-portal` for **platform administrators** (`ADMIN` role). It is a **hybrid control plane + governance surface** — not an installable product module. It centralizes user/org management, module governance, security oversight, and operational controls.
- **Not a product module:** Admin Portal must not appear in `coreModuleRegistry`, business workspace install flows, or the module marketplace as module id `admin`.
- **Canonical module governance:** `/admin-portal/modules` (legacy `/modules/admin` redirects here as of Stage 0B-B).
- **Cross-References:**  
  - [developerProductContext.md] (developer tools, monitoring)
  - [systemPatterns.md] (admin patterns, access control)
  - [databaseContext.md] (user/org models, audit logs)
  - [docs/architecture/audits/ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md](../docs/architecture/audits/ADMIN_PORTAL_CONTROL_PLANE_ARCHITECTURE.md)
  - [docs/guides/ADMIN_PORTAL.md](../docs/guides/ADMIN_PORTAL.md)

## 2. Problem Space
- Need for centralized management of users, organizations, and permissions.
- Requirement for oversight of sharing, access, and platform activity.
- Admins must be able to audit, intervene, and maintain compliance.
- Need for secure user impersonation for debugging and support.
- Comprehensive audit logging and security monitoring.

## 3. User Experience Goals
- Clear, intuitive dashboards for managing users, shares, and activity.
- Fast access to critical admin actions (role changes, share removal, take over).
- Real-time feedback and error handling.
- Secure, role-based access to admin features.
- Professional admin interface similar to enterprise SaaS platforms.

## 3a. Admin Portal Layout & Navigation
- **Dedicated Admin Portal**: Separate `/admin-portal` route with enhanced security
- **Left Sidebar**: Navigation between admin sections (Dashboard, Users, Moderation, Analytics, Billing, Security, System)
- **Main Panel**: Data tables for users, content, and activity logs with filtering and actions
- **Header**: System status, admin user info, and quick actions
- **Responsive Design**: Professional admin interface with Tailwind CSS

## 4. Core Features & Requirements

### **4a. Implemented Features** ✅

#### **Admin Portal Infrastructure** ✅
- ✅ **Dedicated Admin Portal**: `/admin-portal` route with separate authentication
- ✅ **Control-plane model**: Not registered as installable module id `admin` (Stage 0B-B)
- ✅ **Module governance canonical path**: `/admin-portal/modules`; `/modules/admin` redirects (Stage 0B-B)
- ✅ **Compliance gates (0E)**: `ADMIN_PORTAL_DEBUG_ENABLED` for debug/test surfaces; `ADMIN_PORTAL_DANGEROUS_OPS_ENABLED` for migration delete/reset
- ✅ **No mock fallbacks (0E-C)**: Support, modules, and dashboard use live API data with error + retry
- ✅ **Admin Layout**: Professional admin interface with sidebar navigation
- ✅ **Role-Based Access**: ADMIN role required for all admin portal access
- ✅ **Session Management**: Secure admin sessions with JWT authentication
- ✅ **Error Handling**: Comprehensive error handling and user feedback

#### **User Management** ✅
- ✅ **User Dashboard**: Searchable, filterable user table with pagination
- ✅ **User Details**: Comprehensive user information and activity
- ✅ **User Actions**: Ban, suspend, reset password, impersonate users
- ✅ **User Analytics**: User growth, activity, and engagement metrics
- ✅ **Role Management**: View and manage user roles and permissions

#### **Content Moderation** ✅
- ✅ **Content Reports**: View and manage reported content
- ✅ **Moderation Actions**: Remove, restore, mark as reviewed
- ✅ **Report Filtering**: Filter by status, type, and date
- ✅ **Moderation Queue**: Prioritized content review system
- ✅ **Audit Logging**: Complete audit trail for all moderation actions

#### **Platform Analytics** ✅
- ✅ **System Performance**: Uptime, response time, error rate, performance trends with interactive charts
- ✅ **Real-time Activity**: Live audit log feed with user actions, timestamps, and color-coded activity types
- ✅ **System Health**: Server performance and health monitoring
- ✅ **Interactive Charts**: Recharts visualizations for performance trends over time
- ✅ **Technical Metrics**: API requests, database queries, cache hit rates, resource usage (CPU, memory, storage)
- ✅ **Focus**: System and technical metrics only (business metrics moved to Business Intelligence)

#### **Business Intelligence** ✅
- ✅ **Business Metrics**: User growth, revenue metrics (MRR, ARPU), engagement metrics (DAU/WAU/MAU)
- ✅ **Predictive Insights**: AI-powered predictions for churn, upsell, growth, risk (from CollectiveInsight database table)
- ✅ **A/B Testing**: Test management, variant comparison, winner determination with confidence scores
- ✅ **User Segments**: User segmentation with criteria, counts, average value, and growth rates
- ✅ **Competitive Analysis**: Market position, competitor analysis, opportunities and threats
- ✅ **Focus**: Business and strategic metrics only (system metrics moved to Platform Analytics)

#### **AI System Overview** ✅
- ✅ **Unified Dashboard**: Single overview page combining all AI subsystems (Business Intelligence, AI Learning, Business AI Global, Context Debug) at `/admin-portal/ai-system`
- ✅ **System Cards**: Quick access cards showing key metrics from each AI subsystem
- ✅ **Combined Analytics**: 4 interactive charts (User Growth, Revenue, AI Interactions, Pattern Discovery) with unified trends
- ✅ **Unified Trends Visualization**: Multi-line chart comparing all AI systems with metric toggles, date range filters, and correlation analysis
- ✅ **Patterns & Insights**: Combined patterns and insights from multiple AI sources (AI Learning + Business AI Global)
- ✅ **Authenticated API Access**: All AI admin data is fetched via `adminApiService` (never raw `fetch`). Endpoints: `/api/admin/business-ai/global`, `/api/admin/business-ai/patterns`; `/api/centralized-ai/health`, `/api/centralized-ai/patterns`, `/api/centralized-ai/insights`, `/api/centralized-ai/privacy/settings`. Ensures Bearer token auth and eliminates 401s.
- ✅ **Provider Usage**: Provider usage/expense tracking (Combined, OpenAI, Anthropic) in AI System page
- ✅ **AI Learning** (`/admin-portal/ai-learning`): Health, patterns, insights, privacy settings from centralized AI. "Run Pattern Analysis" and "Generate Insights" actions; empty states and loading states when no data.

#### **Module AI Context Management** ✅
- ✅ **AI Context Status Dashboard**: Comprehensive dashboard at `/admin-portal/modules` (AI Context Status tab) showing all modules' AI context registration status
- ✅ **Status Overview**: Summary cards with total modules, registered count, missing context count, and health status (good/warning/critical)
- ✅ **Module List**: Searchable, filterable list of all modules with registration status badges
- ✅ **View Details**: Modal showing complete AI context details (purpose, keywords, patterns, concepts, entities, actions, context providers)
- ✅ **Test Providers**: Real-time testing of context provider endpoints with success/failure indicators and response data
- ✅ **Registration Management**: One-click registration of missing modules via "Register Missing Modules" button
- ✅ **Individual Registration**: "Register Now" button for unregistered modules
- ✅ **Smart Registration Logic**: System only registers missing modules (incremental registration), doesn't skip everything if registry has entries
- ✅ **Query Optimizations**: Pagination (100 limit) and optimized developer count queries to prevent timeouts
- ✅ **Backend Endpoints**: `GET /api/admin/modules/ai/status`, `POST /api/admin/modules/ai/register-built-ins`

#### **Security & Compliance** ✅
- ✅ **Security Events**: Monitor and track security incidents
- ✅ **Audit Logs**: Comprehensive audit trail for all admin actions
- ✅ **System Monitoring**: Real-time system health and performance
- ✅ **Compliance Reporting**: GDPR and regulatory compliance tools
- ✅ **Security Alerts**: Automated security notifications and alerts

#### **System Administration** ✅
- ✅ **System Configuration**: Manage system settings and configurations
- ✅ **System Health**: Monitor server performance and health
- ✅ **Backup Management**: Database backup and restore capabilities
- ✅ **Error Logging**: Centralized error tracking and monitoring
- ✅ **Maintenance Mode**: System maintenance controls

#### **Financial Management** ✅
- ✅ **Subscription Management**: View and manage user subscriptions
- ✅ **Payment Tracking**: Monitor payment processing and revenue
- ✅ **Revenue Analytics**: Financial reporting and revenue trends
- ✅ **Billing Support**: Admin tools for billing and payment issues
- ✅ **Developer Payouts**: Manage developer revenue and payouts

### **4b. Feature Checklist (Implementation Status)**

| Feature                | Status      | Notes/Location (if implemented)      |
|------------------------|-------------|--------------------------------------|
| **Admin Portal Infrastructure** | ✅ | `/admin-portal` route with professional UI |
| **User Management**    | ✅          | Complete user management with actions |
| **Content Moderation** | ✅          | Content reports and moderation tools |
| **Platform Analytics** | ✅          | Real-time metrics and reporting |
| **Security & Compliance** | ✅    | Security events and audit logs |
| **System Administration** | ✅    | System health and configuration |
| **Financial Management** | ✅     | Subscription and payment tracking |
| **Database Models**    | ✅          | ContentReport, SystemMetrics, SecurityEvent, etc. |
| **API Integration**    | ✅          | Complete admin portal API endpoints |
| **Frontend Components** | ✅       | Professional admin UI components |
| **Type Safety**        | ✅          | Full TypeScript compliance |
| **Error Handling**     | ✅          | Comprehensive error management |

### **4c. Planned Features** 🔄

#### **Phase 3: Enhanced Features**
- 🔄 **User Impersonation**: Secure user impersonation for debugging
- 🔄 **Advanced Analytics**: Real-time metrics and custom reports
- 🔄 **Enhanced Security**: MFA, IP whitelisting, session management
- 🔄 **Compliance Tools**: GDPR, SOC2 reporting and controls
- 🔄 **Bulk Operations**: Batch user and content management

#### **Phase 4: Production Features**
- 🔄 **Comprehensive Testing**: Admin portal test suite
- 🔄 **Documentation**: Complete admin user guide
- 🔄 **Production Deployment**: Production-ready configuration
- 🔄 **Monitoring & Alerts**: Admin portal monitoring system

#### **Phase 5: Advanced Features**
- 🔄 **Developer Management**: Module marketplace administration
- 🔄 **Business Intelligence**: Advanced analytics and reporting
- 🔄 **Automation**: Automated admin workflows
- 🔄 **Integration**: Third-party service integrations

## 5. Integration & Compatibility
- Integrates with user, access, and activity APIs.
- Designed for extensibility (add org/settings/monitoring).
- Cross-module integration with all platform features.
- Real-time data synchronization with main application.

## 5a. Data Model Reference
- **User Management**: User, UserSerial, BusinessMember models
- **Content Moderation**: ContentReport model with reporter relations
- **System Monitoring**: SystemMetrics, SystemConfig, SecurityEvent models
- **Audit Logging**: AuditLog model with comprehensive tracking
- **Financial**: Subscription, ModuleSubscription, Payment models

## 6. Technical Constraints & Decisions
- Admin-only access enforced at API and UI levels.
- Uses Next.js, React, Tailwind CSS for frontend.
- Express.js with TypeScript for backend APIs.
- PostgreSQL with Prisma ORM for data persistence.
- JWT-based authentication with role-based access control.

## 7. Success Metrics
- Admin task completion time
- Error rate for admin actions
- Audit/compliance coverage
- System uptime and performance
- User satisfaction with admin tools

## 8. Design & UX References
- Google Admin, Slack Admin, Notion Admin
- [designPatterns.md], [systemPatterns.md]
- Professional enterprise SaaS admin interfaces

## 8a. Global Components & Integration Points
- Admin dashboard, data tables, action dialogs, filtering controls.
- Professional admin portal layout with sidebar navigation.
- Real-time metrics and system health monitoring.
- Comprehensive audit logging and security monitoring.

## 9. Testing & Quality
- Unit/integration tests for admin APIs and UI.
- E2E tests for critical admin flows.
- Security testing for admin access controls.
- Performance testing for admin portal responsiveness.

## 10. Future Considerations & Ideas
- **User Impersonation System**: Secure user impersonation for debugging and support
- **Advanced Analytics**: Real-time metrics, custom reports, and data visualization
- **Enhanced Security**: Multi-factor authentication, IP whitelisting, session management
- **Compliance Tools**: GDPR, SOC2, and regulatory compliance features
- **Developer Management**: Module marketplace administration and developer tools
- **Business Intelligence**: Advanced analytics and predictive reporting
- **Automation**: Automated admin workflows and decision-making
- **Integration**: Third-party service integrations and webhooks

## 11. Update History & Ownership
- **2024-06:** Initial draft.
- **2024-06:** Reviewed for completeness, clarity, and actionability.
- **2024-06:** Feature checklist reordered and expanded for best-practice rebuild.
- **2025-01:** **MAJOR UPDATE** - Complete admin portal implementation with comprehensive features:
  - ✅ Dedicated admin portal at `/admin-portal`
  - ✅ Complete user management system
  - ✅ Content moderation tools
  - ✅ Platform analytics and reporting
  - ✅ Security and compliance features
  - ✅ System administration tools
  - ✅ Financial management capabilities
  - ✅ Professional admin UI with Tailwind CSS
  - ✅ Full TypeScript compliance
  - ✅ Comprehensive API integration
  - ✅ Database models for all admin features
  - ✅ Real-time metrics and monitoring
  - ✅ Audit logging and security tracking

**Current Status**: Admin portal is fully functional and ready for production use. All core features implemented with professional UI/UX and comprehensive backend integration.

**Recent Updates (January 2025 - Rebuild & Consolidation)**:
- ✅ **Data Accuracy**: Fixed Overview page to pull real data from database with accurate user counts and trends
- ✅ **Platform Analytics**: Added interactive Recharts visualizations, real-time activity feed, system performance metrics
- ✅ **AI System Reorganization**: Created unified AI System overview page consolidating Business Intelligence, AI Learning, AI Context Debug, and Business AI Global
- ✅ **AI Learning Page**: Fixed all endpoint connections to use Next.js API proxy, removed all mock data, added proper empty states
- ✅ **Analytics Consolidation**: Separated Platform Analytics (system/technical metrics) and Business Intelligence (business/strategic metrics) with no duplicate functionality
- ✅ **UI/UX Improvements**: Fixed text readability issues (changed light text colors to dark on light backgrounds) across all admin pages
- ✅ **Coding Standards**: Added rule to prevent light text on light backgrounds in future development
- ✅ **Real Predictive Insights**: Business Intelligence now pulls real insights from `CollectiveInsight` database table instead of mock data
- ✅ **Backend Enhancements**: Dashboard stats now calculate real trends (30-day vs 60-day comparisons) for accurate growth metrics

**Next Phase**: User Impersonation System and Advanced Analytics features.