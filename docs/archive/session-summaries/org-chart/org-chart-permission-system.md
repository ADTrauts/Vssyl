> **Status:** Historical / deprecated — **not** current product, architecture, or authorization authority.
> **Archived:** 2026-09-04 (Memory Bank Batch 1C-4A)
> Do not use this document as living guidance. Prefer current Memory Bank ProductContexts, `docs/architecture/`, and domain status records.

---

# Org Chart & Permission System - Memory Bank

## **🎯 System Overview**

The **Org Chart & Permission System** is a unified business management solution that combines:
1. **Organizational Structure Management** - Visual org charts with hierarchical relationships
2. **Granular Permission Control** - Checkbox-based access control for every feature
3. **Role-Based Access Control (RBAC)** - Position-based permissions with inheritance
4. **Employee Management** - Link users to org chart positions
5. **Work Tab Integration** - Automatic module access based on position

## **🏗️ Core Architecture**

### **System Components**
```
Org Chart & Permission System
├── Organizational Structure
│   ├── Business Tiers (C-Suite, VP, Director, Manager, Employee)
│   ├── Departments (Technology, HR, Finance, Marketing, Operations)
│   ├── Positions (CEO, CFO, Server, Manager, etc.)
│   └── Reporting Relationships (who reports to whom)
├── Permission Management
│   ├── Granular Permissions (Module → Feature → Action)
│   ├── Permission Categories (Basic, Advanced, Admin)
│   ├── Role-Based Assignment (Position → Permission Set)
│   └── Inheritance & Overrides (Template-based with customization)
├── Employee Integration
│   ├── User-Position Linking
│   ├── Permission Assignment
│   ├── Module Access Control
│   └── Work Tab Population
└── Management Interface
    ├── Visual Org Chart Builder
    ├── Permission Management Dashboard
    ├── Bulk Operations & Templates
    └── Audit Trail & Reporting
```

## **📋 Business Requirements**

### **Primary Use Cases**

#### **1. Restaurant Business Example**
```
Owner (100% Access - Full System)
├── Executive Chef (90% Access - Kitchen + Management)
│   ├── Sous Chef (50% Access - Kitchen Operations)
│   └── Line Cook (25% Access - Basic Kitchen Tools)
├── FOH Manager (75% Access - Front of House + Management)
│   ├── Team Lead (40% Access - Team Coordination)
│   ├── Server (20% Access - Order Management + Basic Tools)
│   └── Bartender (20% Access - Bar Management + Basic Tools)
└── General Manager (85% Access - Full Operations)
    ├── Assistant Manager (60% Access - Operations + Staff)
    └── Shift Supervisor (35% Access - Shift Management)
```

#### **2. Technology Company Example**
```
CEO (100% Access - Full System)
├── CTO (95% Access - Technology + Strategy)
│   ├── VP Engineering (85% Access - Engineering + Product)
│   │   ├── Engineering Director (70% Access - Team + Projects)
│   │   │   ├── Engineering Manager (55% Access - Team Management)
│   │   │   └── Senior Engineer (40% Access - Development + Tools)
│   │   └── VP Product (80% Access - Product + Strategy)
│   └── VP Infrastructure (80% Access - Systems + Operations)
├── CFO (90% Access - Finance + Operations)
│   ├── Finance Director (70% Access - Financial Management)
│   └── Accounting Manager (55% Access - Accounting + Reports)
└── CMO (90% Access - Marketing + Sales)
    ├── Marketing Director (70% Access - Marketing Strategy)
    └── Brand Manager (55% Access - Brand + Campaigns)
```

### **Key Requirements**
1. **Visual Org Chart Builder** - Drag & drop interface for creating organizational structure
2. **Template-Based Setup** - Industry-specific templates (Restaurant, Tech, Manufacturing, Healthcare)
3. **Granular Permissions** - Checkbox control for every feature and action
4. **Bulk Operations** - Copy roles, batch updates, template application
5. **Permission Inheritance** - Templates with custom overrides
6. **Employee Linking** - Connect users to org chart positions
7. **Work Tab Integration** - Automatic module access based on position
8. **Audit Trail** - Track all permission and structure changes

