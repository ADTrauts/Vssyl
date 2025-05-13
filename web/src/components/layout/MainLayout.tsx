import { ReactNode, useState } from 'react';
import { Logo } from '@/components/common/Logo';
import { UserMenu } from '@/components/common/UserMenu';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4">
        <div className="flex items-center gap-4">
          <Logo size="md" />
          <nav className="flex items-center gap-6">
            <a href="/business" className="text-sm font-medium hover:text-primary">
              Business
            </a>
            <a href="/life" className="text-sm font-medium hover:text-primary">
              Life
            </a>
            <a href="/education" className="text-sm font-medium hover:text-primary">
              Education
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - User's Blocks */}
        <aside
          className={cn(
            'w-64 border-r bg-background transition-all duration-300',
            leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-sm font-semibold">My Blocks</h2>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                ←
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* User's installed blocks will go here */}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Right Sidebar - Built-in Modules */}
        <aside
          className={cn(
            'w-48 border-l bg-background transition-all duration-300',
            rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <h2 className="text-sm font-semibold">Modules</h2>
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="rounded-md p-1 hover:bg-muted"
              >
                →
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <nav className="space-y-2">
                <a
                  href="/chat"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  💬 Chat
                </a>
                <Link
                  href="/drive"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  📁 Drive
                </Link>
                <a
                  href="/analytics"
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                >
                  📊 Analytics
                </a>
              </nav>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}; 