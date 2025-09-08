# Block-on-Block: Comprehensive File Summary & Connections

## Executive Summary

This document provides a complete overview of all files in the Block-on-Block codebase, their purposes, connections, and relationships. The codebase contains **~500+ files** organized into a monorepo structure with clear separation of concerns.

## File Count by Category

- **Root Configuration**: 15+ files
- **Server Backend**: 200+ files
- **Web Frontend**: 150+ files  
- **Shared Components**: 80+ files
- **Database Schema**: 50+ files
- **Documentation**: 45+ files
- **Tests**: 20+ files
- **Scripts**: 10+ files

## 1. Root Level Files

### Configuration & Build Files
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `package.json` | Monorepo configuration with pnpm workspace | All packages, dependencies | 2.2KB |
| `pnpm-lock.yaml` | Dependency lock file | All packages | 336KB |
| `tsconfig.json` | TypeScript configuration | All TypeScript files | 204B |
| `eslint.config.js` | Code linting rules | All source files | 1.9KB |
| `docker-compose.production.yml` | Production deployment | Production environment | 5.2KB |
| `playwright.config.ts` | End-to-end testing | Test files | 834B |
| `pnpm-workspace.yaml` | Workspace configuration | Package management | 192B |

### Scripts & Utilities
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `scripts/build-prisma-schema.js` | Automated Prisma schema builder | Prisma schema files | - |
| `scripts/clear-cache.sh` | Development cache cleanup | Development environment | 1.4KB |
| `setup-env.sh` | Environment setup | Environment variables | 1.4KB |

## 2. Server Directory (`/server`)

### Core Server Files
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `src/index.ts` | Main Express server entry point | All routes, services, middleware | 16KB, 473 lines |
| `src/auth.ts` | Authentication configuration | NextAuth.js, JWT, OAuth | 3.0KB, 121 lines |
| `src/express.d.ts` | Express type definitions | Express types | 483B, 23 lines |

### Routes (`/server/src/routes`) - 40+ Files

#### Core Business Routes
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `business.ts` | Business workspace management | Business service, business controller | 1.4KB, 51 lines |
| `dashboard.ts` | Dashboard and widget management | Dashboard service, widget service | 1.5KB, 69 lines |
| `drive.ts` | File and folder management | Drive service, file controller | 441B, 13 lines |
| `chat.ts` | Real-time messaging system | Chat service, socket service | 1.1KB, 43 lines |
| `calendar.ts` | Event and scheduling management | Calendar service, reminder service | 3.1KB, 81 lines |
| `module.ts` | Module system and marketplace | Module service, subscription service | 1.6KB, 63 lines |
| `payment.ts` | Payment processing | Stripe service, payment service | 832B, 31 lines |
| `billing.ts` | Subscription and billing management | Subscription service, billing service | 1.6KB, 54 lines |

#### AI & Intelligence Routes
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `ai-centralized.ts` | Centralized AI learning system | AI services, learning engine | 89KB, 2917 lines |
| `ai.ts` | Core AI functionality | AI core services, providers | 19KB, 710 lines |
| `ai-autonomy.ts` | AI autonomy controls | AI autonomy engine, approval system | 10KB, 398 lines |
| `ai-intelligence.ts` | AI intelligence features | AI intelligence engine, pattern discovery | 12KB, 416 lines |
| `businessAI.ts` | Business-specific AI features | Business AI service, analytics | 16KB, 565 lines |

#### Admin & Management Routes
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `admin-portal.ts` | Admin portal interface | Admin service, admin controller | 59KB, 1957 lines |
| `admin.ts` | Admin operations | Admin service, user management | 5.1KB, 176 lines |
| `adminBusinessAI.ts` | Admin business AI controls | Business AI service, admin service | 10KB, 359 lines |
| `developerPortal.ts` | Developer portal | Developer portal service, revenue tracking | 791B, 33 lines |

#### User & Authentication Routes
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `user.ts` | User management | User service, user controller | 386B, 12 lines |
| `sso.ts` | Single sign-on integration | SSO service, OAuth providers | 1004B, 31 lines |
| `googleOAuth.ts` | Google OAuth integration | Google OAuth service, OAuth flow | 676B, 23 lines |

