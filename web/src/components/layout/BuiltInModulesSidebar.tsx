import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageSquare, Folder, BarChart, Settings } from 'lucide-react';

interface BuiltInModule {
  id: string;
  name: string;
  icon: React.ReactNode;
  path: string;
}

const builtInModules: BuiltInModule[] = [
  {
    id: 'chat',
    name: 'Chat',
    icon: <MessageSquare className="h-5 w-5" />,
    path: '/chat',
  },
  {
    id: 'drive',
    name: 'Drive',
    icon: <Folder className="h-5 w-5" />,
    path: '/drive',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart className="h-5 w-5" />,
    path: '/analytics',
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    path: '/settings',
  },
];

export const BuiltInModulesSidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleModuleClick = (module: BuiltInModule) => {
    router.push(module.path);
  };

  const isModuleActive = (path: string) => {
    return pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed top-16 right-0 h-[calc(100vh-4rem)] bg-white border-l border-gray-200
        transition-all duration-300 ease-in-out z-30
        ${isCollapsed ? 'w-12' : 'w-48'}
      `}
    >
      {/* Collapse/Expand button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 bg-white border border-gray-200 rounded-full p-1 shadow-sm hover:bg-gray-50"
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Modules list */}
      <div className="p-4">
        <h2 className={`font-semibold mb-4 ${isCollapsed ? 'hidden' : 'block'}`}>
          Core Modules
        </h2>
        <div className="space-y-2">
          {builtInModules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-colors
                ${isModuleActive(module.path)
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-100'
                }
                ${isCollapsed ? 'justify-center' : 'justify-start'}
              `}
            >
              {module.icon}
              {!isCollapsed && <span>{module.name}</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}; 