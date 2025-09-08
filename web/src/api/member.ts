import { authenticatedApiCall } from '../lib/apiUtils';

// Types for member management
export interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  connectionStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  relationshipId: string | null;
  organization?: {
    id: string;
    name: string;
    type: 'business' | 'institution';
    role: string;
  } | null;
}

export interface Connection {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    organization?: {
      id: string;
      name: string;
      type: 'business' | 'institution';
      role: string;
    } | null;
  };
  type: 'REGULAR' | 'COLLEAGUE';
  organizationId: string | null;
  createdAt: string;
}

export interface PendingRequest {
  id: string;
  sender: {
    id: string;
    name: string | null;
    email: string;
    organization?: {
      id: string;
      name: string;
      type: 'business' | 'institution';
      role: string;
    } | null;
  };
  type: 'REGULAR' | 'COLLEAGUE';
  message: string | null;
  organizationId: string | null;
  createdAt: string;
}

export interface BusinessMember {
  id: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    createdAt: string;
  };
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  title: string | null;
  department: string | null;
  joinedAt: string;
  leftAt: string | null;
  isActive: boolean;
  canInvite: boolean;
  canManage: boolean;
  canBilling: boolean;
  job?: {
    id: string;
    title: string;
    department?: {
      name: string;
    } | null;
  } | null;
  connectionStatus: 'none' | 'pending' | 'accepted' | 'declined' | 'blocked';
  relationshipId: string | null;
}

export interface BusinessInvitation {
  id: string;
  businessId: string;
  email: string;
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
  title: string | null;
  department: string | null;
  invitedBy: {
    name: string | null;
  };
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

// Personal Connection APIs

export const searchUsers = async (query: string, limit = 20, offset = 0): Promise<{ users: User[] }> => {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  return authenticatedApiCall(`/api/member/users/search?${params}`, {
    method: 'GET',
  });
};

export interface ConnectionRelationship {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  type: 'colleague' | 'regular';
  message?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  receiver: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

export const sendConnectionRequest = async (receiverId: string, message?: string): Promise<{ relationship: ConnectionRelationship }> => {
  return authenticatedApiCall('/api/member/connections/request', {
    method: 'POST',
    body: JSON.stringify({ receiverId, message }),
  });
};

export const updateConnectionRequest = async (relationshipId: string, action: 'accept' | 'decline' | 'block'): Promise<{ relationship: ConnectionRelationship }> => {
  return authenticatedApiCall(`/api/member/connections/${relationshipId}`, {
    method: 'PUT',
    body: JSON.stringify({ relationshipId, action }),
  });
};

export const getConnections = async (type?: 'all' | 'colleague' | 'regular', limit = 20, offset = 0): Promise<{ connections: Connection[] }> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  
  if (type && type !== 'all') {
    params.append('type', type);
  }
  
  return authenticatedApiCall(`/api/member/connections?${params}`, {
    method: 'GET',
  });
};

export const getPendingRequests = async (): Promise<{ requests: PendingRequest[] }> => {
  return authenticatedApiCall('/api/member/connections/pending', {
    method: 'GET',
  });
};

// Business Employee Management APIs

export const inviteEmployee = async (
  businessId: string,
  email: string,
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN' = 'EMPLOYEE',
  title?: string,
  department?: string,
  message?: string
): Promise<{ invitation: BusinessInvitation }> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/invite`, {
    method: 'POST',
    body: JSON.stringify({ email, role, title, department, message }),
  });
};

export const getBusinessMembers = async (businessId: string): Promise<{ members: BusinessMember[] }> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/members`, {
    method: 'GET',
  });
};

export const updateEmployeeRole = async (
  memberId: string,
  role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN',
  title?: string,
  department?: string,
  canInvite?: boolean,
  canManage?: boolean,
  canBilling?: boolean
): Promise<{ member: BusinessMember }> => {
  return authenticatedApiCall(`/api/member/business/members/${memberId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ memberId, role, title, department, canInvite, canManage, canBilling }),
  });
};

export const removeEmployee = async (memberId: string): Promise<{ message: string; member: BusinessMember }> => {
  return authenticatedApiCall(`/api/member/business/members/${memberId}`, {
    method: 'DELETE',
  });
};

export const getBusinessInvitations = async (businessId: string): Promise<{ invitations: BusinessInvitation[] }> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/invitations`, {
    method: 'GET',
  });
};

export const resendInvitation = async (invitationId: string): Promise<{ message: string; invitation: BusinessInvitation }> => {
  return authenticatedApiCall(`/api/member/business/invitations/${invitationId}/resend`, {
    method: 'POST',
  });
};

export const cancelInvitation = async (invitationId: string): Promise<{ message: string }> => {
  return authenticatedApiCall(`/api/member/business/invitations/${invitationId}`, {
    method: 'DELETE',
  });
};

export const removeConnection = async (relationshipId: string): Promise<{ message: string }> => {
  return authenticatedApiCall(`/api/member/connections/${relationshipId}`, {
    method: 'DELETE',
  });
};

// Bulk Operations APIs

// Business Member Bulk Operations
export const bulkInviteEmployees = async (
  businessId: string,
  invitations: Array<{
    email: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    title?: string;
    department?: string;
    message?: string;
  }>
): Promise<{ 
  message: string; 
  results: { email: string; success: boolean; error?: string; invitation?: BusinessInvitation }[] 
}> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/bulk/invite`, {
    method: 'POST',
    body: JSON.stringify({ invitations }),
  });
};

export const bulkUpdateEmployeeRoles = async (
  businessId: string,
  updates: Array<{
    memberId: string;
    role: 'EMPLOYEE' | 'MANAGER' | 'ADMIN';
    title?: string;
    department?: string;
    canInvite?: boolean;
    canManage?: boolean;
    canBilling?: boolean;
  }>
): Promise<{ 
  message: string; 
  results: { memberId: string; success: boolean; error?: string; member?: BusinessMember }[] 
}> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/bulk/roles`, {
    method: 'PUT',
    body: JSON.stringify({ updates }),
  });
};

export const bulkRemoveEmployees = async (
  businessId: string,
  memberIds: string[]
): Promise<{ 
  message: string; 
  results: { memberId: string; success: boolean; error?: string }[] 
}> => {
  return authenticatedApiCall(`/api/member/business/${businessId}/bulk/remove`, {
    method: 'DELETE',
    body: JSON.stringify({ memberIds }),
  });
};

// Personal Connection Bulk Operations
export const bulkRemoveConnections = async (relationshipIds: string[]): Promise<{ 
  message: string; 
  results: { id: string; success: boolean; error?: string }[] 
}> => {
  return authenticatedApiCall('/api/member/connections/bulk/remove', {
    method: 'POST',
    body: JSON.stringify({ relationshipIds }),
  });
};

export const bulkUpdateConnectionRequests = async (
  requestIds: string[], 
  action: 'accept' | 'decline' | 'block'
): Promise<{ 
  message: string; 
  results: { id: string; success: boolean; error?: string }[] 
}> => {
  return authenticatedApiCall('/api/member/connections/bulk/requests', {
    method: 'POST',
    body: JSON.stringify({ requestIds, action }),
  });
}; 