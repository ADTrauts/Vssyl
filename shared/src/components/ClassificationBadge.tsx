import React from 'react';
import { Badge } from './Badge';
import { ClockIcon, EyeIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export interface ClassificationBadgeProps {
  sensitivity: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  expiresAt?: string;
  showExpiration?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

export default function ClassificationBadge({
  sensitivity,
  expiresAt,
  showExpiration = false,
  size = 'md',
  onClick,
  className = ''
}: ClassificationBadgeProps) {
  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC':
        return 'green';
      case 'INTERNAL':
        return 'blue';
      case 'CONFIDENTIAL':
        return 'yellow';
      case 'RESTRICTED':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getSensitivityIcon = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC':
        return <EyeIcon className="w-3 h-3" />;
      case 'INTERNAL':
        return <EyeIcon className="w-3 h-3" />;
      case 'CONFIDENTIAL':
        return <ShieldCheckIcon className="w-3 h-3" />;
      case 'RESTRICTED':
        return <ExclamationTriangleIcon className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getSensitivityLabel = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC':
        return 'Public';
      case 'INTERNAL':
        return 'Internal';
      case 'CONFIDENTIAL':
        return 'Confidential';
      case 'RESTRICTED':
        return 'Restricted';
      default:
        return sensitivity;
    }
  };

  const isExpiring = () => {
    if (!expiresAt) return false;
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiration <= 30;
  };

  const isExpired = () => {
    if (!expiresAt) return false;
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    return expirationDate < now;
  };

  const getExpirationColor = () => {
    if (isExpired()) return 'red';
    if (isExpiring()) return 'yellow';
    return 'gray';
  };

  const getExpirationText = () => {
    if (!expiresAt) return null;
    
    if (isExpired()) {
      return 'Expired';
    }
    
    const expirationDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration <= 0) {
      return 'Expires today';
    } else if (daysUntilExpiration === 1) {
      return 'Expires tomorrow';
    } else if (daysUntilExpiration <= 7) {
      return `Expires in ${daysUntilExpiration} days`;
    } else if (daysUntilExpiration <= 30) {
      return `Expires in ${Math.ceil(daysUntilExpiration / 7)} weeks`;
    } else {
      return `Expires in ${Math.ceil(daysUntilExpiration / 30)} months`;
    }
  };

  const badgeSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-sm' : 'text-xs';
  const iconSize = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {onClick ? (
        <button onClick={onClick} className="cursor-pointer hover:opacity-80">
          <Badge
            color={getSensitivityColor(sensitivity)}
            size={size}
          >
            <div className="flex items-center space-x-1">
              {getSensitivityIcon(sensitivity)}
              <span className={badgeSize}>{getSensitivityLabel(sensitivity)}</span>
            </div>
          </Badge>
        </button>
      ) : (
        <Badge
          color={getSensitivityColor(sensitivity)}
          size={size}
        >
          <div className="flex items-center space-x-1">
            {getSensitivityIcon(sensitivity)}
            <span className={badgeSize}>{getSensitivityLabel(sensitivity)}</span>
          </div>
        </Badge>
      )}
      
      {showExpiration && expiresAt && (
        <Badge
          color={getExpirationColor()}
          size={size}
        >
          <div className="flex items-center space-x-1">
            <ClockIcon className={iconSize} />
            <span className={badgeSize}>{getExpirationText()}</span>
          </div>
        </Badge>
      )}
    </div>
  );
} 