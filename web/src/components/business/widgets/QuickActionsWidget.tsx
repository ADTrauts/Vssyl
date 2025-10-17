'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FileText, Calendar, Users, MessageSquare, Settings } from 'lucide-react';
import { WidgetProps, WidgetContainer } from './WidgetRegistry';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  color: string;
  bgColor: string;
}

export default function QuickActionsWidget({ businessId, settings, theme }: WidgetProps) {
  const router = useRouter();

  const defaultActions: QuickAction[] = [
    {
      id: 'new-document',
      label: 'New Document',
      icon: FileText,
      onClick: () => router.push(`/business/${businessId}/workspace/drive?action=new`),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'schedule-meeting',
      label: 'Schedule Meeting',
      icon: Calendar,
      onClick: () => router.push(`/business/${businessId}/workspace/calendar?action=new`),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      id: 'message-team',
      label: 'Message Team',
      icon: MessageSquare,
      onClick: () => router.push(`/business/${businessId}/workspace/chat`),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      id: 'view-members',
      label: 'View Members',
      icon: Users,
      onClick: () => router.push(`/business/${businessId}/workspace/members`),
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: () => router.push(`/business/${businessId}`),
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ];

  const actions = settings?.customActions || defaultActions;

  return (
    <WidgetContainer
      title={(settings?.title as string) || 'Quick Actions'}
      icon="⚡"
      description={((settings?.description as string) || 'Common shortcuts for daily tasks')}
      theme={theme}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {(actions as QuickAction[]).map((action: QuickAction) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`p-4 ${action.bgColor} rounded-lg hover:opacity-80 transition-opacity`}
              style={{ backgroundColor: theme?.primaryColor ? `${theme.primaryColor}20` : undefined }}
            >
              <div className="flex flex-col items-center space-y-2">
                <div 
                  className={`p-3 bg-white rounded-full shadow-sm`}
                  style={{ color: theme?.primaryColor || action.color }}
                >
                  <Icon className={`w-6 h-6`} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {action.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </WidgetContainer>
  );
}

