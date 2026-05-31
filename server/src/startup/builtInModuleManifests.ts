import type { BuiltInModuleId } from '../constants/builtInModuleIds';

export interface BuiltInManifestCapabilities {
  read?: boolean;
  write?: boolean;
  realtime?: boolean;
  ai?: boolean;
  vlink?: boolean;
  trash?: boolean;
  notifications?: boolean;
  search?: boolean;
  preview?: boolean;
  businessWorkspace?: boolean;
  globalActivity?: boolean;
}

export interface BuiltInManifestEntity {
  type: string;
  displayName: string;
  pluralName: string;
  vlinkEntityType?: string;
  supportsTrash?: boolean;
  supportsSearch?: boolean;
}

export interface BuiltInManifestNotification {
  type: string;
  name: string;
  description: string;
  category: string;
  defaultChannels?: { inApp?: boolean; email?: boolean; push?: boolean };
  priority?: 'low' | 'normal' | 'high';
  requiresAction?: boolean;
  /** When true, type is registered for discovery but not yet emitted by server. */
  planned?: boolean;
}

export interface BuiltInModuleManifest {
  entryPoint: string;
  isBuiltIn: true;
  permissions: string[];
  capabilities: BuiltInManifestCapabilities;
  routes?: Array<{ path: string; label: string }>;
  entities?: BuiltInManifestEntity[];
  notifications?: BuiltInManifestNotification[];
}

const CAP = {
  readWrite: { read: true, write: true } as BuiltInManifestCapabilities,
  readWriteAi: { read: true, write: true, ai: true } as BuiltInManifestCapabilities,
};

/** Canonical manifest fragments merged on startup reconcile (Batch 1). */
export function buildBuiltInModuleManifest(moduleId: BuiltInModuleId): BuiltInModuleManifest {
  const base = (permissions: string[], capabilities: BuiltInManifestCapabilities): BuiltInModuleManifest => ({
    entryPoint: `/${moduleId}`,
    isBuiltIn: true,
    permissions,
    capabilities,
  });

  switch (moduleId) {
    case 'drive':
      return {
        ...base(['drive:read', 'drive:write'], {
          read: true,
          write: true,
          ai: true,
          vlink: true,
          trash: true,
          realtime: true,
          notifications: true,
          search: true,
          preview: true,
          businessWorkspace: true,
          globalActivity: true,
        }),
        routes: [{ path: '/drive', label: 'File Hub' }],
        entities: [
          {
            type: 'file',
            displayName: 'File',
            pluralName: 'Files',
            vlinkEntityType: 'FILE',
            supportsTrash: true,
            supportsSearch: true,
          },
          {
            type: 'folder',
            displayName: 'Folder',
            pluralName: 'Folders',
            vlinkEntityType: 'FOLDER',
            supportsTrash: true,
            supportsSearch: true,
          },
        ],
        notifications: [
          {
            type: 'drive_permission',
            name: 'File or folder shared',
            description: 'Sent when a file or folder is shared with you or permissions change',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: true },
            priority: 'normal',
            requiresAction: false,
          },
          {
            type: 'drive_shared',
            name: 'File shared (legacy)',
            description: 'Legacy share notification type; prefer drive_permission',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: false },
            priority: 'normal',
            requiresAction: false,
          },
          {
            type: 'drive_file_shared',
            name: 'File shared',
            description: 'Alias catalog entry when file share is distinguished from folder share',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: true },
            priority: 'normal',
            requiresAction: false,
            planned: true,
          },
          {
            type: 'drive_file_unshared',
            name: 'File unshared',
            description: 'Sent when file access is revoked',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: false },
            priority: 'normal',
            requiresAction: false,
            planned: true,
          },
          {
            type: 'drive_folder_shared',
            name: 'Folder shared',
            description: 'Sent when a folder is shared with you',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: true },
            priority: 'normal',
            requiresAction: false,
            planned: true,
          },
          {
            type: 'drive_folder_unshared',
            name: 'Folder unshared',
            description: 'Sent when folder access is revoked',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: false },
            priority: 'normal',
            requiresAction: false,
            planned: true,
          },
          {
            type: 'drive_item_restored',
            name: 'Item restored from trash',
            description: 'Sent when a shared file or folder is restored from trash',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: false },
            priority: 'normal',
            requiresAction: false,
          },
          {
            type: 'drive_item_deleted',
            name: 'Item trashed or permanently deleted',
            description: 'Sent when a shared file or folder is moved to trash or permanently deleted',
            category: 'drive',
            defaultChannels: { inApp: true, email: false, push: false },
            priority: 'normal',
            requiresAction: false,
          },
        ],
      };
    case 'chat':
      return {
        ...base(['chat:read', 'chat:write'], {
          read: true,
          write: true,
          ai: true,
          trash: true,
          realtime: true,
          notifications: true,
          search: true,
          businessWorkspace: true,
          globalActivity: true,
        }),
        routes: [{ path: '/chat', label: 'Chat' }],
      };
    case 'calendar':
      return {
        ...base(['calendar:read', 'calendar:write'], {
          read: true,
          write: true,
          ai: true,
          vlink: true,
          trash: true,
          notifications: true,
          search: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/calendar', label: 'Calendar' }],
      };
    case 'todo':
      return {
        ...base(['todo:read', 'todo:write'], {
          read: true,
          write: true,
          ai: true,
          trash: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/todo', label: 'To-Do' }],
      };
    case 'notes':
      return {
        ...base(['notes:read', 'notes:write'], {
          read: true,
          write: true,
          ai: true,
          trash: true,
          notifications: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/notes', label: 'Notes' }],
      };
    case 'vlink':
      return base(['vlink:read', 'vlink:write'], {
        read: true,
        write: true,
        ai: true,
        businessWorkspace: true,
      });
    case 'place':
      return {
        ...base(['place:read', 'place:write'], {
          read: true,
          write: true,
          ai: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/place', label: 'Place' }],
      };
    case 'dashboard':
      return base(['dashboard:read'], {
        read: true,
        ai: true,
        trash: true,
        businessWorkspace: true,
      });
    case 'hr':
      return {
        ...base(['hr:read', 'hr:write', 'hr:admin'], {
          read: true,
          write: true,
          ai: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/hr', label: 'HR' }],
      };
    case 'scheduling':
      return {
        ...base(['scheduling:read', 'scheduling:write'], {
          read: true,
          write: true,
          ai: true,
          realtime: true,
          businessWorkspace: true,
        }),
        routes: [{ path: '/scheduling', label: 'Scheduling' }],
      };
    default: {
      const _exhaustive: never = moduleId;
      return base([`${String(_exhaustive)}:read`], CAP.readWrite);
    }
  }
}

/** Merge canonical manifest fields into existing DB manifest JSON without dropping partner keys. */
export function reconcileBuiltInManifest(
  moduleId: BuiltInModuleId,
  existing: Record<string, unknown> | null | undefined
): Record<string, unknown> {
  const canonical = buildBuiltInModuleManifest(moduleId);
  const prev = existing && typeof existing === 'object' ? existing : {};
  return {
    ...prev,
    entryPoint: canonical.entryPoint,
    isBuiltIn: true,
    permissions: canonical.permissions,
    capabilities: {
      ...(typeof prev.capabilities === 'object' && prev.capabilities !== null
        ? (prev.capabilities as Record<string, unknown>)
        : {}),
      ...canonical.capabilities,
    },
    ...(canonical.routes ? { routes: canonical.routes } : {}),
    ...(canonical.entities ? { entities: canonical.entities } : {}),
    ...(canonical.notifications ? { notifications: canonical.notifications } : {}),
  };
}
