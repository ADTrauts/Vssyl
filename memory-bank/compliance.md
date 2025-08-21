<!--
Update Rules for compliance.md
- Updated when legal, compliance, or audit policies change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

## Summary of Major Changes / Update History
- [Add major compliance changes, new requirements, or audit policies here with date.]

## Cross-References & Modular Context Pattern
- See [permissionsModel.md](./permissionsModel.md) for access control and data sharing.
- See [databaseContext.md](./databaseContext.md) for data retention and schema.
- See [systemPatterns.md](./systemPatterns.md) for architecture and security patterns.
- See [moduleSpecs.md](./moduleSpecs.md) for module-specific compliance requirements.
- See [chatProductContext.md](./chatProductContext.md), [driveProductContext.md](./driveProductContext.md), [dashboardProductContext.md](./dashboardProductContext.md), and [marketplaceProductContext.md](./marketplaceProductContext.md) for module-specific compliance notes if needed.
- Each major proprietary module should have its own compliance section/file as needed (see README for details on the modular context pattern).

---

# Legal & Compliance

## New-Build Compliance Considerations [2024-06]
- **Data Privacy & Protection:** Must comply with GDPR/CCPA if serving EU/California users. Includes user data rights, breach notification, and data minimization.
- **User Consent & Terms:** Users must agree to Terms of Service and Privacy Policy. Privacy Policy must explain data collection, use, and user rights.
- **Data Retention & Deletion:** Users must be able to request deletion of their data. Define data retention periods and deletion policies.
- **Audit Logging:** Enterprise features require audit logs for access, changes, and admin actions (SOC 2, HIPAA, FERPA, etc.).
- **Security:** Encrypt data at rest and in transit. Enforce role-based access and secure authentication.
- **Public Sharing:** Public links must be secure, expiring, and revocable by users at any time.
- **Third-Party Integrations:** If supporting external modules, require additional terms and review for third-party developers.
- **Children's Data:** If used by children or in education, comply with COPPA/FERPA.

## Legal Requirements
- Laws and regulations relevant to the platform (e.g., FERPA, GDPR, HIPAA).

## Data Retention
- Policies for data storage, deletion, and user rights.

## Audit Policies
- Procedures for auditing access, changes, and compliance.

---

## Archive (Deprecated Compliance Requirements / Policies)
- [Add deprecated or superseded compliance requirements/policies here, with date and summary.] 