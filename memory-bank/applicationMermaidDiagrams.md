# Application architecture — Mermaid diagrams

Canonical **visual maps** of Vssyl for onboarding and AI context. These complement prose in `systemPatterns.md` and `techContext.md`.

**Last updated:** 2026-05-15

## Diagram 1 — Platform and deployment (whole application)

High-level clients, Next.js + Express, data stores, realtime, and major externals. Aligns with deployment notes in `systemPatterns.md` (Cloud Run, proxy, Prisma, GCS).

```mermaid
flowchart TB
  subgraph Clients["Clients"]
    U[Users]
    BR[Browser]
  end

  subgraph Surface["Product surfaces"]
    L["Marketing / landing"]
    A["Auth flows"]
    D["Personal dashboard and modules"]
    W["Work tab / business workspace"]
    H["Household / education contexts"]
    AP["Admin portal"]
  end

  subgraph GCP["Google Cloud"]
    subgraph CRWeb["Cloud Run: web"]
      NEXT["Next.js App Router"]
      PROXY["BFF: /api/* catch-all proxy"]
      NA["NextAuth session"]
    end
    subgraph CRApi["Cloud Run: server"]
      EXP["Express HTTP API"]
      RT["Socket.io realtime"]
      CTL["Controllers"]
      SVC["Services domain logic"]
      AI["AI orchestration providers"]
      STG["storageService GCS or local"]
    end
    SQL[("Cloud SQL PostgreSQL")]
    GCS[("Cloud Storage objects")]
    SM["Secret Manager"]
    CB["Cloud Build CI/CD"]
  end

  subgraph DataAccess["Data and contracts"]
    PR["Prisma client"]
    TEN["Tenant scope dashboardId businessId householdId"]
    MOD["Built-in and marketplace modules"]
  end

  subgraph External["External services"]
    STR["Stripe billing"]
    MAIL["Email SMTP or provider"]
    AIP["LLM and AI APIs"]
  end

  U --> BR
  BR --> L
  BR --> A
  BR --> D
  BR --> W
  BR --> H
  BR --> AP

  BR --> NEXT
  NEXT --> NA
  NEXT --> PROXY
  PROXY -->|"JWT or session forwarded"| EXP
  BR <-->|"chat notifications"| RT

  EXP --> CTL --> SVC
  SVC --> PR --> SQL
  SVC --> STG --> GCS
  SVC --> AI --> AIP
  SVC --> STR
  SVC --> MAIL

  SVC -.-> TEN
  NEXT -.-> MOD
  EXP -.-> MOD

  CB -.-> CRWeb
  CB -.-> CRApi
  SM -.-> CRWeb
  SM -.-> CRApi
```

---

## Diagram 2 — Module interoperability lifecycle

Mutating actions follow **authorize → execute → side effects**; activity, notifications, and sockets run **only after** successful execution. Matches `.cursor/rules/module-interoperability.mdc` and `moduleSpecs.md`.

```mermaid
flowchart TD
  subgraph Client["Client"]
    UI["Module UI widget or page"]
    CTX["React contexts dashboard business household"]
  end

  subgraph Edge["Next.js"]
    FETCH["fetch /api/... relative paths"]
    PROXY["App Router proxy forwards to Express"]
  end

  subgraph API["Express API"]
    AUTH["Authenticate identity"]
    SCOPE["Authorize tenant scope dashboardId + businessId or householdId"]
    PERM["Permission check module or route policy"]
    EXEC["Execute domain mutation or read"]
    FAIL{"Authorized and valid?"}
  end

  subgraph SideEffects["Post-success side effects only"]
    ACT["Persist normalized module activity event"]
    ANA["Analytics derived separately optional async"]
    NOTIF["NotificationService types module_event"]
    SOCK["Socket.io room emit membership proven"]
  end

  subgraph Response["Response path"]
    RES["JSON or error to proxy"]
    RTUI["UI refetch cache invalidation or socket-driven update"]
  end

  UI --> CTX
  UI --> FETCH --> PROXY --> AUTH --> SCOPE --> PERM --> EXEC --> FAIL
  FAIL -->|"no"| ERR["4xx/5xx no activity emit"]
  FAIL -->|"yes"| ACT
  ACT --> ANA
  ACT --> NOTIF
  ACT --> SOCK
  ACT --> RES --> RTUI
  SOCK --> RTUI
  ERR --> RES
```

**Implementation note:** Domain events (`server/src/events/emitDomainEvent.ts`, subscribers under `server/src/events/subscribers/`) can fan out activity, analytics, and socket updates; controllers should still respect **no emit on failed/unauthorized** actions.

---

## Diagram 3 — Module surfaces (personal widgets vs business hub)

Where module IDs appear in the UI: **dashboard widgets** vs **business workspace** routing.

| Area | Source in repo |
|------|----------------|
| Personal widget types | `web/src/components/dashboard/widgetRegistry.ts` (`WIDGET_REGISTRY`) |
| Business hub mounts | `web/src/components/business/BusinessWorkspaceContent.tsx` (`switch (currentModule)`) |
| Work navigation | `web/src/components/BrandedWorkDashboard.tsx` (`?module=` query) |

```mermaid
flowchart TB
  subgraph Auth["Authenticated session"]
    U[User]
  end

  subgraph Personal["Personal home /dashboard"]
    DT["Dashboard tabs DashboardProvider"]
    WG["WidgetShell plus widget picker"]
    subgraph Reg["WIDGET_REGISTRY widget types"]
      R_COMM["chat"]
      R_FILES["drive"]
      R_PROD["calendar todo notes"]
      R_UTIL["ai notifications quickstats quicknotes bookmarks activityfeed"]
      R_BIZCTX["hr scheduling shown when dashboard context is business"]
    end
  end

  subgraph WorkEntry["Work tab branded experience"]
    BR["BrandedWorkDashboard"]
    NAV["router push business id workspace module query"]
  end

  subgraph BizHub["Business hub /business/id/workspace"]
    BWC["BusinessWorkspaceContent switch currentModule"]
    subgraph BizMods["Hub modules"]
      M_CORE["dashboard drive chat calendar"]
      M_BIZ["hr scheduling analytics"]
      M_PEOPLE["members connections maps to same members widget"]
      M_AI["ai notes"]
    end
  end

  U --> DT
  DT --> WG
  WG --> Reg

  U --> BR
  BR --> NAV --> BWC --> BizMods
```

**Nuances**

- Personal widgets are not always full-page module routes; some entries are summary tiles (`quickstats`, `activityfeed`, etc.).
- `connections` in the business hub renders the same surface as `members` (see comment in `BusinessWorkspaceContent.tsx`).
- Work rail availability can still be filtered by business configuration (`getModulesForUser` in `BrandedWorkDashboard.tsx`); the hub switch above is what mounts once a module id is selected.
