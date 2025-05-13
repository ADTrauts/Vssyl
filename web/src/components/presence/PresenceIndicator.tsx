import { usePresence } from '../../hooks/usePresence';
import { Avatar } from '../ui/avatar';
import { Tooltip } from '../ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface PresenceIndicatorProps {
  threadId?: string;
  className?: string;
}

export const PresenceIndicator = ({ threadId, className }: PresenceIndicatorProps) => {
  const { presences } = usePresence(threadId);

  const onlineUsers = presences.filter(p => p.status === 'online');
  const awayUsers = presences.filter(p => p.status === 'away');

  return (
    <div className={`presence-indicator ${className || ''}`}>
      {onlineUsers.length > 0 && (
        <div className="presence-group">
          <span className="presence-label">Online:</span>
          <div className="presence-avatars">
            {onlineUsers.map(user => (
              <Tooltip
                key={user.userId}
                content={`${user.name} (online)`}
                position="bottom"
              >
                <Avatar
                  userId={user.userId}
                  size="sm"
                  className="presence-avatar online"
                />
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {awayUsers.length > 0 && (
        <div className="presence-group">
          <span className="presence-label">Away:</span>
          <div className="presence-avatars">
            {awayUsers.map(user => (
              <Tooltip
                key={user.userId}
                content={`${user.name} (away, last seen ${formatDistanceToNow(new Date(user.lastSeen))} ago)`}
                position="bottom"
              >
                <Avatar
                  userId={user.userId}
                  size="sm"
                  className="presence-avatar away"
                />
              </Tooltip>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 