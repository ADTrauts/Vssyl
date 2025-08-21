<!--
Update Rules for productContext.md
- Only updated for major changes in product context, user experience goals, or core problems solved.
- All changes must be reviewed and approved before updating.
- Should always reflect the single source of truth for product context and UX vision.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Product Context

## Cross-References & Modular Context Pattern
- See [projectbrief.md](./projectbrief.md) for project vision, requirements, and scope.
- See [systemPatterns.md](./systemPatterns.md) for architecture and technical decisions.
- See [businessProfileManagement.md](./businessProfileManagement.md) for business management context and requirements.
- See [progress.md](./progress.md) and [activeContext.md](./activeContext.md) for current status and next steps.
- See [calendarProductContext.md](./calendarProductContext.md) for the Calendar module product context (tab-bound calendars that mirror tab names, auto-provisioned per Personal/Business/Household contexts).
  - Calendar overlays default to All Tabs; Current Tab toggle available; household child protections enforced (Teen/Child read-only)

---

## Product Purpose
Block on Block is a next-generation modular ERP and Life Resource Manager platform. It empowers individuals, teams, and organizations to build personalized, context-aware workspaces by combining proprietary and third-party modules (Blocks) in a unified dashboard experience.

### Problems Solved
- Fragmented workflows across multiple SaaS tools
- Lack of context-aware, role-based access and collaboration
- Siloed data and poor integration between business and personal tools
- Inflexible, non-customizable dashboards in legacy ERP/LRM systems
- Poor user experience in multi-context (personal, business, educational) environments

## User Experience Goals
- **Seamless Context Switching**: Effortlessly move between personal, business, and educational workspaces
- **Modular Customization**: Add, remove, and arrange modules to fit unique workflows
- **Unified Navigation**: Consistent, context-aware navigation across all modules
- **Role-Based Access**: Clear, secure permissions for every context and module
- **Real-Time Collaboration**: Instant updates and presence across all modules
- **Professional & Personal Balance**: Support both enterprise and lifestyle use cases in a single platform
- **Accessible & Responsive**: Intuitive UI for all devices and user types

## Modular Context Pattern
- Each major module (Chat, Drive, Dashboard, Marketplace, etc.) has its own product context file
- All modules support both enterprise and lifestyle use cases, with feature flags and permission checks
- Context switching and role-based access are core to the user experience
- Product context files are cross-referenced for clarity and maintainability

## Current Product Vision (2024-12)
- Multi-context dashboard system (personal, business, educational)
- Modular, extensible architecture for rapid feature development
- Robust business profile management and team collaboration
- Marketplace for third-party and proprietary modules
- Real-time analytics, notifications, and presence
- **Data Classification & Governance**: Comprehensive data sensitivity management with automated classification rules
- **Audit & Privacy Management**: Complete audit trail with data masking and privacy controls
- **Visual Classification System**: Interactive classification badges throughout the UI
- Secure, scalable, and user-friendly foundation for future growth

## Current Core Features

### Data Management & Governance
- **Data Classification**: Automatic and manual classification of files, messages, and content
- **Classification Rules**: Regex-based automated classification with priority processing
- **Classification Templates**: Pre-defined classification settings for quick application
- **Visual Indicators**: Color-coded classification badges with expiration warnings
- **Bulk Operations**: Multi-item classification with success/failure tracking

### Audit & Privacy
- **Audit Trail**: Comprehensive user activity logging with data masking
- **Privacy Controls**: Granular privacy settings and consent management
- **Data Export**: GDPR-compliant data export and deletion requests
- **Data Masking**: Automatic masking of sensitive information (IP addresses, passwords)
- **Retention Policies**: Automated data retention and cleanup

### User Experience
- **Context Switching**: Seamless movement between personal, business, and educational contexts
- **Role-Based Access**: Clear permissions for every context and module
- **Real-Time Updates**: Instant updates and presence across all modules
- **Professional & Personal Balance**: Support for both enterprise and lifestyle use cases
- **Accessible & Responsive**: Intuitive UI for all devices and user types

### Household Module

**Purpose**: Coordinate family and household activities with shared resources and role-based access control.

**Key Features**:
- **Family Coordination**: Shared calendars, grocery lists, bill management, and household tasks
- **Role-Based Access**: Owner, Admin, Adult, Teen, Child, and Temporary Guest roles with appropriate permissions
- **Member Management**: Invite family members, assign roles, and manage household membership
- **Household Context**: Household-aware widgets and features across all platform modules
- **Two-Step Creation**: Streamlined household setup with optional member invitation

