'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import AvatarContextMenu from '../../components/AvatarContextMenu';

export default function BusinessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Don't render anything while loading
  if (status === "loading") {
    return null;
  }

  // Redirect to login if not authenticated
  if (!session) {
    redirect("/auth/login");
  }

  // Only apply this layout to business routes, not to business creation
  const isBusinessRoute = pathname.startsWith('/business/') && !pathname.includes('/create');
  const isBusinessWorkspace = pathname.includes('/workspace');

  // For business workspace pages, use a minimal layout
  if (isBusinessRoute && isBusinessWorkspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Simple header for business workspace */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">Business Workspace</h1>
              </div>
              <AvatarContextMenu />
            </div>
          </div>
        </header>
        {children}
      </div>
    );
  }

  // For other business pages (like profile), use a more detailed layout
  if (isBusinessRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Business header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-lg font-semibold text-gray-900">Business Management</h1>
              </div>
              <AvatarContextMenu />
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    );
  }

  // For non-business routes, just render children
  return <>{children}</>;
} 