export type CategoryType = 'PERSONAL' | 'ENTERPRISE';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER' | 'GUEST';
export type NotificationPreference = 'ALL' | 'MENTIONS' | 'NONE';
export type ThreadStyle = 'SIDE_PANEL' | 'INLINE';

export interface CategoryMember {
  id: string;
  userId: string;
  role: MemberRole;
  joinedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

export interface CategorySettings {
  id: string;
  notificationPreference: NotificationPreference;
  isPrivate: boolean;
  allowInvites: boolean;
  allowThreads: boolean;
  threadStyle: ThreadStyle;
}

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  ownerId: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
  members: CategoryMember[];
  workspaces: Workspace[];
  settings?: CategorySettings;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  categoryId: string;
  createdAt: Date;
  updatedAt: Date;
  conversations: {
    id: string;
    name: string;
    unreadCount: number;
    lastMessage?: {
      content: string;
      createdAt: Date;
    };
  }[];
}

export interface CategoryContextValue {
  categories: Category[];
  activeCategory: Category | null;
  activeWorkspace: Workspace | null;
  setActiveCategory: (category: Category | null) => void;
  setActiveWorkspace: (workspace: Workspace | null) => void;
  createCategory: (data: {
    name: string;
    type: CategoryType;
    icon?: string;
    color?: string;
  }) => Promise<Category>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<Category>;
  deleteCategory: (id: string) => Promise<void>;
  createWorkspace: (data: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    categoryId: string;
  }) => Promise<Workspace>;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  inviteMember: (categoryId: string, email: string, role?: MemberRole) => Promise<void>;
  updateMemberRole: (categoryId: string, userId: string, role: MemberRole) => Promise<void>;
  removeMember: (categoryId: string, userId: string) => Promise<void>;
  updateSettings: (categoryId: string, settings: Partial<CategorySettings>) => Promise<void>;
} 