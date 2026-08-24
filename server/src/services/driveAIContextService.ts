/**
 * Drive AI context — canonical read path via driveVisibilityService (Wave 1C).
 * Formats stable response contracts for twin / orchestrator consumers.
 *
 * D2: owner + shared/access enrichment on recent_files (no grantor fabrication).
 */

import {
  listAccessibleRecentFilesForAIContext,
  listSharedFilesForAIContext,
  aggregateAccessibleDriveStorageForAIContext,
  countAccessibleDriveFilesForAIContext,
  type DriveAIContextFileRow,
} from './driveVisibilityService';

const DEFAULT_STORAGE_LIMIT_BYTES = 10_737_418_240; // 10GB

/** Share grantor is not stored on FilePermission — never invent sharedBy = owner. */
export const DRIVE_SHARE_GRANTOR_SEMANTICS = {
  shareGrantorRecorded: false as const,
  note: 'Owner is the file owner. Your access comes from a file permission. The share/grant actor is not recorded.',
};

export type DriveRecentFilesFocusMode =
  | 'recent'
  | 'shared_with_me'
  | 'owner_accessible'
  | 'ownership'
  | 'grantor_unavailable';

export interface DriveRecentFilesAIOptions {
  query?: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Math.max(bytes, 0)) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function accessLevelFor(
  file: DriveAIContextFileRow,
  currentUserId: string
): 'owner' | 'edit' | 'read' | 'none' {
  if (file.userId === currentUserId) return 'owner';
  const perm = file.permissions[0];
  if (perm?.canWrite) return 'edit';
  if (perm?.canRead) return 'read';
  return 'none';
}

function mapFileForAI(file: DriveAIContextFileRow, currentUserId: string) {
  const ownedByCurrentUser = file.userId === currentUserId;
  const accessLevel = accessLevelFor(file, currentUserId);
  const sharedWithCurrentUser =
    !ownedByCurrentUser && (accessLevel === 'read' || accessLevel === 'edit');

  let accessLabel = 'Accessible';
  if (ownedByCurrentUser) {
    accessLabel = 'Owned by you';
  } else if (sharedWithCurrentUser) {
    accessLabel =
      accessLevel === 'edit' ? 'Shared with you — edit access' : 'Shared with you — read access';
  }

  return {
    id: file.id,
    name: file.name,
    type: file.type,
    size: formatFileSize(file.size),
    lastModified: file.updatedAt.toISOString(),
    folder: file.folder?.name || 'Root',
    starred: file.starred,
    ownerName: file.user?.name ?? null,
    ownerUserId: file.userId,
    ownedByCurrentUser,
    sharedWithCurrentUser,
    accessLevel,
    accessLabel,
  };
}

export type DriveAIContextFilePayload = ReturnType<typeof mapFileForAI>;

function normalizeOwnerNeedle(raw: string): string {
  return raw.trim().replace(/[?.!,]+$/g, '').trim();
}

function ownerNameMatches(ownerName: string | null | undefined, needle: string): boolean {
  if (!ownerName || !needle) return false;
  const name = ownerName.toLowerCase();
  const q = needle.toLowerCase();
  if (name === q) return true;
  if (name.includes(q)) return true;
  return name.split(/\s+/).some((part) => part === q);
}

function fileNameMatches(fileName: string, needle: string): boolean {
  const n = needle.trim().toLowerCase().replace(/[?.!,]+$/g, '');
  if (!n) return false;
  const f = fileName.toLowerCase();
  return f === n || f.includes(n);
}

/**
 * Parse explicit Drive share/owner focus from the user query (bounded cues only).
 * Does not treat bare "sent" as Drive.
 */
