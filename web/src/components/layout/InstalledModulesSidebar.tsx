'use client'

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, Settings, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModuleManager } from './ModuleManager';

interface Module {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive';
  path: string;
  groupId?: string;
}

interface ModuleGroup {
  id: string;
  name: string;
  modules: Module[];
}

interface InstalledModulesSidebarProps {
  modules: Module[];
  groups: ModuleGroup[];
  onModulesChange: (modules: Module[]) => void;
  onGroupsChange: (groups: ModuleGroup[]) => void;
}

export const InstalledModulesSidebar: React.FC<InstalledModulesSidebarProps> = ({
  modules,
  groups,
  onModulesChange,
  onGroupsChange,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showModuleManager, setShowModuleManager] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleModuleClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setShowMobileMenu(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const renderModule = (module: Module) => (
    <button
      key={module.id}
      onClick={() => handleModuleClick(module.path)}
      className={`
        w-full flex items-center gap-3 px-4 py-2 text-sm
        hover:bg-gray-100 transition-colors
        ${pathname === module.path ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
      `}
    >
      <span className="text-lg">{module.icon}</span>
      <span className="truncate">{module.name}</span>
    </button>
  );

  const renderGroup = (group: ModuleGroup) => {
    const isExpanded = expandedGroups.has(group.id);
    const groupModules = modules.filter(m => m.groupId === group.id);

    return (
      <div key={group.id} className="space-y-1">
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 text-gray-500" />
          ) : (
            <Folder className="h-4 w-4 text-gray-500" />
          )}
          <span className="truncate">{group.name}</span>
        </button>
        {isExpanded && (
          <div className="pl-8 space-y-1">
            {groupModules.map(renderModule)}
          </div>
        )}
      </div>
    );
  };

  const ungroupedModules = modules.filter(m => !m.groupId);

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)]
          bg-white border-r border-gray-200
          transition-all duration-300 ease-in-out
          ${isCollapsed ? 'w-16' : 'w-64'}
          ${isMobile && !showMobileMenu ? '-translate-x-full' : 'translate-x-0'}
          z-40
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className={`font-semibold ${isCollapsed ? 'hidden' : 'block'}`}>
              Installed Modules
            </h2>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              {isCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Module Groups */}
          <div className="flex-1 overflow-y-auto py-2">
            {groups.map(renderGroup)}
          </div>

          {/* Ungrouped Modules */}
          {ungroupedModules.length > 0 && (
            <div className="border-t border-gray-200 py-2">
              {ungroupedModules.map(renderModule)}
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setShowModuleManager(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
            >
              <Settings className="h-4 w-4" />
              {!isCollapsed && <span>Manage Modules</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Module Manager Modal */}
      {showModuleManager && (
        <ModuleManager
          modules={modules}
          groups={groups}
          onModulesChange={onModulesChange}
          onGroupsChange={onGroupsChange}
          onClose={() => setShowModuleManager(false)}
        />
      )}
    </>
  );
}; 