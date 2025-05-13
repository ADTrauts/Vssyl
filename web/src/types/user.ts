export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status?: 'online' | 'offline' | 'away' | 'busy';
  lastSeen?: string;
  metadata?: Record<string, any>;
} 