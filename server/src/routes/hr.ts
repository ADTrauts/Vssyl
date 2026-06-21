/**
 * HR MODULE API ROUTES
 * 
 * Three-tier access structure:
 * 1. Admin routes: /hr/admin/* - Full HR management (business admins only)
 * 2. Manager routes: /hr/team/* - Team management (managers with direct reports)
 * 3. Employee routes: /hr/me/* - Self-service (all employees)
 * 4. AI routes: /hr/ai/* - AI context providers (authenticated users)
 * 
 * All routes require:
 * - Authentication (authenticateJWT)
 * - Business Advanced or Enterprise tier (checkBusinessAdvancedOrHigher)
 * - HR module installed (checkHRModuleInstalled)
 */

import express from 'express';
import multer from 'multer';
import { authenticateJWT } from '../middleware/auth';
import { 
  checkHRAdmin, 
  checkManagerAccess, 
  checkEmployeeAccess 
} from '../middleware/hrPermissions';
import { checkHRPolicy } from '../auth/hrPolicyDual';
import { POLICY_ACTIONS } from '../auth/policyActions';
import {
  checkBusinessAdvancedOrHigher,
  checkHRFeature,
  checkHRModuleInstalled
} from '../middleware/hrFeatureGating';
import * as hrController from '../controllers/hrController';
import * as hrWorkforceBridgeController from '../controllers/hrWorkforceBridgeController';

// Configure multer for CSV uploads
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

const router: express.Router = express.Router();

// ============================================================================
// GLOBAL MIDDLEWARE (Applied to all HR routes)
// ============================================================================
router.use(authenticateJWT);  // Must be logged in
router.use(checkBusinessAdvancedOrHigher);  // Business Advanced or Enterprise tier
router.use(checkHRModuleInstalled);  // HR module must be installed

// ============================================================================
// ADMIN ROUTES (Business Admin Dashboard)
// Route: /api/hr/admin/*
// Access: Business owners and admins only
// ============================================================================

// Employee Management (Available on Business Advanced+)
router.get('/admin/employees', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getAdminEmployees);
router.get('/admin/employees/filter-options', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getEmployeeFilterOptions);
router.get('/admin/employees/:id', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ, { resourceIdParam: 'id', resourceType: 'hr_employee' }), hrController.getAdminEmployee);
router.get('/admin/employees/:id/audit-logs', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ, { resourceIdParam: 'id', resourceType: 'hr_employee' }), hrController.getEmployeeAuditLogs);
router.post('/admin/employees', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_WRITE), hrController.createEmployee);
router.put('/admin/employees/:id', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_WRITE, { resourceIdParam: 'id', resourceType: 'hr_employee' }), hrController.updateEmployee);
router.delete('/admin/employees/:id', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_DELETE, { resourceIdParam: 'id', resourceType: 'hr_employee' }), hrController.deleteEmployee);
router.post('/admin/employees/:id/terminate', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_TERMINATE, { resourceIdParam: 'id', resourceType: 'hr_employee' }), hrController.terminateEmployee);

// Time-off calendar (admin view)
router.get('/admin/time-off/calendar', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ), hrController.getTimeOffCalendar);

// Time-off reports (admin view)
router.get('/admin/time-off/reports', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ), hrController.getTimeOffReports);

// Employee Import/Export (Available on Business Advanced+)
router.post('/admin/employees/import', 
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_IMPORT),
  csvUpload.single('file'),
  hrController.importEmployeesCSV
);
router.get('/admin/employees/export', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.exportEmployeesCSV);

// HR Settings (Available on Business Advanced+)
router.get('/admin/settings', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE), hrController.getHRSettings);
router.put('/admin/settings', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE), hrController.updateHRSettings);
router.get('/admin/features', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE), hrController.getHRFeatureAvailability);

// Workforce Communications bridge (domain integration — BO-1A)
router.post(
  '/admin/workforce-bridge/policy-broadcast',
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  hrWorkforceBridgeController.postHrPolicyWorkforceBroadcast
);
router.post(
  '/admin/workforce-bridge/announcement-broadcast',
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  hrWorkforceBridgeController.postHrAnnouncementWorkforceBroadcast
);

