'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/common/Header'
import { Providers } from '@/components/layout/Providers'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { InstalledModulesSidebar } from './InstalledModulesSidebar'
import { BuiltInModulesSidebar } from './BuiltInModulesSidebar'

// Mock data for installed modules
const initialModules = [
  { 
    id: '1', 
    name: 'Project Management', 
    icon: '📊', 
    status: 'active',
    path: '/business/project-management',
    groupId: 'business'
  },
  { 
    id: '2', 
    name: 'Task Tracker', 
    icon: '✓', 
    status: 'active',
    path: '/business/task-tracker',
    groupId: 'business'
  },
  { 
    id: '3', 
    name: 'Calendar', 
    icon: '📅', 
    status: 'inactive',
    path: '/business/calendar',
    groupId: 'business'
  },
  {
    id: '4',
    name: 'Personal Finance',
    icon: '💰',
    status: 'active',
    path: '/life/finance',
    groupId: 'life'
  },
  {
    id: '5',
    name: 'Health Tracker',
    icon: '❤️',
    status: 'active',
    path: '/life/health',
    groupId: 'life'
  }
];

// Mock data for module groups
const initialGroups = [
  {
    id: 'business',
    name: 'Business',
    modules: []
  },
  {
    id: 'life',
    name: 'Life',
    modules: []
  }
];

export default function ClientLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [modules, setModules] = useState(initialModules);
  const [groups, setGroups] = useState(initialGroups);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load modules and groups from localStorage on mount
  useEffect(() => {
    const savedModules = localStorage.getItem('installedModules');
    const savedGroups = localStorage.getItem('moduleGroups');
    
    if (savedModules) {
      setModules(JSON.parse(savedModules));
    }
    if (savedGroups) {
      setGroups(JSON.parse(savedGroups));
    }
  }, []);

  // Save modules and groups to localStorage when they change
  useEffect(() => {
    localStorage.setItem('installedModules', JSON.stringify(modules));
    localStorage.setItem('moduleGroups', JSON.stringify(groups));
  }, [modules, groups]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Providers>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="fixed top-0 left-0 right-0 z-50">
            <Header />
          </div>

          {/* Left Sidebar */}
          <InstalledModulesSidebar
            modules={modules}
            groups={groups}
            onModulesChange={setModules}
            onGroupsChange={setGroups}
          />

          {/* Right Sidebar */}
          <BuiltInModulesSidebar />

          {/* Main Content */}
          <main className={`
            pt-16 transition-all duration-300 ease-in-out
            ${isMobile ? 'ml-0' : 'ml-64'}
            ${isMobile ? 'mr-0' : 'mr-48'}
            p-4
          `}>
            {children}
          </main>
        </div>
      </Providers>
    </DndProvider>
  )
} 