#### Advanced Features
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `org-chart.ts` | Organizational chart management | Org chart service, permission service | 20KB, 638 lines |
| `featureGating.ts` | Feature access control | Feature gating service, subscription service | 1.4KB, 57 lines |
| `audit.ts` | Audit logging | Audit service, logging system | 527B, 16 lines |
| `privacy.ts` | Privacy controls | Privacy service, GDPR compliance | 799B, 31 lines |
| `retention.ts` | Data retention policies | Retention service, data lifecycle | 1.8KB, 59 lines |

### Services (`/server/src/services`) - 25+ Files

#### Core Business Services
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `dashboardService.ts` | Dashboard management | Dashboard routes, widget service | 8.4KB, 319 lines |
| `driveService.ts` | File system operations | Drive routes, file controller | 526B, 27 lines |
| `chatSocketService.ts` | Real-time chat | Chat routes, WebSocket server | 15KB, 504 lines |
| `notificationService.ts` | Notification system | Notification routes, email service | 9.3KB, 325 lines |

#### AI & Analytics Services
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `adminService.ts` | Admin operations | Admin routes, admin controller | 89KB, 3220 lines |
| `permissionService.ts` | Permission management | All routes, role-based access | 16KB, 596 lines |
| `featureGatingService.ts` | Feature access control | Feature gating routes, subscription service | 22KB, 744 lines |

#### Payment & Billing Services
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `stripeService.ts` | Stripe integration | Payment routes, billing service | 11KB, 441 lines |
| `paymentService.ts` | Payment processing | Payment routes, Stripe service | 9.6KB, 344 lines |
| `subscriptionService.ts` | Subscription management | Billing routes, subscription routes | 9.1KB, 345 lines |
| `moduleSubscriptionService.ts` | Module subscriptions | Module routes, subscription service | 12KB, 439 lines |

#### User Management Services
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `userNumberService.ts` | Block ID system | User registration, location service | 3.5KB, 108 lines |
| `geolocationService.ts` | Location detection | Location service, IP geolocation | 2.5KB, 91 lines |
| `locationService.ts` | Location management | Location routes, geolocation service | 2.7KB, 151 lines |
| `auditService.ts` | Audit logging | Audit routes, logging system | 3.2KB, 151 lines |

### AI Services (`/server/src/ai`) - 10+ Directories

#### Core AI Components
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `core/` | Core AI functionality | AI routes, AI controllers | Core AI engine |
| `learning/` | AI learning systems | Learning routes, centralized learning | Learning engine |
| `intelligence/` | AI intelligence features | Intelligence routes, pattern discovery | Intelligence engine |
| `autonomy/` | AI autonomy controls | Autonomy routes, approval system | Autonomy engine |
| `providers/` | AI provider integrations | OpenAI, Claude, local AI | Provider services |
| `analytics/` | AI-powered analytics | Analytics routes, business intelligence | Analytics engine |
| `enterprise/` | Enterprise AI features | Business AI routes, enterprise features | Enterprise AI |
| `privacy/` | AI privacy controls | Privacy routes, data protection | Privacy engine |
| `workflows/` | AI workflow management | Workflow routes, automation | Workflow engine |
| `actions/` | AI action execution | Action routes, automation | Action engine |
| `models/` | AI model management | Model routes, ML models | Model management |
| `context/` | AI context gathering | Context routes, cross-module data | Context engine |
| `approval/` | AI approval workflows | Approval routes, human oversight | Approval system |

### Controllers (`/server/src/controllers`) - 30+ Files

#### Core Controllers
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `dashboardController.ts` | Dashboard operations | Dashboard routes, dashboard service | - |
| `fileController.ts` | File management | File routes, file service | - |
| `chatController.ts` | Chat functionality | Chat routes, chat service | - |
| `businessController.ts` | Business operations | Business routes, business service | - |
| `userController.ts` | User management | User routes, user service | - |

#### AI Controllers
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `aiController.ts` | AI operations | AI routes, AI services | - |
| `aiAnalyticsController.ts` | AI analytics | Analytics routes, AI analytics service | - |
| `aiLearningController.ts` | AI learning | Learning routes, AI learning service | - |

#### Admin Controllers
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `adminController.ts` | Admin operations | Admin routes, admin service | - |
| `auditController.ts` | Audit management | Audit routes, audit service | - |

### Middleware (`/server/src/middleware`)
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `auth.ts` | Authentication middleware | All protected routes, JWT validation | - |
| `subscriptionMiddleware.ts` | Subscription validation | Feature gating, subscription checks | - |
| `validateRequest.ts` | Request validation | Input validation, schema validation | - |