## **🔧 Technical Implementation**

### **Data Models**

#### **1. Organizational Structure**
```typescript
interface OrganizationalTier {
  id: string;
  name: string; // "C-Suite", "VP Level", "Director", "Manager", "Employee"
  level: number; // 1 = highest, 5 = lowest
  description: string;
  defaultPermissions: PermissionSet;
  defaultModules: string[];
}

interface Department {
  id: string;
  name: string;
  description: string;
  parentDepartment?: string; // For nested departments
  headPosition: string; // VP or Director role
  members: string[]; // Array of position IDs
  departmentModules: string[]; // Modules specific to this department
  departmentPermissions: PermissionSet; // Default permissions for department
}

interface Position {
  id: string;
  title: string;
  tier: string; // References OrganizationalTier
  department?: string; // References Department
  reportsTo?: string; // References another Position (for hierarchy)
  permissions: PermissionSet;
  assignedModules: string[];
  maxOccupants: number; // How many people can have this position
  currentOccupants: string[]; // Array of user IDs
  customPermissions: Permission[]; // Override default permissions
}
```

#### **2. Permission System**
```typescript
interface Permission {
  id: string;
  moduleId: string;
  featureId: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'manage' | 'admin';
  description: string;
  category: 'basic' | 'advanced' | 'admin';
  dependencies: string[]; // Other permissions required
  conflicts: string[]; // Conflicting permissions
}

interface PermissionSet {
  id: string;
  name: string; // "Full Access", "Executive Access", etc.
  description: string;
  permissions: Permission[];
  category: 'basic' | 'advanced' | 'admin';
  template: boolean; // Whether this is a reusable template
}

interface RolePermission {
  id: string;
  roleId: string;
  permissions: Permission[];
  inheritedFrom?: string; // For inherited permissions
  overrides?: Permission[]; // For custom overrides
  customPermissions: Permission[]; // Individual customizations
}
```

#### **3. Employee Management**
```typescript
interface EmployeePosition {
  id: string;
  userId: string;
  positionId: string;
  businessId: string;
  assignedAt: string;
  assignedBy: string;
  startDate: string;
  endDate?: string;
  active: boolean;
  customPermissions: Permission[]; // Individual overrides
}

interface PermissionManagementRights {
  id: string;
  userId: string;
  businessId: string;
  grantedBy: string; // Who gave them this right
  grantedAt: string;
  scope: {
    roles: string[]; // Which roles they can manage
    modules: string[]; // Which modules they can manage
    levels: 'basic' | 'advanced' | 'admin'; // Permission levels they can manage
  };
  canGrantToOthers: boolean; // Can they give permission management to others?
  expiresAt?: string; // Optional expiration
}
```

