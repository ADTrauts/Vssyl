# Module Platform Participation Review

**Program:** Platform Capability Adoption — Phase 0A  
**Date:** 2026-06-25  
**Status:** Per-module adoption review

This document provides a **module-by-module participation narrative** from the user's perspective. For matrix cells see [PLATFORM_ADOPTION_MATRIX.md](./PLATFORM_ADOPTION_MATRIX.md). For scores see [PLATFORM_ADOPTION_SCORECARD.md](./PLATFORM_ADOPTION_SCORECARD.md).

---

## 1. Drive (File Hub) — Level A

**User story:** "I search for a file, ask AI about it, see it in my activity feed, link it to a calendar event, and get notified when someone shares it."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Platform Kernel | Partial | Actions appear in-module; feed may lag due to ACT-R1 |
| Unified Search | **Full** | Files and folders appear in omnibar |
| AI Retrieval | Partial | AI lists recent files; cannot query-search all files yet |
| Context Graph | **Full** | Files link via V_Link; graph hydration works |
| Policy Engine | **Full** | Sharing respects permissions consistently |
| Activity | **Full** | Upload, share, trash emit normalized events |
| Notifications | **Full** | Share and trash notifications delivered |
| Realtime | **Full** | Collaborators see changes live |
| V_Link | **Full** | Reference implementation for cross-module links |

**Highest-value gap:** AI query-driven file discovery (retrieval search delegate).

**Reference role:** Copy adoption patterns from File Hub for BO modules.

---

## 2. Chat — Level B

**User story:** "I search conversations, get mention notifications, see messages in realtime, and AI knows my recent chats."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Platform Kernel | Partial | Messages may duplicate in feed via legacy `Message` reads |
| Unified Search | **Full** | Conversations searchable globally |
| AI Retrieval | **Full** | Recent + unread providers |
| Context Graph | Partial | Conversations linked; threads not in graph |
| Realtime | **Full** | Core chat experience |
| Notifications | **Full** | Mentions, messages, reactions |

**Highest-value gap:** Thread nodes in Context Graph; kernel-normalized feed reads.

---

## 3. Calendar — Level B

**User story:** "I search events, get reminders, AI knows today's schedule, and events link to files and tasks."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Full** | Events in global search |
| AI Retrieval | **Full** | Today + upcoming providers |
| Context Graph | **Full** | Event entities in graph |
| Realtime | **Full** | Event updates propagate |
| V_Link | **Full** | Events attach to V_Link containers |

**Highest-value gap:** Retrieval search delegate for "find meeting about…" queries.

---

## 4. Todo — Level B

**User story:** "I search tasks, assign work, link tasks to calendar and files, AI prioritizes my work."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Full** | Tasks in global search |
| AI Retrieval | Partial | List providers (overdue, upcoming) — not query search |
| Context Graph | **Full** | Task nodes + dependency edges |
| V_Link | **Full** | Task attachments |
| Notifications | **Full** | Assignment notifications |

**Highest-value gap:** Query-driven task discovery in AI; realtime depth.

---

## 5. Place — Level B

**User story:** "I discover local businesses, connect with merchants, attend meetings, and AI suggests relevant places."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Full** | Listings searchable |
| AI Retrieval | Partial | 5 providers; grounding partial |
| Context Graph | **Full** | Listing + meeting adapters |
| Activity | **Full** | Rich activity emission (27 sites) |
| Notifications | **Full** | Meeting + connection types |

**Highest-value gap:** AI retrieval grounding quality; meeting search (entities mark `supportsSearch: false`).

---

## 6. Notebook — Level C

**User story:** "I run meetings with linked pages and tasks; everything should appear in search and AI context."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Missing** | Pages found only via notes provider alias |
| Context Graph | Partial | NotebookLink edges exist; no graph adapter |
| Manifest | Partial | Missing trash, search, realtime, notifications flags |
| AI Integration | **Full** | Composition orchestration |
| V_Link | Partial | Operational links ≠ V_Link manifest |

**Highest-value gap:** Dedicated search provider; manifest reconciliation; graph adapter registration.

---

## 7. Notes (legacy) — Level C

**User story:** "Notes still power Notebook pages behind the scenes."

| Status | Disabled in `coreModuleRegistry`; UI routes to Notebook |
| Participation | Search via notes provider; activity + PE on write paths |
| Gap | No `notesVlinkAccessService` (CG-F-002); should merge adoption into Notebook program |

---

## 8. Dashboard — Level C

**User story:** "My home screen shows widgets that reflect my whole workspace."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | Partial | Widget search provider exists |
| AI Integration | Partial | Overview + quick-stats providers |
| Widgets | **Siloed** | Quick Stats, Quick Notes, Bookmarks, Activity Feed not platform-native |
| Composition | **Full** | Routes to modules correctly |

**Highest-value gap:** Widget adoption package (Wave 4) — users experience Dashboard as the platform hub but widgets don't participate in intelligence.

---