// HR Analytics (Available on Business Advanced+)
router.get('/admin/analytics/onboarding', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getOnboardingAnalyticsController);
router.get('/admin/analytics/attendance', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE), hrController.getAttendanceAnalyticsController);
router.get('/admin/analytics/time-off', checkHRAdmin, checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ), hrController.getTimeOffAnalyticsController);

// Onboarding (Business Advanced+ pilot)
router.get(
  '/admin/onboarding/templates',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE),
  hrController.getOnboardingTemplates
);
router.post(
  '/admin/onboarding/templates',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE),
  hrController.createOnboardingTemplate
);
router.put(
  '/admin/onboarding/templates/:templateId',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_UPDATE, { resourceIdParam: 'templateId', resourceType: 'onboarding_journey' }),
  hrController.updateOnboardingTemplate
);
router.delete(
  '/admin/onboarding/templates/:templateId',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE, { resourceIdParam: 'templateId', resourceType: 'onboarding_journey' }),
  hrController.deleteOnboardingTemplate
);
router.get(
  '/admin/onboarding/documents/library',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE),
  hrController.getOnboardingDocumentLibrary
);
router.get(
  '/admin/onboarding/journeys',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE),
  hrController.getOnboardingJourneys
);
router.post(
  '/admin/onboarding/journeys/start',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_CREATE),
  hrController.startOnboardingJourney
);
router.post(
  '/admin/onboarding/tasks/:taskId/complete',
  checkHRFeature('onboarding'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_COMPLETE, { resourceIdParam: 'taskId', resourceType: 'onboarding_journey' }),
  hrController.completeOnboardingTask
);

// Attendance (Phase 3 rollout)
router.get(
  '/admin/attendance/overview',
  checkHRFeature('attendance'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE),
  hrController.getAttendanceOverview
);
router.get(
  '/admin/attendance/policies',
  checkHRFeature('attendance'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE),
  hrController.getAttendancePolicies
);
router.post(
  '/admin/attendance/policies',
  checkHRFeature('attendance'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE),
  hrController.createAttendancePolicy
);
router.put(
  '/admin/attendance/policies/:id',
  checkHRFeature('attendance'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE, { resourceIdParam: 'id' }),
  hrController.updateAttendancePolicy
);

// ============================================================================
// ENTERPRISE-ONLY ADMIN ROUTES
// Route: /api/hr/admin/*
// Access: Business admins on Enterprise tier only
// ============================================================================

// Payroll (Enterprise only)
router.get('/admin/payroll', 
  checkHRFeature('payroll'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  (req, res) => {
    res.json({ 
      message: 'Payroll dashboard - framework stub',
      tier: req.hrTier,
      note: 'Feature implementation pending'
    });
  }
);

// Recruitment/ATS (Enterprise only)
router.get('/admin/recruitment',
  checkHRFeature('recruitment'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  (req, res) => {
    res.json({ 
      message: 'Recruitment dashboard - framework stub',
      tier: req.hrTier,
      note: 'Feature implementation pending'
    });
  }
);

// Performance Management (Enterprise only)
router.get('/admin/performance',
  checkHRFeature('performance'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  (req, res) => {
    res.json({ 
      message: 'Performance management - framework stub',
      tier: req.hrTier,
      note: 'Feature implementation pending'
    });
  }
);

// Benefits Administration (Enterprise only)
router.get('/admin/benefits',
  checkHRFeature('benefits'),
  checkHRAdmin,
  checkHRPolicy(POLICY_ACTIONS.HR_SETTINGS_WRITE),
  (req, res) => {
    res.json({ 
      message: 'Benefits administration - framework stub',
      tier: req.hrTier,
      note: 'Feature implementation pending'
    });
  }
);

// ============================================================================
// MANAGER ROUTES (Team Management)
// Route: /api/hr/team/*
// Access: Managers with direct reports
// ============================================================================

// View team members
router.get('/team/employees', checkManagerAccess, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getTeamEmployees);

// Approve team time-off (framework stub)
router.get('/team/time-off/pending',
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ),
  hrController.getPendingTeamTimeOff
);

router.post('/team/time-off/:id/approve',
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_APPROVE, { resourceIdParam: 'id', resourceType: 'time_off_request' }),
  hrController.approveTeamTimeOff
);

router.get(
  '/team/onboarding/tasks',
  checkHRFeature('onboarding'),
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_MANAGE),
  hrController.getTeamOnboardingTasks
);
router.post(
  '/team/onboarding/tasks/:taskId/complete',
  checkHRFeature('onboarding'),
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_COMPLETE, { resourceIdParam: 'taskId', resourceType: 'onboarding_journey' }),
  hrController.completeTeamOnboardingTask
);

