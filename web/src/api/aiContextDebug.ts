const API_BASE = '/api/ai-context-debug';

export interface AIContextUser {
  id: string;
  name: string | null;
  email: string;
  userNumber: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversation {
  id: string;
  sessionId: string;
  interactionType: string;
  userQuery: string;
  aiResponse: string;
  confidence: number;
  reasoning?: string;
  context: any;
  actions: any[];
  provider?: string;
  model?: string;
  tokensUsed?: number;
  processingTime?: number;
  userFeedback?: string;
  feedbackRating?: number;
  createdAt: string;
}

export interface AIPersonalityProfile {
  personalityData: any;
  learningHistory: any[];
  lastUpdated: string;
}

export interface AIAutonomySettings {
  scheduling: number;
  communication: number;
  fileManagement: number;
  taskCreation: number;
  dataAnalysis: number;
  crossModuleActions: number;
}

export interface Activity {
  id: string;
  type: string;
  details: Record<string, unknown>;
  timestamp: string;
}

export interface BusinessMembership {
  id: string;
  business: {
    id: string;
    name: string;
    industry: string | null;
  };
}

export interface ModuleInstallation {
  id: string;
  module: {
    id: string;
    name: string;
    category: string;
  };
}

export interface AIContext {
  user: AIContextUser;
  recentConversations: AIConversation[];
  personalityProfile: AIPersonalityProfile | null;
  autonomySettings: AIAutonomySettings | null;
  recentActivity: Activity[];
  businessMemberships: BusinessMembership[];
  moduleInstallations: ModuleInstallation[];
  timestamp: string;
}

export interface AISession {
  session: AIConversation[];
  user: AIContextUser;
  sessionId: string;
  totalInteractions: number;
}

export interface ContextValidationCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'INFO';
  message: string;
}

export interface ContextValidation {
  userId: string;
  timestamp: string;
  checks: ContextValidationCheck[];
  overallStatus: 'PASS' | 'FAIL' | 'WARN';
}

export interface CrossModuleContext {
  userId: string;
  modules: {
    drive: {
      fileCount: number;
      recentFiles: any[];
      totalSize: number;
    };
    chat: {
      conversationCount: number;
      conversations: any[];
    };
    business: {
      businessCount: number;
      businesses: any[];
    };
    calendar: {
      calendarCount: number;
      calendars: any[];
    };
    household: {
      householdCount: number;
      households: any[];
    };
  };
  timestamp: string;
}

export interface AIContextStats {
  totalUsers: number;
  aiAdoption: {
    usersWithProfile: number;
    usersWithSettings: number;
    profilePercentage: number;
    settingsPercentage: number;
  };
  conversations: {
    total: number;
    last24Hours: number;
    averageConfidence: number;
  };
  moduleUsage: Array<{
    moduleId: string;
    moduleName: string;
    category: string;
    installCount: number;
  }>;
  timestamp: string;
}

/**
 * Get AI context for a specific user
 */
export const getAIContext = async (userId: string, token: string): Promise<{ success: boolean; data: AIContext }> => {
  const res = await fetch(`${API_BASE}/user/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch AI context');
  return res.json();
};

/**
 * Get AI reasoning for a specific session
 */
export const getAISession = async (sessionId: string, token: string): Promise<{ success: boolean; data: AISession }> => {
  const res = await fetch(`${API_BASE}/session/${sessionId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch AI session');
  return res.json();
};

/**
 * Validate AI context for a user
 */
export const validateAIContext = async (userId: string, token: string, contextType: string = 'full'): Promise<{ success: boolean; data: ContextValidation }> => {
  const res = await fetch(`${API_BASE}/validate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify({ userId, contextType })
  });
  if (!res.ok) throw new Error('Failed to validate AI context');
  return res.json();
};

/**
 * Get cross-module context map for a user
 */
export const getCrossModuleContext = async (userId: string, token: string): Promise<{ success: boolean; data: CrossModuleContext }> => {
  const res = await fetch(`${API_BASE}/cross-module/${userId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch cross-module context');
  return res.json();
};

/**
 * Get AI context debugging statistics
 */
export const getAIContextStats = async (token: string): Promise<{ success: boolean; data: AIContextStats }> => {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    method: 'GET',
  });
  if (!res.ok) throw new Error('Failed to fetch AI context stats');
  return res.json();
};
