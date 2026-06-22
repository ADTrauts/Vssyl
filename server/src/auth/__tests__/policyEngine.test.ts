import { describe, it, expect, vi, afterEach } from 'vitest';
import { authorize } from '../policyEngine';
import { POLICY_ACTIONS } from '../policyActions';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

describe('authorize (policyEngine)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dashboard:read allows owner with matching tenant scope', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      businessId: 'b1',
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1', businessId: 'b1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('dashboard_owner');
  });

  it('dashboard:read denies TENANT_MISMATCH when scope businessId disagrees', async () => {
    const warn = vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      businessId: 'b1',
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1', businessId: 'b_wrong' },
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('TENANT_MISMATCH');
    expect(warn).toHaveBeenCalledWith(
      'Policy denied',
      expect.objectContaining({
        operation: 'policy_deny',
        reason: 'TENANT_MISMATCH',
        action: POLICY_ACTIONS.DASHBOARD_READ,
      }),
    );
  });

  it('dashboard:read defers cross-user access to handler (allow, delegate_owner_scope)', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u_owner',
      businessId: null,
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u_intruder',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'd1',
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('delegate_owner_scope');
  });

  it('dashboard:read list allows authenticated user', async () => {
    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_READ,
      resourceType: 'dashboard',
      resourceId: 'u1',
      metadata: { operation: 'list' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('dashboard_list_authenticated');
  });

  it('dashboard:write denies non-owner on existing dashboard', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u_owner',
      businessId: null,
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u_intruder',
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1' },
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('NOT_OWNER');
  });

  it('dashboard:write allows authenticated create path', async () => {
    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_WRITE,
      resourceType: 'dashboard',
      resourceId: 'u1',
      metadata: { operation: 'create' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('dashboard_authenticated_write');
  });

  it('dashboard:delete allows owner delete', async () => {
    vi.spyOn(prisma.dashboard, 'findFirst').mockResolvedValue({
      id: 'd1',
      userId: 'u1',
      businessId: null,
      householdId: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.DASHBOARD_DELETE,
      resourceType: 'dashboard',
      resourceId: 'd1',
      scope: { dashboardId: 'd1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('dashboard_owner_delete');
  });

  it('calendar:event.create allows editor membership', async () => {
    vi.spyOn(prisma.calendarMember, 'findFirst').mockResolvedValue({ id: 'm1' } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.CALENDAR_EVENT_CREATE,
      resourceType: 'calendar_event',
      resourceId: 'cal-1',
      metadata: { calendarId: 'cal-1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('calendar_event_create_editor');
  });

  it('calendar:calendar.read denies non-member', async () => {
    vi.spyOn(prisma.calendar, 'findFirst').mockResolvedValue(null);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.CALENDAR_READ,
      resourceType: 'calendar',
      resourceId: 'cal-1',
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('NOT_MEMBER');
  });

  it('file:read on folder allows owner', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u1',
      dashboardId: 'd1',
      trashedAt: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
      scope: { dashboardId: 'd1' },
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('folder_owner');
  });

  it('file:read denies TENANT_MISMATCH when scope dashboardId disagrees with folder', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u1',
      dashboardId: 'd1',
      trashedAt: null,
    } as never);

    const d = await authorize({
      userId: 'u1',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
      scope: { dashboardId: 'd_other' },
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('TENANT_MISMATCH');
  });

  it('file:read denies with INSUFFICIENT_ROLE when not owner and no read grant', async () => {
    vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u_owner',
      dashboardId: null,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue(null);

    const d = await authorize({
      userId: 'u_other',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
    });
    expect(d.allow).toBe(false);
    expect(d.reason).toBe('INSUFFICIENT_ROLE');
  });

  it('file:read allows collaborator with canRead grant', async () => {
    vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
      id: 'f1',
      userId: 'u_owner',
      dashboardId: null,
      trashedAt: null,
    } as never);
    vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue({ id: 'p1' } as never);

    const d = await authorize({
      userId: 'u_reader',
      action: POLICY_ACTIONS.FILE_READ,
      resourceType: 'folder',
      resourceId: 'f1',
    });
    expect(d.allow).toBe(true);
    expect(d.matchedPolicy).toBe('folder_permission_read');
  });

  describe('Drive write/delete (PE-D1)', () => {
    it('file:update allows owner', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file1',
        userId: 'u1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.FILE_UPDATE,
        resourceType: 'file',
        resourceId: 'file1',
        scope: { dashboardId: 'd1' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('file_owner');
    });

    it('file:update allows collaborator with canWrite', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file1',
        userId: 'u_owner',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.filePermission, 'findFirst').mockResolvedValue({ id: 'p1' } as never);

      const d = await authorize({
        userId: 'u_editor',
        action: POLICY_ACTIONS.FILE_UPDATE,
        resourceType: 'file',
        resourceId: 'file1',
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('file_permission_write');
    });

    it('file:delete denies read-only collaborator', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file1',
        userId: 'u_owner',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.filePermission, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u_viewer',
        action: POLICY_ACTIONS.FILE_DELETE,
        resourceType: 'file',
        resourceId: 'file1',
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('file:update delegates trashed file to handler 404', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file1',
        userId: 'u1',
        dashboardId: 'd1',
        trashedAt: new Date(),
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.FILE_UPDATE,
        resourceType: 'file',
        resourceId: 'file1',
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_not_found');
    });

    it('folder:delete denies TENANT_MISMATCH on dashboard scope', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        id: 'f1',
        userId: 'u1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.FOLDER_DELETE,
        resourceType: 'folder',
        resourceId: 'f1',
        scope: { dashboardId: 'd_wrong' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('TENANT_MISMATCH');
    });

    it('folder:update allows owner', async () => {
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        id: 'f1',
        userId: 'u1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.FOLDER_UPDATE,
        resourceType: 'folder',
        resourceId: 'f1',
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('folder_owner');
    });
  });

  describe('Drive move/upload/share (PE-D2)', () => {
    it('file:move allows collaborator with write on source and target', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file-1',
        userId: 'owner-1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.filePermission, 'findFirst').mockResolvedValue({ id: 'p1' } as never);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        id: 'folder-b',
        userId: 'owner-1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue({ id: 'p2' } as never);

      const d = await authorize({
        userId: 'collab-1',
        action: POLICY_ACTIONS.FILE_MOVE,
        resourceType: 'file',
        resourceId: 'file-1',
        metadata: { targetFolderId: 'folder-b' },
      });
      expect(d.allow).toBe(true);
    });

    it('file:upload requires folder write on target folder', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        id: 'folder-a',
        userId: 'owner-1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);
      vi.spyOn(prisma.folderPermission, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'viewer-1',
        action: POLICY_ACTIONS.FILE_UPLOAD,
        resourceType: 'folder',
        resourceId: 'folder-a',
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('folder:share denies non-owner', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.folder, 'findUnique').mockResolvedValue({
        id: 'f1',
        userId: 'owner-1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);

      const d = await authorize({
        userId: 'intruder-1',
        action: POLICY_ACTIONS.FOLDER_SHARE,
        resourceType: 'folder',
        resourceId: 'f1',
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('NOT_OWNER');
    });

    it('file:share allows owner only', async () => {
      vi.spyOn(prisma.file, 'findUnique').mockResolvedValue({
        id: 'file-1',
        userId: 'owner-1',
        dashboardId: 'd1',
        trashedAt: null,
      } as never);

      const d = await authorize({
        userId: 'owner-1',
        action: POLICY_ACTIONS.FILE_SHARE,
        resourceType: 'file',
        resourceId: 'file-1',
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('file_share_owner');
    });
  });

  describe('module:install', () => {
    const approvedModule = { id: 'mod-hr', status: 'APPROVED' as const };

    it('allows business ADMIN to install', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_module_install');
    });

    it('allows business MANAGER to install', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'MANAGER',
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(true);
    });

    it('allows member with canManage to install', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canManage: true,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(true);
    });

    it('denies regular EMPLOYEE without canManage', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('denies NOT_MEMBER when no active membership', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('NOT_MEMBER');
    });

    it('denies business scope when businessId is missing', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        metadata: { installScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('allows personal scope install for authenticated user', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(approvedModule as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        metadata: { installScope: 'personal' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('module_install_personal');
    });

    it('defers missing module to handler (delegate_not_found)', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_INSTALL,
        resourceType: 'module',
        resourceId: 'missing',
        metadata: { installScope: 'personal' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_not_found');
    });
  });

  describe('module:uninstall', () => {
    const existingModule = { id: 'mod-hr' };

    it('allows business ADMIN to uninstall', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canManage: false,
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue({ id: 'bmi_1' } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_module_uninstall');
    });

    it('allows business MANAGER to uninstall', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'MANAGER',
        canManage: false,
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue({ id: 'bmi_1' } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(true);
    });

    it('allows member with canManage to uninstall', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canManage: true,
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue({ id: 'bmi_1' } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(true);
    });

    it('denies regular EMPLOYEE without canManage', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('denies NOT_MEMBER when no active membership', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('NOT_MEMBER');
    });

    it('denies TENANT_MISMATCH when membership businessId does not match scope', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canManage: false,
        businessId: 'b2',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('TENANT_MISMATCH');
    });

    it('delegates business uninstall when installation row is missing (handler returns 404)', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canManage: false,
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.businessModuleInstallation, 'findUnique').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        scope: { businessId: 'b1' },
        metadata: { uninstallScope: 'business' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_installation_not_found');
    });

    it('allows personal uninstall when user owns installation', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue({
        id: 'inst_1',
        userId: 'u1',
      } as never);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        metadata: { uninstallScope: 'personal' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('module_uninstall_personal');
    });

    it('delegates personal uninstall when installation is missing (handler returns 404)', async () => {
      vi.spyOn(prisma.module, 'findUnique').mockResolvedValue(existingModule as never);
      vi.spyOn(prisma.moduleInstallation, 'findUnique').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.MODULE_UNINSTALL,
        resourceType: 'module',
        resourceId: 'mod-hr',
        metadata: { uninstallScope: 'personal' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_installation_not_found');
    });
  });

  describe('business member management (PE-B1)', () => {
    const businessRow = { id: 'b1' };

    it('business:member.invite allows ADMIN', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canInvite: true,
        canManage: true,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_admin',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_member_invite');
    });

    it('business:member.invite allows MANAGER', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'MANAGER',
        canInvite: false,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_mgr',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
    });

    it('business:member.invite allows member with canInvite only', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: true,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_inviter',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
    });

    it('business:member.invite denies employee without canInvite', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: false,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_emp',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('business:member.remove allows canManage', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: false,
        canManage: true,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_mgr',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_REMOVE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_member_manage');
    });

    it('business:member.update denies inactive member (NOT_MEMBER)', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u_inactive',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('NOT_MEMBER');
    });

    it('business:member.update denies TENANT_MISMATCH', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canInvite: true,
        canManage: true,
        businessId: 'b_other',
      } as never);

      const d = await authorize({
        userId: 'u_admin',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('TENANT_MISMATCH');
    });

    it('business:member.acceptInvitation allows matching invitee email', async () => {
      vi.spyOn(prisma.businessInvitation, 'findUnique').mockResolvedValue({
        email: 'invitee@example.com',
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        email: 'invitee@example.com',
      } as never);

      const d = await authorize({
        userId: 'u_invitee',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
        metadata: { invitationToken: 'tok_abc' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_member_accept_invitation');
    });

    it('business:member.acceptInvitation denies email mismatch', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.businessInvitation, 'findUnique').mockResolvedValue({
        email: 'invitee@example.com',
        businessId: 'b1',
      } as never);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        email: 'other@example.com',
      } as never);

      const d = await authorize({
        userId: 'u_wrong',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_ACCEPT_INVITATION,
        resourceType: 'business',
        resourceId: 'b1',
        metadata: { invitationToken: 'tok_abc' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('delegates when business row is missing', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_INVITE,
        resourceType: 'business',
        resourceId: 'b_missing',
        scope: { businessId: 'b_missing' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_not_found');
    });

    it('business:member.cancelInvite allows canInvite', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: true,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_inviter',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_CANCEL_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_member_cancel_invite');
    });

    it('business:member.cancelInvite denies employee without canInvite', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: false,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_emp',
        action: POLICY_ACTIONS.BUSINESS_MEMBER_CANCEL_INVITE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });
  });

  describe('business:update (PE-B2)', () => {
    const businessRow = { id: 'b1' };

    it('allows ADMIN to update business', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canInvite: true,
        canManage: true,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_admin',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('business_update');
    });

    it('allows MANAGER to update business', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'MANAGER',
        canInvite: true,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_mgr',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
    });

    it('allows member with canManage only', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: false,
        canManage: true,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_mgr',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(true);
    });

    it('denies employee without canManage', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'EMPLOYEE',
        canInvite: false,
        canManage: false,
        businessId: 'b1',
      } as never);

      const d = await authorize({
        userId: 'u_emp',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('INSUFFICIENT_ROLE');
    });

    it('denies NOT_MEMBER', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u_out',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('NOT_MEMBER');
    });

    it('denies TENANT_MISMATCH', async () => {
      vi.spyOn(logger, 'warn').mockResolvedValue(undefined as never);
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(businessRow as never);
      vi.spyOn(prisma.businessMember, 'findFirst').mockResolvedValue({
        role: 'ADMIN',
        canInvite: true,
        canManage: true,
        businessId: 'b_other',
      } as never);

      const d = await authorize({
        userId: 'u_admin',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b1',
        scope: { businessId: 'b1' },
      });
      expect(d.allow).toBe(false);
      expect(d.reason).toBe('TENANT_MISMATCH');
    });

    it('delegates when business row is missing', async () => {
      vi.spyOn(prisma.business, 'findUnique').mockResolvedValue(null);

      const d = await authorize({
        userId: 'u1',
        action: POLICY_ACTIONS.BUSINESS_UPDATE,
        resourceType: 'business',
        resourceId: 'b_missing',
        scope: { businessId: 'b_missing' },
      });
      expect(d.allow).toBe(true);
      expect(d.matchedPolicy).toBe('delegate_not_found');
    });
  });
});