router.get(
  '/team/attendance/exceptions',
  checkHRFeature('attendance'),
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_MANAGE),
  hrController.getTeamAttendanceExceptions
);

router.post(
  '/team/attendance/exceptions/:id/resolve',
  checkHRFeature('attendance'),
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_ATTENDANCE_EXCEPTION_UPDATE, { resourceIdParam: 'id', resourceType: 'attendance_exception' }),
  hrController.resolveTeamAttendanceException
);

// Time-off calendar (admins and managers)
router.get('/team/time-off/calendar',
  checkManagerAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ),
  hrController.getTimeOffCalendar
);

// ============================================================================
// DASHBOARD WIDGET (any employee with HR access)
// ============================================================================
router.get('/dashboard-summary', checkEmployeeAccess, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getDashboardSummary);

// ============================================================================
// EMPLOYEE ROUTES (Self-Service)
// Route: /api/hr/me/*
// Access: All business employees
// ============================================================================

// View own HR data
router.get('/me', checkEmployeeAccess, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getOwnHRData);

// Update own HR data (limited fields)
router.put('/me', checkEmployeeAccess, checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_WRITE), hrController.updateOwnHRData);

// Attendance (self-service)
router.get(
  '/me/attendance/records',
  checkHRFeature('attendance'),
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ),
  hrController.getMyAttendanceRecords
);
router.post(
  '/me/attendance/punch-in',
  checkHRFeature('attendance.clockInOut'),
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ),
  hrController.recordSelfAttendancePunchIn
);
router.post(
  '/me/attendance/punch-out',
  checkHRFeature('attendance.clockInOut'),
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ),
  hrController.recordSelfAttendancePunchOut
);

// Request time off (framework stub)
router.post('/me/time-off/request',
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_REQUEST),
  hrController.requestTimeOff
);

// View own time-off balance (framework stub)
router.get('/me/time-off/balance',
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ),
  hrController.getTimeOffBalance
);

// List own time-off requests
router.get('/me/time-off/requests',
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ),
  hrController.getMyTimeOffRequests
);

router.post('/me/time-off/:id/cancel',
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_REQUEST),
  hrController.cancelTimeOffRequest
);

router.get(
  '/me/onboarding/journeys',
  checkHRFeature('onboarding'),
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ),
  hrController.getMyOnboardingJourneys
);
router.post(
  '/me/onboarding/tasks/:taskId/complete',
  checkHRFeature('onboarding'),
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_ONBOARDING_COMPLETE, { resourceIdParam: 'taskId', resourceType: 'onboarding_journey' }),
  hrController.completeMyOnboardingTask
);

// View own pay stubs (framework stub)
router.get('/me/pay-stubs',
  checkEmployeeAccess,
  checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ),
  (req, res) => {
    res.json({ 
      message: 'Pay stubs - framework stub',
      payStubs: [],
      note: 'Feature implementation pending'
    });
  }
);

// ============================================================================
// AI CONTEXT PROVIDERS (Required for AI integration)
// Route: /api/hr/ai/*
// Access: Authenticated users with HR access
// ============================================================================

router.get('/ai/context/overview', checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getHROverviewContext);
router.get('/ai/context/headcount', checkHRPolicy(POLICY_ACTIONS.HR_EMPLOYEE_READ), hrController.getHeadcountContext);
router.get('/ai/context/time-off', checkHRPolicy(POLICY_ACTIONS.HR_TIME_OFF_READ), hrController.getTimeOffContext);

// ============================================================================
// HEALTH CHECK
// ============================================================================

router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    module: 'hr',
    version: '1.0.0',
    tier: req.hrTier,
    features: req.hrFeatures
  });
});

export default router;

