import { cn } from '@/lib/utils';

export type OnlineStatusType = 'online' | 'offline' | 'away' | 'busy';

interface OnlineStatusProps {
  status: OnlineStatusType;
  className?: string;
  showLabel?: boolean;
}

const statusConfig = {
  online: {
    color: 'bg-green-500',
    label: 'Online',
  },
  offline: {
    color: 'bg-gray-400',
    label: 'Offline',
  },
  away: {
    color: 'bg-yellow-500',
    label: 'Away',
  },
  busy: {
    color: 'bg-red-500',
    label: 'Busy',
  },
};

export function OnlineStatus({ status, className, showLabel = false }: OnlineStatusProps) {
  const config = statusConfig[status];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('block h-2.5 w-2.5 rounded-full ring-2 ring-white', config.color)} />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{config.label}</span>
      )}
    </div>
  );
} 