## 9. HR — Level C

**User story:** "As a manager I need to find employee records, time-off requests, and onboarding status from anywhere."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Missing** | Must navigate to HR module |
| AI Retrieval | Partial | AI knows headcount/time-off via direct reads |
| Context Graph | **Full** | 4 HR entity types on V_Link path |
| Activity | **Full** | `hrActivityService` on write paths |
| Notifications | **Full** | 12 HR notification types |
| V_Link | **Full** | HR entity linking works |

**Highest-value gap:** Search provider for employees, time-off, onboarding — **highest BO user pain**.

---

## 10. Scheduling — Level C

**User story:** "I need to find my shifts and swap requests without opening Scheduling."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Missing** | Manifest explicitly `supportsSearch: false` |
| AI Retrieval | Partial | Overview provider only |
| Activity + Events | **Full** | Publish path emits activity + domain events |
| Notifications | **Full** | Schedule publish, swap, open shift |
| Realtime | Partial | Publish fan-out; not continuous |

**Highest-value gap:** Search provider for shifts and schedules.

---

## 11. Workforce Communications — Level C

**User story:** "I need to find announcements and policy acknowledgements across the business."

| Capability | Participation | User-visible effect |
|------------|---------------|---------------------|
| Unified Search | **Missing** | No provider |
| AI Retrieval | Partial | Overview + reach providers |
| Activity | **Full** | Workforce activity service |
| V_Link | **Full** | Communication entities linkable |

**Highest-value gap:** Search provider for communications and campaigns.

---

## 12. V_Link — Level B

**User story:** "I link anything to anything — files, events, tasks, people."

| Role | Platform substrate, not data SoR |
| Participation | Search **Full**; Context Graph **Full** (P0); AI pipeline **Full** |
| Gap | Module-local `VLinkActivity` vs normalized kernel; no realtime |

---

## 13. Analytics (surface) — Level D

**User story:** "I open Analytics from business workspace to see business insights."

| Reality | Redirect to `/workspace/analytics`; data from Analytics Capability |
| Participation | Capability L2 serves dashboard-summary; surface does not register as module |
| Gap | Product surface should consume capability reads transparently in workspace hub |

---

## 14. Members — Level D

**User story:** "I find team members from global search."

| Participation | `memberSearchProvider` (platform); identity via Account Platform |
| Gap | No module AI context; no activity as members module; org chart is separate (#OC) |

---

## 15. Notifications (utility) — Level B

**User story:** "I see all my alerts in one place."

| Role | Delivery surface + UX Reference #2 |
| Participation | Consumes domain events; realtime in-app delivery |
| Gap | Not a data module — N/A for search/graph/V_Link as provider |

---

## 16. AI (workspace) — Level B

**User story:** "I ask my twin anything about my workspace."

| Role | Primary platform capability **consumer** |
| Participation | Retrieval orchestrator, graph bundle, V_Link pipeline all wired |
| Gap | Still reads legacy activity in some context engines (ACT-R1) |

---

## 17. Business Workspace (shell) — Level C

**User story:** "I work in my business hub and everything feels connected."

| Participation | Routes 15+ modules; Reference Workspace L3 certified |
| User reality | Navigation works; intelligence does not flow across module boundaries |
| Gap | Shell-level search aggregation; per-module adoption is the real lever |

---

## 18. Business Administration (#OC) — Level C

**User story:** "Org structure and approvals govern what I can do."

| Participation | PE **Full**; activity + domain events on org chart and approvals |
| Gap | Not a workspace tab module; no search; no graph adapter for org entities |

---

## 19–22. Dashboard widgets

### Activity Feed — Level D

Displays cross-module timeline but reads legacy multi-source. User sees **inconsistent** events vs in-module history.

### Quick Stats — Level D

Bridges Analytics Capability for AI quick-stats only. Not searchable; not in activity.

### Quick Notes — Level E

Local widget storage. No platform participation.

### Bookmarks — Level E

Saved links only. No platform participation.

---

## 23. Cross-module participation patterns

### Pattern A — Reference native (File Hub, Chat, Calendar, Todo)

```
authorize → execute → emitModuleActivityEvent → domain event → notification → realtime → search index via provider
```

### Pattern B — Business operations (HR, Scheduling, Workforce)

```
authorize → execute → emitModuleActivityEvent → notification
                                    ↓
                          ❌ no search provider
                          ❌ AI list-only retrieval
```

### Pattern C — Widget silo (Quick Notes, Bookmarks)

```
local state → dashboard render
        ↓
  ❌ no platform fan-out
```

---

## 24. Participation review conclusions

1. **Certified ≠ adopted** for business operations modules.
2. **Dashboard is the user's platform hub** but its widgets are the weakest adoption cluster.
3. **File Hub is the only Level A module** — appropriate reference for adoption waves.
4. **ACT-R1 is the only cross-cutting fix** that improves every module's user-visible participation simultaneously.

---

**Last updated:** 2026-06-25
