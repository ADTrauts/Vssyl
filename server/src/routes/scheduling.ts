import express from 'express';
import { body, param, query } from 'express-validator';
import { authenticateJWT } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import { checkSchedulingModuleInstalled } from '../middleware/schedulingFeatureGating';
import {
  checkSchedulingAdmin,
  checkSchedulingManagerAccess,
  checkSchedulingEmployeeAccess,
  checkSchedulingSelfAccess
} from '../middleware/schedulingPermissions';
import * as schedulingController from '../controllers/schedulingController';
import { asyncHandler } from '../index';

const router: express.Router = express.Router();

/** UUID path param used across scheduling entities */
const idParam = validate([param('id').isUUID()]);

/** POST /me/availability — route-level shape; controller enforces day/type semantics and time ordering */
const postOwnAvailability = validate([
  query('businessId').optional().isUUID(),
  body('businessId').optional().isUUID(),
  body('dayOfWeek').isString().notEmpty(),
  body('startTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('availabilityType').isString().notEmpty(),
  body('effectiveFrom').optional().isISO8601(),
  body('effectiveTo').optional().isISO8601(),
  body('recurring').optional().isBoolean(),
  body('notes').optional().isString(),
]);

/** POST /ai/generate-schedule */
const postAiGenerateSchedule = validate([
  body('businessId').isUUID(),
  body('scheduleId').isUUID(),
  body('strategy').optional().isString(),
]);

/** POST /ai/suggest-assignments */
const postAiSuggestAssignments = validate([
  body('businessId').isUUID(),
  body('shiftId').isUUID(),
  body('scheduleId').optional().isUUID(),
]);

/** POST /admin/schedules */
const postAdminCreateSchedule = validate([
  body('name').isString().notEmpty(),
  body('startDate').isString().notEmpty(),
  body('endDate').isString().notEmpty(),
  body('description').optional().isString(),
  body('timezone').optional().isString(),
  body('templateId').optional().isUUID(),
]);

/** POST /admin/shifts */
const postAdminCreateShift = validate([
  body('scheduleId').isUUID(),
  body('title').isString().notEmpty(),
  body('startTime').isString().notEmpty(),
  body('endTime').isString().notEmpty(),
  body('businessId').optional().isUUID(),
  body('employeePositionId').optional().isUUID(),
  body('positionId').optional().isUUID(),
  body('breakMinutes').optional().isInt({ min: 0 }),
  body('notes').optional().isString(),
  body('color').optional().isString(),
  body('isOpenShift').optional().isBoolean(),
  body('stationName').optional().isString(),
  body('locationId').optional().isUUID(),
]);

/** POST /admin/schedule-templates */
const postAdminCreateScheduleTemplate = validate([
  body('name').isString().notEmpty(),
  body('scheduleType').isString().notEmpty(),
  body('description').optional().isString(),
  body('sourceScheduleId').optional().isUUID(),
]);

/** POST /admin/stations */
const postAdminCreateBusinessStation = validate([
  body('businessId').isUUID(),
  body('name').isString().notEmpty(),
  body('stationType').isString().notEmpty(),
  body('jobFunction').optional().isString(),
  body('description').optional().isString(),
  body('color').optional().isString(),
  body('isRequired').optional().isBoolean(),
  body('priority').optional().isInt(),
  body('defaultStartTime').optional().isString(),
  body('defaultEndTime').optional().isString(),
]);

/** POST /admin/job-locations */
const postAdminCreateJobLocation = validate([
  body('businessId').isUUID(),
  body('name').isString().notEmpty(),
  body('address').optional().isString(),
  body('description').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isString(),
  body('notes').optional().isString(),
]);

/** PUT /admin/schedules/:id — partial update */
const putAdminUpdateSchedule = validate([
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('startDate').optional().isString(),
  body('endDate').optional().isString(),
  body('timezone').optional().isString(),
]);

/** PUT /admin/shifts/:id — partial; employeePositionId may be UUID, empty, or member-* */
const putAdminUpdateShift = validate([
  body('title').optional().isString(),
  body('startTime').optional().isString(),
  body('endTime').optional().isString(),
  body('breakMinutes').optional().isInt({ min: 0 }),
  body('notes').optional(),
  body('color').optional().isString(),
  body('positionId').optional().custom((v) => v === '' || typeof v === 'string'),
  body('employeePositionId')
    .optional({ nullable: true })
    .custom((v) => {
      if (v === undefined) return true;
      if (v === null || v === '') return true;
      if (typeof v === 'string' && v.startsWith('member-')) return true;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
    }),
  body('stationName').optional({ nullable: true }).isString(),
  body('locationId')
    .optional({ nullable: true })
    .custom((v) => v === null || v === '' || (typeof v === 'string' && /^[0-9a-f-]{36}$/i.test(v))),
]);

/** PUT /admin/schedule-templates/:id */
const putAdminUpdateScheduleTemplate = validate([
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('scheduleType').optional().isString(),
  body('isActive').optional().isBoolean(),
]);

/** PUT /admin/stations/:id — businessId required by controller */
const putAdminUpdateBusinessStation = validate([
  body('businessId').isUUID(),
  body('name').optional().isString(),
  body('stationType').optional().isString(),
  body('jobFunction').optional(),
  body('description').optional().isString(),
  body('color').optional().isString(),
  body('isRequired').optional().isBoolean(),
  body('priority').optional().isInt(),
  body('isActive').optional().isBoolean(),
  body('defaultStartTime').optional(),
  body('defaultEndTime').optional(),
]);

/** PUT /admin/job-locations/:id */
const putAdminUpdateJobLocation = validate([
  body('name').optional().isString(),
  body('address').optional().isString(),
  body('description').optional().isString(),
  body('phone').optional().isString(),
  body('email').optional().isString(),
  body('notes').optional().isString(),
  body('isActive').optional().isBoolean(),
]);

/** PUT swap approve/deny — optional notes */
const putSwapManagerNotes = validate([body('managerNotes').optional().isString()]);

/** PUT /me/availability/:id */
const putOwnAvailability = validate([
  query('businessId').optional().isUUID(),
  body('dayOfWeek').optional().isString(),
  body('startTime').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').optional().matches(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  body('availabilityType').optional().isString(),
  body('effectiveFrom').optional().isISO8601(),
  body('effectiveTo').optional().isISO8601(),
  body('recurring').optional().isBoolean(),
  body('notes').optional().isString(),
]);

router.use(authenticateJWT);
router.use(checkSchedulingModuleInstalled);

// ============================================================================
// ADMIN ROUTES
// Access: Business owners and admins
// ============================================================================

// Schedules
router.get('/admin/schedules', checkSchedulingAdmin, schedulingController.getSchedules);
router.post('/admin/schedules', checkSchedulingAdmin, postAdminCreateSchedule, schedulingController.createSchedule);
router.get('/admin/schedules/:id', checkSchedulingAdmin, idParam, schedulingController.getScheduleById);
router.put(
  '/admin/schedules/:id',
  checkSchedulingAdmin,
  idParam,
  putAdminUpdateSchedule,
  schedulingController.updateSchedule
);
router.delete('/admin/schedules/:id', checkSchedulingAdmin, idParam, schedulingController.deleteSchedule);
router.post('/admin/schedules/:id/publish', checkSchedulingAdmin, idParam, schedulingController.publishSchedule);

// Shifts
router.get('/admin/shifts', checkSchedulingAdmin, schedulingController.getShifts);
router.post('/admin/shifts', checkSchedulingAdmin, postAdminCreateShift, schedulingController.createShift);
router.get('/admin/shifts/:id', checkSchedulingAdmin, idParam, schedulingController.getShiftById);
router.put(
  '/admin/shifts/:id',
  checkSchedulingAdmin,
  idParam,
  putAdminUpdateShift,
  schedulingController.updateShift
);
router.delete('/admin/shifts/:id', checkSchedulingAdmin, idParam, schedulingController.deleteShift);

// Shift Templates
router.get('/admin/templates', checkSchedulingAdmin, schedulingController.getShiftTemplates);
router.post('/admin/templates', checkSchedulingAdmin, schedulingController.createShiftTemplate);
router.get('/admin/templates/:id', checkSchedulingAdmin, idParam, schedulingController.getShiftTemplateById);
router.put('/admin/templates/:id', checkSchedulingAdmin, idParam, schedulingController.updateShiftTemplate);
router.delete('/admin/templates/:id', checkSchedulingAdmin, idParam, schedulingController.deleteShiftTemplate);

// Schedule Templates
router.get('/admin/schedule-templates', checkSchedulingAdmin, schedulingController.getScheduleTemplates);
router.post(
  '/admin/schedule-templates',
  checkSchedulingAdmin,
  postAdminCreateScheduleTemplate,
  schedulingController.createScheduleTemplate
);
router.get('/admin/schedule-templates/:id', checkSchedulingAdmin, idParam, schedulingController.getScheduleTemplateById);
router.put(
  '/admin/schedule-templates/:id',
  checkSchedulingAdmin,
  idParam,
  putAdminUpdateScheduleTemplate,
  schedulingController.updateScheduleTemplate
);
router.delete('/admin/schedule-templates/:id', checkSchedulingAdmin, idParam, schedulingController.deleteScheduleTemplate);

// Employee Availability (Admin view all)
router.get('/admin/availability', checkSchedulingAdmin, schedulingController.getAllEmployeeAvailability);
router.put('/admin/availability/:id', checkSchedulingAdmin, idParam, schedulingController.updateEmployeeAvailabilityAdmin);

// Shift Swap Requests (Admin view all and manage)
router.get('/admin/swaps', checkSchedulingAdmin, schedulingController.getAllShiftSwapRequests);
router.put(
  '/admin/swaps/:id/approve',
  checkSchedulingAdmin,
  idParam,
  putSwapManagerNotes,
  schedulingController.approveShiftSwapAdmin
);
router.put(
  '/admin/swaps/:id/deny',
  checkSchedulingAdmin,
  idParam,
  putSwapManagerNotes,
  schedulingController.denyShiftSwapAdmin
);

// Business Stations
router.get('/admin/stations', checkSchedulingAdmin, schedulingController.getBusinessStations);
router.post(
  '/admin/stations',
  checkSchedulingAdmin,
  postAdminCreateBusinessStation,
  schedulingController.createBusinessStation
);
router.get('/admin/stations/:id', checkSchedulingAdmin, idParam, schedulingController.getBusinessStationById);
router.put(
  '/admin/stations/:id',
  checkSchedulingAdmin,
  idParam,
  putAdminUpdateBusinessStation,
  schedulingController.updateBusinessStation
);
router.delete('/admin/stations/:id', checkSchedulingAdmin, idParam, schedulingController.deleteBusinessStation);

// Job Locations
router.get('/admin/job-locations', checkSchedulingAdmin, schedulingController.getBusinessJobLocations);
router.post(
  '/admin/job-locations',
  checkSchedulingAdmin,
  postAdminCreateJobLocation,
  schedulingController.createBusinessJobLocation
);
router.put(
  '/admin/job-locations/:id',
  checkSchedulingAdmin,
  idParam,
  putAdminUpdateJobLocation,
  schedulingController.updateBusinessJobLocation
);
router.delete('/admin/job-locations/:id', checkSchedulingAdmin, idParam, schedulingController.deleteBusinessJobLocation);

// Recommendations
router.get('/recommendations', checkSchedulingAdmin, schedulingController.getSchedulingRecommendations);

// ============================================================================
// AI-POWERED SCHEDULING
// ============================================================================

router.post(
  '/ai/generate-schedule',
  checkSchedulingAdmin,
  postAiGenerateSchedule,
  schedulingController.generateAISchedule
);
router.post(
  '/ai/suggest-assignments',
  checkSchedulingAdmin,
  postAiSuggestAssignments,
  schedulingController.suggestShiftAssignments
);

// ============================================================================
// MANAGER ROUTES
// ============================================================================

router.get('/team/schedules', checkSchedulingManagerAccess, schedulingController.getTeamSchedules);
router.post('/team/schedules/:id/publish', checkSchedulingManagerAccess, idParam, schedulingController.publishTeamSchedule);

router.get('/team/shifts/open', checkSchedulingManagerAccess, schedulingController.getOpenShiftsForTeam);
router.post('/team/shifts/:id/assign', checkSchedulingManagerAccess, idParam, schedulingController.assignEmployeeToShift);

router.get('/team/availability', checkSchedulingManagerAccess, schedulingController.getTeamAvailability);

router.get('/team/swaps/pending', checkSchedulingManagerAccess, schedulingController.getPendingShiftSwapRequestsForTeam);
router.put(
  '/team/swaps/:id/approve',
  checkSchedulingManagerAccess,
  idParam,
  putSwapManagerNotes,
  schedulingController.approveShiftSwapManager
);
router.put(
  '/team/swaps/:id/deny',
  checkSchedulingManagerAccess,
  idParam,
  putSwapManagerNotes,
  schedulingController.denyShiftSwapManager
);

// ============================================================================
// DASHBOARD WIDGET
// ============================================================================
router.get('/dashboard-summary', checkSchedulingEmployeeAccess, schedulingController.getDashboardSummary);

// ============================================================================
// EMPLOYEE ROUTES
// ============================================================================

router.get('/me/schedule', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, schedulingController.getOwnSchedule);

router.post(
  '/me/availability',
  checkSchedulingEmployeeAccess,
  checkSchedulingSelfAccess,
  postOwnAvailability,
  asyncHandler(schedulingController.setOwnAvailability)
);
router.get('/me/availability', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, schedulingController.getOwnAvailability);
router.put(
  '/me/availability/:id',
  checkSchedulingEmployeeAccess,
  checkSchedulingSelfAccess,
  idParam,
  putOwnAvailability,
  schedulingController.updateOwnAvailability
);
router.delete('/me/availability/:id', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, idParam, schedulingController.deleteOwnAvailability);

router.post('/me/shifts/:id/swap/request', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, idParam, schedulingController.requestShiftSwap);
router.get('/me/swaps', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, schedulingController.getOwnShiftSwapRequests);
router.post('/me/swap-requests/:id/cancel', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, idParam, schedulingController.cancelSwapRequest);

router.get('/me/open-shifts', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, schedulingController.getOwnOpenShifts);
router.post('/me/shifts/:id/claim', checkSchedulingEmployeeAccess, checkSchedulingSelfAccess, idParam, schedulingController.claimOpenShift);

// ============================================================================
// AI CONTEXT ROUTES
// ============================================================================

router.get('/ai/context/overview', checkSchedulingEmployeeAccess, schedulingController.getSchedulingOverviewForAI);
router.get('/ai/context/coverage', checkSchedulingEmployeeAccess, schedulingController.getCoverageStatusForAI);
router.get('/ai/context/conflicts', checkSchedulingEmployeeAccess, schedulingController.getSchedulingConflictsForAI);

export default router;
