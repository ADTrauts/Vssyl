import { PrismaClient } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { loadBusinessWorkspaceBoundaryBlock } from './businessWorkspaceBoundaries';

/** Employee-facing read-only digest of workspace AI policies. */
export interface WorkspaceAIPolicyDigest {
  businessId: string;
  businessName?: string;
  workspaceAIName?: string;
  description?: string;
  securityLevel: string;
  complianceMode: boolean;
  policyLines: string[];
  voiceHints: string[];
  allowEmployeeInteraction: boolean;
  personalIdentityNote: string;
}

export const WORKSPACE_AI_PERSONAL_IDENTITY_NOTE =
  'Your personal AI Identity (how your twin communicates, what it remembers, and what you save from chat) still applies. Workspace policies add organization boundaries on top — they do not replace your personal settings.';

/**
 * Build a read-only policy digest for an active business member.
 * Returns null when the user is not a member or workspace AI is not active for employees.
 */
export async function buildWorkspaceAIPolicyDigest(
  userId: string,
  businessId: string,
  db: PrismaClient = prisma
): Promise<WorkspaceAIPolicyDigest | null> {
  const boundary = await loadBusinessWorkspaceBoundaryBlock(userId, businessId, db);
  if (!boundary) {
    return null;
  }

  const twin = await db.businessAIDigitalTwin.findUnique({
    where: { businessId },
    select: {
      name: true,
      description: true,
      allowEmployeeInteraction: true,
    },
  });

  return {
    businessId,
    businessName: boundary.businessName,
    workspaceAIName: twin?.name,
    description: twin?.description ?? undefined,
    securityLevel: boundary.securityLevel,
    complianceMode: boundary.complianceMode,
    policyLines: boundary.policyLines,
    voiceHints: boundary.businessVoiceHints ?? [],
    allowEmployeeInteraction: twin?.allowEmployeeInteraction ?? true,
    personalIdentityNote: WORKSPACE_AI_PERSONAL_IDENTITY_NOTE,
  };
}
