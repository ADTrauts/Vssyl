<!--
Presence Product Context
See README for the modular context pattern.
-->

# Presence Product Context

**Description:**
This file documents the product context for user presence and activity tracking across modules.

## 1. Header & Purpose
- **Purpose:**  
  The Presence module provides real-time tracking and display of user online/away/offline status across threads and modules. It enables collaborative features, improves user awareness, and supports engagement analytics.
- **Cross-References:**  
  - [chatProductContext.md] (thread presence in chat)
  - [threadActivityProductContext.md] (activity tracking)
  - [systemPatterns.md] (real-time architecture, presence patterns)
  - [databaseContext.md] (User, ThreadPresence models)

## 2. Problem Space
- Users need to know who is online, away, or recently active in collaborative contexts (chat, threads, docs).
- Presence must be accurate, real-time, and scalable across modules.
- Presence data should be extensible for analytics, notifications, and engagement features.

## 3. User Experience Goals
- Clear, real-time presence indicators (avatars, tooltips, status badges).
- Accurate online/away/offline status and last seen info.
- Presence integrated into chat, threads, and other collaborative modules.
- Non-intrusive, accessible, and performant UI.

## 3a. Panel-Based Layout & Navigation
- **PresenceIndicator:** Shown in thread headers, chat panels, or user lists.
- **Panels:** Grouped by status (online, away, offline), with avatars and tooltips.
- **Integration:** Presence indicators embedded in chat, thread, and collaboration UIs.

## 4. Core Features & Requirements
- Real-time presence tracking via WebSocket or similar.
- Activity-based status updates (online, away after inactivity, offline on disconnect).
- Thread-specific and (future) global presence support.
- Presence data stored and retrievable via API.
- Extensible for new modules and analytics.

## 4a. Feature Checklist (Implementation Status)
| Feature                | Status      | Notes/Location (if implemented)      |
|------------------------|-------------|--------------------------------------|
| Real-Time Presence     | ✅          | usePresence, WebSocket, API          |
| PresenceIndicator UI   | ✅          | PresenceIndicator.tsx                |
| Thread-Specific Status | ✅          | usePresence, threadPresence API      |
| Activity Tracking      | ✅          | usePresence (mousemove, keydown, etc.)|
| Last Seen Info         | ✅          | PresenceIndicator, API               |
| Global Presence        | ❌ Planned  | Not yet implemented                  |
| Analytics Integration  | ❌ Planned  | Not yet implemented                  |

## 5. Integration & Compatibility
- Integrated with chat, threads, and collaboration modules.
- API and WebSocket support for real-time updates.
- Designed for extensibility to other modules and analytics.

## 5a. Data Model Reference
- See [databaseContext.md] and `prisma/schema.prisma` for User and ThreadPresence models.

## 6. Technical Constraints & Decisions
- Real-time updates via WebSocket.
- Presence status based on user activity and connection state.
- Thread-specific presence; global presence planned.
- Must be performant and scalable for large user bases.

## 7. Success Metrics
- Accuracy and timeliness of presence updates.
- User engagement with collaborative features.
- Performance and scalability under load.
- User satisfaction with presence awareness.

## 8. Design & UX References
- Slack, Google Docs, Microsoft Teams (presence indicators)
- [designPatterns.md], [systemPatterns.md]

## 8a. Global Components & Integration Points
- PresenceIndicator UI, usePresence hook, threadPresence API.

## 9. Testing & Quality
- Unit/integration tests for presence APIs and UI.
- E2E tests for real-time updates and activity tracking.
- Performance and scalability testing.

## 10. Future Considerations & Ideas
- Global presence tracking (across all modules).
- Presence-based notifications and analytics.
- Custom status messages (e.g., "In a meeting").
- Integration with external presence systems (calendar, SSO).

## 11. Update History & Ownership
- **2024-06:** Major update to reflect real-time, modular presence tracking.  
  Owner: [Your Name/Team]