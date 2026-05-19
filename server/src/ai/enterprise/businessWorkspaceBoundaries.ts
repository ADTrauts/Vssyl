import { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export const BUSINESS_WORKSPACE_POLICY_BLOCK_TITLE = 'Business workspace AI policies';

/** Compact policy block injected into personal twin when `businessId` is in chat context. */
export interface BusinessWorkspaceBoundaryBlock {
  businessId: string;
  businessName?: string;
  securityLevel: string;
  complianceMode: boolean;
  policyLines: string[];
  /** Business-configured voice hints (does not replace personal Control Center prefs). */
  businessVoiceHints?: string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function readString(v: unknown): string | undefined {
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
}

function accessLabel(field: string, value: unknown): string | undefined {
  const v = readString(value) ?? (typeof value === 'boolean' ? (value ? 'allowed' : 'denied') : undefined);
  if (!v) return undefined;
  const labels: Record<string, string> = {
    none: 'no access',
    limited: 'limited access only',
    full: 'full access when authorized',
    allowed: 'allowed when policy permits',
    denied: 'not allowed',
  };
  const normalized = v.toLowerCase();
  const desc = labels[normalized] ?? v;
  return `${field}: ${desc}`;
}

/**
 * Turn stored business AI JSON into prompt-safe policy lines.
 */
export function formatBusinessWorkspacePolicyLines(input: {
  restrictions?: unknown;
  capabilities?: unknown;
  aiPersonality?: unknown;
  complianceMode?: boolean;
  securityLevel?: string;
}): { policyLines: string[]; businessVoiceHints: string[] } {
  const policyLines: string[] = [];
  const businessVoiceHints: string[] = [];

  if (input.complianceMode) {
    policyLines.push('Compliance mode is ON: avoid advice that violates policy; flag uncertainty.');
  }
  if (input.securityLevel && input.securityLevel !== 'standard') {
    policyLines.push(`Security level: ${input.securityLevel} — apply stricter data handling.`);
  }

  if (isRecord(input.restrictions)) {
    const r = input.restrictions;
    const employee = accessLabel('Employee data', r.employeeDataAccess);
    const client = accessLabel('Client data', r.clientDataAccess);
    if (employee) policyLines.push(employee);
    if (client) policyLines.push(client);
    if (r.financialDataAccess === false) {
      policyLines.push('Financial data: do not surface or infer financial records without explicit authorization.');
    }
    if (r.sensitiveDataAccess === false) {
      policyLines.push('Sensitive data: do not expose classified or sensitive business data.');
    }
    if (r.externalAPIAccess === false) {
      policyLines.push('External integrations: do not assume third-party API access is permitted.');
    }
    if (r.crossDepartmentAccess === false) {
      policyLines.push('Cross-department data: stay within the user’s department context unless they confirm broader access.');
    }
    const maxLen = typeof r.maxResponseLength === 'number' ? r.maxResponseLength : undefined;
    if (maxLen && maxLen > 0 && maxLen < 8000) {
      policyLines.push(`Keep responses under roughly ${maxLen} characters when possible.`);
    }
    const maxPerDay = typeof r.maxInteractionsPerDay === 'number' ? r.maxInteractionsPerDay : undefined;
    if (maxPerDay && maxPerDay > 0) {
      policyLines.push(`Business daily interaction guidance: avoid suggesting high-volume automated outreach.`);
    }
    const forbidden = r.forbiddenTopics;
    if (Array.isArray(forbidden) && forbidden.length > 0) {
      const topics = forbidden
        .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        .slice(0, 8)
        .join(', ');
      if (topics) policyLines.push(`Forbidden topics: ${topics}.`);
    }
    const accessLevel = readString(r.accessLevel);
    if (accessLevel) policyLines.push(`General access level: ${accessLevel}.`);
  }

  if (isRecord(input.capabilities)) {
    const disabled: string[] = [];
    for (const [key, val] of Object.entries(input.capabilities)) {
      if (val === false) disabled.push(key);
    }
    if (disabled.length > 0) {
      policyLines.push(`Disabled capabilities for this workspace: ${disabled.slice(0, 10).join(', ')}.`);
    }
  }

  if (isRecord(input.aiPersonality)) {
    const p = input.aiPersonality;
    const tone = readString(p.tone);
    const style = readString(p.communicationStyle);
    if (tone) businessVoiceHints.push(`Preferred business tone: ${tone}`);
    if (style) businessVoiceHints.push(`Communication style: ${style}`);
    const expertise = Array.isArray(p.expertise)
      ? p.expertise.filter((e): e is string => typeof e === 'string').slice(0, 5)
      : [];
    if (expertise.length > 0) {
      businessVoiceHints.push(`Business expertise areas: ${expertise.join(', ')}`);
    }
    const values = Array.isArray(p.companyValues)
      ? p.companyValues.filter((e): e is string => typeof e === 'string').slice(0, 4)
      : [];
    if (values.length > 0) {
      businessVoiceHints.push(`Company values to respect: ${values.join(', ')}`);
    }
  }

  return { policyLines: policyLines.slice(0, 12), businessVoiceHints: businessVoiceHints.slice(0, 6) };
}

/**
 * Load business workspace policies for an active member. Returns null if no twin, no access, or inactive.
 */
export async function loadBusinessWorkspaceBoundaryBlock(
  userId: string,
  businessId: string,
  db: PrismaClient = prisma
): Promise<BusinessWorkspaceBoundaryBlock | null> {
  const member = await db.businessMember.findFirst({
    where: { businessId, userId, isActive: true },
    select: { id: true },
  });
  if (!member) {
    return null;
  }

  const twin = await db.businessAIDigitalTwin.findUnique({
    where: { businessId },
    include: {
      business: { select: { id: true, name: true } },
    },
  });

  if (!twin || twin.status !== 'active' || !twin.allowEmployeeInteraction) {
    return null;
  }

  const { policyLines, businessVoiceHints } = formatBusinessWorkspacePolicyLines({
    restrictions: twin.restrictions,
    capabilities: twin.capabilities,
    aiPersonality: twin.aiPersonality,
    complianceMode: twin.complianceMode,
    securityLevel: twin.securityLevel,
  });

  if (policyLines.length === 0 && businessVoiceHints.length === 0) {
    policyLines.push(
      'You are assisting in a business workspace. Apply business-appropriate professionalism and do not expose data outside the user’s authorized scope.'
    );
  }

  void logger.debug('Loaded business workspace AI policies for personal twin', {
    operation: 'business_workspace_boundaries_loaded',
    userId,
    businessId,
    policyLineCount: policyLines.length,
  });

  return {
    businessId,
    businessName: twin.business?.name,
    securityLevel: twin.securityLevel,
    complianceMode: twin.complianceMode,
    policyLines,
    ...(businessVoiceHints.length > 0 && { businessVoiceHints }),
  };
}
