<!--
Update Rules for permissionsModel.md
- Updated when permissions, data sharing, or role management policies change.
- All changes should be dated and well-documented.
- Use cross-references to other memory bank files for related patterns or requirements.
- Archive outdated sections rather than deleting.
- Add a table of contents if file exceeds 200 lines.
- Summarize changes at the top if the update is significant.
-->

# Permissions & Data Sharing Model

## 1. User Roles & Memberships
- **Customizable Roles:**
  - Each organization (business, school, etc.) can define its own roles and permissions framework.
  - The platform provides a default framework (e.g., admin, member, guest, HR, teacher, student), but orgs can edit or add roles as needed.
- **Multiple Roles:**
  - Users can hold multiple roles within the same organization (e.g., student and club leader).

## Related Documentation
- [moduleSpecs.md](./moduleSpecs.md) (module permissions, management)
- [compliance.md](./compliance.md) (legal/HR requirements)
- [roadmap.md](./roadmap.md) (future features, including Extender Services)

---

## Technical Enforcement & Audit Logging (Placeholder)
- Permissions are enforced in backend services via middleware and database access controls (see future implementation notes in roadmap).
- Audit logging of permission changes and access events is planned for future compliance and security.

---

## 2. Module Access & Feature Flags
- **Org Admin Control:**
  - The creating admin sets up the initial modules for the organization.
  - Platform admins can be assigned to manage modules and org settings; their access can be removed or transferred by the master organizer (the original creator).
- **User Suggestions:**
  - Users can suggest new modules to org admins.
- **Extender Services:**
  - [Roadmap Item] Clarification needed in the future: How individual extender services interact with org-level modules. See [roadmap.md](./roadmap.md).

## 3. Data Visibility & Sharing
- **Opt-In Data Sharing:**
  - Personal data is always opt-in for sharing with organizations, except for HR/legal requirements.
- **Calendar Privacy:**
  - Users' calendars aggregate all commitments, but orgs only see time blocks (not details) unless the user opts in.
- **Data Ownership:**
  - The initial creator owns data, but if created within an org, the parent org also has ownership. If a user leaves, orgs retain access to relevant files and data.

## 4. Notifications & Messaging
- **Private Messaging:**
  - Messages are private by default; org admins cannot view user messages.
- **No Admin Oversight:**
  - Most messages are not visible to admins, supporting user privacy.

## 5. Joining, Leaving, and Switching Orgs
- **Data Retention:**
  - When a user leaves an org, their data is archived for 60 days, giving admins time to review or recover needed information.
  - HR/legal data is retained as required by law.
- **Org Removal:**
  - Organizations can remove users (e.g., upon resignation or termination).

## Change History / Archived Policies
- [Add major changes, deprecated policies, or clarifications here with date and summary.]

## [2024-06] User Roles & RBAC Infrastructure

- User model now includes a `role` field (enum: USER, ADMIN)
- RBAC enforced via `requireRole` middleware in Express
- Example admin-only endpoint: `/admin/secret` (requires ADMIN role)
- All protected endpoints require JWT authentication
- Pattern is ready for extension to more granular roles/permissions as needed 

## [2024-06] File Sharing & Permission Enforcement (Implemented)

- Per-file, per-user sharing implemented via FilePermission model
- Endpoints:
  - GET /files/:id/permissions (list)
  - POST /files/:id/permissions (grant)
  - PUT /files/:id/permissions/:userId (update)
  - DELETE /files/:id/permissions/:userId (revoke)
- Permission checks enforced on download, update, delete (owner or explicit permission required)
- Composite unique constraint on (fileId, userId) for upsert
- Pattern: owner can manage all permissions, others only as granted 