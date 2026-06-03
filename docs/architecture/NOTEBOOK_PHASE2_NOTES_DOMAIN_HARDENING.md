# Notebook Phase 2 — Notes/Page Domain Hardening

**Date:** 2026-06-01  
**Status:** Complete  

## Summary

Notebook remains the user-facing module. **Notes** owns storage (`Note` model) and backend services. Product label **Page** appears in activity (`targetType: page`) and platform entity registry.

## Services (`server/src/services/notes/`)

| Service | Responsibility |
|---------|----------------|
| `notesPageService` | create, update |
| `notesVisibilityService` | list, get, AI recent/pinned reads |
| `notesPermissionService` | owner/shared/dashboard scope |
| `notesPolicyDual` | Policy Engine dual enforcement |
| `notesTrashService` | soft trash, restore, permanent delete, global trash list/empty |
| `notesShareService` | share, revoke, list shares |
| `notesNotificationService` | `notes_shared` only |
| `notesActivityService` | module activity (`moduleId: notes`, `targetType: page`) |
| `notesDomainEventService` | `notes.page.*` domain events |

## Global Trash

- Handler: `moduleId: notes`, `moduleName: Notebook Pages`, `supportedTypes: ['note']`
- `trashController` delegates list/restore/permanent-delete/empty for notes pages
- User DELETE `/api/notes/:id` → `notesTrashService.softTrashPage` (unchanged route contract)

## Manifest truth

- `notes` built-in manifest: `trash: true`, entity `page`, notification `notes_shared`
- `notebook` manifest: facade only (no trash claim)

## Deferred

- `notesFolderService` / folder controller extraction
- Notebook Trash UI in shell (uses placeholder copy until Phase 3+)
- `notebookLink`, schema, certification
