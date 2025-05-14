<!--
Update Rules for activeContext.md
- Only contains the current work focus, recent changes, and next steps.
- When a phase is completed, move its details to progress.md and summarize the outcome.
- Should always be up-to-date and concise.
- Date major updates or new sections.
- Use cross-references instead of duplication.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Active Context

## Current State

### Phase 1: Core Module Integration (Current - 3 months)

#### Chat System Integration
- Phase 1: Core Infrastructure ✅
  - Panel System
    - Resizable panels
    - Collapsible panels
    - Panel state management
    - Panel layout structure
    - Responsive design
  - Basic Message System
    - Message display
    - Message input
    - Message actions
    - Message reactions
    - Message status
    - Basic rich text support
    - Basic file attachments
  - UI Components
    - Chat layout
    - Message components
    - Basic thread UI
    - Typing indicators UI
    - Online status UI

- Phase 2: Thread System & Real-time Features ✅
  - Thread creation and management
  - Real-time updates
  - WebSocket infrastructure
  - Presence system

- Phase 3: Organization Structure ✅
  - Categories System
    - Category management
    - Category organization
    - Category permissions
  - Teams Implementation
    - Team creation
    - Team management
    - Team permissions
  - Resource Organization
    - Resource management
    - Resource sharing
    - Resource permissions
  - Permissions Hierarchy
    - Role-based access
    - Permission inheritance
    - Access control

- Phase 4: Enterprise Features ✅
  - Analytics System
    - Thread analytics service
    - User analytics service
    - Tag analytics service
    - Search analytics service
    - Real-time analytics updates
  - Analytics Dashboard
    - Date range picker
    - Comparative analytics
    - User statistics
    - Tag analytics
    - Trending threads
    - Activity charts
    - Export functionality
  - Search Enhancements
    - Advanced thread search
    - Real-time search updates
    - Search suggestions
    - Popular searches
    - Search history
    - Search analytics
  - Collaboration Features
    - Real-time co-editing
    - Thread version history
    - Collaborative filtering
    - User presence indicators
    - Role-based access control
    - Comment system
    - Insight system

#### File System Integration (Current Focus)
- Phase 1: Unified Storage Architecture ✅
  - All drive module and component files migrated to `.tsx` and fully type-safe
  - All `any` types removed and replaced with explicit types/type guards
  - All linter/type errors and warnings resolved (ESLint clean, `--max-warnings=0`)
  - Type guards and shared interfaces used throughout
  - Integration with context/hooks confirmed type-safe
  - All drive UI components (FileGrid, FolderGrid, FolderCard, NewFolderButton, etc.) are now warning/error free
  - This phase is now complete and the drive module is ready for further feature work or integration
- Phase 2: Enhanced File Management
  - Advanced file organization
  - Version control system
  - Bulk operations
  - Search and filtering

#### Basic Dashboard Implementation
- Phase 1: Core Dashboard
- Phase 2: Analytics Integration
- Phase 3: Customization Options

#### Cross-module Data Tracking
- Phase 1: Basic Integration
- Phase 2: Advanced Analytics
- Phase 3: AI-Powered Insights

### Phase 2: Foundation & Core Analytics (3-6 months)
1. Complete current analytics system
   - Template management
   - Cross-pillar analytics framework
   - Basic metrics for all pillars
   - Enhanced data visualization

### Phase 3: Pillar-Specific Analytics (6-9 months)
1. Enterprise Analytics
   - Business metrics
   - Team performance tracking
   - Resource utilization
   - Project analytics

2. Life Analytics
   - Personal productivity metrics
   - Time management tracking
   - Goal progress monitoring
   - Work-life balance indicators

3. Education Analytics
   - Learning progress tracking
   - Course performance metrics
   - Student engagement analytics
   - Knowledge retention tracking

### Phase 4: Enhanced Module Integration (9-12 months)
1. Task Manager Integration
   - Task completion analytics
   - Priority tracking
   - Workflow optimization
   - Cross-pillar task management

2. Calendar Integration
   - Time allocation analytics
   - Schedule optimization
   - Event participation tracking
   - Cross-pillar scheduling

3. Finance Integration
   - Budget tracking analytics
   - Expense pattern analysis
   - Financial goal tracking
   - Cross-pillar financial management

### Phase 5: Advanced Analytics & AI (12-18 months)
1. Predictive Analytics
   - Trend analysis
   - Performance predictions
   - Resource forecasting
   - Personalized recommendations

2. AI Integration
   - Smart insights
   - Automated reporting
   - Pattern recognition
   - Intelligent recommendations

