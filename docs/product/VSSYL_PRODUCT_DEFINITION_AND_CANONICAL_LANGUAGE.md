# VSSYL Product Definition & Canonical Language Guide

**Status:** Draft 2 for ratification  
**Date:** September 2026  
**Role:** Product language reference

A durable reference for what Vssyl is, how Personal and Business differ, what the major platform surfaces do, and which terms should be used consistently.

## Document status

Draft 2 for ratification. This guide is intended to become the shared language reference for product conversations, documentation, README copy, AI/Cursor prompts, and future design work. It defines **product meaning**, not implementation status, architecture law, pricing, or roadmap.

Updated to incorporate the durable small-and-growing-business, organization-wide participation, interoperability, and shared operational understanding principles.

**Authority boundaries**

- This guide is **not** architecture law. When architecture and this guide disagree about architecture, the canonical architecture owner wins.
- This guide is **not** proof of shipped behavior. When code and this guide disagree about implementation, code wins.
- Module-level product intent remains in `memory-bank/*ProductContext.md` and related Memory Bank files.

---

## Contents

1. [The definition of Vssyl](#1-the-definition-of-vssyl)
2. [The Personal and Business distinction](#2-the-personal-and-business-distinction)
3. [How the product is organized](#3-how-the-product-is-organized)
4. [Core platform surfaces and capabilities](#4-core-platform-surfaces-and-capabilities)
5. [How the major pieces work together](#5-how-the-major-pieces-work-together)
6. [Canonical terminology glossary](#6-canonical-terminology-glossary)
7. [Naming rules and terms to avoid](#7-naming-rules-and-terms-to-avoid)
8. [Recommended short descriptions](#8-recommended-short-descriptions)
9. [Source basis and maintenance rules](#9-source-basis-and-maintenance-rules)

### Reading rule

When a term has a specific canonical meaning, use that term rather than a nearby synonym. The goal is not to make language rigid for users; it is to keep product, design, engineering, and AI conversations aligned.

---

## 1. The definition of Vssyl

Vssyl is a contextual operational platform for people and organizations. It brings applications, connected systems, information, relationships, intelligence, and shared platform capabilities into one governed environment so users can operate across Personal and Business contexts without managing a collection of disconnected tools.

### The shortest durable definition

**Canonical one-sentence definition**

Vssyl is one contextual operational platform that helps people and organizations work across connected applications and systems while preserving clear ownership, privacy, authority, and context.

### Who Vssyl is designed to serve

- Vssyl is designed especially for everyday, small, and growing businesses that need connected operational capability without dedicated enterprise-software administrators, analysts, integration teams, or specialist software users.
- The product is not limited to a particular company size. The same product model should remain useful as a business grows from a small team to a much larger organization.
- Vssyl is intended to support participation across an organization rather than being software only for sales, finance, HR, management, IT, or another specialist department.

### Product promise

Vssyl gives everyday businesses access to connected operational intelligence that has historically required enterprise-scale software, without requiring them to operate enterprise software.

### Problem, product model, promise

| Level | Durable framing |
|-------|-----------------|
| **Problem** | Small and growing businesses experience many of the same information, software, and operational fragmentation problems as large enterprises, but usually lack the staff, systems, integrations, and administrative overhead required to solve them. |
| **Product model** | Vssyl creates a shared operational environment where people, applications, and connected systems contribute to one understanding of the business, while each participant receives an experience appropriate to their role, responsibilities, context, and authority. |
| **Promise** | Vssyl makes connected operational intelligence accessible without transferring enterprise-software complexity to the business using it. |

### What problem Vssyl is trying to solve

- Modern life and business are fragmented across separate applications, accounts, files, messages, calendars, tasks, systems, and relationships.
- Those tools often know only their own data, so users repeatedly rebuild context, search for information, switch interfaces, and manually connect work that is already related.
- Small and growing businesses often face enterprise-scale coordination problems without enterprise-scale software staff or integration capacity.
- Business software frequently adds administrative burden by making people manage the software itself instead of helping them accomplish the work.
- AI added as a separate chatbot does not solve fragmentation if it lacks governed access to the user's real applications, records, connected systems, permissions, relationships, and context.

### The Vssyl product thesis

- One platform is more useful than a bundle of disconnected apps when applications can share governed platform capabilities and context.
- Applications should remain understandable and own their domain records and workflows when Vssyl is the authoritative system for that domain.
- External systems can remain authoritative while Vssyl brings their relevant information and capabilities into the user's operational context.
- Applications and connected systems should contribute enough governed meaning for the wider platform to understand the people, events, locations, work, metrics, relationships, and permitted actions relevant to the user.
- Shared platform capabilities should consume those authorized contributions rather than independently rebuilding each application's business logic.
- The experience should adapt to the participant's role, responsibilities, context, and authority instead of presenting everyone with the same software plus different permissions.
- Platform complexity should be absorbed by Vssyl rather than transferred to the customer.
- Context should follow the user only when it is relevant and authorized.
- Intelligence should reduce effort, not create a second system the user has to administer.
- Personal and Business belong in the same product family, but their data and authority boundaries must remain distinct.
- Enterprise needs deepen the same product family rather than creating separate enterprise forks.

### Connect before replacing

**Durable product principle**

Vssyl connects before it replaces. An outside system can remain authoritative while Vssyl brings the relevant information, relationships, signals, and permitted actions into the user's operational context.

- Accounting, payroll, point of sale, ecommerce, productivity suites, industry-specific software, and other operational systems do not need to be recreated merely to participate in Vssyl.
- The goal is coherent operation across systems, not ownership of every business function.
- Installing an application, connecting an outside service, adding employees, or configuring a business should progressively make Vssyl more useful without requiring the customer to understand integration architecture.

### What Vssyl is not

- Not a bundle of unrelated SaaS products placed behind one login.
- Not one giant application that owns every type of record.
- Not a requirement that every important business function eventually be replaced by a native Vssyl application.
- Not a dashboard that becomes the system of record for everything.
- Not an AI chatbot that replaces the applications or external systems that own real data.
- Not a universal context pool where Personal and Business information automatically mixes.
- Not a separate enterprise product line with duplicated versions of every application.
- Not software that requires the customer to understand semantic mappings, metadata architecture, API schemas, context providers, workflow engines, or integration pipelines to receive its value.
- Not defined by a pricing tier, provider brand, cloud vendor, or current implementation phase.

---

## 2. The Personal and Business distinction

Personal and Business are governed operating contexts inside one Vssyl platform. They share platform infrastructure and can use many of the same applications, but they do not automatically share authority, private records, memory, or configuration.

| Dimension | Personal | Business |
|-----------|----------|----------|
| **Primary purpose** | The individual's own life, information, relationships, preferences, and work. | The operation of a business or organization under that business's authority. |
| **Primary owner** | The individual user. | The business/tenant and its authorized members. |
| **Authority** | The user's personal permissions and choices. | Business membership, policy, tenant scope, and application permissions. |
| **Data boundary** | Personal records stay personal unless intentionally shared or linked. | Business records remain business-scoped and are not automatically personal data. |
| **Applications** | May include Dashboard, File Hub, Chat, Calendar, To-Do, Place, and other personal-capable apps. | May include business-scoped versions of shared apps plus HR, Scheduling, Members, Analytics, and other organization-oriented apps. |
| **Participation** | The individual shapes the experience around personal needs and preferences. | Owners, managers, supervisors, frontline employees, and occasional participants can operate in the same business environment with different experiences. |
| **AI** | Uses the shared Vssyl intelligence runtime in Personal scope. | Uses the same shared runtime in Business scope with business authorization and policy. |
| **Search** | Returns authorized Personal-scope results. | Returns only business content the user is authorized to discover. |
| **Settings** | User preferences, privacy, display, account choices, and personal behavior. | Business configuration belongs primarily to Business Administration; user preferences may still be context-aware. |

### Organization-wide participation

**Business participation principle**

Vssyl is designed for participation across the organization. Every person can operate within the same business environment while receiving an experience appropriate to their role, responsibilities, context, and authority.

- An owner may see business-wide direction, exceptions, and configuration responsibilities.
- A manager or supervisor may see team-specific work, approvals, staffing, alerts, or metrics.
- A frontline employee may see the tasks, communications, files, schedule, and information relevant to the work they perform.
- An occasional participant may receive a narrow experience for the specific interaction they need.
- This is not simply the same screen with more or fewer permissions. Authorization still matters, but Vssyl should also adapt what is emphasized, organized, and presented.

### What is shared

- The Vssyl platform and core interaction model.
- Identity and authentication infrastructure.
- Shared applications where the product supports both contexts.
- Cross-cutting services such as AI orchestration, search, notifications, presence, realtime delivery, storage integration, lifecycle, interoperability, and design system.
- A common product language and navigation philosophy.

### What is not automatically shared

- Private Personal records into Business.
- Business records into the user's Personal domain.
- AI memory or knowledge across scopes without an explicit governed rule.
- Access merely because two entities are connected through V_Link or another relationship.
- Business configuration simply because a user has personal preferences.
- Authority merely because a user can see a workspace, relationship, notification, or search result.

### Rule of thumb

Shared platform does not mean shared permission. A relationship, common application, connected system, or shared runtime may provide context, but it does not erase the boundary between Personal authority and Business authority.

---

## 3. How the product is organized

### Four product layers

| Layer | Meaning | Examples |
|-------|---------|----------|
| **Operating contexts** | The governed scope in which the user is currently operating. | Personal, Business |
| **Applications** | User-facing domain products that own their records/workflows when Vssyl is authoritative, and contribute governed meaning to the wider platform. | File Hub, Chat, Calendar, To-Do, HR, Scheduling, Place, Marketplace |
| **Shared platform capabilities** | Cross-cutting services that consume authorized application and integration contributions without taking over domain ownership. | AI, Unified Search, Notifications, Analytics, Settings, Presence, Interoperability, V_Link, Policy Engine, Global Trash |
| **Experience and administration surfaces** | Places where users enter, project, configure, or govern the platform. | Dashboard, Work tab, Business workspace, Business Administration, Developer, Platform Admin |

### The ownership principle

**Domain truth stays with the authoritative owner**

A Vssyl application owns the records and business rules for a domain when it is the system of record. A connected external system can also remain authoritative. Shared platform capabilities can search, notify, summarize, connect, interpret, automate, or assist without quietly becoming a second system of record.

- Dashboard projects information from applications or connected systems; it does not become the owner of those records.
- Analytics interprets data; it does not become the operational source of truth.
- V_Link connects relationships; it does not replace the owning application or grant access by itself.
- AI reasons over governed truth; it does not create a shadow authoritative database.
- Notifications deliver attention; they do not become an activity or audit system.
- Realtime delivery carries changes; it does not own the mutation that created them.
- Interoperability brings outside systems into the operational environment without requiring Vssyl to replace them.

### Shared operational understanding

**Canonical descriptive concept — not a subsystem name**

Applications own their domain truth, while Vssyl connects their meaning into a shared operational understanding of the person and organization. This describes the product outcome, not a new branded architecture layer.

A Scheduling application may contribute the meaning of people, shifts, locations, assignments, coverage, or attendance events. An Inventory application may contribute products, quantities, movement, consumption, shortages, or cost changes. A Compliance application may contribute obligations, recurrence, completion, accountability, or exceptions. The owning application still controls the actual records and business rules; the wider platform gains enough authorized meaning for shared capabilities to assist coherently.

### Application, module, capability, surface: the critical distinction

| Term | Use it when... | Do not use it as... |
|------|----------------|---------------------|
| **Application** | Referring to a user-facing domain product with records, workflows, and a coherent responsibility. An application may also contribute authorized structured meaning to the wider platform. | A generic word for every shared platform service. |
| **Module** | Referring to the platform's technical packaging, registry, installability, lifecycle, or module contract. | A synonym for every feature, screen, or shared capability. |
| **Capability** | Referring to a shared service that consumes authorized contributions from applications or integrations and supports multiple experiences. | A claim that the capability owns each application's domain data or should rebuild its logic. |
| **Surface** | Referring to where something appears in the UI or how a user reaches it. | A claim about ownership or architecture. |
| **Workspace** | Referring to an orchestration/working environment that organizes access to applications for a particular operating context. | A synonym for the application itself or its system of record. |
| **Feature** | Referring to a specific user-visible behavior inside an application, capability, or surface. | A substitute for the larger product/domain. |

### Complexity belongs to Vssyl, not the customer

- Customers should receive the benefit of semantic mapping, metadata, APIs, entity contracts, context assembly, integration pipelines, and automation without needing to understand those mechanisms.
- Connecting a service or enabling an application should progressively improve shared operational understanding with sensible defaults and guided configuration.
- Technical contracts belong in architecture and integration documentation; the product experience should expose the business meaning, not the machinery.

---

## 4. Core platform surfaces and capabilities

The following definitions describe product purpose and ownership. They intentionally avoid phase status, implementation details, and commercial packaging.

### Dashboard

**Projection / home surface**

The user's configurable home and summary surface. It presents authorized projections, shortcuts, status, and signals from applications and connected systems so people can see and enter their work without the Dashboard becoming the owner of that work.

**Boundary:** Use "Personal dashboard shell" when referring specifically to the global Personal layout/chrome. A deeper interaction should route to the owning application when appropriate.

### File Hub

**Application**

Vssyl's user-facing file and folder application for organizing, previewing, sharing, locating, and recovering files across supported contexts. It is also the natural file source for attachments used by other applications.

**Boundary:** User-facing name: File Hub. Technical module id/code name may remain "drive". Do not expose "Drive" as the preferred product name.

### Chat

**Application**

The communication application for Personal and Business conversations, messaging, replies/threads, presence-aware collaboration, file sharing, search, and notifications. Chat should remain available without forcing the user to abandon the context they are working in.

**Boundary:** Chat owns conversations/messages; Notifications and Activity remain separate concepts.

### Calendar

**Application**

The time-and-event application for calendars, events, invitations, availability, reminders, and time-based coordination across supported contexts.

**Boundary:** Calendar = events and time. Do not use Calendar as a synonym for workforce Scheduling or To-Do tasks.

### To-Do

**Application**

The task and work-item application for things a user or team needs to complete, including due dates, organization, ownership, and task progress.

**Boundary:** UI name: To-Do. Technical id: `todo`. Entity: task. Avoid the legacy module id "tasks".

### HR

**Application**

The workforce and employment domain for employee-oriented records and processes such as employment profiles, onboarding, and HR-owned lifecycle information.

**Boundary:** Business membership is not the same thing as HR employment data. Authorization is not owned by HR.

### Scheduling

**Application**

The workforce planning application for shifts, coverage, assignments, and future staffing plans. Its structured contribution can help the wider platform understand authorized scheduling concepts without duplicating Scheduling's records or rules.

**Boundary:** Scheduling = workforce shifts/coverage. Calendar = events. To-Do = tasks. Attendance/history belongs with the appropriate workforce/HR owner.

### Place

**Application with dual-surface behavior**

Vssyl's place/relationship/discovery experience built around a user's personal "Main Street" concept, while also allowing businesses to maintain the business-facing presence that Personal users discover and interact with.

**Boundary:** Place is not a workspace type. It is an application that can appear through different surfaces.

### Marketplace

**Application / ecosystem surface**

The buyer/discovery side of the Vssyl ecosystem: discover, evaluate, and initiate installation of applications or modules where supported.

**Boundary:** Marketplace does not own creator publishing, platform approval, or the authoritative installed-state lifecycle.

### Developer

**Creator / publisher surface**

The creator-side surface for building, submitting, publishing, and managing creator participation in the Vssyl application ecosystem.

**Boundary:** Developer is distinct from Marketplace. Approval/certification belongs to Platform Admin; installed-state lifecycle belongs to platform lifecycle systems.

### Notifications

**Cross-cutting attention capability**

The product layer that turns important application or integration events into user attention through a persistent notification center and supported delivery channels.

**Boundary:** Notifications are not Settings and not Activity. Owning systems create notification intent; the platform delivers it. Preference controls may live with or integrate with Settings.

### Settings

**Cross-cutting preference / control surface**

The place for user preferences, privacy choices, display/behavior controls, and other user-level configuration that should apply consistently across Vssyl.

**Boundary:** Do not use personal Settings as the owner of business-tenant configuration. Business configuration belongs primarily to Business Administration.

### Unified Search

**Cross-cutting discovery capability**

A permission-aware, federated search experience that consumes authorized contributions from applications and integrations, helps users find content across Vssyl, and navigates them back to the owning source.

**Boundary:** Search is discovery, not a replacement for navigation, and not the same thing as AI retrieval or external web search.

### AI / Digital Life Twin

**Governed contextual intelligence**

Vssyl's shared intelligence runtime. It combines authorized identity, context, memory, relationships, application truth, connected-system contributions, permissions, tools, and provenance to explain, recommend, assist, and, where permitted, act through owning systems.

**Boundary:** Applications and connected systems remain authoritative for their domains. AI inherits the user's authority. Model providers are replaceable adapters. "Digital Life Twin" is an internal/product-philosophy term; final user-facing branding remains open.

### V_Link

**Relationship / association bridge**

The platform relationship layer that connects entities and provides governed relationship context across Vssyl without moving ownership away from source applications or connected systems.

**Boundary:** A V_Link does not grant access by itself, does not become the system of record, and is not the same thing as AI memory.

### Presence

**Cross-cutting awareness capability**

The lightweight awareness of whether a person is available or recently active, used by collaborative experiences such as Chat and business member surfaces.

**Boundary:** Presence is not an activity history, attendance record, or audit trail.

### Analytics

**Cross-cutting interpretation capability**

The layer that consumes authorized contributions and interprets patterns, metrics, summaries, and reports from authoritative application or connected-system data.

**Boundary:** Analytics interprets; it does not own the operational records it analyzes.

### Interoperability

**Cross-cutting connection capability**

The product capability that allows Vssyl applications and external systems to exchange authorized information, meaning, events, and permitted actions while preserving source ownership.

**Boundary:** Interoperability does not imply replacement, data duplication, unrestricted sync, or a new Vssyl-owned system of record.

### Members

**Business membership / roster surface**

The business-facing roster and membership experience for understanding who belongs to a business and managing the membership relationship within its proper authority boundaries.

**Boundary:** Membership is not employment, org placement, or full authorization. Those concerns have separate owners.

### Business Administration

**Business-tenant administration surface**

The business-owner/admin area for configuring one business: identity, branding, business settings, enabled applications, organizational configuration, connected services, and other tenant-owned administration.

**Boundary:** Do not confuse Business Administration with Platform Admin or with day-to-day employee work in the Business workspace.

### Platform Admin

**Platform operator control plane**

The Vssyl-operator governance and control plane for platform-wide moderation, certification/approval, operational controls, and administrative oversight.

**Boundary:** Business owners do not use Platform Admin to run their company. It is not an installable application.

### Policy Engine

**Authorization capability**

The canonical platform direction for evaluating and enforcing whether an actor may perform a protected action under the applicable scope and policy.

**Boundary:** A role, relationship, workspace visibility, integration, or AI confidence score is not a substitute for authorization.

### Global Trash

**Lifecycle capability**

The shared recovery/lifecycle experience for soft-deleted resources where the owning application participates in the platform trash contract.

**Boundary:** Trash does not become the domain owner; the owning application still controls the underlying resource semantics.

---

## 5. How the major pieces work together

### A simple operating model

| Step | What happens |
|------|--------------|
| **1. User enters a context** | The user is operating in Personal or a specific Business scope. |
| **2. The shell or workspace orients them** | Dashboard, Work tab, or Business workspace gives them a coherent entry point and adapts the experience to the participant without taking ownership away from applications. |
| **3. Applications and external systems do domain work** | File Hub owns files, Chat owns conversations, Calendar owns events, Scheduling owns shifts, while connected accounting, payroll, POS, ecommerce, or other systems can remain authoritative for their own domains. |
| **4. Owning systems contribute governed meaning** | They expose enough authorized structure for Vssyl to understand relevant people, work, events, locations, relationships, metrics, exceptions, and permitted actions without copying business logic into every capability. |
| **5. Shared capabilities consume those contributions** | Search discovers, Notifications call attention, Settings apply preferences, Presence adds awareness, V_Link adds relationship context, Analytics interprets, Interoperability connects, and AI reasons. |
| **6. Authorization is preserved** | Every protected read or action remains governed by the actor's authority and current scope. |
| **7. Results return to the owning domain** | Mutations happen through the owning application or external system. Events, notifications, realtime updates, analytics, workflows, and AI can react without becoming the owner. |

### Examples

- Calendar owns events; Dashboard may show the next event as an authorized projection. A deeper edit returns the user to Calendar.
- File Hub owns files; Chat may reference a file and Unified Search may discover it without either becoming the file owner.
- Scheduling owns shifts and coverage; Dashboard, AI, Search, Analytics, Notifications, or future workflows may use authorized scheduling meaning without rebuilding Scheduling logic.
- An outside accounting system can remain authoritative while Vssyl uses authorized financial signals or actions to support a coherent business view.
- A Calendar event reminder generates a notification. Calendar owns the event; Notifications owns delivery/attention; Settings may control the user's notification preference.
- V_Link connects related records across applications. The link helps navigation/context, but it does not grant the user permission to open restricted content.
- Analytics summarizes business activity. The analytical view is derived from authoritative records rather than replacing them.

---

## 6. Canonical terminology glossary

Use these definitions when writing product documents, README copy, Cursor prompts, architecture discussions, tickets, and internal explanations. Add a modifier when a term could be ambiguous.

| Term | Status | Definition |
|------|--------|------------|
| **Vssyl** | Canonical | The full contextual operational platform. One product family serving Personal and Business operating contexts, with a primary promise of making sophisticated connected capabilities practical for everyday and growing businesses. |
| **Platform** | Canonical | The shared Vssyl layer that connects applications, external systems, cross-cutting capabilities, governance, lifecycle, intelligence, search, notifications, realtime, identity, authorization, and common UX so they can participate in one operational environment without collapsing ownership. |
| **Context** | Canonical general term | Relevant, governed meaning available to an interaction. Always qualify it when the type matters, such as operating context, AI context, business context, or relationship context. |
| **Operating context** | Canonical | The governed scope in which the user is operating. Primary root contexts are Personal and Business. |
| **Personal context** | Canonical | The user-owned operating scope for the individual's information, relationships, preferences, and personal use of Vssyl. |
| **Business context** | Canonical | A business/tenant-scoped operating context governed by business membership, policy, permissions, and business-owned records. |
| **Participant** | Canonical descriptive term | A person operating in a Personal or Business environment. In Business, participants may include owners, managers, supervisors, frontline employees, or occasional users with different responsibilities and experiences. |
| **Role-aware experience** | Canonical descriptive concept | An experience whose emphasis, navigation, information, and actions adapt to the participant's role, responsibilities, context, and authority. It is broader than permission gating alone. |
| **Scope** | Canonical | The boundary that determines which identity, tenant, authority, and data are applicable to a request or interaction. |
| **Tenant** | Canonical technical/business term | An isolated business organization boundary in the platform. Prefer "business" in user-facing prose unless tenancy itself is the topic. |
| **Application** | Canonical | A user-facing domain product with coherent records, workflows, and user actions. When Vssyl is authoritative for the domain, the application owns the domain truth and may contribute authorized structured meaning to the wider platform. |
| **Module** | Canonical technical term | The platform packaging, registry, installability, lifecycle, or contract concept used for applications/modules. A module may contribute to shared platform understanding, but "module" is not a synonym for every feature or capability. |
| **Application contribution** | Canonical descriptive concept; not an implementation contract | The authorized meaning, signals, relationships, metrics, events, or permitted actions an application makes available for shared platform use while retaining ownership of its records and business logic. |
| **Feature** | Canonical | A specific user-visible behavior inside an application, capability, or surface. |
| **Capability** | Canonical | A shared platform function used by multiple applications and surfaces. Capabilities should consume authorized contributions rather than duplicate each application's domain logic. |
| **Surface** | Canonical | A UI location or presentation through which an application or capability is experienced. Surface does not imply ownership. |
| **Domain** | Canonical | A coherent area of product responsibility and records, such as files, conversations, events, workforce shifts, employment, accounting, or inventory. |
| **Domain owner** | Canonical | The application, service, or external system responsible for authoritative records and business rules in a domain. |
| **System of record (SoR)** | Canonical architecture/product term | The authoritative owner of a record or domain state. It may be a Vssyl application or an external system. Shared capabilities should not create shadow SoRs. |
| **Shared operational understanding** | Canonical descriptive concept; not a subsystem | The governed, cross-application understanding Vssyl gains when applications and connected systems contribute relevant meaning while their authoritative records remain with the owning source. |
| **External system** | Canonical | A connected non-Vssyl system that may remain authoritative for part of the user's or business's operation. |
| **Integration** | Canonical | A governed connection between Vssyl and an application or external system that exchanges information, events, identity, or permitted actions. |
| **Interoperability** | Canonical | The ability of Vssyl applications, capabilities, and external systems to work together through authorized exchange while preserving source ownership and policy. |
| **Projection** | Canonical | A contextual representation of information owned elsewhere, such as Dashboard showing a next event or recent file. A projection is not a duplicate system of record. |
| **Workspace** | Canonical with qualifier | An orchestration/working surface that hosts access to applications. Prefer the specific canonical name such as "Business workspace" instead of using "workspace" loosely. |
| **Personal dashboard shell** | Canonical | The logged-in Personal-side shell/chrome with global navigation and Personal entry surfaces. |
| **Dashboard** | Canonical | A configurable projection/home experience that summarizes and launches work from applications and connected systems without owning their records. |
| **Work tab** | Canonical | The tab inside the Personal shell used as the entry point for employer/business work. |
| **Branded work landing** | Canonical | The business-branded selection/authentication/entry experience reached from Work before or while entering a business workspace. |
| **Business workspace** | Canonical | The day-to-day employee/employer operating surface for a specific business and its business-scoped applications. The experience can vary substantially by participant. |
| **Business Administration** | Canonical | The tenant-owner/admin configuration area for a business. Distinct from the Business workspace and Platform Admin. |
| **Platform Admin** | Canonical | The Vssyl operator control plane for platform-wide governance, certification, moderation, and operational administration. |
| **Module admin** | Canonical qualifier | Administrative controls inside one application/domain. Use this term when the scope is one module rather than the business or entire platform. |
| **File Hub** | Canonical user-facing | The user-facing file application. Internal module id/code name may be "drive". |
| **drive** | Technical id | The technical module id/code name for File Hub. Avoid using "Drive" as the preferred user-facing product name. |
| **To-Do** | Canonical user-facing | The task application display name. |
| **todo** | Technical id | The canonical technical module id for To-Do. |
| **task** | Canonical entity | An individual work item owned by To-Do or another explicitly task-owning domain. Do not use "tasks" as the module id. |
| **Calendar** | Canonical | The event/time application. Use for calendars, events, invitations, reminders, and availability. |
| **Scheduling** | Canonical | The workforce-shift and coverage-planning application. Do not use as a generic synonym for Calendar. |
| **HR** | Canonical | The employment/workforce domain. Distinct from business membership and platform authorization. |
| **Members** | Canonical | The business membership/roster surface and relationship. Membership alone is not employment, org position, or permission. |
| **Business member role** | Canonical with qualifier | A coarse designation associated with business membership/admin responsibilities. Do not assume it is the entire authorization model. |
| **Org position** | Canonical with qualifier | A structural/workforce placement in the organization. Do not use it as a synonym for platform authorization. |
| **Permission** | Canonical | An allowed action or access decision under the applicable authorization model. |
| **Authorization** | Canonical | The process of deciding whether an authenticated actor may perform a protected action. |
| **Policy Engine (PE)** | Canonical | The platform authorization direction/owner for centralized policy evaluation and enforcement. |
| **Unified Search** | Canonical | Permission-aware federated discovery across Vssyl applications and authorized connected-system contributions. |
| **Search provider** | Technical | An application/domain adapter that contributes authorized results to Unified Search. |
| **AI** | Canonical generic user-facing | The user-facing shorthand for Vssyl intelligence when the Digital Life Twin name is not being used. |
| **Digital Life Twin** | Canonical internal/product-philosophy; branding open | The governed shared Vssyl intelligence runtime. Personal and Business are scopes over the same runtime, not separate brains. |
| **Model** | Canonical AI term | The language/reasoning model used by Vssyl AI. It is not Vssyl's memory, permissions, domain truth, or product identity. |
| **Provider** | Canonical technical AI term | A vendor/adapter supplying a model capability. Providers are replaceable. |
| **AI context** | Canonical with qualifier | Authorized and relevant information assembled for an AI turn. Distinct from the broader Personal/Business operating context. |
| **Context provider** | Technical AI term | A governed adapter through which an application can expose relevant context to the shared AI runtime when that application is AI-exposed. |
| **Memory** | Canonical AI term | Governed durable continuity/recall. It is not every conversation and not a substitute for authoritative application records. |
| **Knowledge** | Canonical AI term | Governed information available to intelligence under the knowledge model. Do not use interchangeably with memory, context, or system-of-record data. |
| **V_Link** | Canonical | The relationship/association bridge across Vssyl entities. Link does not equal access, ownership, or memory. |
| **Relationship** | Canonical | A governed association between people, businesses, or entities. The specific relationship class determines meaning; relationships do not automatically grant access. |
| **Presence** | Canonical | Current/recent availability awareness such as online, away, offline, or last active. |
| **Activity** | Canonical | A record or feed of what happened in the system/domain. Activity is not the same as a notification. |
| **Notification** | Canonical | A user-attention item generated because an event is important to the user. |
| **Notification center** | Canonical | The persistent place where notifications are collected and reviewed. |
| **Realtime** | Canonical technical/product term | Near-immediate delivery of state changes/events to connected experiences. It is a transport/update behavior, not the system of record. |
| **Analytics** | Canonical | Interpretation, measurement, reporting, and insight derived from authoritative domain data. |
| **Marketplace** | Canonical | The discovery/evaluation/install-initiation side of the application ecosystem. |
| **Developer** | Canonical | The creator/publisher side of the application ecosystem. |
| **Application lifecycle** | Canonical | The platform process/authority covering states such as availability, installation, assignment, activation, and retirement of applications/modules. |
| **Registry** | Canonical technical term | A platform-maintained catalog of registered modules/capabilities/contracts used for lifecycle/runtime behavior. |
| **Global Trash** | Canonical | The shared lifecycle/recovery surface for soft-deleted resources that participate in the platform trash contract. |
| **Enterprise** | Canonical product-scale adjective | Describes larger or more complex organizational needs within the same Vssyl product family. It does not mean a separate forked application family or a fixed commercial package. |
| **Product family** | Canonical | The principle that Personal, Business, and enterprise-scale needs belong to one Vssyl product system rather than separate duplicated products. |
| **Tier** | Use cautiously | A commercial/entitlement term. Do not use tier names to define Vssyl's product identity unless a current commercial authority explicitly establishes them. |
| **Configuration** | General term; not root product law | The act of defining preferences or business/platform behavior. Do not elevate "configuration vs operation" into a universal Vssyl product model unless it is separately ratified. |

---

## 7. Naming rules and terms to avoid

### Use these canonical forms

| When you mean... | Say... | Avoid... |
|------------------|--------|----------|
| The overall product | Vssyl; contextual operational platform | ERP/LRM as the primary identity; "digital workspace" as the complete definition |
| Primary business audience | Everyday, small, and growing businesses; scales with the organization | "Mom-and-pop only" or enterprise-only framing |
| Cross-application business understanding | Shared operational understanding | Inventing a branded subsystem name unless one is separately ratified |
| Outside software participation | Integration / interoperability; external system may remain authoritative | Assuming Vssyl must replace every external system |
| Files product | File Hub | Drive in user-facing copy |
| Task product | To-Do (UI), `todo` (technical id), task (entity) | Tasks as module id |
| Cross-app search | Unified Search | Global Search when referring to the current canonical search model |
| Business employee work area | Business workspace | Work tab when you actually mean the workspace |
| Entry from Personal into employer work | Work tab | Business workspace if the user has not entered the workspace |
| Business-owner configuration | Business Administration | Business admin when the phrase could be confused with Platform Admin |
| Vssyl operator controls | Platform Admin | Business Administration |
| Personal/business boundary | Personal context / Business context | Separate Personal app / separate Business app |
| AI system | AI or Digital Life Twin when intentionally discussing the product concept | Centralized AI; Business AI Twin as a separate brain |
| Large organization needs | Enterprise needs/capabilities within the same product family | Enterprise version/fork of every module |
| Relationship layer | V_Link | Access graph; permission link; memory |
| Authorization | Policy Engine / authorization / permission | Org chart role as the full permission model |
| Notifications | Notification / notification center | Activity feed when the thing is user attention |
| Historical log | Activity / audit trail as appropriate | Notification |

### Deprecated or discouraged language

| Term / phrase | Status | Why |
|---------------|--------|-----|
| Block / Blocks | Deprecated as product vocabulary | Legacy naming that creates confusion with the current Vssyl application/module model. |
| ERP / LRM as Vssyl's definition | Discouraged | Too narrow and reinforces the old split-product framing. It may be used historically or comparatively, not as the canonical identity. |
| Mom-and-pop software | Discouraged as the full target definition | Captures accessibility but artificially caps the product. Prefer everyday, small, and growing businesses with a product model that scales. |
| Revolutionary digital workspace | Discouraged as canonical | Marketing language, not a precise system definition. |
| Centralized AI / ContinuousLearning | Deprecated | Old AI architecture language that no longer represents the governed shared Twin model. |
| Every module must have AI | Deprecated/incorrect | AI exposure is conditional; applications can participate in the platform without owning their own AI brain. |
| Business AI and Personal AI as separate engines | Incorrect | Personal and Business are scopes over a shared intelligence runtime. |
| AI learns everything | Incorrect | Memory, context, learning, knowledge, and domain truth are separate governed concepts. |
| V_Link grants access | Incorrect | A relationship does not itself authorize content access. |
| Dashboard owns platform data | Incorrect | Dashboard projects data from owning applications or connected systems. |
| Enterprise module fork | Incorrect product direction | Enterprise needs enhance the same application family. |
| Business admin | Ambiguous | Use Business Administration, Platform Admin, or module admin depending on actual scope. |
| Context Fabric / Data 360 / Semantic Engine as Vssyl names | Do not invent by implication | Shared operational understanding is currently a product concept, not a ratified named subsystem. |

---

## 8. Recommended short descriptions

### 15-second definition

**Recommended**

Vssyl is one contextual operational platform for personal life and business. It connects applications and outside systems through shared context, search, notifications, relationships, analytics, and governed AI while keeping each domain's data and permissions properly owned.

### 30-second definition

**Recommended**

Vssyl gives everyday and growing businesses access to the kind of connected operational intelligence that has historically required enterprise-scale software, without requiring them to operate enterprise software. Applications and connected systems keep ownership of their records, while Vssyl creates a shared operational environment where each person gets an experience appropriate to their role, responsibilities, context, and authority.

### Business product promise

**Recommended**

Vssyl helps a business operate as one connected environment even when its work spans multiple applications, people, and outside systems. The complexity of connecting that environment belongs to Vssyl, not to the customer.

### Personal vs Business in one sentence

**Recommended**

Personal and Business are two governed operating contexts inside the same Vssyl platform: they can share platform capabilities and applications, but they do not automatically share data, memory, permissions, or configuration.

### AI in one sentence

**Recommended**

Vssyl AI is a governed Digital Life Twin that reasons over authorized context and application or connected-system truth, inherits the user's authority, and acts through the systems that own the work.

### What makes Vssyl different

- It is designed to make sophisticated connected capability practical for everyday and growing businesses, not only organizations with enterprise-software teams.
- Participation can span the organization, while the experience adapts to the person instead of merely hiding or showing the same interface.
- Applications remain understandable and responsible for their own truth.
- External systems can remain authoritative; Vssyl connects before it replaces.
- Shared capabilities consume governed contributions from applications and integrations rather than reconstructing domain logic independently.
- Personal and Business live in one system without treating their boundaries as optional.
- AI is part of the governed platform, not a disconnected chatbot layer.
- The platform is intended to absorb complexity and reduce operating burden rather than add another layer of software administration.

---

## 9. Source basis and maintenance rules

This guide is a product-language reference. It should remain durable while implementation changes underneath it.

### Repository basis

- Root repository orientation and mental model: `AGENTS.md`.
- Durable project identity: `memory-bank/projectbrief.md`.
- System-level product model: `memory-bank/productContext.md`.
- AI product philosophy: `memory-bank/aiProductPhilosophy.md`.
- Business naming: `memory-bank/vssylBusinessNaming.md`.
- Active ProductContexts for Dashboard, File Hub, Chat, Calendar, To-Do, HR, Scheduling, Place, Marketplace, Analytics, Settings, Members, Presence, V_Link, Developer, Notifications, and Platform Admin.
- Canonical architecture boundaries for Search, Policy Engine, V_Link, application lifecycle, interoperability, workspace/navigation, and Business Administration.
- This Draft 2 also incorporates ratified product-level conclusions about target market accessibility, organization-wide participation, connect-before-replace interoperability, application contributions, and complexity absorption. Competitor comparisons that helped reach those conclusions are intentionally excluded from the canonical guide.

### Maintenance rules

1. Change this guide only for product meaning or terminology, not for routine implementation status.
2. Do not add pricing, tiers, vendors, route names, database schemas, deployment details, or phase completion claims as product definitions.
3. When architecture and this guide disagree about architecture, the canonical architecture owner wins and this guide should be corrected.
4. When code and this guide disagree about shipped behavior, code/status evidence wins; this guide should not be used to claim implementation.
5. Add a new glossary term only when the term has a distinct product meaning that people are likely to misuse.
6. Do not turn descriptive concepts such as shared operational understanding into branded subsystems without a separate product/architecture decision.
7. Keep application contribution definitions at the product level here; schemas, contracts, metadata, context-provider rules, event models, APIs, integration pipelines, and workflow engines belong in architecture/implementation documentation.
8. When a term has an open branding or commercial decision, mark it open rather than silently resolving it.
9. Prefer canonical qualifiers over ambiguous shorthand: Business workspace, Business Administration, Platform Admin, business member role, org position, AI context, operating context.

### Recommended next repository use

- Use this guide as the source for rewriting the public GitHub README.
- Use the glossary to review current UI labels, docs, ProductContexts, and Cursor prompts for terminology drift.
- Consider publishing a PDF as a generated reference artifact from this editable source.
- Do not make this guide another architecture source of truth; it should point to architecture rather than duplicate it.

### Ratification checkpoint

Before treating this as canonical, review the glossary specifically for any terms you want renamed or made more user-friendly. The biggest intentionally open naming decision remains how visible "Digital Life Twin" should be to end users.

---

*One platform. Clear contexts. Owned domains. Shared understanding.*

*Draft 2 — Product Definition & Canonical Language Guide*
