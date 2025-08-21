'use client';
import React, { useState, useRef, useEffect } from 'react';
import { 
  HomeIcon, 
  ChatBubbleLeftRightIcon, 
  UserGroupIcon, 
  PlusIcon, 
  BriefcaseIcon,
  AcademicCapIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useDashboard } from '../../contexts/DashboardContext';

interface ChatSidebarProps {
  onNewChat: () => void;
  onContextSwitch?: (dashboardId: string) => void;
}

interface ContextChat {
  id: string;
  name: string;
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  dashboardId: string;
  type: 'personal' | 'business' | 'educational' | 'household';
  active: boolean;
  href: string;
}

interface QuickAccessItem {
  icon: React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
  label: string;
  href: string;
}

interface StyleProps {
  sidebar: React.CSSProperties;
  newButton: React.CSSProperties;
  sectionTitle: React.CSSProperties;
  item: React.CSSProperties;
  activeItem: React.CSSProperties;
}

// Quick access items (equivalent to utility folders in Drive)
const quickAccessItems: QuickAccessItem[] = [
  { icon: BellIcon, label: 'Notifications', href: '/notifications' },
  { icon: Cog6ToothIcon, label: 'Settings', href: '/notifications/settings' },
];

// Helper functions
const getContextIcon = (type: string) => {
  switch (type) {
    case 'household': return HomeIcon;
    case 'business': return BriefcaseIcon;
    case 'educational': return AcademicCapIcon;
    default: return ChatBubbleLeftRightIcon;
  }
};

const getContextColor = (type: string, active: boolean = false) => {
  const colors = {
    household: { bg: active ? '#fef3c7' : 'transparent', text: active ? '#92400e' : '#6b7280', border: '#f59e0b' },
    business: { bg: active ? '#dbeafe' : 'transparent', text: active ? '#1e40af' : '#6b7280', border: '#3b82f6' },
    educational: { bg: active ? '#d1fae5' : 'transparent', text: active ? '#065f46' : '#6b7280', border: '#10b981' },
    personal: { bg: active ? '#e0f2fe' : 'transparent', text: active ? '#0369a1' : '#6b7280', border: '#6366f1' }
  };
  return colors[type as keyof typeof colors] || colors.personal;
};

const styles: StyleProps = {
  sidebar: {
    width: 260,
    background: '#f8fafc',
    padding: 16,
    borderRight: '1px solid #e5e7eb',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  newButton: {
    width: '100%',
    height: 40,
    background: '#e0f2fe',
    color: '#0369a1',
    border: 'none',
    borderRadius: 8,
    padding: '0 12px',
    fontWeight: 600,
    fontSize: 15,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginTop: 16,
    marginBottom: 8,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    borderRadius: 6,
    color: '#6b7280',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.2s',
    cursor: 'pointer',
  },
  activeItem: {
    fontWeight: 600,
    borderLeft: '3px solid',
    paddingLeft: 9,
  },
};

export default function ChatSidebar({ 
  onNewChat,
  onContextSwitch
}: ChatSidebarProps) {
  const { 
    currentDashboard, 
    allDashboards,
    getDashboardType,
    getDashboardDisplayName 
  } = useDashboard();

  // Generate context chats based on user's dashboards
  const generateContextChats = (): ContextChat[] => {
    if (!allDashboards || allDashboards.length === 0) {
      return [{
        id: 'my-chat',
        name: 'My Chat',
        icon: ChatBubbleLeftRightIcon,
        dashboardId: 'personal',
        type: 'personal',
        active: true,
        href: '/chat'
      }];
    }

    return allDashboards.map(dashboard => {
      const dashboardType = getDashboardType(dashboard);
      const dashboardDisplayName = getDashboardDisplayName(dashboard);
      const isActive = currentDashboard?.id === dashboard.id;
      
      return {
        id: `${dashboard.id}-chat`,
        name: `${dashboardDisplayName} Chat`,
        icon: getContextIcon(dashboardType),
        dashboardId: dashboard.id,
        type: dashboardType as 'personal' | 'business' | 'educational' | 'household',
        active: isActive,
        href: `/chat?dashboard=${dashboard.id}`
      };
    });
  };

  const contextChats = generateContextChats();

  const handleChatClick = (chat: ContextChat) => {
    if (onContextSwitch && chat.dashboardId !== currentDashboard?.id) {
      onContextSwitch(chat.dashboardId);
    }
  };

  return (
    <div style={styles.sidebar}>
      {/* New Chat Button */}
      <button
        style={styles.newButton}
        onClick={onNewChat}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#bae6fd';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#e0f2fe';
        }}
      >
        <PlusIcon style={{ width: 18, height: 18 }} />
        New Chat
      </button>

      {/* Your Chats Section */}
      <div style={styles.sectionTitle as React.CSSProperties}>Your Chats</div>
      
      {contextChats.map((chat) => {
        const colors = getContextColor(chat.type, chat.active);
        const Icon = chat.icon;
        
        return (
          <Link
            key={chat.id}
            href={chat.href}
            style={{
              ...styles.item,
              ...(chat.active ? styles.activeItem : {}),
              backgroundColor: colors.bg,
              color: colors.text,
              ...(chat.active ? { borderLeftColor: colors.border } : {}),
            }}
            onClick={() => handleChatClick(chat)}
          >
            <Icon style={{ width: 18, height: 18, color: colors.text }} />
            {chat.name}
          </Link>
        );
      })}

      {/* Quick Access Section */}
      <div style={styles.sectionTitle as React.CSSProperties}>Quick Access</div>
      
      {quickAccessItems.map((item) => {
        const Icon = item.icon;
        
        return (
          <Link
            key={item.label}
            href={item.href}
            style={styles.item}
            className="hover:bg-gray-100"
          >
            <Icon style={{ width: 18, height: 18 }} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}