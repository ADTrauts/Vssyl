'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Brain, MessageSquare } from 'lucide-react';
import { Button } from 'shared/components';
import {
  AI_EXPERIENCE_ROUTES,
  type AIExperienceSurface,
} from '@/lib/aiExperienceNavigation';

export interface AIExperienceNavLinksProps {
  /** Hide link for the surface the user is already on */
  currentSurface?: AIExperienceSurface | 'identity-page' | 'chat-page';
  /** Compact icon buttons for toolbars and dropdown headers */
  variant?: 'default' | 'compact';
  /** Called before navigation (e.g. close header dropdown) */
  onNavigate?: () => void;
  className?: string;
}

export function AIExperienceNavLinks({
  currentSurface,
  variant = 'default',
  onNavigate,
  className = '',
}: AIExperienceNavLinksProps) {
  const router = useRouter();
  const pathname = usePathname();

  const onChatPage =
    currentSurface === 'chat-page' ||
    currentSurface === 'full-page' ||
    pathname?.startsWith('/ai-chat');
  const onIdentityPage =
    currentSurface === 'identity-page' || pathname === '/ai' || pathname?.startsWith('/ai?');

  const navigate = (href: string) => {
    onNavigate?.();
    router.push(href);
  };

  const showChat = !onChatPage;
  const showIdentity = !onIdentityPage;

  if (!showChat && !showIdentity) return null;

  const size = variant === 'compact' ? 'sm' : 'sm';
  const btnVariant = variant === 'compact' ? 'ghost' : 'secondary';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      {showChat ? (
        <Button
          variant={btnVariant}
          size={size}
          onClick={() => navigate(AI_EXPERIENCE_ROUTES.chat)}
          aria-label="Open full AI chat"
        >
          <MessageSquare className="h-4 w-4 mr-1.5" />
          {variant === 'compact' ? 'Chat' : 'Open chat'}
        </Button>
      ) : null}
      {showIdentity ? (
        <Button
          variant={btnVariant}
          size={size}
          onClick={() => navigate(AI_EXPERIENCE_ROUTES.identity)}
          aria-label="Open AI Identity settings"
        >
          <Brain className="h-4 w-4 mr-1.5" />
          {variant === 'compact' ? 'Identity' : 'AI Identity'}
        </Button>
      ) : null}
    </div>
  );
}

export default AIExperienceNavLinks;
