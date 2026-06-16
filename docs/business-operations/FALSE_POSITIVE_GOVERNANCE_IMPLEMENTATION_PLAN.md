# FALSE POSITIVE Governance Implementation Plan

**Program:** Business Operations Stage 1 Implementation Planning  
**Initiative:** CO-06 — FALSE POSITIVE Governance Adoption  
**Gap:** G01 (P0)  
**Last updated:** 2026-06-14  
**Constitution:** [BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md](./BUSINESS_OPERATIONS_STRATEGIC_ARCHITECTURE.md) § FALSE POSITIVE GOVERNANCE  
**Boundary source:** [CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md](./CHAT_COMMUNICATIONS_BOUNDARY_ANALYSIS.md)

---

## Purpose

Convert CO-06 into executable work that prevents delivery, workflow, collaboration, and synchronization features from being classified as **Workforce Communications** products during Stage 1 implementation and all subsequent BO modernization.

**Resolves:** G01 — FALSE POSITIVE governance adoption.

---

## Governance model

### Three-system model (binding)

| System | Role |
|--------|------|
| **Chat** | Conversation — people to people |
| **Workforce Communications** | Broadcast — organization to audience (Phase 1 partial via front page) |
| **Notifications** | Delivery — domains emit; Notifier delivers |

### Binding distinctions

| Statement | Meaning |
|-----------|---------|
| Chat ≠ Workforce Communications | Participant-scoped collaboration ≠ org-chart audience messaging |
| Notifications ≠ Workforce Communications | C2 Notifier delivery ≠ campaign content, audience, ack lifecycle |
| Workflow Notifications ≠ Workforce Communications | `hr_*` alerts ≠ broadcast/compliance campaigns |
| Realtime Events ≠ Workforce Communications | `schedule:*` socket sync ≠ authored operational messages |

### Governed false positives (minimum set)

| Surface | Classification | Owner |
|---------|----------------|-------|
| Chat CHANNEL type | Conversation label | Chat |
| Scheduling `schedule:shift:*`, `schedule:published` | UI synchronization | Scheduling + platform Realtime |
| Notification Center | Delivery inbox | Platform Notifications |
| HR `hr_*` notifications | Workflow alerts | HR → Platform |
| Front-page `companyAnnouncements` | Phase 1 WC broadcast seed — not Chat; incomplete domain | Business front-page CMS |
| Chat `ReadReceipt` | Message read state | Chat |
| Announcement `priority: urgent` | Display metadata | Business CMS — not emergency system |

### Design review rule

Before labeling any feature "workforce communications," verify full lifecycle: **Author → Audience (org-chart) → Delivery → Read → Ack → Audit**. If any step is absent or owned by another domain per table above, the feature is **not** Workforce Communications.

---

## Ownership

| Role | Responsibility |
|------|----------------|
| **BO program steward** | Maintains FALSE POSITIVE checklist; approves boundary exceptions |
| **Design review gate owner** | Enforces lifecycle test on BO PRs and feature specs |
| **Module owners (Scheduling, HR, Business)** | Classify their surfaces correctly in implementation work |
| **Platform Notifications owner** | Confirms delivery-only boundary in CO-02 work |

---

## Adoption process

| Step | Action |
|------|--------|
| 1 | Publish BO design review checklist (WP-06.1) referencing constitution § FALSE POSITIVE GOVERNANCE |
| 2 | Insert checklist into BO feature/PR review template |
| 3 | Label all governed surfaces in implementation specs before CO-02/CO-04 work begins |
| 4 | Train reviewers on three-system model (WP-06.2) |
| 5 | Audit existing BO surfaces for mislabeling (WP-06.3) |

---

## Enforcement model

### Modernization gates (no BO program may)

1. Implement broadcasts inside Chat as substitute for Workforce Communications
2. Treat Notification Center as comms authoring surface
3. Treat scheduling socket events as shift messaging product
4. Treat front-page Phase 1 as sufficient emergency alert system or complete WC domain

**Exception path:** Explicit program revision superseding constitution.

### Enforcement checkpoints

| Checkpoint | When | Action |
|------------|------|--------|
| Feature spec review | Before implementation | Lifecycle test + governed surface table |
| CO-02 notification work | Track 3 | Verify emitters are workflow/operational — not WC campaigns unless CO-11 |
| CO-04 trash work | Track 3 | No trash handler labeled "comms inbox" |
| Stage 1 verification | Track 4 | Surrogate labeling audit complete |

---

## Work packages

| ID | Work package | Deliverable |
|----|--------------|-------------|
| **WP-06.1** | Design review checklist artifact | `BO_FALSE_POSITIVE_DESIGN_REVIEW_CHECKLIST.md` (or section in existing review template) |
| **WP-06.2** | Reviewer adoption | Reviewer briefing doc + acknowledgment record |
| **WP-06.3** | Surrogate labeling audit | Inventory of BO surfaces with correct classification labels |
| **WP-06.4** | Implementation spec template | BO feature spec template with lifecycle test section |

---

## Entry criteria

| Criterion | Status |
|-----------|--------|
| Modernization planning complete | ✅ |
| Constitution § FALSE POSITIVE GOVERNANCE final | ✅ |
| Boundary analysis final | ✅ |
| Stage 1 program authorized | ✅ |

---

## Exit criteria (G01)

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Design review checklist published and referenced in BO review process | Checklist exists; linked from Stage 1 docs |
| 2 | Three-system model documented in reviewer materials | WP-06.2 complete |
| 3 | Governed surfaces inventory labeled correctly | WP-06.3 audit complete |
| 4 | No open mislabeling of Chat/sockets/notifs as full WC | Audit pass |
| 5 | Modernization gate list adopted in BO program charter | Gate list referenced |

---

# Assumptions

- Constitution § FALSE POSITIVE GOVERNANCE remains authoritative — not re-opened
- Chat CHANNEL semantics unchanged in Stage 1
- Front-page Phase 1 classification per constitutional clarification remains binding
- Governance adoption is primarily process + documentation — not code refactor
- Reviewers have access to BO constitution and boundary docs

---

# Risks

| Risk | Mitigation |
|------|------------|
| Checklist published but not used in reviews | WP-06.2 adoption + gate owner accountability |
| Implementation teams bypass review under time pressure | Stage 1 verification audit (WP-06.3) |
| New features mislabeled during CO-02 emitter work | CO-02 plan requires FALSE POSITIVE check per type |
| Socket events expanded and marketed as "shift comms" | Enforcement checkpoint on Scheduling notification/socket work |

See [STAGE_1_IMPLEMENTATION_RISK_REGISTER.md](./STAGE_1_IMPLEMENTATION_RISK_REGISTER.md) — R-06.

---

# Dependencies

| Dependency | Relationship |
|------------|----------------|
| None (P0 entry) | CO-06 may start immediately |
| CO-02 | CO-06 should complete before notification taxonomy finalization |
| CO-11 (Stage 3) | CO-06 governance prevents WC absorption — prerequisite for future WC |

---

# Verification Criteria

| Method | Pass condition |
|--------|----------------|
| Checklist existence review | WP-06.1 artifact published |
| Surface audit | WP-06.3 — all governed surfaces correctly classified |
| Sample PR review | At least one BO PR/spec demonstrates lifecycle test |
| CO-02 cross-check | Notification types classified as workflow vs broadcast per taxonomy |
| Stage 1 exit gate | G01 row satisfied in verification track |

---

## Certification statement

**No certification awarded.** Governance implementation plan only.