### Types (`/server/src/types`)
| Directory/File | Purpose | Connections | Contents |
|----------------|---------|-------------|----------|
| `express/` | Express-specific types | Express routes, Express middleware | Express types |
| `cors.d.ts` | CORS type definitions | CORS middleware, cross-origin requests | CORS types |

### Utils (`/server/src/utils`)
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `blockIdValidation.ts` | Block ID validation | Block ID system, user registration | - |
| `timezone.ts` | Timezone utilities | Calendar system, time handling | - |
| `tokenUtils.ts` | Token management | JWT tokens, refresh tokens | - |

## 3. Web Directory (`/web`)

### Core App Files
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `src/app/layout.tsx` | Root layout with providers | All pages, context providers | 3.0KB, 89 lines |
| `src/app/page.tsx` | Home page | Layout, home components | 245B, 12 lines |
| `src/app/globals.css` | Global styles | All components, Tailwind CSS | 4.7KB, 248 lines |
| `next.config.js` | Next.js configuration | Next.js build, optimization | 3.4KB, 148 lines |
| `tailwind.config.js` | Tailwind CSS configuration | Styling, design system | 1.2KB, 40 lines |

### App Routes (`/web/src/app`) - 20+ Directories

#### Core Application Routes
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `dashboard/` | User dashboard | Dashboard context, dashboard components | Dashboard pages |
| `business/` | Business workspace | Business context, business components | Business pages |
| `drive/` | File management | Drive context, drive components | Drive pages |
| `chat/` | Messaging system | Chat context, chat components | Chat pages |
| `calendar/` | Calendar and events | Calendar context, calendar components | Calendar pages |
| `profile/` | User profile management | User context, profile components | Profile pages |
| `auth/` | Authentication pages | Auth context, auth components | Auth pages |

#### Admin & Management Routes
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `admin-portal/` | Admin portal interface | Admin context, admin components | Admin portal pages |
| `admin/` | Admin operations | Admin context, admin components | Admin pages |
| `developer-portal/` | Developer portal | Developer context, developer components | Developer portal pages |

#### Module Routes
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `modules/` | Module marketplace | Module context, module components | Module pages |
| `ai/` | AI control center | AI context, AI components | AI pages |

### Components (`/web/src/components`) - 50+ Files

#### Core UI Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `AccountSwitcher.tsx` | Account switching | User context, business context | - |
| `AvatarContextMenu.tsx` | User avatar menu | User context, avatar component | - |
| `AIEnhancedSearchBar.tsx` | AI-powered search | Search context, AI service | - |
| `GlobalChat.tsx` | Global chat interface | Chat context, chat service | - |

#### Admin Components
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `admin-portal/` | Admin-specific components | Admin context, admin service | Admin components |

#### AI Components
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `ai/` | AI-related components | AI context, AI service | AI components |

#### Business Components
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `business/` | Business-specific components | Business context, business service | Business components |

### Contexts (`/web/src/contexts`) - 10+ Files

#### Core Contexts
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `DashboardContext.tsx` | Dashboard state management | Dashboard components, dashboard service | - |
| `WorkAuthContext.tsx` | Work authentication | Business context, auth service | - |
| `ChatContext.tsx` | Chat state management | Chat components, chat service | - |
| `GlobalBrandingContext.tsx` | Branding management | All components, branding service | - |
| `GlobalSearchContext.tsx` | Search functionality | Search components, search service | - |
| `GlobalTrashProvider.tsx` | Trash management | Trash components, trash service | - |

### Hooks (`/web/src/hooks`) - 3+ Files

#### Custom Hooks
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `useAuth.ts` | Authentication hooks | Auth context, auth service | - |
| `useBusiness.ts` | Business operations | Business context, business service | - |
| `useNotifications.ts` | Notification management | Notification context, notification service | - |

### API (`/web/src/api`) - 21+ Files

#### Core API Clients
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `analytics.ts` | Analytics API | Analytics service, analytics components | - |
| `audit.ts` | Audit API | Audit service, audit components | - |
| `business.ts` | Business API | Business service, business components | - |
| `chat.ts` | Chat API | Chat service, chat components | - |
| `drive.ts` | Drive API | Drive service, drive components | - |
| `user.ts` | User API | User service, user components | - |

