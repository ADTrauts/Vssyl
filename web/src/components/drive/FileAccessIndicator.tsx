import React from 'react';
import type { Permission } from '@/types/api';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface FileAccessIndicatorProps {
  permission: Permission;
  isOwner: boolean;
  className?: string;
}

export const FileAccessIndicator: React.FC<FileAccessIndicatorProps> = ({
  permission,
  isOwner,
  className,
}) => {
  const getAccessInfo = () => {
    if (isOwner) {
      return {
        icon: ShieldCheck,
        color: 'text-green-500',
        tooltip: 'You own this file',
      };
    }

    switch (permission) {
      case 'WRITE':
        return {
          icon: Shield,
          color: 'text-blue-500',
          tooltip: 'You have write access',
        };
      case 'READ':
        return {
          icon: Shield,
          color: 'text-gray-500',
          tooltip: 'You have read access',
        };
      default:
        return {
          icon: ShieldAlert,
          color: 'text-red-500',
          tooltip: 'No access',
        };
    }
  };

  const { icon: Icon, color, tooltip } = getAccessInfo();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`inline-flex items-center ${className}`}>
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}; 