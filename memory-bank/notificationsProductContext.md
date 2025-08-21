<!--
Notifications Product Context
See README for the modular context pattern.
-->

# Notifications Product Context

**Description:**
This file documents the product context for all notification systems, including in-app, email, and push notifications.

## 1. Header & Purpose
- **Purpose:**  
  The Notifications module provides a centralized, extensible system for delivering notifications across all modules and channels (in-app, toast, push, email). It ensures users receive timely, relevant, and actionable information, while giving them control over notification preferences and delivery methods.
- **Cross-References:**  
  - [systemPatterns.md] (notification architecture, event routing)
  - [databaseContext.md] (notification models, delivery logs)
  - [chatProductContext.md], [driveProductContext.md], etc. (modules that generate notifications)

## 2. Problem Space
- Previous notification handling was inconsistent and decentralized (toasts, alerts, ad hoc APIs).
- Users need a single, reliable place to review all notifications.
- Modules should not need to know how to deliver notifications—just what to notify.
- Users want control over which notifications they receive and how.

## 3. User Experience Goals
- Centralized notification center UI (bell icon, sidebar, or dropdown).
- Real-time, persistent, and actionable in-app notifications.
- Toasts for transient feedback only.
- Push and email notifications for critical or out-of-app events.
- User-configurable notification preferences.
- Consistent, accessible, and non-intrusive notification delivery.

## 3a. Panel-Based Layout & Navigation
- **Notification Center:** Accessible from anywhere (bell icon, sidebar, or dropdown).
- **Panels:** List of unread and recent notifications, with actions (mark as read, delete, link to context).
- **Badges:** Unread counts on icons or tabs.
- **Settings Panel:** User preferences for notification types and delivery channels.

## 4. Core Features & Requirements
- Centralized notification service (backend) for all modules.
- Modular delivery: in-app, toast, push, email.
- Real-time delivery (WebSocket, SSE, etc.).
- Persistent notification storage and state (read/unread, deleted).
- User preferences for notification types and channels.
- Audit log of notification events and deliveries.
- Extensible for new modules and notification types.

## 4a. Feature Checklist (Implementation Status)
| Feature                        | Status      | Notes/Location (if implemented)      |
|---------------------------------|-------------|--------------------------------------|
| Central Notification Service    | ✅ Complete | Full CRUD API with filtering/pagination |
| In-App Notification Center      | ✅ Complete | Full UI with real-time updates       |
| Toasts for Feedback             | ✅          | sonner, useToast, ad hoc             |
| Push Notifications              | ✅ Complete  | Web Push API with service worker and VAPID |
| Email Notifications             | ✅ Complete  | SMTP integration with HTML templates |
| User Preferences                | ✅ Complete | Full settings page with channel management |
| Real-Time Delivery              | ✅ Complete | WebSocket integration with live updates |
| Persistent Storage/State        | ✅ Complete | Database models with comprehensive API |
| Module Integration              | ✅ Complete | Chat, Drive, Business modules integrated |
| Audit Log                       | ⚠️ Partial  | Basic logging, advanced features pending |

## 5. Integration & Compatibility
- All modules send notification events to the central service.
- Notification center routes and delivers notifications based on user preferences and context.
- Modular, extensible for new channels and notification types.

## 5a. Data Model Reference
- See [databaseContext.md] and `prisma/schema.prisma` for notification models and delivery logs.
- Notification, DeliveryLog, UserPreference models.

## 6. Technical Constraints & Decisions
- All notification creation, storage, and delivery must be centralized.
- Toasts are for transient feedback only, not persistent or critical information.
- Real-time delivery via WebSocket or similar.
- Push/email require user opt-in and backend integration.
- All notification code must be modular, testable, and extensible.

## 7. Success Metrics
- User engagement with notification center.
- Delivery success rate (in-app, push, email).
- User satisfaction with notification relevance and control.
- No missed or duplicate notifications.
- Performance and reliability of notification delivery.

## 8. Design & UX References
- Slack, Notion, GitHub (notification center UI)
- [designPatterns.md], [systemPatterns.md]

## 8a. Global Components & Integration Points
- NotificationCenter UI, useNotifications hook, toast system, push/email backend integration.