#### AI API Clients
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `ai.ts` | AI operations | AI service, AI components | - |
| `aiAnalytics.ts` | AI analytics | AI analytics service, analytics components | - |
| `aiLearning.ts` | AI learning | AI learning service, learning components | - |

#### Admin API Clients
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `admin.ts` | Admin operations | Admin service, admin components | - |
| `adminPortal.ts` | Admin portal | Admin portal service, admin portal components | - |

### Lib (`/web/src/lib`) - 12+ Files

#### Core Utilities
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `auth.ts` | Authentication utilities | Auth context, auth service | - |
| `api.ts` | API utilities | All API clients, HTTP requests | - |
| `utils.ts` | General utilities | All components, common functions | - |
| `constants.ts` | Application constants | All components, configuration | - |

## 4. Shared Directory (`/shared`)

### Components (`/shared/src/components`) - 60+ Files

#### Core UI Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `Button.tsx` | Button component | All components, button variants | - |
| `Input.tsx` | Input field component | Form components, input handling | 727B, 26 lines |
| `Modal.tsx` | Modal dialog component | All components, modal dialogs | 3.7KB, 140 lines |
| `Card.tsx` | Card component | All components, card layouts | 291B, 20 lines |
| `Avatar.tsx` | Avatar component | User components, profile display | 2.9KB, 100 lines |
| `Badge.tsx` | Badge component | All components, status indicators | 784B, 35 lines |

#### Data Display Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `FileGrid.tsx` | File grid display | Drive components, file management | 14KB, 409 lines |
| `FilePreview.tsx` | File preview | File components, file viewing | 8.7KB, 299 lines |
| `Table.tsx` | Data table component | All components, data display | 903B, 36 lines |
| `LineChart.tsx` | Line chart component | Analytics components, data visualization | 882B, 36 lines |
| `BarChart.tsx` | Bar chart component | Analytics components, data visualization | 835B, 36 lines |
| `PieChart.tsx` | Pie chart component | Analytics components, data visualization | 822B, 27 lines |

#### Form Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `FormGroup.tsx` | Form group wrapper | Form components, form layout | 653B, 20 lines |
| `Checkbox.tsx` | Checkbox component | Form components, form inputs | 278B, 7 lines |
| `Radio.tsx` | Radio button component | Form components, form inputs | 232B, 7 lines |
| `Switch.tsx` | Toggle switch component | Form components, form inputs | 907B, 35 lines |
| `Textarea.tsx` | Text area component | Form components, form inputs | 315B, 20 lines |

#### Navigation Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `SidebarNavigation.tsx` | Sidebar navigation | Layout components, navigation | 728B, 27 lines |
| `Breadcrumbs.tsx` | Breadcrumb navigation | Layout components, navigation | 725B, 20 lines |
| `Tabs.tsx` | Tab navigation | All components, tab interfaces | 2.8KB, 127 lines |

#### Utility Components
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `LoadingOverlay.tsx` | Loading states | All components, loading indicators | 1.0KB, 30 lines |
| `ErrorBoundary.tsx` | Error handling | All components, error boundaries | 1.1KB, 43 lines |
| `ToastProvider.tsx` | Toast notifications | All components, notifications | 1.4KB, 51 lines |
| `ContextMenu.tsx` | Context menus | All components, right-click menus | 7.1KB, 223 lines |

### Types (`/shared/src/types`) - 9+ Files

#### Core Types
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `chat.d.ts` | Chat type definitions | Chat components, chat service | - |
| `dashboard.d.ts` | Dashboard types | Dashboard components, dashboard service | - |
| `drive.d.ts` | Drive types | Drive components, drive service | - |
| `user.d.ts` | User types | User components, user service | - |
| `business.d.ts` | Business types | Business components, business service | - |

### Utils (`/shared/src/utils`) - 2+ Files

#### Core Utilities
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `brandColors.ts` | Brand color definitions | All components, design system | - |
| `format.ts` | Formatting utilities | All components, data formatting | - |

## 5. Prisma Directory (`/prisma`)

### Schema Files
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `schema.prisma` | Main database schema | All services, all controllers | 3089 lines |
| `modules/` | Domain-based schema modules | Schema organization, build system | - |