### **Database Schema**
```sql
-- Organizational structure
CREATE TABLE organizational_tiers (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name VARCHAR(100),
  level INTEGER,
  description TEXT,
  default_permissions JSONB,
  default_modules JSONB
);

CREATE TABLE departments (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  name VARCHAR(100),
  description TEXT,
  parent_department_id UUID REFERENCES departments(id),
  head_position_id UUID REFERENCES positions(id),
  department_modules JSONB,
  department_permissions JSONB
);

CREATE TABLE positions (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  title VARCHAR(100),
  tier_id UUID REFERENCES organizational_tiers(id),
  department_id UUID REFERENCES departments(id),
  reports_to_id UUID REFERENCES positions(id),
  permissions JSONB,
  assigned_modules JSONB,
  max_occupants INTEGER DEFAULT 1,
  custom_permissions JSONB
);

-- Permission system
CREATE TABLE permissions (
  id UUID PRIMARY KEY,
  module_id VARCHAR(100),
  feature_id VARCHAR(100),
  action VARCHAR(50),
  description TEXT,
  category VARCHAR(50),
  dependencies JSONB,
  conflicts JSONB
);

CREATE TABLE permission_sets (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  description TEXT,
  permissions JSONB,
  category VARCHAR(50),
  template BOOLEAN DEFAULT false
);

-- Employee management
CREATE TABLE employee_positions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  position_id UUID REFERENCES positions(id),
  business_id UUID REFERENCES businesses(id),
  assigned_at TIMESTAMP,
  assigned_by UUID REFERENCES users(id),
  start_date DATE,
  end_date DATE,
  active BOOLEAN DEFAULT true,
  custom_permissions JSONB
);

CREATE TABLE permission_management_rights (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  business_id UUID REFERENCES businesses(id),
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP,
  scope JSONB,
  can_grant_to_others BOOLEAN DEFAULT false,
  expires_at TIMESTAMP
);

-- Audit trail
CREATE TABLE permission_changes (
  id UUID PRIMARY KEY,
  business_id UUID REFERENCES businesses(id),
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP,
  change_type VARCHAR(50),
  target_role VARCHAR(100),
  permissions_changed JSONB,
  reason TEXT
);
```

## **🎨 User Interface Design**

### **1. Org Chart Builder**
```
Visual Org Chart Interface
├── Drag & Drop Builder
│   ├── Add positions by dragging from toolbar
│   ├── Connect positions with reporting lines
│   ├── Organize into departments
│   └── Real-time preview
├── Template Library
│   ├── Restaurant (Kitchen + FOH + Management)
│   ├── Technology (Engineering + Sales + Operations)
│   ├── Manufacturing (Production + Quality + Management)
│   ├── Healthcare (Clinical + Administrative + Management)
│   └── Custom (Build from scratch)
├── Quick Actions
│   ├── Add Department
│   ├── Create Position
│   ├── Set Reporting Relationship
│   └── Apply Template
└── Validation
    ├── Check reporting structure
    ├── Validate permissions
    ├── Verify module assignments
    └── Highlight conflicts
```

### **2. Permission Management Dashboard**
```
Permission Management Interface
├── Role Overview
│   ├── List all positions
│   ├── Permission summary per role
│   ├── Module access per role
│   └── Employee count per role
├── Permission Editor
│   ├── Module selection
│   ├── Feature breakdown
│   ├── Action permissions (checkboxes)
│   └── Category grouping (Basic/Advanced/Admin)
├── Bulk Operations
│   ├── Copy role permissions
│   ├── Batch permission updates
│   ├── Template application
│   └── Bulk employee assignment
└── Audit & Reports
    ├── Permission change history
    ├── Role modification log
    ├── Employee assignment history
    └── Permission usage analytics
```

### **3. Employee Management Interface**
```
Employee Management Dashboard
├── Employee Directory
│   ├── List all employees
│   ├── Current positions
│   ├── Permission levels
│   └── Module access
├── Assignment Interface
│   ├── Assign employee to position
│   ├── Inherit position permissions
│   ├── Custom permission overrides
│   └── Bulk assignments
├── Onboarding Flow
│   ├── Position selection
│   ├── Permission confirmation
│   ├── Module access setup
│   └── Work tab configuration
└── Management Tools
    ├── Permission management rights
    ├── Temporary access grants
    ├── Role transitions
    └── Offboarding process
```

## **🚀 Implementation Phases**

### **Phase 1: Core Infrastructure (Weeks 1-2)**
- Database schema implementation
- Basic API endpoints
- Core data models and interfaces
- Permission system foundation

### **Phase 2: Org Chart Builder (Weeks 3-4)**
- Visual org chart interface
- Drag & drop functionality
- Template system
- Department and position management

### **Phase 3: Permission Management (Weeks 5-6)**
- Granular permission system
- Checkbox-based interface
- Permission categories
- Inheritance and override logic

### **Phase 4: Employee Integration (Weeks 7-8)**
- Employee assignment system
- Permission inheritance
- Module access control
- Work tab integration

