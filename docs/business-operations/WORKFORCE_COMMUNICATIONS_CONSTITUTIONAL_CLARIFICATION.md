# Workforce Communications Constitutional Clarification

**Program:** Business Operations Constitutional Clarification  
**Status:** Canonical maturity amendment — supersedes Phase 0C/0D **classification label only**  
**Last updated:** 2026-06-14  
**Purpose:** Reconcile Phase 0C repository findings, Phase 0D constitution, and clarified Vssyl product vision **without repository re-audit**

**Authoritative inputs:**

- [WORKFORCE_COMMUNICATIONS_CAPABILITY_MAP.md](./WORKFORCE_COMMUNICATIONS_CAPABILITY_MAP.md)
- [WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md](./WORKFORCE_COMMUNICATIONS_STRATEGIC_POSITIONING.md)
- [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)
- [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md)
- [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md)

---

## 1. Executive Summary

Phase 0C correctly concluded that a **dedicated Workforce Communications module does not exist**. Product vision clarification now states that Workforce Communications was **never intended as peer-to-peer messaging** — it is a **broadcast system** (organization → audience), distinct from Chat (conversation) and Notifications (delivery).

**Constitutional amendment (maturity only):**

| Axis | Classification |
|------|----------------|
| **Dedicated module** | **NOT PRESENT** (unchanged) |
| **Domain capability** | **PARTIALLY PRESENT — Phase 1** |
| **Current implementation** | Business Front Page announcements (`companyAnnouncements`) |
| **Current maturity** | **LOW** |

Phase 0C discovery remains valid for module absence, boundaries, and missing lifecycle capabilities. This clarification **reclassifies** Business Front Page from "unrelated surrogate" to **Phase 1 seed** of the broadcast domain per product intent.

**Ownership, identity, Chat boundaries, and Notification boundaries do not change.**

---

## 2. What Chat Is

### System type

**Conversation System** — people communicate with people.

### Purpose

Enable **participant-scoped** collaboration where users choose or are invited into conversations.

### Examples

- Direct messages (DM)
- Group conversations
- Team collaboration
- Project discussions
- Onboarding task discussion deep-links (`OnboardingChatIntegration`)

### Why Chat should remain conversation-focused

| Reason | Detail |
|--------|--------|
| **Audience model** | Explicit `ConversationParticipant` list — not org-chart department resolution |
| **Product intent** | User-to-user communication; opt-in threading |
| **Architecture** | L3 collaboration module; `ReadReceipt` is message-scoped |
| **Risk** | Absorbing broadcasts into Chat breaks audience model and compliance lifecycle |

**Constitutional rule (unchanged):** Chat ≠ Workforce Communications. See [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md).

---

## 3. What Workforce Communications Is

### System type

**Broadcast System** — organizations communicate with audiences.

### Purpose

Enable **organization-authored** messages to **resolved workforce audiences** with campaign lifecycle (author → audience → delivery → read → ack → audit).

### Examples

| Category | Examples |
|----------|----------|
| **General** | Business announcements, birthdays, leadership messages |
| **Policy & compliance** | Policy updates, compliance acknowledgements (target) |
| **Operations** | Schedule publication notices, HR updates, coverage messaging (target) |
| **Critical** | Emergency alerts (target) |

### Why this differs from Chat

| Dimension | Workforce Communications | Chat |
|-----------|------------------------|------|
| **Author** | Organization / admin | Individual participants |
| **Audience** | Org-chart resolved (EP, Dept, hierarchy) | Participant picker |
| **Pattern** | Broadcast fan-out | Conversation thread |
| **Lifecycle** | Campaign + ack + audit (target) | Message + optional read receipt |
| **Delivery partner** | Notifications (emit) | Notifications for message alerts |

Workforce Communications **authors content and audience**; Notifications **delivers**; Chat **does neither** for operational broadcasts.

---

## 4. What Notifications Are

### System type

**Delivery Infrastructure** — domains emit; Notifier delivers.

### Purpose

Persist and fan-out alerts to users via in-app, email, push, and related channels (C2 Notifier per platform automation boundary).

### Examples

- New announcement (when a domain emits)
- New chat message
- PTO approved
- Shift updated (when emitted — not present for scheduling today)

### Why Notifications do not own communication content

| Aspect | Notifications | Workforce Communications |
|--------|---------------|------------------------|
| **Owns** | Delivery rows, inbox UX, channel fan-out | Message content, audience spec, campaign lifecycle |
| **Does not own** | Broadcast authoring, dept audience resolution, compliance ack campaigns | Transport layer |
| **Role** | **How** alerts arrive | **What** operational message is sent **to whom** |

**Constitutional rule (unchanged):** Notifications ≠ Workforce Communications.

---

## 5. Front Page Reclassification

### Business Front Page — evaluation (Phase 0C evidence; no re-audit)

| Dimension | Assessment |
|-----------|------------|
| **Current capabilities** | Admin author via `FrontPageContentEditor`; store `companyAnnouncements` JSON on `BusinessFrontPageConfig`; render on `BusinessFrontPage` and `AnnouncementsWidget`; priority display; client-side expiry filter |
| **Audience capabilities** | **Implicit business-wide** on announcement content; `visibleToDepartments` on **widgets** only — not per-announcement targeting |
| **Implementation ownership** | Business front-page CMS (`businessFrontPageService`, branding subsystem) |
| **Domain ownership (intent)** | Workforce Communications — **Phase 1** broadcast slice |
| **Maturity** | **LOW** — single capability, no constitutional alignment |

