<!--
Update Rules for databaseContext.md
- Only updated for schema changes, new models, or best practices.
- All changes should be atomic and well-documented.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- [Add major schema changes, new models, or best practices here with date.]

## Cross-References & Modular Context Pattern
- See [techContext.md](./techContext.md) for tech stack and database technology.
- See [systemPatterns.md](./systemPatterns.md) for architecture and data patterns.
- See [moduleSpecs.md](./moduleSpecs.md) for module-specific data requirements.
- See [chatProductContext.md](./chatProductContext.md), [driveProductContext.md](./driveProductContext.md), [dashboardProductContext.md](./dashboardProductContext.md), and [marketplaceProductContext.md](./marketplaceProductContext.md) for module-specific database context if needed.
- Each major proprietary module should have its own database context section/file as needed (see README for details on the modular context pattern).

---

# Database Context

## Schema File Location
⚠️ CRITICAL REQUIREMENT: The database schema file MUST be located at `/prisma/schema.prisma` (root level).
- DO NOT create schema files in other locations
- DO NOT create schema files in server/prisma/
- DO NOT create schema files in any other directories
- This is a critical architectural requirement to prevent schema conflicts and ensure proper database management

## Schema Management

### Modular Schema Organization ✅ **Implemented**
The Prisma schema has been reorganized from a single 3,000+ line file into a clean, modular structure for better maintainability.

**Structure:**
```
prisma/
├── schema.prisma          # Generated file (DO NOT EDIT)
├── modules/               # Source files (EDIT THESE)
│   ├── auth/             # User management & authentication
│   ├── chat/             # Communication & messaging
│   ├── business/         # Enterprise & organizational features
│   ├── ai/               # AI & machine learning systems
│   ├── billing/          # Subscriptions & revenue management
│   ├── calendar/         # Event & scheduling systems
│   ├── drive/            # File management & storage
│   └── admin/            # Security & system administration
└── README.md             # Complete development documentation
```

**Workflow:**
1. **Edit module files** in `prisma/modules/[module]/` (never edit schema.prisma directly)
2. **Run build script**: `npm run prisma:build`
3. **Generate client**: `npm run prisma:generate`
4. **Create migrations**: `npm run prisma:migrate`

**Available Commands:**
- `npm run prisma:build` - Build schema from modules
- `npm run prisma:generate` - Build + generate Prisma client
- `npm run prisma:migrate` - Build + run database migrations
- `npm run prisma:studio` - Build + open Prisma Studio

**Benefits:**
- ✅ Easier navigation - Find models quickly by domain
- ✅ Better team collaboration - Work on different modules simultaneously
- ✅ Cleaner git history - Changes isolated to specific domains
- ✅ Improved maintainability - Clear separation of concerns
- ✅ Zero breaking changes - All existing code continues to work

## Database Models

### Module Organization

#### **Auth Module** (`modules/auth/user.prisma`)
- User management, authentication tokens, preferences
- Privacy & consent management (GDPR compliance)
- Location system for user numbering (Block ID)
- Notification and push subscription models

#### **Chat Module** (`modules/chat/conversations.prisma`)
- Conversations, messages, threads
- File references, reactions, read receipts
- Participant management and roles

#### **Business Module** (`modules/business/`)
- **business.prisma**: Company profiles, members, invitations
- **dashboard.prisma**: Business dashboards and widgets
- **front-page.prisma**: Front page customization
- **modules.prisma**: Business module installations
- **org-chart.prisma**: Organizational structure and permissions
- **household.prisma**: Household management with role-based access

#### **AI Module** (`modules/ai/`)
- **ai-models.prisma**: AI personality profiles, autonomy settings
- **analytics.prisma**: Analytics platform, predictive intelligence
- **enterprise-ai.prisma**: Enterprise AI digital twins
- **module-context-registry.prisma**: AI context for modules

#### **Billing Module** (`modules/billing/subscriptions.prisma`)
- Subscriptions, usage tracking, invoices
- Module subscriptions and developer revenue
- Platform revenue and payments

#### **Calendar Module** (`modules/calendar/calendars.prisma`)
- Multi-context calendars (personal, business, household)
- Events, attendees, reminders, attachments
- Calendar memberships and connections

#### **Drive Module** (`modules/drive/files.prisma`)
- File management, folders, permissions
- Activity tracking, sharing controls
- File versioning and metadata

#### **Admin Module** (`modules/admin/`)
- **admin-portal.prisma**: Content moderation, impersonation
- **security.prisma**: Security events, audit logs
- **support.prisma**: Support tickets, knowledge base

## Best Practices
1. Always use the root schema file for changes
2. Keep schema changes atomic and well-documented
3. Test migrations before applying to production
4. Maintain backward compatibility when possible
5. Document any breaking changes in the schema 

---

## Archive (Deprecated Models / Schema Patterns)
- [Add deprecated or superseded models/schema patterns here, with date and summary.] 