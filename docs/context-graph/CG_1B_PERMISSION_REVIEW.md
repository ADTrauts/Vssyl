# CG-1B — Permission Review

**Program:** Vssyl Context Graph  
**Phase:** 1B  
**Date:** 2026-06-19

---

## Review conclusion

**No permission leaks discovered.** All P1 adapters enforce module access services before returning nodes. Denied nodes are omitted from bundles. No permission inheritance.

---

## P1 enforcement points

| Adapter | Access service | PE action | Membership gate |
|---------|----------------|-----------|-----------------|
| Notes | `notesVlinkAccessService` | `NOTES_PAGE_READ` | Owner or share |
| Notebook page | `notesVlinkAccessService` (same Note SoR) | `NOTES_PAGE_READ` | Owner or share |
| Notebook folder | Inline creator check on `NoteFolder` | — | Creator only |
| Chat | `chatVlinkAccessService` | `CHAT_CONVERSATION_READ` | Active participant |
| Place listing | `placeVlinkAccessService` | `PLACE_LISTING_READ` | Public or admin |
| Place meeting | `placeVlinkAccessService` | `PLACE_MEETING_READ` | Creator/invite/calendar |

---

## Traversal permission model

1. **V_Link hop** — `assertVLinkAccess` on container
2. **Attachment hop** — adapter `getNode` → module access service
3. **NotebookLink hop** — `listPageLinks` requires page read; targets hydrated only if accessible
4. **Bundle assembly** — `shouldOmitNode` for `denied` / `canRead: false`

**No inheritance:** child node access evaluated independently.

---

## Ownership review

| Module | SoR | Adapter writes? | Violation? |
|--------|-----|-----------------|------------|
| Notes | `Note` table | No | No |
| Notebook | `NotebookLink`, `NoteFolder` | No | No |
| Chat | `Conversation` | No | No |
| Place | `businessPlaceListing`, `placeMeetingPlace` | No | No |

Notes and Notebook both read `Note` for page content — **descriptor disambiguation** via `moduleId` (`notes:note` vs `notebook:notebook_page`), not ownership transfer.

---

## Place inclusion rationale

Place included because:

- `placeVlinkAccessService` already canonical for V_Link resolution
- PE actions defined (`PLACE_LISTING_READ`, `PLACE_MEETING_READ`)
- Business ownership clear (Place module SoR)

`place_review` **excluded** — no entity model; would require synthetic adapter stub.

---

## Test coverage

| Test | Permission behavior |
|------|---------------------|
| `p1Adapters.test.ts` — chat restricted | `access: 'restricted'` when not allowed |
| `crossAdapterTraversal.test.ts` — denied chat | Node omitted from bundle |
| `notesVlinkAccessService.test.ts` | Deny non-readable note |
| `permissionResolver.test.ts` | Omit denied (1A regression) |

CG-F-007 (full ≥10 integration matrix) remains **partial** — 4 cross-adapter permission scenarios added.

---

## Required question answers (permission subset)

| Question | Answer |
|----------|--------|
| Permission leaks? | **None discovered** |
| Denied nodes omitted? | **Yes** |
| V_Link authoritative? | **Yes** |
| Synthetic edges? | **No** |

**Last updated:** 2026-06-19
