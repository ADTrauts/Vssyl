import React from 'react';
import { 
  BarChart3, 
  Folder, 
  MessageCircle, 
  Users, 
  Shield, 
  TrendingUp,
  Settings,
  LayoutDashboard
} from 'lucide-react';
import { MODULES, getModulesForUser } from '../config/modules';

interface BusinessWorkspaceLayoutProps {
  children: React.ReactNode;
  userRole?: string;
  isOwner?: boolean;
}

export default function BusinessWorkspaceLayout({ 
  children, 
  userRole = 'user', 
  isOwner = false 
}: BusinessWorkspaceLayoutProps) {
  const availableModules = getModulesForUser(userRole, isOwner);

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'dashboard':
        return <LayoutDashboard className="w-5 h-5" />;
      case 'folder':
        return <Folder className="w-5 h-5" />;
      case 'message-circle':
        return <MessageCircle className="w-5 h-5" />;
      case 'users':
        return <Users className="w-5 h-5" />;
      case 'shield':
        return <Shield className="w-5 h-5" />;
      case 'bar-chart':
        return <BarChart3 className="w-5 h-5" />;
      case 'trending-up':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900">Modules</h2>
        </div>
        
        <nav className="mt-4">
          {availableModules.map((module) => (
            <a
              key={module.id}
              href={module.path}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              {getModuleIcon(module.icon)}
              <span className="ml-3 text-sm font-medium">{module.name}</span>
              {module.ownerOnly && (
                <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Owner
                </span>
              )}
            </a>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Business Workspace</h1>
            <div className="flex items-center space-x-4">
              {isOwner && (
                <span className="text-sm text-blue-600 font-medium">Owner</span>
              )}
              <span className="text-sm text-gray-500">{userRole}</span>
            </div>
          </div>
        </div>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
} 