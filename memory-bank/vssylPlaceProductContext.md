<!--
Update Rules for vssylPlaceProductContext.md
- Only updated for major changes in Vssyl_Place product context, user experience goals, or core problems solved.
- All changes must be reviewed and approved before updating.
- Should always reflect the single source of truth for Vssyl_Place product context and UX vision.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Vssyl_Place Product Context

**Created**: January 2026  
**Last Updated**: March 2026  
**Status**: ✅ **IMPLEMENTED** — All 7 phases complete, deployed to production  
**Vision**: A personal "Main Street" — a user-built neighborhood that blends physical and digital stores into a modern, interconnected place

> **February 2026 Update — Implementation Complete**: All 7 phases implemented and deployed to production (`vssyl.com/place`). Backend: 8 controllers, 60+ API endpoints, 7 Prisma migrations with 20+ new models. Frontend: Place page with 5 sub-tabs (My Place, Explore, Meetings, Feed, Insights), 10+ components, React Flow graph visualization, real-time WebSocket updates. AI: 5 context providers registered. Notifications: Place category integrated.
>
> **March 2026 Update — Business Admin & Listing Images**: Place listing editing centralized in Business Admin dashboard (Vssyl Place section). Separate cover image (header) and avatar/thumbnail image (cards, map node); upload/delete endpoints for both. Zod validation for upsert listing and add link; frontend surfaces backend validation errors.

---

## Table of Contents