3. Cross-Pillar Insights
   - Integrated analytics dashboard
   - Cross-pillar correlations
   - Unified reporting
   - Custom analytics views

### Phase 6: Specialized Features (18-24 months)
1. Enterprise Specialization
   - Business intelligence tools
   - Team analytics
   - Project management insights
   - Resource optimization

2. Life Specialization
   - Personal development tracking
   - Family activity analytics
   - Wellness metrics
   - Personal goal tracking

3. Education Specialization
   - Learning analytics
   - Course performance tracking
   - Student progress monitoring
   - Educational resource optimization

### Phase 7: Platform Enhancement (24+ months)
1. Performance Optimization
   - Data processing efficiency
   - Real-time analytics
   - Scalability improvements
   - Performance monitoring

2. User Experience
   - Enhanced visualization
   - Customizable dashboards
   - Mobile optimization
   - Accessibility improvements

3. Integration Expansion
   - Third-party integrations
   - API enhancements
   - Data export/import
   - Cross-platform compatibility

### Phase 8: Advanced Features (Future)
1. AI/ML Capabilities
   - Advanced predictions
   - Automated insights
   - Smart recommendations
   - Pattern analysis

2. Customization
   - Custom analytics modules
   - Personalized metrics
   - Flexible reporting
   - Advanced visualization

3. Enterprise Features
   - Advanced security
   - Compliance tracking
   - Audit capabilities
   - Enterprise reporting

## Technical Considerations

### Current Focus
1. Phase 1 Completion
   - Chat system integration
   - File system integration
   - Dashboard implementation
   - Cross-module tracking

2. Performance Optimization
   - Database queries
   - Real-time updates
   - Search functionality
   - File handling

3. Security Enhancements
   - Authentication
   - Authorization
   - Data protection
   - Audit logging

### Active Decisions
1. Using WebSocket for real-time features
2. Implementing comprehensive analytics
3. Building presence tracking
4. Adding management features
5. Optimizing search functionality

## Next Steps

### Immediate Priority
1. Complete Chat System Integration
   - Finish thread analytics
   - Complete presence tracking
   - Implement pinning/starring
   - Enhance search filters

2. Begin File System Integration
   - Design file structure
   - Plan storage system
   - Define access patterns
   - Set up sharing mechanisms

3. Start Dashboard Implementation
   - Design layout system
   - Plan widget framework
   - Define data sources
   - Set up customization

4. Set up Cross-module Tracking
   - Design tracking system
   - Plan data aggregation
   - Define metrics
   - Set up reporting

### Technical Debt
1. WebSocket implementation optimization
2. Enhanced file handling
3. Real-time updates improvement
4. Search functionality optimization
5. Authentication enhancements

## Monitoring Points
1. Thread performance metrics
2. Real-time update latency
3. Search response times
4. UI responsiveness
5. State synchronization
6. Resource usage

## [2024-06-10] Unused Imports Removed from SearchInterface.tsx

The following imports were removed from `web/src/components/search/SearchInterface.tsx` as they were unused and not referenced elsewhere in the project:

- SearchBar
- SearchResults
- SearchFilters
- SearchShare
- Select, SelectContent, SelectItem, SelectTrigger, SelectValue
- formatDistanceToNow
- Avatar, AvatarFallback, AvatarImage
- LineChart, BarChart
- Textarea
- Tabs as UiTabs
- Checkbox as UiCheckbox
- Label as UiLabel
- RadioGroup as UiRadioGroup
- ShareSearch as UiShareSearch
- SearchAnalytics as UiSearchAnalytics
- SearchVisualization as UiSearchVisualization
- SearchCollaboration as UiSearchCollaboration
- SearchExport as UiSearchExport
- SearchHistory as UiSearchHistory
- SearchSuggestions as UiSearchSuggestions
- SearchCustomization as UiSearchCustomization
- SearchNotifications as UiSearchNotifications
- SearchAccessibility as UiSearchAccessibility
- SearchIntegration as UiSearchIntegration

These can be reintroduced if needed for future development.

## UI Component Audit (2024-06)

### Summary of Gaps
- Potential duplication of components (e.g., Avatar in both common and ui)
- Missing common UI elements: Table/DataGrid, Pagination, Breadcrumbs, Advanced Modal/Drawer, File Picker/Upload, Empty State, Loading Skeleton
- Inconsistent usage of shared UI primitives across modules
- Layout/navigation patterns not fully abstracted

