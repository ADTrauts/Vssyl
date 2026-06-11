'use client';

import React from 'react';
import { Brain } from 'lucide-react';
import CompactSearchButton from '../header/CompactSearchButton';
import AvatarContextMenu from '../AvatarContextMenu';
import ClientOnlyWrapper from '../../app/ClientOnlyWrapper';

export type PlatformHeaderActionVariant = 'personal' | 'business';

/** Shared AI dropdown anchor positioning — used by both header consumers */
export function computePlatformAIDropdownPosition(anchorRect: DOMRect): {
  top: number;
  left: number;
  width: number;
} {
  return {
    top: anchorRect.bottom + window.scrollY + 8,
    left: Math.max(20, (window.innerWidth - 700) / 2),
    width: Math.min(700, window.innerWidth - 40),
  };
}

export interface PlatformHeaderSearchActionProps {
  className?: string;
}

/** Search action — wraps CompactSearchButton unchanged */
export function PlatformHeaderSearchAction({ className }: PlatformHeaderSearchActionProps) {
  if (className) {
    return (
      <div className={className}>
        <CompactSearchButton />
      </div>
    );
  }
  return <CompactSearchButton />;
}

export interface PlatformHeaderAvatarActionProps {
  className?: string;
}

/** Avatar action — ClientOnlyWrapper + AvatarContextMenu */
export function PlatformHeaderAvatarAction({ className }: PlatformHeaderAvatarActionProps) {
  const menu = (
    <ClientOnlyWrapper>
      <AvatarContextMenu />
    </ClientOnlyWrapper>
  );
  if (className) {
    return <div className={className}>{menu}</div>;
  }
  return menu;
}

function PlatformHeaderAISuggestionBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="absolute -right-1 -top-1 z-20 flex items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white"
      style={{
        minWidth: '18px',
        height: '18px',
        padding: '0 4px',
        fontSize: '10px',
        lineHeight: '1',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
}

function SchedulingPulseOverlay() {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle, rgba(139, 92, 246, 0.6) 0%, rgba(139, 92, 246, 0.3) 50%, transparent 70%)',
          animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'conic-gradient(from 0deg, rgba(139, 92, 246, 0.4), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.4))',
          backgroundSize: '200% 200%',
          animation: 'color-wave 4s linear infinite',
          zIndex: 0,
          borderRadius: '50%',
          opacity: 0.8,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          animation: 'glow-pulse 2s ease-in-out infinite',
          zIndex: 0,
          borderRadius: '50%',
        }}
      />
    </>
  );
}

export interface PlatformHeaderAIActionProps {
  variant: PlatformHeaderActionVariant;
  isOpen: boolean;
  onClick: () => void;
  /** Optional ref for dropdown anchor positioning (personal header) */
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** Business header polls suggestions; personal omits until wired (4D.4 Option A) */
  pendingSuggestionsCount?: number;
  /** Business scheduling context pulse */
  showSchedulingPulse?: boolean;
  className?: string;
}

/**
 * AI action button — variant preserves personal "AI" text vs business Brain icon.
 * Wave 3C-4D.4 — shared action primitive.
 */
export function PlatformHeaderAIAction({
  variant,
  isOpen,
  onClick,
  buttonRef,
  pendingSuggestionsCount = 0,
  showSchedulingPulse = false,
  className = '',
}: PlatformHeaderAIActionProps) {
  const isBusiness = variant === 'business';
  const size = isBusiness ? 52 : 40;

  const title =
    pendingSuggestionsCount > 0
      ? `AI Assistant (${pendingSuggestionsCount} suggestion${pendingSuggestionsCount > 1 ? 's' : ''})`
      : 'AI Assistant';

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      className={`relative flex items-center justify-center transition-all hover:bg-purple-100 ${className}`.trim()}
      style={{
        background: isOpen ? '#8b5cf6' : 'transparent',
        color: isOpen ? '#fff' : '#8b5cf6',
        border: isBusiness ? 'none' : '2px solid #8b5cf6',
        outline: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: '50%',
        transition: 'all 0.2s ease',
        position: 'relative',
        fontWeight: isBusiness ? undefined : '600',
        fontSize: isBusiness ? undefined : '12px',
      }}
      title={title}
    >
      <PlatformHeaderAISuggestionBadge count={pendingSuggestionsCount} />
      {showSchedulingPulse && !isOpen && <SchedulingPulseOverlay />}
      {isBusiness ? (
        <Brain size={26} style={{ position: 'relative', zIndex: 1 }} />
      ) : (
        'AI'
      )}
    </button>
  );
}

export interface PlatformHeaderActionRowProps {
  variant: PlatformHeaderActionVariant;
  isAIOpen: boolean;
  onAIClick: () => void;
  aiButtonRef?: React.Ref<HTMLButtonElement>;
  pendingSuggestionsCount?: number;
  showSchedulingPulse?: boolean;
}

/**
 * Standard header action row — search, AI, avatar.
 * Consumers supply AI open state and click handler (dropdown positioning stays in consumer).
 */
export function PlatformHeaderActionRow({
  variant,
  isAIOpen,
  onAIClick,
  aiButtonRef,
  pendingSuggestionsCount,
  showSchedulingPulse,
}: PlatformHeaderActionRowProps) {
  return (
    <>
      <PlatformHeaderSearchAction />
      <PlatformHeaderAIAction
        variant={variant}
        isOpen={isAIOpen}
        onClick={onAIClick}
        buttonRef={aiButtonRef}
        pendingSuggestionsCount={pendingSuggestionsCount}
        showSchedulingPulse={showSchedulingPulse}
      />
      <PlatformHeaderAvatarAction />
    </>
  );
}