1. [Cross-References & Context](#cross-references--context)
2. [Product Purpose & Vision](#product-purpose--vision)
3. [Core Philosophy](#core-philosophy)
4. [User Experience Goals](#user-experience-goals)
5. [Core Features](#core-features)
6. [All Decisions (1-26)](#all-decisions-1-26)
7. [Revised Implementation Phases](#revised-implementation-phases)
8. [Technical Architecture](#technical-architecture)
9. [Existing Framework to Leverage](#existing-framework-to-leverage)
10. [Success Metrics](#success-metrics)
11. [Notes & References](#notes--references)

---

## Cross-References & Context

- See [productContext.md](./productContext.md) for overall product vision
- See [systemPatterns.md](./systemPatterns.md) for architecture patterns
- See [roadmap.md](./roadmap.md) for implementation timeline
- See [businessProfileManagement.md](./businessProfileManagement.md) for business connection context
- See [activeContext.md](./activeContext.md) for current work focus
- See [progress.md](./progress.md) for implementation status

---

## Product Purpose & Vision

**Vssyl_Place** is a revolutionary social/connection/web interface that redefines how users interact with the internet. It transforms the fragmented web experience into a **personal Main Street** — a user-curated neighborhood where physical stores, digital businesses, restaurants, services, and connections all live side by side.

### The "Personal Main Street" Concept

Vssyl_Place is NOT a geographic map with real distances. It is a user-built, visual neighborhood — their own "Main Street" — where they curate the places they want to interact with. A user's Main Street might include:
- The local coffee shop down the street
- An Etsy shop across the country
- A ghost kitchen they order from on DoorDash
- A big-box retailer for groceries via Instacart
- A friend's small business in another state
- A digital service with no physical location at all

All of these coexist as "buildings" on the user's personal Main Street, regardless of physical location.

### Problems Solved
- **Fragmented Internet Experience**: Users jump between websites, apps, and services without context
- **Discovery Challenges**: Finding relevant businesses requires multiple searches and platforms
- **Lack of Personal Context**: The internet doesn't adapt to individual users' needs and relationships
- **Transaction Friction**: Purchasing, reservations, and interactions require switching between multiple platforms
- **Social Isolation**: Current platforms don't facilitate meaningful connections between users and communities
- **Information Overload**: Too much information, too little personalization
- **Vanity Metrics Culture**: Existing platforms prioritize follower counts and likes over genuine connections

### Core Vision

Vssyl_Place enables users to:
1. **Build Their Personal Main Street**: A curated neighborhood of physical and digital places they interact with
2. **Follow & Connect**: Follow businesses and users to add them to their neighborhood
3. **Interact Directly**: Order food, buy groceries, purchase gifts, make reservations — all from their Main Street
4. **Discover Locally First**: Geography seeds initial suggestions to push local purchases and community
5. **Expand Globally**: Follow businesses anywhere — digital stores, remote shops, favorite brands
6. **AI-Powered Assistance**: Use AI to make reservations, purchase items, and get personalized recommendations

---

## Core Philosophy

These principles guide every Vssyl_Place decision:

1. **No Vanity Metrics**: Follower counts are private to the business owner. Never publicly visible. We are NOT building another social media platform chasing likes and follows.
2. **Genuine Connections**: This is about actual, meaningful interactions — not superficial engagement metrics.
3. **User Controls Their Destiny**: Privacy settings, algorithm preferences, recommendation tuning — the user decides everything.
4. **Local First, Then Global**: Geography seeds initial discovery to support local businesses and communities, but users can follow anything anywhere.
5. **Physical + Digital Coexist**: A user's Main Street is not bound by geography. Online-only shops, ghost kitchens, and digital services belong just as much as the corner store.
6. **Businesses Control Their Presence**: Business admins create their "building/page" and decide how users can interact with them (website links, DoorDash, social media, Instacart, etc.).

---

## User Experience Goals

### Primary Goals
- **Visual Main Street**: See your curated neighborhood as an interactive Mini Metro-style network visualization
- **Personalized Discovery**: Businesses surface based on location, connections, interests, and AI recommendations
- **Seamless Transactions**: Purchase items, make reservations, and interact with businesses without leaving Vssyl_Place
- **Social Context**: See how connections relate to each other and discover new ones through existing relationships
- **AI Assistance**: Natural language interactions for reservations, purchases, and recommendations
- **Full User Control**: Privacy, preferences, and algorithm tuning always in the user's hands

### Visual Design Philosophy

**Inspiration**: Mini Metro (transportation network game)

**Key Visual Principles**:
- **Network Visualization**: Connections shown as lines/edges between nodes (users, businesses, places)
- **Node Types**: Geometric shapes represent entity types
  - **Circles** = People/Users
  - **Squares** = Businesses
  - **Triangles** = Restaurants
  - **Other shapes** = Additional entity types (grocery, digital services, etc. — to be refined)
  - **Colors** = Used to connect and categorize like items
- **Interactive Manipulation**: Pinch-to-zoom, tap, drag to rearrange (touch-optimized)
- **Color Coding**: Visual distinction between connection types and categories
- **User-Customizable Layout**: Force-directed default positioning, with drag-to-rearrange and saved layouts
- **Dynamic Updates**: Real-time updates as connections and relationships change via WebSockets

### Navigation Structure

```
Header: [ Vssyl_Place ] [ Personal ] [ Work ] [ ... ]
                |
                v
        Sub-tabs within Vssyl_Place:
        [ My Place ] [ Explore ] [ (future tabs) ]
```

- **Vssyl_Place**: First tab in the main header (before personal dashboards)
- **My Place** (primary sub-tab): User's personal Main Street / neighborhood graph
- **Explore** (secondary sub-tab): Discover new businesses, browse categories, search
- **Future tabs**: To be determined as features expand

---

## Core Features

### 1. Personal Main Street (My Place)
- **Neighborhood Graph**: Interactive Mini Metro-style visualization of followed businesses and connections
- **User-Curated**: Users build their own Main Street by following businesses
- **Drag to Rearrange**: Customize node positions, save personal layouts
- **Node Interaction**: Click a business "building" → see all interaction methods (website, DoorDash, Instacart, social media, etc.)
- **Privacy Controls**: Per-business follow visibility toggle, global privacy setting in avatar menu
- **Auto-Seeded**: Initial neighborhood populated with local businesses based on geolocation

### 2. Explore & Discovery
- **Local-First Discovery**: Geography seeds initial suggestions to push local purchases
- **Algorithm-Driven**: As user follows more, algorithm suggests similar businesses
- **AI-Powered Suggestions**: Digital Life Twin provides personalized recommendations
- **Category Browsing**: Filter by restaurant, retail, grocery, digital services, etc.
- **Search**: Full-text search for businesses, categories, areas
- **"Why You're Seeing This"**: Transparency tooltips on all suggestions
- **User Controls**: Dismiss/hide, "Not interested", tune category preferences

### 3. Business "Buildings"
- **Business Page Creator**: Admin tool for business admins to create their public-facing "building"
- **Interaction Links**: Website, social media, DoorDash, Instacart, OpenTable, Uber Eats, custom URLs
- **Category System**: Restaurants, retail, grocery, ghost kitchens, digital services, etc.
- **Verification Required**: Only verified businesses appear in Place
- **Verification Badge**: Visual indicator on business nodes
- **Business Controls**: Business decides how users can interact with them

### 4. Connection System
- **Business Follows**: Follow/unfollow businesses (building on existing `BusinessFollow` model)
- **User Connections**: Follow other users (building on existing `Relationship` model)
- **Per-Business Privacy**: Toggle visibility of individual follows
- **Private Follower Counts**: Business sees their own count, never publicly displayed
- **Connection Types**: Visual distinction via line styles/colors in the graph

### 5. Transactions & Interactions
- **In-Place Purchasing**: Buy directly from business nodes via Stripe
- **External Routing**: Route to DoorDash, Instacart, OpenTable, etc. from business node
- **Order Management**: Track orders and transactions
- **Transaction History**: Personal transaction history view
- **Per-Transaction Fees**: Small Vssyl cut (Shopify model)

### 6. AI-Powered Features
- **Recommendation Engine**: Personalized discovery via Digital Life Twin
- **Reservation Assistant**: AI makes reservations via integrated services
- **Purchase Assistant**: AI helps find and buy items
- **Natural Language Interaction**: Ask questions, make requests in plain language

### 7. Meeting Places (Phase 6)
- **Location Marking**: Mark and share meeting places with connections
- **Calendar Integration**: Link meeting places to calendar events
- **Map View**: Optional geographic map view alongside Main Street graph

### 8. Onboarding
- **5-10 Step Tutorial**: Popup walkthrough on first visit showing Explore, following, adding places
- **Auto-Seeded Neighborhood**: Local places immediately populate the initial Main Street
- **Interest Selection**: User selects interests and places during setup to seed their map
- **Progressive Disclosure**: Start simple, reveal complexity as user engages

---

## All Decisions (1-26)

All product, design, technical, and business questions have been answered. This is the complete decision reference.

### Design Decisions (1-4)

**1. Visual Style** ✅ **Mini Metro**
- Clean, minimalist connection visualization with geometric shapes and clean lines
- Galaxy style deferred — too challenging to render currently

**2. Interaction Patterns** ✅ **Touch-Optimized Graph**
- Pinch-to-zoom, tap to select, drag to rearrange
- Desktop-first priority with touch optimization for mobile
- Desktop: mouse zoom, pan, click, drag
- Mobile: pinch, tap, swipe

**3. Node Representation** ✅ **Geometric Shapes with Color Coding**
- **Circles** = People/Users
- **Squares** = Businesses
- **Triangles** = Restaurants
- **Other shapes** = Additional entity types (to be refined per category)
- **Colors** = Used to connect and categorize like items

**4. Connection Visualization** ✅ **Geometric Shapes with Color Coding**
- Different connection types shown with different line styles/colors
- Colors help connect and categorize related items

### Technical Decisions (5-8)

**5. Visualization Library** ✅ **React Flow** (`@xyflow/react`)
- Built specifically for React (matches existing stack)
- Good performance, customizable nodes/edges
- Supports Mini Metro style easily
- Compatible with existing architecture

**6. Performance (Large Networks)** ✅ **Multi-Layered Optimization**
- **Virtualization**: Only render visible nodes
- **Level-of-Detail (LOD)**: Simplify nodes when zoomed out
- **Clustering**: Group nearby nodes at low zoom levels
- **Pagination/Lazy Loading**: Load connections in batches
- **Web Workers**: Offload layout calculations to background threads
- **Target**: Smooth performance with 100+ connections

**7. Real-time Updates** ✅ **WebSocket Integration**
- Extend existing WebSocket system (`chatSocketService.ts` pattern)
- New connections, status changes, transactions appear in real-time

**8. Spatial Layout** ✅ **Hybrid (Force-Directed + User-Defined)**
- **Force-Directed** (Default): Nodes naturally space based on connection strength, similar nodes cluster
- **User-Defined** (Customizable): Drag and reposition nodes, save custom layouts per user
- **Hierarchical**: Optional for specific views

### Business Decisions (9-12)

**9. Business Onboarding (Public Profiles)** ✅ **Business Admin Page Creator**
- Business admins build their "building/page" in admin section
- Separate project requiring dedicated planning
- Location: Business admin section (`/business/[id]/admin/`)

**10. Transaction Fees** ✅ **Small Per-Transaction Fee (Shopify Model)**
- Small per-transaction fee (e.g., $0.01-$0.05)
- For transactions within Vssyl_Place
- Exact fee structure TBD

**11. Business Verification** ✅ **Existing System + Gate**
- Leverage existing business verification in setup workflow
- **Only verified businesses appear** in Vssyl_Place
- Visual verification badge on business nodes
- Future: Physical mail verification (Google-style code mailed to business address)

**12. Marketplace Integration** ✅ **Broader Than Module Marketplace**
- Vssyl_Place includes businesses, services, products — broader scope
- Module marketplace is separate; Vssyl_Place is the social/connection layer
- Complementary but distinct systems

### Product Decisions (13-26) — February 2026

**13. Privacy Model** ✅ **Private by Default, User-Controlled**
- User's neighborhood is **private by default**
- Per-business toggle: user decides if individual follows are visible to others
- Global privacy setting added to avatar menu
- Businesses see their own follower count — **never publicly visible**
- Philosophy: genuine connections, not chasing follows/likes

**14. Discovery Algorithm** ✅ **Local-First, Algorithm-Enhanced, AI-Powered**
- Geography as the starting point — push local purchases first
- As user follows more, algorithm suggests similar businesses
- AI-powered suggestions via Digital Life Twin
- Sub-tab structure: Vssyl_Place header tab → My Place (primary), Explore (secondary), future tabs

**15. Work Integration** ✅ **Personal Only at Launch**
- Vssyl_Place lives on the personal side only
- Business-facing Vssyl_Place is a **future expansion** (separate large project)
- For now, business admins create public-facing pages visible in Explore/neighborhoods

**16. Migration Path** ✅ **N/A — Fresh Start**
- No existing users to migrate (platform is new)
- All users will be new to the entire platform

**17. Onboarding Strategy** ✅ **Tutorial + Auto-Seed + Interest Selection**
- 5-10 step tutorial popup on first visit
- Shows: Explore page, following businesses, adding places to neighborhood
- Initial neighborhood auto-populated with local places via geolocation
- User selects interests and places during setup to seed their map immediately

**18. Mobile Experience** ✅ **Touch-Optimized Graph, Desktop-First**
- Touch-optimized graph with pinch-to-zoom and tap interactions
- Every user starts on My Place (neighborhood), Explore is secondary tab
- **Desktop-first** development priority
- Mobile gets same graph experience, optimized for touch

**19. Community Model** ✅ **Hybrid, Phase 7+**
- Hybrid approach: derived cluster suggestions that can be formalized into explicit communities
- Deferred to Phase 7+ — not in initial launch scope

**20. Monetization** ✅ **Free Listings + Premium Promotions (Phase 7+)**
- Free for all businesses to create listings
- Premium promoted placement as paid feature (Phase 7+)
- Integrate premium features into existing tiered business payment levels
- Per-transaction fees from Decision #10 remain in effect

**21. Verification Strategy** ✅ **Existing Verification + Visibility Gate**
- Existing business verification sufficient for launch
- **Only verified businesses visible** in Vssyl_Place
- Visual verification badge on business nodes in the graph
- Future enhancement: Physical mail verification (Google-style — code mailed to address)

**22. Content Moderation** ✅ **Admin Portal + Auto-Flagging, Proportional**
- Leverage existing admin portal user submission/review system
- Add auto-flagging for suspicious patterns (no website, duplicate info, bot-like behavior)
- Moderation intensity scales proportionally with platform growth
- Use existing `ContentReport` model infrastructure
- Escalation: Report → Auto-flag → Admin review → Action

**23. Geographic Scope** ✅ **US-Only Launch, Global Future**
- US-only at launch, expand globally as Vssyl grows
- Geography is just the **starting point** for discovery suggestions
- Once followed, a business is in your neighborhood regardless of distance
- Digital-only businesses (Etsy shops, ghost kitchens, digital services) fit naturally
- The Main Street is NOT a physical map — it's a user-curated neighborhood

**24. Accessibility** ✅ **Launch Requirement**
- Full accessibility is a launch requirement (not post-launch)
- Keyboard navigation through the graph
- Screen reader support (ARIA labels on all nodes/edges)
- High contrast mode
- Alternative list view of neighborhood as fallback
- Continue existing accessibility patterns from the rest of the application

**25. External Integrations** ✅ **Business-Controlled Interaction Links**
- All integration types are important
- Business admins create their "building" and configure interaction links:
  - Website URL
  - Social media links
  - DoorDash / Uber Eats
  - Instacart
  - OpenTable / Resy
  - Custom URLs
- When user clicks a business node, they see all interaction methods the business has configured
- The business controls how users interact with them

**26. Algorithm Transparency** ✅ **Full User Control**
- "Why you're seeing this" tooltips on all suggestions
- Dismiss/hide suggestions with "Not interested"
- Tune preferences (show more restaurants, fewer retail, etc.)
- Algorithm also learns silently from user behavior (follows, dismissals, interactions)
- Users control their destiny — transparency and control are core principles

---

## Revised Implementation Phases

### Phase 1: Foundation, Design & Onboarding ✅ COMPLETE

**Goal**: Get the `/place` route live with the visual framework and onboarding flow

**Existing Framework to Leverage:**
- ✅ Next.js App Router (`web/src/app/`)
- ✅ React Context System (`web/src/contexts/`)
- ✅ Shared Components (`shared/src/components/`)
- ✅ Header Navigation (`web/src/components/GlobalHeaderTabs.tsx`)
- ✅ Authentication System (`server/src/middleware/auth.ts`)
- ✅ User Model with location (`prisma/modules/auth/user.prisma`)
- ✅ AI Onboarding Flow pattern (`web/src/components/ai/AIOnboardingFlow.tsx`)

**New Features to Build:**
- Database schema: `Place`, `PlaceCustomization`, `PlaceNode` models
- React Flow setup with Mini Metro visual design system
- `/place` route with sub-tab structure: **My Place** | **Explore**
- Header tab integration (Vssyl_Place as first tab in `GlobalHeaderTabs.tsx`)
- `PlaceContext` provider for state management
- **Onboarding flow**: 5-10 step tutorial, interest selection, local place seeding
- **Geolocation service**: Detect user location to seed initial local businesses
- **Accessibility foundation**: Keyboard navigation, ARIA labels on all nodes/edges, high contrast mode, alternative list view of neighborhood
- **Global privacy setting**: Add to avatar menu (private by default)
- Touch-optimized graph interactions (pinch-to-zoom, tap)
- Desktop-first responsive layout

---

### Phase 2: Business "Buildings" & Verification ✅ COMPLETE

**Goal**: Businesses can create their public-facing page/building that appears on the map

**Existing Framework to Leverage:**
- ✅ `Business` Model (`prisma/modules/business/business.prisma`)
- ✅ `BusinessBranding` Model (logos, colors)
- ✅ Business Controllers (`server/src/controllers/businessController.ts`)
- ✅ Global Search System (`GlobalSearchContext`, `searchController`)
- ✅ Existing business verification workflow

**New Features to Build:**
- **Business Page Creator** (admin tool): Business admins build their "building" — logo, description, category, interaction links
- **Interaction links system**: Website, social media, DoorDash, Instacart, OpenTable, Uber Eats, custom URLs
- **Business categories**: Restaurants, retail, grocery, digital services, ghost kitchens, etc.
- **Verification gate**: Only verified businesses appear in Place (leverage existing verification)
- **Visual verification badge** on business nodes
- Business node rendering: Geometric shapes with category-based differentiation
- **Business search provider**: Add to global search system for Place

---

### Phase 3: Connections & My Place ✅ COMPLETE

**Goal**: Users can follow businesses and build their personal Main Street

**Existing Framework to Leverage:**
- ✅ `BusinessFollow` Model (`prisma/modules/business/business.prisma`)
- ✅ `Relationship` Model (user-to-user connections)
- ✅ `UserPrivacySettings` Model (`prisma/modules/auth/user.prisma`)
- ✅ Connection Controllers (`memberController.ts`, `businessController.ts`)
- ✅ Notification System (`NotificationService`)
- ✅ WebSocket System (`chatSocketService.ts`)

**New Features to Build:**
- **Follow system**: Follow/unfollow businesses from Explore or business pages
- **Per-business privacy toggle**: Control visibility of individual follows
- **Neighborhood graph**: Followed businesses appear as nodes in My Place
- **User connections**: Follow other users (building on `Relationship` model)
- User nodes (circles) and business nodes (shapes) in the same graph
- **Force-directed layout** with user customization (drag to rearrange, save positions)
- **Node interaction**: Click a business node → shows all interaction methods configured by business
- **Connection types**: Visual distinction via line styles/colors
- **Real-time updates**: WebSocket integration for new follows, status changes
- Follower count visible to business only (never public)
- **Content moderation foundation**: Leverage `ContentReport` model, auto-flagging basics

---

### Phase 4: Explore & Discovery ✅ COMPLETE

**Goal**: Users discover new businesses and connections through intelligent suggestions

**Existing Framework to Leverage:**
- ✅ Global Search System (provider pattern)
- ✅ Location System (`Country`, `Region`, `Town` models)
- ✅ Digital Life Twin System (`DigitalLifeTwinCore`, `DigitalLifeTwinService`)
- ✅ AI Context Engine (`CrossModuleContextEngine`)

**New Features to Build:**
- **Explore tab UI**: Browsable, searchable directory of verified businesses
- **Geographic suggestions**: Surface local businesses based on user location
- **Algorithm-driven suggestions**: Based on existing follows, similar businesses
- **AI-powered recommendations**: Digital Life Twin integration for personalized suggestions
- **"Why you're seeing this"** tooltips on all suggestions
- **User controls**: Dismiss/hide, "Not interested", tune category preferences
- **Interest-based filtering**: Filter by category, location, type
- **Search within Explore**: Full-text search for businesses, categories, areas
- **Vssyl_Place AI context providers**: `place_overview`, `place_connections`, `place_discoveries`
- Register in `server/src/startup/registerBuiltInModules.ts`

---

### Phase 5: Transactions & Interaction ✅ COMPLETE

**Goal**: Users can interact with businesses directly from their neighborhood

**Existing Framework to Leverage:**
- ✅ Stripe Integration (`StripeService`, `paymentController`)
- ✅ `User.stripeCustomerId` field
- ✅ Payment Components (`PaymentModal`, `QueryPackPurchase`)
- ✅ AI Query Purchase pattern (`AIQueryPurchase` model)

**New Features to Build:**
- **Transaction model**: Purchase and order records
- **In-Place purchasing**: Buy directly from business nodes (Stripe integration)
- **External interaction routing**: Route to DoorDash, Instacart, OpenTable, etc. from business node
- **Order management**: Track orders and transactions
- **Transaction history**: User transaction history view
- **Receipt generation**: Transaction confirmations
- **Per-transaction fees**: Small Vssyl cut (Shopify model)
- **Transaction privacy**: User controls what's visible

---

### Phase 6: AI Enhancement & Meeting Places ✅ COMPLETE

**Goal**: AI assistant helps with reservations, purchases, recommendations + location coordination features

**Existing Framework to Leverage:**
- ✅ Digital Life Twin System
- ✅ AI Context Engine and Registry
- ✅ AI Routes (`/api/ai/twin`, `/api/ai/query`)
- ✅ AI Personality Engine
- ✅ AI Chat Components (`AIChatDropdown`, `AIChatModule`)
- ✅ Calendar System (`Calendar`, `Event` models)
- ✅ Location System (`Country`, `Region`, `Town`)

**New Features to Build:**
- **Reservation assistant**: AI makes reservations via OpenTable/Resy integration
- **Purchase assistant**: AI helps find and buy items from Main Street businesses
- **Advanced recommendation engine**: Deep personalization via Digital Life Twin learning
- **Meeting Places**: Mark and share locations with connections
- **Calendar integration**: Link meeting places to calendar events
- **Map view** (optional): Geographic view alongside Main Street graph
- **Location privacy controls**: Control location visibility and sharing

---

### Phase 7: Advanced Features & Growth ✅ COMPLETE

**Goal**: Communities, analytics, premium features, scaling, global expansion

**Existing Framework to Leverage:**
- ✅ Analytics Infrastructure (`analyticsController`, analytics models)
- ✅ Activity Tracking (`Activity` model)
- ✅ Notification System (complete infrastructure)
- ✅ WebSocket System (real-time updates)
- ✅ Module Review System (adaptable for business reviews)
- ✅ Existing tiered business payment levels

**New Features to Build:**
- **Community system** (hybrid): Derived clusters + formalized groups
- **Activity feed & timeline**: Real-time WebSocket feed, filterable by type
- **Advanced analytics**: Personal network analytics, spending insights, network evolution
- **Premium business features**: Promoted placement, advanced analytics (integrate into existing payment tiers)
- **Physical mail verification** (Google-style code mailed to business)
- **Data export**: Connections, transactions (GDPR-compliant)
- **External platform imports**: LinkedIn, Google Contacts, social imports
- **Global expansion**: International business support, localization
- **Business-side Vssyl_Place**: Future expansion for business-to-business connections
- Moderation scaling: Enhanced auto-flagging, ML-based detection

---

## Technical Architecture

### Database Models (Implemented)

**Core Models** (Phase 1):
- **Place**: User's personalized Main Street configuration
- **PlaceCustomization**: User preferences for layout, theme, node positions
- **PlaceNode**: Individual node positions and customizations saved per user
- **PlaceInterest**: User interest categories for discovery

**Business Models** (Phase 2):
- **BusinessPlaceListing**: Public-facing business "building" — extends existing `Business` model. Fields include `coverImage` (header banner), `avatarImage` (thumbnail/map; optional, falls back to cover then logo).
- **BusinessInteractionLink**: Links to website, DoorDash, Instacart, social media, etc.
- **BusinessCategory**: Category assignments (enum-based)

**Privacy Models** (Phase 3):
- **PlaceFollowVisibility**: Per-business follow visibility toggle

**Transaction Models** (Phase 5):
- **PlaceTransaction**: Purchase, external click, and reservation records with Stripe integration
- **PlaceInteractionClick**: Granular click analytics for external interaction links

**Meeting Models** (Phase 6):
- **PlaceMeetingPlace**: Meeting coordination with location, scheduling, calendar links
- **PlaceMeetingInvite**: RSVP management for meeting invitees
- **PlaceLocationPrivacy**: User-controlled location sharing settings

**Community & Analytics Models** (Phase 7):
- **PlaceCommunity**: User-created and auto-clustered groups
- **PlaceCommunityMember**: Community membership with roles
- **PlaceActivityFeedItem**: Polymorphic activity timeline
- **PlaceAnalyticsSnapshot**: Periodic user analytics snapshots

All models defined in `prisma/modules/place/place.prisma` with relations in `prisma/modules/auth/user.prisma` and `prisma/modules/business/business.prisma`.

### Integration Points

**Existing Systems:**
- `BusinessFollow` model (business connections)
- `Relationship` model (user connections)
- `UserPrivacySettings` model (privacy controls)
- Stripe payment integration (transactions)
- AI system (Digital Life Twin for recommendations and assistance)
- Business profiles and workspace
- Global search system
- Notification system
- WebSocket system
- Calendar system
- Admin portal (moderation)
- `ContentReport` model (content moderation)

**New Systems (Built):**
- Place visualization engine (React Flow) — `PlaceGraph.tsx`
- Business page creator (admin tool) — `BusinessPlaceListingAdmin.tsx`
- Interaction link system — `BusinessProfilePanel.tsx` with click tracking
- Transaction processing system — `placeTransactionController.ts`
- Geolocation service — `geolocationService.ts` (leveraged existing)
- Discovery/recommendation algorithm — `placeDiscoveryController.ts`, `placeAIController.ts`
- Place AI context providers — 5 providers registered in `registerBuiltInModules.ts`
- Meeting coordination — `placeMeetingController.ts`
- Community system — `placeCommunityController.ts`
- Activity feed & analytics — `placeAnalyticsController.ts`

### Navigation Integration (Implemented)

- **Header Position**: Vssyl_Place is the **FIRST tab** in the user header (`GlobalHeaderTabs.tsx`)
- **Sub-tabs**: My Place | Explore | Meetings | Feed | Insights
- **Routes**: `/place` (main), `/place/transactions` (history)
- **Visual Distinction**: MapPin icon, unique styling
- **Scope**: Personal side only at launch (no business-side Place)
- **Additional UI**: History link, Privacy settings modal

---

## Existing Framework to Leverage

**Authentication & User Management:**
- User model, authentication, JWT system
- User profiles, photos, location tracking (Country/Region/Town)
- Privacy settings system (`UserPrivacySettings`)

**Connection Systems:**
- `Relationship` model (user-to-user)
- `BusinessFollow` model (user-to-business)
- Connection request/management controllers

**Business Management:**
- Business profiles, branding, members
- Business workspace system
- Business verification workflow
- Module installation and management

**Payment & Transactions:**
- Stripe integration (payments, subscriptions, customer management)
- Payment controllers and services
- Existing tiered business payment levels

**AI & Intelligence:**
- Digital Life Twin system
- AI context engine and providers
- AI chat and assistants
- Personality engine

**Search & Discovery:**
- Global search system with extensible provider pattern
- Search controllers and contexts

**Calendar & Events:**
- Calendar models and system
- Event management, RSVP, attendees

**Notifications:**
- Complete notification system with NotificationService
- Real-time WebSocket updates

**Analytics:**
- Personal analytics endpoints
- Analytics data models
- Activity tracking

**Content Moderation:**
- `ContentReport` model and admin infrastructure
- Admin portal with submission review

**Location System:**
- Country/Region/Town hierarchy
- User location tracking

---

## Success Metrics

- **User Engagement**: Daily active users on Vssyl_Place, time spent in My Place and Explore
- **Neighborhood Growth**: Average businesses per user's Main Street, follow rate
- **Local Discovery**: % of follows that are geographically local businesses
- **Transaction Volume**: Purchases and interactions made through Vssyl_Place
- **Discovery Rate**: New businesses discovered through Explore and AI suggestions
- **AI Usage**: AI-assisted reservations, purchases, recommendations
- **Business Adoption**: Number of verified businesses with public pages
- **Interaction Depth**: Click-throughs on business interaction links (DoorDash, website, etc.)
- **Retention**: Users returning to their Main Street daily/weekly

---

## Notes & References

### Design Inspiration
- **Mini Metro**: Transportation network game with clean, minimalist connection visualization — PRIMARY inspiration
- **Personal Main Street**: The core metaphor — a user-curated street of places, not a geographic map
- **Graph Theory**: Network graph visualization principles
- **Anti-inspiration**: Social media vanity metrics (follower counts, likes) — we deliberately avoid this

### Technical References
- **React Flow** (`@xyflow/react`): Chosen visualization library
- **Recharts**: Existing charting library in codebase (React Flow follows similar patterns)
- **OrgChartVisualView**: Existing large graph handling pattern in codebase

### Key Architectural Decisions
- Desktop-first, touch-optimized for mobile
- React Flow for visualization
- Force-directed layout with user customization
- WebSocket for real-time updates
- Accessibility as launch requirement
- Personal-only scope at launch (no business-side Place)
- US-only geographic scope at launch

---

**Last Updated**: March 2026  
**Status**: ✅ **IMPLEMENTED** — All 7 phases complete, deployed to production (`vssyl.com/place`)  
**Next Steps**: User testing, business onboarding, iterate on UX feedback

### Business Admin as Main Editing Surface (March 2026)

- **Primary location**: Business Admin dashboard → **Vssyl Place** section in sidebar (between Branding and AI & Insights). This is the main point where businesses create and edit their Place profile.
- **Standalone page**: `/business/[id]/place` still available for deep links; uses same `PlaceListingEditor` component.
- **Editor**: `PlaceListingEditor` supports compact mode when embedded in Business Admin; full mode on standalone page.

### Listing Images: Cover vs Avatar (March 2026)

- **Cover image** (`coverImage`): Hero/banner at the top of the Business Profile panel and (when no avatar) as strip/thumb on Explore cards. Upload via "Cover Image" in Place Listing editor; endpoints `POST/DELETE /api/place/listing/:businessId/cover`.
- **Avatar/thumbnail image** (`avatarImage`): Optional separate image for the small square on the profile card, Explore cards, and the map node. If set, it is used for thumbnail and map; if not set, fallback is cover image then business logo. Upload via "Thumbnail / Avatar Image" in Place Listing editor; endpoints `POST/DELETE /api/place/listing/:businessId/avatar`.
- **Display logic**: Header = cover only. Thumbnail (card + map) = `avatarImage ?? coverImage ?? business.logo`. Map node image comes from `getPlace()` enrichment: `avatarImage ?? coverImage ?? logo`.

### Backend Validation (March 2026)

- **Upsert listing**: Zod schema for displayName, shortDescription, coverImage, avatarImage, category, tags, nodeColor, nodeShape, isEnabled, isPublished (strict; optional fields validated when present).
- **Add interaction link**: Zod schema for type (enum), label, url (auto-prefix https if missing), sortOrder. Validation errors returned as 400 with `details` (fieldErrors); frontend surfaces message to user.

### Key Implementation Files

**Backend Controllers** (`server/src/controllers/`):
- `placeController.ts` — Place CRUD, node management, AI context overview
- `placeListingController.ts` — Business listing management (admin)
- `placeDiscoveryController.ts` — Explore, local/for-you suggestions, AI context
- `placeTransactionController.ts` — Transactions, interaction clicks, stats
- `placeAIController.ts` — AI recommendations, purchase/reservation help, activity context
- `placeMeetingController.ts` — Meetings, RSVPs, calendar links, location privacy
- `placeCommunityController.ts` — Communities, auto-clusters, membership
- `placeAnalyticsController.ts` — Activity feed, personal analytics, data export, analytics context

**Backend Routes**: `server/src/routes/place.ts` (60+ endpoints under `/api/place`)

**Frontend Pages** (`web/src/app/`):
- `place/page.tsx` — Main Place page with 5 sub-tabs
- `place/layout.tsx` — PlaceProvider wrapper
- `place/transactions/page.tsx` — Transaction history

**Frontend Components** (`web/src/components/place/`):
- `PlaceGraph.tsx` — React Flow neighborhood visualization
- `PlaceOnboarding.tsx` — Interest selection and tutorial
- `PlaceExplore.tsx` — Business discovery
- `BusinessProfilePanel.tsx` — Business detail panel with interaction links
- `PlaceMeetings.tsx` — Meeting coordination
- `PlaceActivityFeed.tsx` — Activity timeline
- `PlaceAnalyticsDashboard.tsx` — Personal analytics insights
- `PlacePrivacySettings.tsx` — Location privacy modal
- `BusinessPlaceListingAdmin.tsx` — Business admin listing manager

**Context & API** (`web/src/`):
- `contexts/PlaceContext.tsx` — Central state management with WebSocket
- `api/place.ts`, `api/placeTransaction.ts`, `api/placeMeeting.ts`, `api/placeAnalytics.ts`

**Database**: `prisma/modules/place/place.prisma` (20+ models, 7 migrations)
