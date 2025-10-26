# HR Module - Database Schema

## Purpose
This directory contains the database schema for the HR Management module. The HR module extends the existing org chart system to provide comprehensive human resources management.

## Architecture Philosophy

### Framework First
The schemas in this directory define the **framework** for HR features, not the features themselves. We start with minimal core data structures and add feature-specific fields incrementally.

### Extends Org Chart (Doesn't Replace)
HR data builds on top of the existing org chart system:
- **Org Chart** handles: Positions, departments, reporting structure, permissions
- **HR Module** adds: Hire dates, employment types, HR-specific workflows

### Multi-Tenant by Design
Every table MUST include:
- `businessId` field with foreign key to Business
- Index on `businessId` for query performance
- This prevents data leakage between businesses

## Current Schema Files

### core.prisma
Foundational HR data models:
- **EmployeeHRProfile**: Core employee HR data (extends EmployeePosition)
- **ManagerApprovalHierarchy**: Defines approval workflows
- **HRModuleSettings**: Business-level HR configuration

## Tier-Based Features

### Business Advanced (Limited)
- Employee directory (max 50 employees)
- Basic time-off management
- Employee self-service
- Simple reports

### Enterprise (Full)
- Unlimited employees
- Advanced attendance (clock in/out, geolocation)
- Payroll processing
- Recruitment/ATS
- Performance reviews
- Benefits administration

## Adding New Features

When adding a new HR feature (e.g., attendance, payroll):

1. **Create a new .prisma file** in this directory
   ```
   prisma/modules/hr/
   ├── core.prisma (existing)
   ├── attendance.prisma (NEW)
   └── ...
   ```

2. **Follow these patterns**:
   - Include `businessId` on all tables (multi-tenant isolation)
   - Reference `EmployeeHRProfile`, not `User` directly
   - Use soft deletes (`deletedAt`) where appropriate
   - Add indexes for performance
   - Document tier availability in comments

3. **Rebuild schema**:
   ```bash
   npm run prisma:build
   npm run prisma:generate
   npm run prisma:migrate
   ```

## Data Flow

```
User Account
    ↓
Business Membership
    ↓
Org Chart Position (EmployeePosition)
    ↓
HR Profile (EmployeeHRProfile) ← You are here
    ↓
Feature-specific data (Attendance, Payroll, etc.)
```

## Key Relationships

### EmployeeHRProfile
- **1:1 with EmployeePosition**: Each org chart position can have one HR profile
- **N:1 with Business**: All HR data belongs to a business
- **1:N with Features**: One employee has many attendance records, payroll records, etc.

### ManagerApprovalHierarchy
- **N:1 with EmployeePosition (employee)**: Employee needs approvals
- **N:1 with EmployeePosition (manager)**: Manager provides approvals
- **N:1 with Business**: Approval rules are business-specific

## Migration Strategy

When creating migrations:

1. **Test in development first**
2. **Use descriptive migration names**:
   ```bash
   npm run prisma:migrate -- --name add_hr_core_models
   ```
3. **Check for breaking changes**
4. **Document any data transformations needed**

## Security Considerations

### Sensitive Data
- `personalInfo` JSON field should be encrypted in production
- `emergencyContact` should have restricted access
- Payroll data (when added) requires extra security

### Access Control
- All API endpoints must check business membership
- HR admin role required for sensitive operations
- Employees can only view their own data (except managers/admins)

## Performance Notes

### Indexes
All tables have indexes on:
- `businessId` (required for multi-tenant queries)
- Foreign keys (for join performance)
- Common filter fields (`deletedAt`, `employeeType`, etc.)

### Query Patterns
Always scope queries by `businessId`:
```typescript
// ✅ Correct
const employees = await prisma.employeeHRProfile.findMany({
  where: { businessId, deletedAt: null }
});

// ❌ Wrong (security issue - data leakage)
const employees = await prisma.employeeHRProfile.findMany({
  where: { deletedAt: null }
});
```

## Future Feature Schemas

Planned feature files:
- [ ] `attendance.prisma` - Time tracking, time-off, schedules
- [ ] `payroll.prisma` - Pay runs, tax calculations, direct deposit
- [ ] `recruitment.prisma` - Job postings, applications, interviews
- [ ] `performance.prisma` - Reviews, goals, 360 feedback
- [ ] `benefits.prisma` - Plans, enrollments, COBRA
- [ ] `onboarding.prisma` - Workflows, checklists, training

## Related Documentation

- **Module Brainstorming**: `memory-bank/moduleBrainstorming.md` - Full feature list
- **Org Chart System**: `memory-bank/org-chart-permission-system.md` - Foundation
- **Business Workspace**: `memory-bank/businessWorkspaceArchitecture.md` - Integration
- **Database Context**: `memory-bank/databaseContext.md` - Overall schema

## Questions?

Refer to `.cursor/rules/coding-standards.mdc` for:
- TypeScript standards
- API routing patterns
- Multi-tenant data isolation requirements
- Prisma schema best practices

