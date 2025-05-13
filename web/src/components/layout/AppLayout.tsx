// React and third-party imports
import { ReactNode } from 'react';

// Layout Components
import { AppHeader } from '@/components/layout/AppHeader';
import { ChatLayout } from '@/components/chat/ChatLayout';

// Types
interface AppLayoutProps {
  /** The content to be rendered within the layout */
  children: ReactNode;
}

/**
 * AppLayout is the main layout component that provides the application's structure.
 * It includes a header and the chat layout which manages conversation, message, and thread panels.
 */
export const AppLayout = ({ children }: AppLayoutProps) => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header Section */}
      <div className="flex h-14 shrink-0 items-center border-b border-border">
        <AppHeader />
      </div>

      {/* Chat Layout Section */}
      <ChatLayout>{children}</ChatLayout>
    </div>
  );
}; 