# File Hub Product Context

**Status:** Active product intent  
**Last verified:** 2026-09-04  
**Authority:** Product intent only  
**Architecture:** File Hub reference implementation review, Platform Standards, Global Trash, V_Link

---

## Purpose

**File Hub** is Vssyl’s first-party place for **files and folders**: upload, organize, preview, share, find, and recover content in personal and business contexts.

### Naming

| Layer | Name |
|------|------|
| **User-facing product** | **File Hub** |
| **Canonical module id** | `drive` |
| **Routes** | Typically under `/drive` (implementation detail owned by routing contracts) |

“Drive” may appear historically or in paths; product language and UI copy should prefer **File Hub**.

## User Value

- One contextual home for documents and files instead of fragmented downloads and chat-only attachments
- Clear ownership and sharing so people know what they own vs what was shared with them
- Recoverability through trash/restore without inventing a second trash product
- Reuse of the same files from Chat, To-Do, Calendar, and other applications

## Core Product Model

Durable user-facing concepts:

- **Files** and **folders**
- **Upload** and download/preview
- **Organization** (hierarchy, move, rename)
- **Owned vs shared** resources
- **Discoverability** where supported (search, recent, pinned/quick access, shared views)
- **Sharing** with permissions appropriate to the collaborator
- **Trash and restore** (soft delete)
- **Activity awareness** at a product level (that something changed), without defining activity architecture here

### Global Trash relationship

File Hub trash is a **module-scoped view of Global Trash**, not a separate permanent bin. Permanent deletion and recovery semantics are platform lifecycle behavior; File Hub presents the user’s file/folder recovery experience.

## Context Behavior

- **Personal:** Files belong to the user’s personal operating context (dashboard-scoped tenancy in implementation).
- **Business:** File Hub is available in business workspace as the business file surface for that context.
- Isolation across personal/business contexts is a product expectation; users should not see another context’s private files without authorized share/access.
- **Household:** Not currently defined as a product invariant for File Hub in this document.

## Key Relationships

- **Chat:** Share and attach File Hub files in conversations.
- **To-Do / Calendar:** Attach or link files to tasks and events where those products support it.
- **Dashboard / workspace:** Host File Hub as an application destination; optional home widgets may project File Hub, but the system of record remains File Hub.
- **AI / Digital Life Twin:** May read or act on files only through normal File Hub authority (same access the user has).
- **V_Link:** Files and folders can participate in cross-context relationships; membership in a link does not by itself grant file content access.
- **Marketplace module attachments:** Not established as a File Hub product promise in this document.

## Product Invariants

- Changing the underlying blob-storage provider must not change the user’s File Hub mental model (files, folders, share, trash).
- Soft-deleted File Hub items remain recoverable through trash until permanently removed per platform rules.
- Share and access decisions are contextual; File Hub must not present another tenant’s private content as the user’s own.
- File Hub is the user-facing file experience; it does not redefine platform storage as a competing product.

## Boundaries

File Hub does **not** own:

- Platform blob storage architecture (`storageService`, cloud buckets, and related delivery mechanics)
- Policy Engine internals
- Global Trash platform registration mechanics (beyond the product relationship above)
- Chat message transport or Calendar event models
- Marketplace packaging of arbitrary module artifacts (unless later defined as product)

## Open Product Decisions

1. Exact user-facing language for share permissions (e.g. view/edit/share vs read/write-style wording).
2. Household File Hub scope.
3. Which discoverability surfaces (recent / pinned / shared) are first-class product invariants vs convenience UI.

## Canonical References

- [`docs/VSSYL_SOURCE_OF_TRUTH.md`](../docs/VSSYL_SOURCE_OF_TRUTH.md) — File Hub (`drive`) naming
- [`docs/architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md`](../docs/architecture/audits/FILE_HUB_REFERENCE_IMPLEMENTATION_REVIEW.md) — reference module status
- [`docs/architecture/REFERENCE_MODULE_CATALOG.md`](../docs/architecture/REFERENCE_MODULE_CATALOG.md) — Reference Module #1
- [`docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md`](../docs/architecture/VSSYL_PLATFORM_STANDARDS_AND_MODULE_CONTRACT.md) — platform vs module storage
- Global Trash and V_Link docs via [`docs/architecture/VSSYL_ARCHITECTURE_INDEX.md`](../docs/architecture/VSSYL_ARCHITECTURE_INDEX.md)
