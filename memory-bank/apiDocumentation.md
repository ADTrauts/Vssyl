<!--
Update Rules for apiDocumentation.md
- Updated when API endpoints, contracts, or integration notes change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- [Add major API changes, new endpoints, or integration notes here with date.]

## Cross-References & Modular Context Pattern
- See [systemPatterns.md](./systemPatterns.md) for API and integration patterns.
- See [moduleSpecs.md](./moduleSpecs.md) for module-specific API requirements.
- See [techContext.md](./techContext.md) for tech stack and API technology.
- See [chatProductContext.md](./chatProductContext.md), [driveProductContext.md](./driveProductContext.md), [dashboardProductContext.md](./dashboardProductContext.md), and [marketplaceProductContext.md](./marketplaceProductContext.md) for module-specific API docs if needed.
- Each major proprietary module should have its own API documentation section/file as needed (see README for details on the modular context pattern).

---

# API Documentation

## API Overview
Block on Block exposes a RESTful API for all core platform features, including file management, user authentication, chat, and analytics. The API is designed for both internal (frontend/backend) and external (third-party) integration, with a focus on security, consistency, and extensibility.

## Endpoints (Sample Structure)
> This is a sample of key endpoints. For the full, up-to-date contract, see the OpenAPI/Swagger documentation (to be generated as the API evolves).
- **Authentication**
  - `POST /api/auth/login` — User login
  - `POST /api/auth/logout` — User logout
  - `POST /api/auth/register` — User registration
- **Files**
  - `GET /api/files` — List files
  - `POST /api/files` — Upload file
  - `GET /api/files/:id` — Get file metadata
  - `DELETE /api/files/:id` — Delete file
- **Chat**
  - `GET /api/chat/threads` — List chat threads
  - `POST /api/chat/threads` — Create thread
  - `GET /api/chat/threads/:id/messages` — List messages in a thread

## Integration Notes
- All endpoints require authentication via JWT in the `Authorization` header unless otherwise noted.
- Responses follow a consistent JSON structure: `{ success: boolean, data: ..., error?: string }`
- For full request/response schemas, see the OpenAPI/Swagger documentation (to be generated as the API evolves).
- Frontend should use the provided API client library for type safety and error handling.

## API Design Patterns & Features
- All endpoints enforce role-based access control (RBAC) and permissions.
- File sharing supports public access via secure, expiring links.
- Real-time features are available via WebSocket endpoints for chat, analytics, and notifications.
- List endpoints support pagination, filtering, and sorting.
- All responses use a standardized JSON format with clear error handling.
- The API is versioned (e.g., /api/v1/...) for future compatibility.
- Rate limiting and security headers are enforced on sensitive endpoints.
- The API is extensible for third-party modules and integrations.
- OpenAPI/Swagger documentation is provided for all endpoints.

---

## Archive (Deprecated Endpoints / API Patterns)
- [Add deprecated or superseded endpoints/API patterns here, with date and summary.]

## [2024-06] New API Endpoints

### Notifications
- `GET /notifications` — List current user's notifications (JWT required)
- `POST /notifications` — Create a notification for current user (JWT required)
- `POST /notifications/:id/read` — Mark notification as read (JWT required)

### User Settings
- `GET /settings` — Get all user settings as key-value pairs (JWT required)
- `PUT /settings` — Set/update a user setting (`{ key, value }` in body, JWT required)
- `DELETE /settings/:key` — Remove a user setting (JWT required)

### Admin
- `GET /admin/secret` — Admin-only test endpoint (JWT + ADMIN role required)

All endpoints return JSON. See backend code for detailed response structure. 