## 9. Testing & Quality
- Unit/integration tests for notification APIs and UI.
- E2E tests for notification flows.
- Delivery and read/unread state validation.
- Performance and reliability testing.

## 10. Future Considerations & Ideas
- AI-driven notification prioritization.
- Third-party notification integrations (SMS, external services).

## [2024-07] Complete Notification System Implementation

### Push Notifications
- **PushNotificationService**: Complete service with VAPID authentication
- **Database Integration**: PushSubscription model with user relationships
- **API Endpoints**: Subscription management, VAPID key retrieval, testing
- **Module Integration**: Automatic push delivery with notification creation

### Email Notifications
- **EmailNotificationService**: Complete service with SMTP integration
- **Database Integration**: Email preferences stored in UserPreference model
- **API Endpoints**: Email service status, preferences management, testing
- **Module Integration**: Automatic email delivery with notification creation

### Frontend Integration
- **PushNotificationService**: Frontend service for subscription management
- **EmailNotificationService**: Frontend service for email preferences
- **Service Worker**: Background notification handling with actions
- **Settings UI**: Complete notification settings components
- **Browser Support**: Graceful fallbacks for unsupported browsers

### Key Features
- **VAPID Authentication**: Secure push notification delivery
- **SMTP Integration**: Reliable email delivery with HTML templates
- **Service Worker**: Background notification handling and actions
- **Notification Actions**: View, mark as read, and navigation
- **User Preferences**: Granular control over notification channels
- **Automatic Cleanup**: Failed subscription removal
- **Testing Infrastructure**: Comprehensive testing scripts
- **Error Handling**: Graceful fallbacks and user feedback

### Technical Implementation
- **Web Push API**: Standard-compliant push notification delivery
- **SMTP Email**: Professional email delivery with templates
- **Real-time Integration**: All notifications sent via multiple channels
- **User Control**: Enable/disable notifications with test functionality
- **Cross-browser Support**: Chrome, Firefox, Safari, Edge compatibility

### Backend Foundation
- **PushNotificationService**: Complete service with VAPID authentication
- **Database Integration**: PushSubscription model with user relationships
- **API Endpoints**: Subscription management, VAPID key retrieval, testing
- **Module Integration**: Automatic push delivery with notification creation

### Frontend Integration
- **PushNotificationService**: Frontend service for subscription management
- **Service Worker**: Background notification handling with actions
- **Settings UI**: Complete push notification settings component
- **Browser Support**: Graceful fallbacks for unsupported browsers

### Key Features
- **VAPID Authentication**: Secure push notification delivery
- **Service Worker**: Background notification handling and actions
- **Notification Actions**: View, mark as read, and navigation
- **Automatic Cleanup**: Failed subscription removal
- **Testing Infrastructure**: Comprehensive testing scripts
- **Error Handling**: Graceful fallbacks and user feedback

### Technical Implementation
- **Web Push API**: Standard-compliant push notification delivery
- **Real-time Integration**: Push notifications sent with every notification creation
- **User Control**: Enable/disable push notifications with test functionality
- **Cross-browser Support**: Chrome, Firefox, Safari, Edge compatibility
- Advanced user preference management.
- Notification digests and summaries.

## 11. Update History & Ownership
- **2024-06:** Major update to reflect centralized, modular notification architecture.  
  Owner: [Your Name/Team]

## [2024-06] Notification Infrastructure Update

- Persistent notification system scaffolded: Prisma models (Notification, NotificationDelivery), API endpoints (`/notifications`, mark as read), and NotificationList React component (shared UI library)
- All endpoints require JWT authentication
- Modules can trigger notifications by creating Notification records via the API or service
- NotificationList is designed for use in sidebar, drawer, or page contexts
- System is extensible for future channels (push, email) and user preferences

## [2024-07] Notification System Complete Implementation

- **Backend Foundation**: Complete CRUD operations with advanced filtering, pagination, and statistics
- **Module Integration**: Chat (messages, mentions, reactions), Drive (file sharing, permissions), Business (invitations, members)
- **Frontend Integration**: Real API calls with graceful error handling and fallbacks
- **UI Components**: Notification center, badge component, settings page with full functionality
- **Testing**: Sample data, comprehensive testing scripts, and validation
- **Real-time Features**: WebSocket integration for live updates and notification delivery
- **Advanced Features**: Bulk operations, user preferences, notification analytics