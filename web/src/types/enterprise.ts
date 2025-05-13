import { User } from '@/types/user';

export type ThreadType = 'message' | 'topic' | 'project' | 'decision' | 'documentation';

export interface Vote {
  userId: string;
  vote: 'approve' | 'reject' | 'abstain';
  comment?: string;
  timestamp: string;
}

export interface Action {
  id: string;
  title: string;
  description?: string;
  assigneeId: string;
  assignee?: User;
  dueDate?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface EnterpriseThread {
  id: string;
  type: ThreadType;
  title: string;
  description?: string;
  status: 'active' | 'resolved' | 'archived';
  votes: Vote[];
  actions: Action[];
  version: number;
  lastEditedBy?: string;
  lastEditedAt?: string;
  progress?: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseConversation {
  id: string;
  name: string;
  type: 'enterprise';
  workspaceId: string;
  participants: {
    user: User;
    role: 'admin' | 'member' | 'viewer';
    joinedAt: string;
  }[];
  permissions: {
    canCreateThreads: boolean;
    canInviteUsers: boolean;
    canManagePermissions: boolean;
  };
  tags: string[];
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
} 