// ============================================================================
// MODULE AI CONTEXT TYPES
// ============================================================================
// TypeScript interfaces for the Module AI Context Registry system

/**
 * Entity definition - describes what the module manages
 */
export interface ModuleEntity {
  name: string;
  pluralName: string;
  description: string;
}

/**
 * Action definition - describes what users can do with the module
 */
export interface ModuleAction {
  name: string;
  description: string;
  permissions: string[];
}

/**
 * Context provider - endpoint the AI calls to get live data
 */
export interface ModuleContextProvider {
  name: string;
  endpoint: string;
  cacheDuration: number; // milliseconds
  description?: string;
  parameters?: Record<string, any>;
}

/**
 * Queryable data - structured query the AI can make
 */
export interface ModuleQueryableData {
  dataType: string;
  endpoint: string;
  description: string;
  parameters?: Record<string, any>;
}

/**
 * Module relationship - how this module relates to others
 */
export interface ModuleRelationship {
  module: string;
  type: 'integrates' | 'depends' | 'enhances' | 'conflicts';
  description: string;
}

/**
 * Complete AI context definition for a module
 * This is what developers define in their module manifest
 */
export interface ModuleAIContext {
  purpose: string;
  category: string;
  keywords: string[];
  patterns: string[];
  concepts: string[];
  entities: ModuleEntity[];
  actions: ModuleAction[];
  contextProviders: ModuleContextProvider[];
  queryableData?: ModuleQueryableData[];
  relationships?: ModuleRelationship[];
}

/**
 * Registry entry for a module's AI context
 * This is what's stored in the database
 */
export interface ModuleAIContextRegistryEntry {
  id: string;
  moduleId: string;
  moduleName: string;
  purpose: string;
  category: string;
  keywords: string[];
  patterns: string[];
  concepts: string[];
  entities: ModuleEntity[];
  actions: ModuleAction[];
  contextProviders: ModuleContextProvider[];
  queryableData?: ModuleQueryableData[];
  relationships?: ModuleRelationship[];
  fullAIContext: ModuleAIContext;
  version: string;
  lastUpdated: Date;
  createdAt: Date;
}

/**
 * User AI context cache entry
 */
export interface UserAIContextCacheEntry {
  id: string;
  userId: string;
  cachedContext: UserContext;
  lastUpdated: Date;
  expiresAt: Date;
  version: string;
  hitCount: number;
  missCount: number;
}

/**
 * User context object from CrossModuleContextEngine
 */
export interface UserContext {
  userId: string;
  installedModules: string[];
  moduleContexts: Record<string, any>;
  personalAI?: any;
  businessAI?: any;
  preferences?: any;
  recentActivity?: any;
}

/**
 * Module AI performance metrics
 */
export interface ModuleAIPerformanceMetric {
  id: string;
  moduleId: string;
  date: Date;
  
  // Query metrics
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageLatency: number;
  
  // Context metrics
  contextFetchCount: number;
  contextFetchErrors: number;
  averageContextSize: number;
  cacheHitRate: number;
  
  // User satisfaction metrics
  positiveRatings: number;
  negativeRatings: number;
  averageRating: number;
  
  // Cost tracking
  estimatedCost: number;
  tokenCount: number;
  
  // AI learning contribution
  learningEventsGenerated: number;
  patternsContributed: number;
  
  createdAt: Date;
}

/**
 * Module AI analytics dashboard data
 */
export interface ModuleAIAnalytics {
  moduleId: string;
  moduleName: string;
  totalQueries: number;
  successRate: number;
  averageLatency: number;
  cacheHitRate: number;
  userSatisfaction: number;
  estimatedCost: number;
  learningContribution: number;
  trendData: {
    queries: Array<{ date: string; count: number }>;
    performance: Array<{ date: string; latency: number }>;
    satisfaction: Array<{ date: string; rating: number }>;
  };
}

/**
 * AI query analysis result
 * Used to determine which modules to query for a user's question
 */
export interface AIQueryAnalysis {
  query: string;
  matchedModules: Array<{
    moduleId: string;
    moduleName: string;
    confidence: number;
    matchedKeywords: string[];
    matchedPatterns: string[];
    relevance: 'high' | 'medium' | 'low';
  }>;
  suggestedContextProviders: Array<{
    moduleId: string;
    providerName: string;
    endpoint: string;
  }>;
}

/**
 * Module context response from a context provider endpoint
 */
export interface ModuleContextResponse {
  moduleId: string;
  providerName: string;
  data: any;
  timestamp: Date;
  cached: boolean;
  latency: number;
}

/**
 * AI learning event with module tracking
 */
export interface AILearningEventWithModule {
  id: string;
  userId: string;
  eventType: string;
  context: string;
  
  // Module tracking
  sourceModule?: string;
  sourceModuleVersion?: string;
  moduleActive: boolean;
  moduleSpecificData?: any;
  
  // Learning data
  oldBehavior?: string;
  newBehavior: string;
  userFeedback?: string;
  confidence: number;
  
  // Pattern recognition
  patternData?: any;
  frequency: number;
  
  // Application
  applied: boolean;
  validated: boolean;
  
  createdAt: Date;
}

