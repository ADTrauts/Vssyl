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

export interface BuiltInModuleManifest {
  entryPoint: string;
  isBuiltIn: true;
  permissions: string[];
  capabilities: BuiltInManifestCapabilities;
  routes?: Array<{ path: string; label: string }>;
  entities?: BuiltInManifestEntity[];
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
  };
}
