import type { HouseholdRole } from '@prisma/client';

/** Roles that may add members and (within policy) remove members from the household roster. */
export const HOUSEHOLD_ROSTER_MANAGER_ROLES: HouseholdRole[] = ['OWNER', 'ADMIN', 'ADULT'];

export function isHouseholdRosterManager(role: HouseholdRole | null | undefined): boolean {
  return !!role && HOUSEHOLD_ROSTER_MANAGER_ROLES.includes(role);
}

/**
 * Whether the acting member may use roster edit/remove (not invite-only) on the target member.
 * Owner/Admin: anyone except the household owner. Adult: only teen, child, or temporary guest.
 */
export function canModifyHouseholdMemberAsManager(
  managerRole: HouseholdRole | null | undefined,
  targetMemberRole: HouseholdRole
): boolean {
  if (!isHouseholdRosterManager(managerRole)) return false;
  if (targetMemberRole === 'OWNER') return false;
  if (managerRole === 'OWNER' || managerRole === 'ADMIN') return true;
  if (managerRole === 'ADULT') {
    return (
      targetMemberRole === 'TEEN' ||
      targetMemberRole === 'CHILD' ||
      targetMemberRole === 'TEMPORARY_GUEST'
    );
  }
  return false;
}
