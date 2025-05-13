<!--
Update Rules for projectbrief.md
- Only updated for major changes in project scope, vision, or core requirements.
- All changes must be reviewed and approved before updating.
- Should always reflect the single source of truth for project goals.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Block on Block - Project Brief

## Overview
Block on Block is a next-generation Enterprise Resource Planner (ERP) and Life Resource Manager (LRM) platform that provides a modular, customizable dashboard experience for both individuals and businesses. The platform's core strength lies in its flexible ecosystem of installable modules (Blocks) that can be combined to create a personalized workspace.

## Core Requirements

### Dashboard Experience
- Centralized dashboard with module snippets
- Customizable layout and organization
- Real-time updates across modules
- Responsive design for all devices
- Drag-and-drop module arrangement
- Module state persistence

### Block Ecosystem
- Built-in proprietary modules
- Third-party module support
- Module installation/management
- Module versioning and updates
- Module marketplace
- Module dependencies handling
- Module isolation and security

### Core Modules
- Drive: File storage and sharing
- Chat: Communication and collaboration
- HR: Employee management
- Tasks: Project and task management
- Finance: Personal and business finance
- Commerce: Marketplace and transactions
- Calendar: Scheduling and events
- Notes: Document management
- Analytics: Data visualization
- Settings: Platform configuration

### Social & Commercial Features
- User profiles and connections
- Module sharing and recommendations
- Marketplace for third-party modules
- In-platform transactions
- Community features
- User ratings and reviews
- Module documentation
- Developer tools and SDK

### Technical Goals
1. Maintain modular architecture
2. Ensure secure module integration
3. Support third-party extensions
4. Provide robust API for developers
5. Maintain high performance with multiple modules
6. Ensure data isolation between modules
7. Support real-time collaboration
8. Enable seamless module updates

### Non-functional Requirements
1. Security: Protect user data and module integrity
2. Performance: Fast module loading and updates
3. Scalability: Handle growing number of modules and users
4. Reliability: Consistent module operation
5. Usability: Intuitive module management
6. Extensibility: Easy third-party integration
7. Maintainability: Clear module boundaries
8. Documentation: Comprehensive guides and examples

### OAuth 2.0 Provider
- Develop an OAuth 2.0 provider to allow third-party applications to authenticate users through our system.
- Enhance user experience by enabling Single Sign-On (SSO) capabilities.

### Dual-Sided Module Vision (Enterprise & Lifestyle) [2024-06]
- Every module (e.g., Chat, Drive, Analytics, Tasks, Calendar, etc.) must support both:
  - **Enterprise Side:** Advanced features for organizations, teams, business workflows, compliance, analytics, permissions, integrations, etc. Monetized via group/organization subscriptions.
  - **Lifestyle Side:** Features for individuals, families, or small groups—personal organization, private workspaces, collections, simple sharing, etc. Free for individual users.
- Individual users may purchase "extender" services in the future to unlock enterprise-like features à la carte (e.g., advanced analytics, team collaboration, enhanced security).
- Extender services will be available via the module marketplace for individuals, with a smooth upgrade path from lifestyle to enterprise features.
- Billing and licensing will support both enterprise subscriptions and individual purchases, with entitlements tracked at the user and org level. 