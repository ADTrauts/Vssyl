/**
 * G10 facade — re-exports domain services for G09 backward compatibility.
 */
export type { ManagerScope } from './schedulingServiceShared';

export { resolveManagerScopeFromRequest } from './schedulingSwapService';

export {
  listOpenShiftsForManager,
  assignShiftToEmployeeByManager,
} from './schedulingShiftService';

export {
  listTeamAvailability,
  updateEmployeeAvailabilityByAdmin,
} from './schedulingAvailabilityService';

export { listBusinessShiftSwapRequests } from './schedulingSwapService';

export {
  listShiftTemplates,
  getShiftTemplateById,
  createShiftTemplate,
  updateShiftTemplate,
  archiveShiftTemplate,
} from './schedulingTemplateService';