### Recommendations
1. Consolidate duplicates into a single shared directory (ui or shared)
2. Expand the core UI library with missing primitives
3. Enforce usage guidelines and document best practices
4. Abstract layout/navigation components for all modules
5. Audit and refactor modules to use shared components
6. Document all shared UI components and (optionally) set up Storybook

### Next Steps
- Prioritize consolidation and expansion of the shared UI library
- Begin with the most commonly duplicated or missing elements
- Document and communicate best practices to the team

## Analytics Module Interoperability (2024-06)

### Findings
- The `useAnalytics` hook provides a shared interface for retrieving analytics data (thread, user, tag, trending threads) and exporting analytics, accessible to any module.
- REST API endpoints (`/api/analytics/...`) make analytics data available platform-wide.
- Analytics components are modular and domain-focused (e.g., ComplianceAnalytics, RiskAnalytics).
- Backend services (AnalyticsService, ThreadAnalyticsService, AnalyticsCoordinator) centralize analytics logic and aggregation.
- Real-time analytics is designed (via `useAnalyticsWebSocket`), but implementation and cross-module usage may be incomplete.

### Strengths
- Shared analytics API/hook enables consistent data access across modules.
- Modular analytics components allow for easy extension and integration.
- Backend services support analytics features platform-wide.

### Gaps
- No clear evidence of analytics data being actively pushed into other modules for context-aware features.
- Real-time analytics integration is not fully implemented or leveraged across modules.
- No event bus or pub/sub pattern for analytics events detected on the frontend.

### Recommendations
1. Promote use of the shared `useAnalytics` hook in all modules.
2. Implement and document real-time analytics integration (e.g., `useAnalyticsWebSocket`).
3. Enable cross-module analytics insights (e.g., show thread analytics in chat, file analytics in drive).
4. Consider a frontend event bus for analytics events.

### Next Steps
- Document usage patterns and provide examples for common analytics use cases.
- Ensure real-time analytics is available and documented for all modules.
- Identify and implement opportunities for contextual analytics in other modules.

## Dual-Sided Module Implementation Checklist (2024-06)

For each module (Chat, Drive, Analytics, Tasks, Calendar, etc.):

- [ ] Define and document both Enterprise and Lifestyle feature sets.
- [ ] Use user/org context to determine which features to expose.
- [ ] Implement feature flags or permission checks at the module/component level.
- [ ] Clearly communicate in the UI which features are enterprise-only or available as extenders.
- [ ] Integrate with the marketplace for individuals to discover and purchase extender services.
- [ ] Ensure a smooth upgrade path from lifestyle to enterprise features.
- [ ] Integrate with billing for enterprise subscriptions and individual purchases.
- [ ] Track entitlements at the user and org level.
- [ ] Document the differences and onboarding flows for enterprise vs. lifestyle users.

## [2024-06-13] ESLint Config Types Noted

- The project uses two different ESLint configuration styles:
  - `web/` (frontend): Uses classic `.eslintrc.json` (JSON format), suitable for Next.js/React/TypeScript projects.
  - `server/` (backend): Uses the new flat config `eslint.config.js` (JavaScript format), suitable for modern Node/TypeScript setups.
- Both are valid and intentional. Do not mix config types in the same directory. Each subproject should maintain its own ESLint config style.
- Contributors should refer to this note when updating or troubleshooting linting setups.

## [2024-06-13] Remediated linter errors in server/services/analyticsBatchService.ts

- Remediated linter errors in server/services/analyticsBatchService.ts:
  - Removed unused 'ThreadActivity' import.
  - Fixed upsert properties to match Prisma ThreadAnalytics model (added engagementScore, messageCount; removed replyCount).
  - Removed invalid property access (isFollowing) on ThreadParticipant.
  - Replaced 'any' with 'unknown' for dynamic return type.
- Pattern: Always cross-check Prisma model fields and types when fixing linter/type errors in service logic.

## [2024-06-13] Remediated linter error in server/services/analyticsCacheService.ts

- Remediated linter error in server/services/analyticsCacheService.ts:
  - Replaced 'any' with 'unknown' for the cache set method value parameter.
- Pattern: Use 'unknown' for generic cache/value types in service interfaces for type safety.

## [2024-06-13] Remediated linter errors in server/services/analyticsCoordinator.ts

- Remediated linter errors in server/services/analyticsCoordinator.ts:
  - Replaced all 'any' return types in public async methods with 'unknown'.
  - Removed 'ThreadView' from Prisma imports and replaced its usage with an inline type for event payloads.
  - Fixed instantiation of AnalyticsWebSocketService to use getInstance().
- Pattern: Use inline types for event payloads when no model exists, and prefer 'unknown' over 'any' for dynamic analytics objects. 