#### Schema Modules
| Directory | Purpose | Connections | Contents |
|-----------|---------|-------------|----------|
| `auth/` | Authentication models | User service, auth service | User, Role models |
| `business/` | Business models | Business service, business controller | Business, BusinessMember models |
| `ai/` | AI models | AI services, AI controllers | AI models, learning models |
| `billing/` | Billing models | Billing service, payment service | Subscription, Invoice models |
| `calendar/` | Calendar models | Calendar service, calendar controller | Calendar, Event models |
| `chat/` | Chat models | Chat service, chat controller | Conversation, Message models |
| `drive/` | File management models | Drive service, file controller | File, Folder models |
| `admin/` | Admin models | Admin service, admin controller | Admin, Audit models |

### Migrations - 50+ Files

#### Key Migrations
| Migration | Purpose | Connections | Date |
|-----------|---------|-------------|------|
| `20250601223342_test/` | Initial test migration | Database setup | 2025-06-01 |
| `20250602101913_add_userpref_unique/` | User preferences | User service | 2025-06-02 |
| `20250603105558_add_file_folder_models_relations/` | File system | Drive service | 2025-06-03 |
| `20250604010732_add_file_permission_unique/` | File permissions | Permission service | 2025-06-04 |
| `20250609225507_add_trashed_at_to_file_and_folder/` | Trash system | Drive service | 2025-06-09 |
| `20250610215024_add_activity_model/` | Activity tracking | Activity service | 2025-06-10 |
| `20250611005920_add_email_verification/` | Email verification | Email service | 2025-06-11 |
| `20250621155321_add_starred_field/` | Starred items | Drive service | 2025-06-21 |
| `20250622125748_add_chat_models/` | Chat system | Chat service | 2025-06-22 |
| `20250626011844_add_dashboard_to_conversations/` | Dashboard integration | Dashboard service | 2025-06-26 |
| `20250626015130_add_business_and_educational_models/` | Business models | Business service | 2025-06-26 |
| `20250630020126_add_sso_department_job_models/` | SSO integration | SSO service | 2025-06-30 |
| `20250702103339_add_personal_relationships/` | User relationships | User service | 2025-07-02 |
| `20250703101731_add_business_follow/` | Business following | Business service | 2025-07-03 |
| `20250707103438_add_audit_logging_and_compliance/` | Audit system | Audit service | 2025-07-07 |
| `20250709020347_add_file_folder_order/` | File ordering | Drive service | 2025-07-09 |
| `20250719142308_add_trashed_at_to_conversations_and_dashboards/` | Extended trash | Drive service, dashboard service | 2025-07-19 |
| `20250720203816_add_message_enhancements/` | Message improvements | Chat service | 2025-07-20 |
| `20250728015603_add_push_subscriptions/` | Push notifications | Notification service | 2025-07-28 |
| `20250728110333_add_policy_violations/` | Policy enforcement | Governance service | 2025-07-28 |
| `20250729203157_add_household_models/` | Household management | Household service | 2025-07-29 |
| `20250801000725_add_dashboard_id_to_files_folders/` | Dashboard integration | Dashboard service, drive service | 2025-08-01 |
| `20250801211531_add_ai_models/` | AI system models | AI services | 2025-08-01 |
| `20250804005004_add_billing_subscription_models/` | Billing system | Billing service | 2025-08-04 |
| `20250805011613_add_user_numbering_system/` | Block ID system | User service, location service | 2025-08-05 |
| `20250806102558_add_admin_portal_models/` | Admin portal | Admin service | 2025-08-06 |
| `20250806194249_add_admin_impersonation/` | Admin impersonation | Admin service | 2025-08-06 |
| `20250811234621_calendar_init/` | Calendar system | Calendar service | 2025-08-11 |
| `20250812011811_calendar_comments_attendees/` | Calendar features | Calendar service | 2025-08-12 |
| `20250812013431_reminder_dispatched_flag/` | Reminder system | Reminder service | 2025-08-12 |
| `20250812020517_event_recurrence/` | Event recurrence | Calendar service | 2025-08-12 |
| `20250813021204_add_business_module_installations/` | Module system | Module service | 2025-08-13 |
| `20250818190808_add_org_chart_permission_system/` | Org chart permissions | Org chart service, permission service | 2025-08-18 |
| `20250820204819_add_business_module_subscriptions/` | Module subscriptions | Module service, subscription service | 2025-08-20 |
| `20250821013209_add_enterprise_ai_digital_twin/` | Enterprise AI | AI services, business service | 2025-08-21 |
| `20250821192335_add_centralized_learning_tracking/` | Centralized learning | AI learning service | 2025-08-21 |
| `20250822015113_sync_database/` | Database synchronization | Database management | 2025-08-22 |

