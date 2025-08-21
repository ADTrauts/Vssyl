# Shared UI Components

This directory contains **generic, reusable UI components** (buttons, cards, modals, etc.) that are shared across all apps in the monorepo.

- Only add components here if they are truly generic and have no app-specific business logic.
- Examples: Button, Card, Modal, Avatar, Table, Spinner, SidebarNavigation, etc.
- If you need to create a business-logic or context-aware component, use the app-specific components directory (e.g., `web/src/components/`).

**Keep this directory clean and focused on UI primitives!**

## Shared Components & Hooks

### NotificationList
- Displays a list of notifications for the current user
- Fetches from `/notifications` API, allows marking as read
- Requires JWT token prop
- Usable in sidebar, drawer, or page

### useUserSettings
- React hook for fetching, updating, and deleting user settings
- Uses `/settings` API endpoints
- Returns settings, loading, error, and update/delete actions
- Requires JWT token 