### **Phase 5: Advanced Features (Weeks 9-10)**
- Bulk operations
- Template management
- Audit trail
- Permission testing (optional)

### **Phase 6: Polish & Testing (Weeks 11-12)**
- UI/UX improvements
- Performance optimization
- Testing and bug fixes
- Documentation and training

## **🔗 Integration Points**

### **1. Business Creation Flow**
```
Business Creation → Org Chart Setup
├── Business registration
├── Industry selection
├── Auto-template application
├── Custom structure building
└── Permission setup
```

### **2. Work Tab Integration**
```
Position Assignment → Work Tab Population
├── Employee assigned to position
├── Inherit position permissions
├── Access relevant modules
├── Configure personalized dashboard
└── Real-time permission updates
```

### **3. Module Management**
```
Module Installation → Permission Assignment
├── Install business modules
├── Define module permissions
├── Assign to positions
├── Inherit by employees
└── Control access levels
```

## **📊 Business Value**

### **1. Operational Efficiency**
- **Streamlined Onboarding**: Automatic permission assignment
- **Consistent Access Control**: Standardized permission structure
- **Easy Management**: Visual interface for complex structures
- **Bulk Operations**: Efficient management of multiple roles

### **2. Security & Compliance**
- **Granular Control**: Precise access management
- **Audit Trail**: Full accountability and tracking
- **Permission Inheritance**: Logical access structure
- **Role-Based Security**: Position-based access control

### **3. Scalability**
- **Template System**: Industry-specific best practices
- **Flexible Structure**: Adapt to any business size
- **Permission Management**: Delegate control appropriately
- **Growth Support**: Scale with business expansion

## **🎯 Success Metrics**

### **1. User Experience**
- **Setup Time**: Complete org chart setup in <30 minutes
- **Permission Accuracy**: 99%+ correct permission assignments
- **User Satisfaction**: >90% satisfaction with permission system
- **Error Rate**: <1% permission-related errors

### **2. Business Impact**
- **Onboarding Speed**: 50% faster employee setup
- **Permission Management**: 75% reduction in access issues
- **Security Incidents**: 90% reduction in unauthorized access
- **Management Efficiency**: 60% faster permission updates

### **3. Technical Performance**
- **Response Time**: <500ms permission checks
- **Scalability**: Support 1000+ employees per business
- **Reliability**: 99.9% uptime for permission system
- **Data Integrity**: Zero data loss in permission changes

## **❓ Open Questions & Future Enhancements**

### **1. Advanced Features (Future Phases)**
- **Conditional Permissions**: Time-based, location-based access
- **Permission Dependencies**: Complex permission relationships
- **Approval Workflows**: Optional approval for sensitive changes
- **Integration APIs**: Connect to external HR systems

### **2. Analytics & Insights**
- **Permission Usage Analytics**: Track feature usage by role
- **Access Pattern Analysis**: Identify permission optimization opportunities
- **Security Monitoring**: Detect unusual access patterns
- **Compliance Reporting**: Generate audit and compliance reports

### **3. Mobile & Accessibility**
- **Mobile Interface**: Manage permissions on mobile devices
- **Accessibility**: Screen reader and keyboard navigation support
- **Offline Support**: Basic permission management without internet
- **Multi-language**: Support for international businesses

## **🚀 Next Steps**

### **Immediate Actions**
1. **Review and approve** this comprehensive system design
2. **Prioritize features** for Phase 1 implementation
3. **Set up development environment** for org chart system
4. **Begin database schema** implementation

### **Development Approach**
- **Iterative Development**: Build and test each phase
- **User Feedback**: Regular testing with business users
- **Performance Monitoring**: Track system performance metrics
- **Documentation**: Maintain comprehensive system documentation

---

**This Memory Bank file captures the complete Org Chart & Permission System design. It serves as the single source of truth for all development decisions and implementation details.**

**Ready to begin Phase 1 implementation?** 🎉
