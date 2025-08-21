<!--
Analytics Product Context
See README for the modular context pattern.
-->

# Analytics Product Context

**Description:**
This file documents the product context for all user-facing analytics, dashboards, and reporting features.

## 1. Header & Purpose
- **Purpose:**  
  The Analytics module provides user-facing dashboards, charts, and reporting features for actionable business, compliance, and operational insights. All analytics must be accurate, validated, and non-intrusive to the core application.
- **Cross-References:**  
  - [dashboardProductContext.md] (integration of analytics widgets)
  - [systemPatterns.md] (analytics architecture, data sourcing)
  - [databaseContext.md] (analytics data models)

## 2. Problem Space
- Previous analytics code was partially AI-generated and may be incomplete, inaccurate, or unstable.
- Analytics must not introduce instability or degrade user experience.
- There is a need for actionable, validated insights that support real user and business needs.

## 3. User Experience Goals
- Clear, actionable dashboards and reports.
- Only show analytics that are accurate and relevant.
- Modular analytics widgets that do not interfere with core workflows.
- Responsive, accessible, and performant analytics UI.

## 3a. Panel-Based Layout & Navigation
- **Left Sidebar:** Navigation between analytics sections (compliance, risk, customer, etc.).
- **Main Panel:** Dashboards, charts, and reports.
- **Panel Features:** Filtering, export, and drill-down capabilities.

## 4. Core Features & Requirements
- Actionable dashboards and charts for key business/compliance metrics.
- Custom reports and advanced filtering.
- Export/import of analytics data (CSV, PDF, etc.).
- Modular, extensible analytics components.
- Integration with validated, real data sources only.
- Strict review and testing for all analytics features.

## 4a. Feature Checklist (Implementation Status)

> **Note:** All features marked as planned due to full platform rebuild. Status will be updated as features are re-implemented.

| Feature                        | Status      | Notes/Location (if implemented)                |
|-------------------------------|-------------|-----------------------------------------------|
| Data Model & API Foundations   | ❌          | Planned                                       |
| Analytics Dashboard            | ❌          | Planned                                       |
| Charts/Visualizations          | ❌          | Planned                                       |
| Custom Reports                 | ❌          | Planned                                       |
| Export/Import                  | ❌          | Planned                                       |
| Filtering                      | ❌          | Planned                                       |
| Data Validation                | ❌          | Planned                                       |
| Integration with Dashboard     | ❌          | Planned                                       |
| Notifications                  | ❌          | Planned                                       |
| Analytics & Reporting          | ❌          | Planned                                       |
| Compliance & Audit             | ❌          | Planned                                       |

## 5. Integration & Compatibility
- Analytics widgets can be embedded in the Dashboard and other modules.
- Must use validated, real data sources.
- Designed for modularity and extensibility.

## 5a. Data Model Reference
- See [databaseContext.md] and `prisma/schema.prisma` for analytics data models.
- All analytics data must be sourced from validated, production-ready models.

## 6. Technical Constraints & Decisions
- All analytics code must be reviewed and tested before deployment.
- Remove or refactor any legacy/AI-generated analytics code that is not validated.
- Analytics must be modular and not introduce instability to the application.
- Use only real, production data sources.

## 7. Success Metrics
- User engagement with analytics dashboards.
- Accuracy and reliability of analytics data.
- No negative impact on application stability or performance.
- User/business feedback on analytics usefulness.

## 8. Design & UX References
- Google Analytics, Power BI, Tableau (for inspiration)
- [designPatterns.md], [systemPatterns.md]

## 8a. Global Components & Integration Points
- AnalyticsDashboard, AnalyticsCharts, VisualizationCard, and other modular analytics widgets.

## 9. Testing & Quality
- Unit/integration tests for all analytics components.
- E2E tests for analytics workflows.
- Data validation and accuracy checks.
- Performance and load testing.

## 10. Future Considerations & Ideas
- Audit and refactor/remove legacy/AI-generated analytics code (high priority for stability)
- Expand analytics only with validated, user-driven requirements
- Add AI-driven insights only after core analytics are stable and validated (cross-link to systemPatterns.md)
- Support for third-party analytics integrations (cross-link to developerProductContext.md)
- Periodic review of analytics accuracy and business value

## 11. Update History & Ownership
- **2024-06:** Major update to reflect new analytics principles and caution.
- **2024-06:** Reviewed for completeness, clarity, and actionability. Marked as ready for ongoing development.  
  Owner: [Your Name/Team]
- **2024-06:** Feature checklist reordered and expanded for best-practice rebuild. All features marked as planned. Status will be updated as features are re-implemented.