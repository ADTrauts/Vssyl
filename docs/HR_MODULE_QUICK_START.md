# HR Module - Quick Start Guide

**Status**: Framework Complete ✅  
**Ready For**: Feature Implementation

---

## 🚀 Getting Started

### 1. Run Database Migration
```bash
cd /Users/andrewtrautman/Desktop/Vssyl
npm run prisma:migrate -- --name add_hr_module
```

### 2. Seed HR Module
```bash
npx ts-node scripts/seed-hr-module.ts
```

### 3. Restart Server
```bash
pnpm dev
```

### 4. Access HR Module

**Admin Dashboard**:
```
https://vssyl.com/business/[businessId]/admin/hr
```

**Employee Self-Service**:
```
https://vssyl.com/business/[businessId]/workspace/hr/me
```

**Manager Team View**:
```
https://vssyl.com/business/[businessId]/workspace/hr/team
```

---

## 📁 File Structure

### Backend
```
server/src/
├── routes/hr.ts                      # API routes
├── controllers/hrController.ts       # Request handlers
└── middleware/
    ├── hrPermissions.ts              # Access control
    └── hrFeatureGating.ts            # Tier-based gates
```

### Frontend
```
web/src/
├── hooks/useHRFeatures.ts           # Feature detection
└── app/business/[id]/
    ├── admin/hr/page.tsx            # Admin dashboard
    └── workspace/hr/
        ├── me/page.tsx              # Employee self-service
        └── team/page.tsx            # Manager team view
```

### Database
```
prisma/modules/hr/
├── core.prisma                       # HR schema
└── README.md                         # Database docs
```

---

## 🔧 Adding Features

### Example: Add Time-Off Request Feature

#### 1. Add Database Model
```prisma
// prisma/modules/hr/attendance.prisma
model TimeOffRequest {
  id          String   @id @default(uuid())
  employeePositionId String
  employeePosition EmployeePosition @relation(...)
  businessId  String
  business    Business @relation(...)
  startDate   DateTime
  endDate     DateTime
  reason      String?
  status      TimeOffStatus @default(PENDING)
  // ... more fields
  
  @@index([businessId])
  @@map("time_off_requests")
}

enum TimeOffStatus {
  PENDING
  APPROVED
  DENIED
  CANCELLED
}
```

#### 2. Add API Endpoint
```typescript
// server/src/controllers/hrController.ts
export const requestTimeOff = async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  // Implementation...
};

// server/src/routes/hr.ts
router.post('/me/time-off/request', 
  checkEmployeeAccess,
  requestTimeOff
);
```

#### 3. Add Frontend Component
```typescript
// web/src/components/hr/TimeOffRequestForm.tsx
export function TimeOffRequestForm() {
  // Form implementation...
}

// Update page.tsx to use component
import { TimeOffRequestForm } from '@/components/hr/TimeOffRequestForm';
```

#### 4. Test
```bash
# Test API
curl -X POST http://localhost:5000/api/hr/me/time-off/request \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"startDate": "2025-11-01", "endDate": "2025-11-05", "reason": "Vacation"}'

# Test UI
# Visit: http://localhost:3000/business/[id]/workspace/hr/me
```

---

## 🎯 Feature Priority

### **Recommended Order**:

1. **Employee Management** (Week 1-2)
   - CRUD operations
   - Profile management
   - Import/export

2. **Time-Off System** (Week 3)
   - Request workflow
   - Approval system
   - Balance tracking

3. **Attendance Tracking** (Week 4)
   - Clock in/out (Enterprise)
   - Reports
   - Calendar view

4. **Payroll** (Month 2)
   - Processing
   - Pay stubs
   - Tax calculations

5. **Recruitment** (Month 3)
   - Job postings
   - ATS
   - Interviews

---

## 🔐 Security Checklist

When implementing features, ALWAYS:

- [ ] Include `businessId` in all database queries
- [ ] Check tier access for enterprise features
- [ ] Validate user permissions (admin/manager/employee)
- [ ] Use soft deletes (`deletedAt`) for employee data
- [ ] Sanitize user input
- [ ] Log important actions
- [ ] Handle errors gracefully
- [ ] Test multi-tenant isolation

---

## 📊 Tier Feature Reference

### Business Advanced ($69.99/mo)
- ✅ Employees (max 50)
- ✅ Basic time-off
- ✅ Employee self-service
- ❌ No clock in/out
- ❌ No payroll
- ❌ No recruitment
- ❌ No performance reviews

### Enterprise ($129.99/mo)
- ✅ Unlimited employees
- ✅ Full time-off
- ✅ Clock in/out
- ✅ Payroll
- ✅ Recruitment
- ✅ Performance
- ✅ Benefits

---

## 🆘 Troubleshooting

### Migration Fails
```bash
# Reset if needed
npm run prisma:reset

# Try migration again
npm run prisma:migrate -- --name add_hr_module
```

### API Returns 403
- Check business tier (Business Advanced or Enterprise)
- Verify HR module is installed
- Check user permissions (admin/manager/employee)
- Verify businessId is passed correctly

### Features Not Showing
- Check `useHRFeatures` hook is getting correct tier
- Verify tier check middleware is working
- Check browser console for errors
- Hard refresh browser (Cmd+Shift+R)

---

## 📞 Support

- **Documentation**: `memory-bank/hrProductContext.md`
- **Implementation Details**: `docs/HR_MODULE_FRAMEWORK_IMPLEMENTATION.md`
- **Database Docs**: `prisma/modules/hr/README.md`
- **Module Brainstorming**: `memory-bank/moduleBrainstorming.md`

---

**Ready to implement features!** Start with Employee Management CRUD. 🎯