### Lifecycle coverage (Phase 1)

| Step | Status |
|------|--------|
| Author | ✓ |
| Audience selection | ✗ (implicit business-wide) |
| Delivery | ✓ (page/widget render only) |
| Read receipt | ✗ |
| Acknowledgement | ✗ |
| Audit | ✗ |
| Notification fan-out | ✗ |

### Classification answer

| Option | Verdict |
|--------|---------|
| **Surrogate only** | **Superseded** for announcements — product intent identifies this as broadcast seed |
| **Phase 1 of Workforce Communications** | **Yes** — organization-to-audience pattern without full domain |

Front page is **not** Chat, **not** Notifications, and **not** a complete Workforce Communications domain. It is the **first implementation stage** of the broadcast system.

---

## 6. Constitutional Classification Decision

### Dual-axis maturity (binding)

| Axis | Classification | Notes |
|------|----------------|-------|
| **Dedicated module** | **NOT PRESENT** | No module id, manifest, workspace hub, dedicated routes/models |
| **Domain capability** | **PARTIALLY PRESENT (Phase 1)** | Business Front Page announcements |

### Current implementation

- **Business Front Page announcements** (`companyAnnouncements`)

### Current maturity

**LOW**

### Missing (unchanged from Phase 0C)

- Audience targeting (org-chart resolver on content)
- Department broadcasts
- Read receipts (operational)
- Acknowledgements
- Emergency alerts
- Campaign audit
- Notification fan-out
- Dedicated module hub
- Dedicated manifest

### Supersedes

The blanket statement **"Workforce Communications NOT PRESENT"** as a **domain maturity label**. It does **not** supersede:

- Module-absence findings
- Chat / Notifications / socket / HR workflow FALSE POSITIVE conclusions (except front-page row refinement)
- [WORKFORCE_AUDIENCE_ARCHITECTURE.md](./WORKFORCE_AUDIENCE_ARCHITECTURE.md) target model
- [WORKFORCE_IDENTITY_ARCHITECTURE.md](./WORKFORCE_IDENTITY_ARCHITECTURE.md)

---

## 7. Impact On Phase 0D Constitution

| Document | Amendment |
|----------|-----------|
| [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md) | Pillar: PARTIALLY PRESENT (Phase 1); FALSE POSITIVE GOVERNANCE front-page row |
| [BUSINESS_OPERATIONS_DOMAIN_MODEL.md](./BUSINESS_OPERATIONS_DOMAIN_MODEL.md) | WC § current state |
| [BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md](./BUSINESS_OPERATIONS_EXECUTIVE_SUMMARY.md) | Maturity language |
| [BUSINESS_OPERATIONS_CAPABILITY_TARGET_STATE.md](./BUSINESS_OPERATIONS_CAPABILITY_TARGET_STATE.md) | Workforce Broadcasts → Partial |
| [BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md](./BUSINESS_OPERATIONS_MODERNIZATION_PREREQUISITES.md) | P10: evolve front page → full domain |
| [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md) | Footnote on front-page FALSE POSITIVE row |

Phase 0A–0C discovery documents remain **historical record** — not amended.

---

## 8. Updated Domain Definition

```
Workforce Communications
├── System type:        Broadcast (organization → audience)
├── Phase 1 (today):    Business Front Page announcements
│                        └── Implementation host: Business front-page CMS
│                        └── Maturity: LOW
├── Module (today):     NOT PRESENT
└── Target:             Full Workforce Communications domain
                         (audience, ack, audit, notification emitters, hub, manifest)
```

### Three-system constitutional model

```
Chat                      → Conversation System
Workforce Communications  → Broadcast System (Phase 1 partial)
Notifications             → Delivery Infrastructure
```

---

## 9. What Does Not Change

| Area | Status |
|------|--------|
| Org Chart ownership | Unchanged |
| HR ownership | Unchanged |
| Scheduling ownership | Unchanged |
| Identity architecture | Unchanged |
| Audience architecture (target) | Unchanged |
| Chat boundaries | Unchanged |
| Notification boundaries | Unchanged |
| Model C hybrid architecture | Unchanged |
| FALSE POSITIVES: CHANNEL, scheduling sockets, Notification Center, HR notifications | Unchanged |
| `priority: urgent` on announcements ≠ emergency system | Unchanged |

**Only Workforce Communications maturity classification changes.**

---

## 10. Final Recommendation

1. **Adopt dual-axis classification** — module NOT PRESENT; domain PARTIALLY PRESENT (Phase 1).
2. **Treat Business Front Page announcements** as the **seed broadcast implementation**, not an unrelated surrogate and **not** Chat.
3. **Preserve all Phase 0C boundaries** for Chat, Notifications, workflow notifications, and realtime events.
4. **Modernize by evolution** — prerequisites should **extend** front-page Phase 1 into full domain (audience, ack, audit, module registration) rather than assume greenfield-only.
5. **Do not treat Phase 1 as complete** — emergency, dept broadcasts, ack, and notification fan-out remain missing; `urgent` priority remains display metadata only.

**No certification. No implementation. Documentation only.**

---

## Document authority

This document amends **maturity classification** for Workforce Communications across Phase 0D strategic docs. Boundary and identity authority documents remain canonical for ownership. Supersede only via explicit Business Operations program revision.