export function resolveDriveRecentFilesFocus(query: string | null | undefined): {
  mode: DriveRecentFilesFocusMode;
  ownerNeedle?: string;
  fileNameNeedle?: string;
} {
  const q = (query || '').trim();
  if (!q) return { mode: 'recent' };

  const grantorMatch = q.match(/\bwho\s+shared\s+(.+?)\s+with\s+me\b/i);
  if (grantorMatch?.[1]) {
    return {
      mode: 'grantor_unavailable',
      fileNameNeedle: normalizeOwnerNeedle(grantorMatch[1]),
    };
  }

  const ownsMatch = q.match(/\bwho\s+owns\s+(.+?)(?:\?|$)/i);
  if (ownsMatch?.[1]) {
    return {
      mode: 'ownership',
      fileNameNeedle: normalizeOwnerNeedle(ownsMatch[1]),
    };
  }

  const sharedWithMeOnly =
    /\b(?:what|show(?:\s+me)?|list)\s+(?:files?|documents?)\s+(?:are\s+)?shared\s+with\s+me\b/i.test(
      q
    ) ||
    /\b(?:files?|documents?)\s+(?:that\s+(?:are|were)\s+)?shared\s+with\s+me\b/i.test(q);

  const ownerShareMatch =
    q.match(
      /\b(?:what|show(?:\s+me)?|list)\s+(?:the\s+)?(?:files?|documents?)\s+did\s+([A-Za-z][\w\s.'-]{0,40}?)\s+share\s+with\s+me\b/i
    ) ||
    q.match(
      /\b(?:the\s+)?(?:file|document)\s+([A-Za-z][\w\s.'-]{0,40}?)\s+shared\s+with\s+me\b/i
    ) ||
    q.match(
      /\b(?:files?|documents?)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,3})\s+shared\s+with\s+me\b/
    ) ||
    q.match(
      /\b(?:files?|documents?)\s+(?:owned\s+by|from)\s+([A-Za-z][\w\s.'-]{0,40}?)(?:\s+that)?\s+(?:I\s+can\s+access|can\s+I\s+access)\b/i
    ) ||
    q.match(
      /\b(?:files?|documents?)\s+(?:does|did)\s+([A-Za-z][\w\s.'-]{0,40}?)\s+own\s+that\s+I\s+can\s+access\b/i
    ) ||
    q.match(
      /\baccessible\s+(?:files?|documents?)\s+from\s+([A-Za-z][\w\s.'-]{0,40}?)(?:\?|$)/i
    );

  if (ownerShareMatch?.[1]) {
    const needle = normalizeOwnerNeedle(ownerShareMatch[1]);
    const stop = /^(are|is|was|were|the|a|an|my|our|me|i)$/i;
    if (needle && !stop.test(needle)) {
      return {
        mode: 'owner_accessible',
        ownerNeedle: needle,
      };
    }
  }

  if (sharedWithMeOnly && !/\bsent\b/i.test(q)) {
    return { mode: 'shared_with_me' };
  }

  return { mode: 'recent' };
}

function uniqueOwnerCandidates(
  files: DriveAIContextFilePayload[],
  needle: string
): Array<{ ownerName: string; ownerUserId: string }> {
  const byId = new Map<string, { ownerName: string; ownerUserId: string }>();
  for (const f of files) {
    if (!ownerNameMatches(f.ownerName, needle)) continue;
    if (!f.ownerName) continue;
    byId.set(f.ownerUserId, { ownerName: f.ownerName, ownerUserId: f.ownerUserId });
  }
  return [...byId.values()];
}

export async function buildRecentFilesAIContext(
  userId: string,
  dashboardId?: string | null,
  options?: DriveRecentFilesAIOptions
) {
  const focus = resolveDriveRecentFilesFocus(options?.query);

  const [recentRows, sharedRows] = await Promise.all([
    listAccessibleRecentFilesForAIContext({
      userId,
      dashboardId,
      limit: 10,
    }),
    listSharedFilesForAIContext({
      userId,
      dashboardId,
      limit: 25,
    }),
  ]);

  const recentFiles = recentRows.map((f) => mapFileForAI(f, userId));
  // Product "shared with me": permission-granted files the user does not own.
  const sharedWithMe = sharedRows
    .filter((f) => f.userId !== userId)
    .map((f) => mapFileForAI(f, userId));

  const authorizedById = new Map<string, DriveAIContextFilePayload>();
  for (const f of [...recentFiles, ...sharedWithMe]) {
    authorizedById.set(f.id, f);
  }
  const authorizedFiles = [...authorizedById.values()];

  let focusFiles: DriveAIContextFilePayload[] = [];
  let ownerMatchAmbiguity: Array<{ ownerName: string; ownerUserId: string }> | undefined;

  if (focus.mode === 'shared_with_me') {
    focusFiles = sharedWithMe;
  } else if (focus.mode === 'owner_accessible' && focus.ownerNeedle) {
    const candidates = uniqueOwnerCandidates(authorizedFiles, focus.ownerNeedle);
    if (candidates.length > 1) {
      ownerMatchAmbiguity = candidates;
      focusFiles = [];
    } else if (candidates.length === 1) {
      const ownerId = candidates[0].ownerUserId;
      focusFiles = authorizedFiles.filter(
        (f) => f.ownerUserId === ownerId && f.sharedWithCurrentUser
      );
    } else {
      focusFiles = [];
    }
  } else if (
    (focus.mode === 'ownership' || focus.mode === 'grantor_unavailable') &&
    focus.fileNameNeedle
  ) {
    focusFiles = authorizedFiles.filter((f) => fileNameMatches(f.name, focus.fileNameNeedle!));
  }

  return {
    context: {
      recentFiles,
      sharedWithMe,
      focus: {
        mode: focus.mode,
        ownerNeedle: focus.ownerNeedle ?? null,
        fileNameNeedle: focus.fileNameNeedle ?? null,
        files: focusFiles,
        ...(ownerMatchAmbiguity ? { ownerMatchAmbiguity } : {}),
        ...(focus.mode === 'grantor_unavailable'
          ? {
              shareGrantorRecorded: false,
              shareGrantorNote: DRIVE_SHARE_GRANTOR_SEMANTICS.note,
            }
          : {}),
      },
      summary: {
        totalRecentFiles: recentFiles.length,
        totalSharedWithMe: sharedWithMe.length,
        hasStarredFiles: recentRows.some((f) => f.starred),
        mostRecentUpdate: recentRows[0]?.updatedAt.toISOString(),
        ...DRIVE_SHARE_GRANTOR_SEMANTICS,
      },
    },
    metadata: {
      provider: 'drive',
      endpoint: 'recentFiles',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function buildStorageStatsAIContext(userId: string, dashboardId?: string | null) {
  const aggregate = await aggregateAccessibleDriveStorageForAIContext({ userId, dashboardId });
  const storageLimit = DEFAULT_STORAGE_LIMIT_BYTES;
  const percentageUsed = (aggregate.storageUsedBytes / storageLimit) * 100;
  const other =
    aggregate.totalFiles -
    aggregate.documentFiles -
    aggregate.imageFiles -
    aggregate.videoFiles;

  return {
    context: {
      storage: {
        used: formatFileSize(aggregate.storageUsedBytes),
        usedBytes: aggregate.storageUsedBytes,
        limit: formatFileSize(storageLimit),
        limitBytes: storageLimit,
        percentageUsed: Math.round(percentageUsed * 100) / 100,
        available: formatFileSize(storageLimit - aggregate.storageUsedBytes),
      },
      files: {
        total: aggregate.totalFiles,
        byType: {
          documents: aggregate.documentFiles,
          images: aggregate.imageFiles,
          videos: aggregate.videoFiles,
          other: Math.max(0, other),
        },
      },
      status:
        percentageUsed >= 90 ? 'critical' : percentageUsed >= 75 ? 'warning' : 'normal',
    },
    metadata: {
      provider: 'drive',
      endpoint: 'storageStats',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function buildFileCountAIContext(
  userId: string,
  params: {
    type?: string;
    folderId?: string | null;
    dashboardId?: string | null;
  }
) {
  const type =
    params.type === 'folder' || params.type === 'recent' || params.type === 'all'
      ? params.type
      : 'all';

  const count = await countAccessibleDriveFilesForAIContext({
    userId,
    dashboardId: params.dashboardId,
    type,
    folderId: params.folderId ?? null,
  });

  return {
    count,
    parameters: {
      type,
      folderId: params.folderId || null,
    },
    metadata: {
      provider: 'drive',
      endpoint: 'fileCount',
      timestamp: new Date().toISOString(),
    },
  };
}
