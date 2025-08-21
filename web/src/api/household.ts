import { HouseholdRole, HouseholdType } from '@prisma/client';

// Helper to add Authorization header
function authHeaders(token: string, headers: Record<string, string> = {}) {
  return { ...headers, Authorization: `Bearer ${token}` };
}

const API_BASE = '/api/household';

export interface Household {
  id: string;
  name: string;
  description?: string;
  type: HouseholdType;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
  members: HouseholdMember[];
  _count?: {
    members: number;
    dashboards: number;
  };
}

export interface HouseholdMember {
  id: string;
  userId: string;
  householdId: string;
  role: HouseholdRole;
  joinedAt: string;
  expiresAt?: string;
  isActive: boolean;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

export interface CreateHouseholdRequest {
  name: string;
  description?: string;
  type: HouseholdType;
  isPrimary?: boolean;
}

export interface UpdateHouseholdRequest {
  name?: string;
  description?: string;
}

export interface InviteMemberRequest {
  email: string;
  role: HouseholdRole;
  expiresAt?: string;
}

export interface UpdateMemberRoleRequest {
  role: HouseholdRole;
  expiresAt?: string;
}

// Get all households for the current user
export async function getHouseholds(token: string): Promise<Household[]> {
  const res = await fetch(API_BASE, { 
    headers: authHeaders(token) 
  });
  if (!res.ok) throw new Error('Failed to fetch households');
  const data: { households: Household[] } = await res.json();
  return data.households;
}

// Get a specific household
export async function getHousehold(token: string, id: string): Promise<Household> {
  const res = await fetch(`${API_BASE}/${id}`, { 
    headers: authHeaders(token) 
  });
  if (!res.ok) throw new Error('Household not found');
  const data: { household: Household } = await res.json();
  return data.household;
}

// Create a new household
export async function createHousehold(token: string, input: CreateHouseholdRequest): Promise<Household> {
  const res = await fetch(API_BASE, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to create household');
  }
  const data: { household: Household } = await res.json();
  return data.household;
}

// Update a household
export async function updateHousehold(token: string, id: string, input: UpdateHouseholdRequest): Promise<Household> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update household');
  }
  const data: { household: Household } = await res.json();
  return data.household;
}

// Delete a household
export async function deleteHousehold(token: string, id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to delete household');
  }
}

// Invite a member to the household
export async function inviteMember(token: string, householdId: string, input: InviteMemberRequest): Promise<HouseholdMember> {
  const res = await fetch(`${API_BASE}/${householdId}/members`, {
    method: 'POST',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to invite member');
  }
  const data: { member: HouseholdMember } = await res.json();
  return data.member;
}

// Update a member's role
export async function updateMemberRole(token: string, householdId: string, userId: string, input: UpdateMemberRoleRequest): Promise<HouseholdMember> {
  const res = await fetch(`${API_BASE}/${householdId}/members/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
    headers: authHeaders(token, { 'Content-Type': 'application/json' }),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to update member role');
  }
  const data: { member: HouseholdMember } = await res.json();
  return data.member;
}

// Remove a member from the household
export async function removeMember(token: string, householdId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/${householdId}/members/${userId}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Failed to remove member');
  }
}

// Utility function to get role display name
export function getRoleDisplayName(role: HouseholdRole): string {
  switch (role) {
    case 'OWNER':
      return 'Owner';
    case 'ADMIN':
      return 'Admin';
    case 'ADULT':
      return 'Adult';
    case 'TEEN':
      return 'Teen';
    case 'CHILD':
      return 'Child';
    case 'TEMPORARY_GUEST':
      return 'Guest';
    default:
      return role;
  }
}

// Utility function to get role color
export function getRoleColor(role: HouseholdRole): 'gray' | 'blue' | 'green' | 'red' | 'yellow' {
  switch (role) {
    case 'OWNER':
      return 'blue';
    case 'ADMIN':
      return 'blue';
    case 'ADULT':
      return 'green';
    case 'TEEN':
      return 'yellow';
    case 'CHILD':
      return 'red';
    case 'TEMPORARY_GUEST':
      return 'gray';
    default:
      return 'gray';
  }
} 