import { AIRequest, UserContext } from '../core/DigitalLifeTwinService';

export interface DataClassification {
  type: 'local_only' | 'cloud_safe' | 'hybrid';
  sensitivity: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

export type ClassifiableData = Record<string, unknown> | string | unknown[] | UserContext;

export interface RoutingDecision {
  processor: 'local' | 'cloud' | 'hybrid';
  localData: Record<string, unknown>;
  cloudData: Record<string, unknown>;
  classification: DataClassification;
}

export class PrivacyDataRouter {
  
  /**
   * Classify data based on sensitivity and privacy requirements
   */
  classifyData(data: ClassifiableData): DataClassification {
    const sensitivePatterns = [
      // Financial data
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card numbers
      /\$\d+|\d+\.\d{2}/, // Money amounts
      /bank|account|routing|ssn|social security/i,

      // Personal identifiers
      /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN
      /password|pin|secret|private key/i,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (can be sensitive)

      // Medical/health data
      /medical|health|diagnosis|prescription|doctor|hospital/i,

      // Private conversations
      /private|confidential|secret|personal/i
    ];

    const sensitivity = this.calculateSensitivity(data, sensitivePatterns);
    const type = this.determineProcessingType(sensitivity, data);

    return {
      type,
      sensitivity,
      reasons: this.getClassificationReasons(data, sensitivePatterns)
    };
  }

  /**
   * Route AI request based on data classification
   */
  async routeRequest(request: AIRequest, context: UserContext): Promise<RoutingDecision> {
    // Classify the request data
    const requestClassification = this.classifyData(request.query);
    
    // Classify context data
    const contextClassification = this.classifyData(context);

    // Determine overall processing approach
    const overallClassification = this.combineClassifications(requestClassification, contextClassification);

    // Split data for processing
    const { localData, cloudData } = this.splitData(request, context, overallClassification);

    return {
      processor: overallClassification.type === 'local_only' ? 'local' : 
                overallClassification.type === 'cloud_safe' ? 'cloud' : 'hybrid',
      localData,
      cloudData,
      classification: overallClassification
    };
  }

  /**
   * Calculate sensitivity level based on patterns found
   */
  private calculateSensitivity(data: ClassifiableData, patterns: RegExp[]): 'low' | 'medium' | 'high' | 'critical' {
    const dataStr = JSON.stringify(data).toLowerCase();
    let matchCount = 0;
    let criticalMatch = false;

    for (const pattern of patterns) {
      if (pattern.test(dataStr)) {
        matchCount++;
        
        // Check for critical patterns (financial, medical, auth)
        if (pattern.source.includes('password|pin|secret') || 
            pattern.source.includes('\\d{4}[\\s-]?\\d{4}') || 
            pattern.source.includes('\\d{3}-?\\d{2}-?\\d{4}')) {
          criticalMatch = true;
        }
      }
    }

    if (criticalMatch) return 'critical';
    if (matchCount >= 3) return 'high';
    if (matchCount >= 1) return 'medium';
    return 'low';
  }

  /**
   * Determine processing type based on sensitivity
   */
  private determineProcessingType(sensitivity: string, data: ClassifiableData): 'local_only' | 'cloud_safe' | 'hybrid' {
    // Critical data must stay local
    if (sensitivity === 'critical') {
      return 'local_only';
    }

    // High sensitivity data should be hybrid (analysis local, general processing cloud)
    if (sensitivity === 'high') {
      return 'hybrid';
    }

    // Medium sensitivity can be hybrid or cloud depending on user settings
    if (sensitivity === 'medium') {
      return 'hybrid';
    }

    // Low sensitivity can safely go to cloud
    return 'cloud_safe';
  }

  /**
   * Get reasons for classification decision
   */
  private getClassificationReasons(data: ClassifiableData, patterns: RegExp[]): string[] {
    const dataStr = JSON.stringify(data).toLowerCase();
    const reasons: string[] = [];

    if (patterns.some(p => p.source.includes('password|pin|secret') && p.test(dataStr))) {
      reasons.push('Contains authentication credentials');
    }
    if (patterns.some(p => p.source.includes('\\d{4}[\\s-]?\\d{4}') && p.test(dataStr))) {
      reasons.push('Contains financial information');
    }
    if (patterns.some(p => p.source.includes('medical|health') && p.test(dataStr))) {
      reasons.push('Contains health/medical information');
    }
    if (patterns.some(p => p.source.includes('private|confidential') && p.test(dataStr))) {
      reasons.push('Marked as private or confidential');
    }
    if (patterns.some(p => p.source.includes('\\d{3}-?\\d{2}-?\\d{4}') && p.test(dataStr))) {
      reasons.push('Contains personal identifiers');
    }

    return reasons.length > 0 ? reasons : ['General data, safe for cloud processing'];
  }

  /**
   * Combine multiple classifications into overall decision
   */
  private combineClassifications(
    requestClassification: DataClassification, 
    contextClassification: DataClassification
  ): DataClassification {
    // Use the most restrictive classification
    const sensitivities = ['low', 'medium', 'high', 'critical'];
    const maxSensitivity = sensitivities.reduce((max, current) => {
      const requestIndex = sensitivities.indexOf(requestClassification.sensitivity);
      const contextIndex = sensitivities.indexOf(contextClassification.sensitivity);
      const maxIndex = sensitivities.indexOf(max);
      const currentIndex = sensitivities.indexOf(current);
      
      return Math.max(requestIndex, contextIndex, maxIndex) === currentIndex ? current : max;
    }, 'low') as 'low' | 'medium' | 'high' | 'critical';

    const type = this.determineProcessingType(maxSensitivity, {});

    return {
      type,
      sensitivity: maxSensitivity,
      reasons: [
        ...requestClassification.reasons,
        ...contextClassification.reasons
      ]
    };
  }