## 6. Tests Directory (`/tests`)

### End-to-End Tests
| File/Directory | Purpose | Connections | Contents |
|----------------|---------|-------------|----------|
| `e2e/auth.spec.js` | Authentication tests | Auth service, auth components | Auth test cases |
| `e2e/chat/` | Chat functionality tests | Chat service, chat components | Chat test cases |
| `e2e/drive/` | File management tests | Drive service, drive components | Drive test cases |

## 7. Memory Bank (`/memory-bank`) - 45+ Files

### Core Documentation
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `projectbrief.md` | Project overview and vision | All documentation, project context | 240 lines |
| `systemPatterns.md` | Architecture patterns | All documentation, technical context | 1485 lines |
| `techContext.md` | Technical context | All documentation, technical details | 931 lines |
| `activeContext.md` | Current development focus | All documentation, current status | 140 lines |
| `moduleSpecs.md` | Module specifications | Module system, marketplace | - |

### Module Context
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `chatProductContext.md` | Chat module context | Chat service, chat components | - |
| `driveProductContext.md` | Drive module context | Drive service, drive components | - |
| `dashboardProductContext.md` | Dashboard context | Dashboard service, dashboard components | - |
| `marketplaceProductContext.md` | Marketplace context | Module system, marketplace | - |

### Technical Documentation
| File | Purpose | Connections | Size |
|------|---------|-------------|------|
| `AI_CODING_STANDARDS.md` | AI development standards | AI services, AI development | - |
| `API_DOCUMENTATION.md` | API documentation | All API routes, API clients | - |
| `DEPLOYMENT.md` | Deployment procedures | Production deployment, CI/CD | - |

## File Connection Patterns

### 1. **Frontend → Backend Connections**
- **API Routes**: All frontend components connect to backend via `/api/*` endpoints
- **WebSocket**: Real-time features connect via Socket.io
- **Authentication**: NextAuth.js integrates with Express JWT system

### 2. **Shared Components → Frontend/Backend**
- **Type Definitions**: Shared types used across frontend and backend
- **UI Components**: Reusable components used in web app
- **Utilities**: Common utilities shared across the stack

### 3. **Database → All Layers**
- **Prisma Schema**: Defines data models for all layers
- **Migrations**: Track database evolution
- **Relationships**: Complex relationships between entities

### 4. **Service Layer Dependencies**
- **Dashboard Service** ← Widget Service
- **File Service** ← Permission Service
- **Chat Service** ← Socket Service
- **Notification Service** ← Email Service

### 5. **AI Service Dependencies**
- **Centralized Learning** ← Learning Engine
- **Pattern Discovery** ← Analytics Engine
- **Intelligence Engine** ← Context Engine
- **Autonomy Engine** ← Approval Engine

## Key Architectural Patterns

### 1. **Monorepo Architecture**
- Single repository with clear separation of concerns
- pnpm workspace for dependency management
- Shared code across frontend and backend

### 2. **Modular Architecture**
- Domain-based separation of business logic
- Plugin system for extensibility
- Dynamic module loading based on permissions

### 3. **AI-First Architecture**
- Multi-provider AI integration
- Centralized learning across all users
- Configurable autonomy controls

### 4. **Real-time Architecture**
- WebSocket infrastructure for live updates
- Event-driven architecture for scalability
- Efficient connection management

### 5. **Security Architecture**
- JWT-based authentication
- Role-based access control
- Comprehensive audit logging
- Privacy and compliance features

## Summary

The Block-on-Block codebase represents a comprehensive, enterprise-grade digital workspace platform with:

- **~500+ files** across frontend, backend, and shared components
- **40+ API routes** covering all major functionality
- **25+ services** implementing business logic
- **60+ shared components** for consistent UI
- **50+ database migrations** showing system evolution
- **100% TypeScript** implementation for type safety
- **AI-first architecture** with multi-provider support
- **Real-time capabilities** via WebSocket integration
- **Modular design** with marketplace support
- **Comprehensive security** and compliance features

The platform is built with modern technologies, follows best practices, and is designed for scalability and maintainability. The current focus is on achieving 100% type safety and preparing for production deployment.
