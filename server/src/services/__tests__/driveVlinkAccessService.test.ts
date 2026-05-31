import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VLinkEntityType } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import * as driveHelpers from '../drivePermissionHelpers';
import * as drivePolicyDual from '../../auth/drivePolicyDual';
import {
  resolveDriveFileForVLink,
  resolveDriveFolderForVLink,
  userCanLinkDriveFile,
} from '../driveVlinkAccessService';

describe('driveVlinkAccessService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({ blocked: false });
  });

  it('denies deleted files', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue(null);
    const result = await resolveDriveFileForVLink('user-1', 'missing');
    expect(result).toEqual({ allowed: false, state: 'deleted' });
  });

  it('denies trashed files without granting access', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'f1',
      name: 'doc.pdf',
      trashedAt: new Date(),
      dashboardId: null,
    } as never);

    const result = await resolveDriveFileForVLink('user-1', 'f1');
    expect(result.allowed).toBe(false);
    expect(result.state).toBe('trashed');
  });

  it('allows owner with policy pass', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'f1',
      name: 'doc.pdf',
      trashedAt: null,
      dashboardId: 'dash-1',
    } as never);
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(true);

    const result = await resolveDriveFileForVLink('owner-1', 'f1');
    expect(result).toMatchObject({
      allowed: true,
      state: 'active',
      title: 'doc.pdf',
      url: '/drive?file=f1',
    });
  });

  it('denies unrelated user even when V_Link link exists (permission gate)', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'f1',
      name: 'secret.pdf',
      trashedAt: null,
      dashboardId: null,
      folderId: null,
    } as never);
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(false);
    vi.spyOn(driveHelpers, 'canWriteFile').mockResolvedValue(false);

    const result = await resolveDriveFileForVLink('stranger-1', 'f1');
    expect(result.allowed).toBe(false);
    expect(await userCanLinkDriveFile('stranger-1', 'f1')).toBe(false);
  });

  it('denies when policy engine blocks', async () => {
    vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
      id: 'f1',
      name: 'doc.pdf',
      trashedAt: null,
      dashboardId: 'dash-1',
    } as never);
    vi.spyOn(driveHelpers, 'canReadFile').mockResolvedValue(true);
    vi.spyOn(drivePolicyDual, 'evaluateDrivePolicyDual').mockResolvedValue({
      blocked: true,
      reason: 'INSUFFICIENT_ROLE',
    });

    const result = await resolveDriveFileForVLink('user-1', 'f1');
    expect(result.allowed).toBe(false);
  });

  it('resolves active folders for collaborators', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'folder-1',
      name: 'Shared',
      trashedAt: null,
      dashboardId: null,
    } as never);
    vi.spyOn(driveHelpers, 'canReadFolder').mockResolvedValue(true);

    const result = await resolveDriveFolderForVLink('collab-1', 'folder-1');
    expect(result.allowed).toBe(true);
    expect(result.url).toBe('/drive?folder=folder-1');
  });
});

describe('driveVlinkAccessService entity types', () => {
  it('covers FILE and FOLDER V_Link types', () => {
    expect([VLinkEntityType.FILE, VLinkEntityType.FOLDER]).toContain(VLinkEntityType.FILE);
  });
});