  /**
   * Split data between local and cloud processing
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private splitData(request: AIRequest, context: UserContext, classification: DataClassification): {
    localData: any;
    cloudData: any;
  } {
    if (classification.type === 'local_only') {
      return {
        localData: { request, context },
        cloudData: this.createSafeContext(request, context)
      };
    }

    if (classification.type === 'cloud_safe') {
      return {
        localData: null,
        cloudData: { request, context }
      };
    }

    // Hybrid: split sensitive and non-sensitive data
    return {
      localData: this.extractSensitiveData(request, context),
      cloudData: this.createSafeContext(request, context)
    };
  }

  /**
   * Extract only sensitive data for local processing
   */
  private extractSensitiveData(request: AIRequest, context: UserContext): Record<string, unknown> {
    return {
      userId: request.userId,
      sensitiveQuery: this.maskSensitiveContent(request.query),
      personalPreferences: context.preferences,
      autonomySettings: context.autonomySettings,
      timestamp: request.timestamp
    };
  }

  /**
   * Create safe context for cloud processing
   */
  private createSafeContext(request: AIRequest, context: UserContext): Record<string, unknown> {
    return {
      userId: request.userId, // ID is okay
      query: this.sanitizeQuery(request.query),
      generalPreferences: this.extractGeneralPreferences(context.preferences),
      recentActivityPatterns: this.summarizeActivity(context.recentActivity),
      dashboardType: context.dashboardContext?.business ? 'business' : 
                     context.dashboardContext?.household ? 'household' : 'personal',
      timestamp: request.timestamp,
      priority: request.priority
    };
  }

  /**
   * Remove sensitive content from query while preserving intent
   */
  private sanitizeQuery(query: string): string {
    return query
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT_CARD]')
      .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, '[SSN]')
      .replace(/password|pin|secret/gi, '[SENSITIVE]')
      .replace(/\$\d+(\.\d{2})?/g, '[AMOUNT]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  }

  /**
   * Mask sensitive content for local processing context
   */
  private maskSensitiveContent(content: string): string {
    // Keep the structure but mask actual values
    return content
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, 'XXXX-XXXX-XXXX-XXXX')
      .replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, 'XXX-XX-XXXX')
      .replace(/password|pin|secret/gi, '[REDACTED]');
  }

  /**
   * Extract general (non-sensitive) preferences
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private extractGeneralPreferences(preferences: any): Record<string, unknown> {
    if (!preferences || typeof preferences !== 'object') return {};
    
    // Handle both object and array formats
    if (Array.isArray(preferences)) {
      return preferences
        .filter((pref: any) => !this.isSensitivePreference(pref))
        .reduce((acc: any, pref: any) => {
          acc[pref.key] = pref.value;
          return acc;
        }, {});
    }
    
    // For object format, return as-is after filtering sensitive keys
    return Object.entries(preferences)
      .filter(([key]) => !this.isSensitivePreference({ key }))
      .reduce((acc: any, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {});
  }

  /**
   * Check if a preference is sensitive
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isSensitivePreference(preference: any): boolean {
    const sensitiveKeys = [
      'password', 'pin', 'secret', 'private', 'financial', 
      'medical', 'ssn', 'bank', 'account'
    ];
    
    const key = preference.key?.toLowerCase() || '';
    return sensitiveKeys.some(sensitive => key.includes(sensitive));
  }

  /**
   * Summarize activity without sensitive details
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private summarizeActivity(activities: any): Record<string, unknown> {
    if (!activities || !Array.isArray(activities) || activities.length === 0) return {};

    const activitiesTyped = activities as Record<string, unknown>[];
    
    return {
      totalActivities: activitiesTyped.length,
      modules: this.getModuleUsagePattern(activitiesTyped),
      timePatterns: this.getTimePatterns(activitiesTyped),
      collaborationLevel: this.getCollaborationLevel(activitiesTyped)
    };
  }

  /**
   * Get module usage patterns
   */
  private getModuleUsagePattern(activities: Array<Record<string, unknown>>): Record<string, number> {
    const moduleCount: Record<string, number> = {};
    
    activities.forEach(activity => {
      const module = typeof activity.module === 'string' ? activity.module : 'unknown';
      moduleCount[module] = (moduleCount[module] || 0) + 1;
    });
    
    return moduleCount;
  }

  /**
   * Get time usage patterns
   */
  private getTimePatterns(activities: Array<Record<string, unknown>>): Record<string, unknown> {
    const hourCounts: Record<number, number> = {};
    
    activities.forEach(activity => {
      const createdAt = activity.createdAt instanceof Date ? activity.createdAt : new Date(String(activity.createdAt || new Date()));
      const hour = createdAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    return {
      peakHours: Object.entries(hourCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .map(([hour]) => parseInt(hour)),
      totalHoursActive: Object.keys(hourCounts).length
    };
  }

  /**
   * Get collaboration level
   */
  private getCollaborationLevel(activities: Array<Record<string, unknown>>): string {
    const collaborativeActivities = activities.filter(activity => {
      const action = typeof activity.action === 'string' ? activity.action : '';
      return action.includes('share') || 
             action.includes('invite') || 
             action.includes('collaborate');
    });

    const ratio = collaborativeActivities.length / activities.length;
    
    if (ratio > 0.3) return 'high';
    if (ratio > 0.1) return 'medium';
    return 'low';
  }
}