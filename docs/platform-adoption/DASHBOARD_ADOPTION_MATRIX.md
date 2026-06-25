# Dashboard Adoption Matrix

**Program:** Platform Capability Adoption — Wave 4  
**Date:** 2026-06-25  
**Status:** Post-Wave 4 baseline

**Legend:** **F** = Full · **P** = Partial · **M** = Missing · **N/A** = Not applicable

---

## 1. Widget participation matrix

| Widget | Kernel | Unified Search | AI Retrieval | Context Graph | Activity | Notifications | Platform Controller |
|--------|--------|----------------|--------------|---------------|----------|---------------|---------------------|
| **chat** | P | F (chat provider) | F | P | F (module) | F | P |
| **drive** | P | F | F | F | F | F | P |
| **calendar** | P | F | F | F | F | F | P |
| **todo** | P | F | F | F | F | F | P |
| **notebook** | P | F | F | P | P | P | P |
| **notifications** | M | M | M | M | M | F (surface) | P |
| **ai** | M | M | F (consumer) | P | M | M | P |
| **quickstats** | M | M | P (context route) | M | M | M | M |
| **quicknotes** | **F** | **F** | **F** | N/A | **F** | M | P |
| **bookmarks** | **F** | **F** | **F** | N/A | **F** | M | P |
| **activityfeed** | **F** | M | P | M | F (display) | M | M |
| **hr** | P | F | F | F | F | F | P |
| **scheduling** | P | F | F | F | F | F | P |

---

## 2. Wave 4 changes

| Widget | Before | After |
|--------|--------|-------|
| quicknotes | M search, M activity specificity | F via dashboard provider + `widget.quicknote.create` |
| bookmarks | M search, M activity specificity | F via dashboard provider + `widget.bookmark.create` |
| activityfeed | P kernel | F kernel reads (Wave 1) |
| Dashboard module | P search (names only) | F search (names + widget content) |

---

## 3. Manifest entities (dashboard module)

| Entity | supportsSearch |
|--------|----------------|
| dashboard | ✅ |
| quick_note | ✅ |
| bookmark | ✅ |
| widget | ❌ (chrome only) |

---

## 4. Remaining gaps

| Gap | Target |
|-----|--------|
| quickstats unified search | N/A — analytics aggregation |
| Widget deep-link UX in web client | Product polish (out of Wave 4 scope) |
| quicknotes/bookmarks V_Link | Not meaningful for local config |

**Last updated:** 2026-06-25
