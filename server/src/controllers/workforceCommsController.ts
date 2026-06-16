/**
 * Workforce Communications HTTP handlers — split under `./workforceComms/` by surface.
 * Exported names must match `routes/workforceComms.ts` and integration tests.
 */

export { requireAuthorizedBusinessId } from './workforceComms/workforceCommsShared';
export * from './workforceComms/workforceCommsAdminController';
export * from './workforceComms/workforceCommsEmployeeController';
export * from './workforceComms/workforceCommsAiContextController';
