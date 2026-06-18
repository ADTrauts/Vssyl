import type { Prisma } from '@prisma/client';

export const BUSINESS_MEMBER_USER_SELECT = {
  id: true,
  name: true,
  email: true,
} as const;

export const BUSINESS_WITH_ACTIVE_MEMBERS_INCLUDE = {
  members: {
    where: { isActive: true },
    include: {
      user: { select: BUSINESS_MEMBER_USER_SELECT },
    },
  },
} satisfies Prisma.BusinessInclude;

export const BUSINESS_LIST_INCLUDE = {
  members: {
    where: { isActive: true },
    include: {
      user: { select: BUSINESS_MEMBER_USER_SELECT },
    },
  },
  dashboards: true,
  subscriptions: {
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, tier: true, status: true },
  },
  _count: {
    select: {
      members: { where: { isActive: true } },
    },
  },
} satisfies Prisma.BusinessInclude;

export const BUSINESS_DETAIL_INCLUDE = {
  members: {
    where: { isActive: true },
    include: {
      user: { select: BUSINESS_MEMBER_USER_SELECT },
    },
  },
  dashboards: true,
  subscriptions: {
    where: { status: 'active' },
    orderBy: { createdAt: 'desc' as const },
    select: { id: true, tier: true, status: true },
  },
} satisfies Prisma.BusinessInclude;

export interface CreateBusinessInput {
  name: string;
  ein: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: Record<string, unknown>;
  phone?: string;
  email?: string;
  description?: string;
}

export interface UpdateBusinessInput {
  name?: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: Record<string, unknown>;
  phone?: string;
  email?: string;
  description?: string;
  branding?: Record<string, unknown>;
  schedulingMode?: string;
  schedulingStrategy?: string;
  schedulingConfig?: Record<string, unknown>;
  aiSettings?: Record<string, unknown>;
}

export interface InviteMemberInput {
  email: string;
  role: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
  title?: string;
  department?: string;
}

export interface UpdateMemberInput {
  role?: 'EMPLOYEE' | 'ADMIN' | 'MANAGER';
  title?: string;
  department?: string;
  canInvite?: boolean;
  canManage?: boolean;
  canBilling?: boolean;
}

export const CONFIGURATION_FIELD_KEYS = [
  'schedulingMode',
  'schedulingStrategy',
  'schedulingConfig',
  'aiSettings',
] as const;

export const BRANDING_FIELD_KEYS = ['branding'] as const;