**User Benefits**:
- **Centralized Organization**: All family coordination in one platform
- **Age-Appropriate Access**: Teen and Child roles with limited permissions
- **Guest Management**: Temporary access for babysitters, relatives, or roommates
- **Seamless Integration**: Household context enhances all existing modules

**Target Users**: Families, multi-generational households, roommate situations, and extended family groups

### Technical Foundation
- **API Proxy**: Consistent API routing with automatic authentication
- **Error Handling**: Centralized error handling with proper user feedback
- **Session Management**: Automatic token refresh and session persistence
- **Data Protection**: Built-in data masking and privacy controls

---

## User Experience & Business Value

### **Block ID System - User Experience** 🆕
**Status**: ✅ Implemented

#### **User Journey & Experience**

**Registration Flow:**
1. **User Registration**: User creates account with email/password
2. **Automatic Location Detection**: System detects user's location via IP address
3. **Block ID Generation**: System generates unique Block ID (e.g., `001-001-001-0000001`)
4. **Success Display**: User sees their Block ID prominently displayed
5. **Copy Functionality**: User can copy Block ID to clipboard with one click

**Daily Usage:**
1. **Avatar Menu**: Block ID prominently displayed in user's avatar menu
2. **Settings Page**: Dedicated page showing Block ID and location information
3. **Security Messaging**: Clear communication about Block ID immutability
4. **Cross-Module Integration**: Block ID used for secure identification across all features

**Business Connections:**
1. **Business Invitations**: Block ID included in invitation emails for secure identification
2. **Connection Requests**: Block ID in notifications for cross-module security
3. **Audit Trail**: Complete history of all Block ID usage for compliance

#### **Business Value & Benefits**

**For Users:**
- **Permanent Identity**: Immutable Block ID serves as permanent digital identity
- **Secure Identification**: Block ID used for secure identification across all platform features
- **Location Transparency**: Users can see their detected location and when it was determined
- **Cross-Module Security**: Block ID ensures correct user identification in business connections
- **Compliance**: Complete audit trail for all Block ID usage and location changes

**For Administrators:**
- **User Management**: Comprehensive admin tools for Block ID management
- **Location Updates**: Admin-only location changes with proper audit trails
- **Security Monitoring**: Complete audit logs for Block ID usage and security
- **Data Integrity**: Block ID format validation and data integrity checks
- **Compliance**: Full audit trail for regulatory compliance requirements

**For Platform:**
- **Global Scalability**: 9.9 quintillion capacity with 3-digit codes
- **Atomic Operations**: Database transactions prevent race conditions
- **Cross-Module Integration**: Block ID used for secure identification across all features
- **Audit Compliance**: Complete audit trail for security and compliance requirements
- **Immutable Design**: Block ID cannot be changed by users, ensuring data integrity

#### **Key Features & Capabilities**

**Block ID Format:**
- **Structure**: `[CountryCode]-[RegionCode]-[TownCode]-[UserSerial]`
- **Example**: `001-001-001-0000001` (USA-NY-Manhattan-User #1)
- **Capacity**: 9.9 quintillion users globally
- **Validation**: Strict 3-3-3-7 format with component parsing

**Location Detection:**
- **Automatic**: IP-based geolocation using ipapi.co
- **Fallback**: Default location assignment when geolocation fails
- **Transparency**: Users can see their detected location and timestamp
- **Admin Control**: Location changes require admin approval with audit trails

**Security Features:**
- **Immutable Design**: Block ID cannot be changed by users
- **Admin Oversight**: Location changes require admin approval
- **Audit Trail**: Complete history of all Block ID usage
- **Cross-Module Security**: Block ID verification for secure identification

**Cross-Module Integration:**
- **Business Invitations**: Block ID included in invitation emails
- **Connection Requests**: Block ID in notification data
- **Audit Logging**: Complete trail of Block ID usage across modules
- **Secure Identification**: Block ID used for user identification across platform

#### **User Interface Components**

**Avatar Menu Integration:**
- Block ID prominently displayed below user email
- Copy-to-clipboard functionality with feedback
- Clear visual hierarchy and accessibility

**Settings Page:**
- Dedicated page for Block ID and location information
- Security messaging about Block ID immutability
- Location detection timestamp and details
- Copy functionality for Block ID

**Registration Success:**
- Block ID display after successful registration
- Clear explanation of Block ID purpose
- Copy functionality for immediate use

**Admin Panel:**
- User management with Block ID display
- Location update capabilities with audit trails
- Audit log viewing for security monitoring
- Block ID validation and data integrity tools

### **Payment & Billing System - User Experience**

---

> For detailed requirements, see [projectbrief.md]. For technical patterns, see [systemPatterns.md]. For business management, see [businessProfileManagement.md]. For current status, see [activeContext.md] and [progress.md]. 