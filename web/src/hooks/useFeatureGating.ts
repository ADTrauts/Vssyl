import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { authenticatedApiCall } from '../lib/apiUtils';

export interface FeatureConfig {
  name: string;
  requiredTier: 'free' | 'standard' | 'enterprise';
  module: string;
  category: 'core' | 'premium' | 'enterprise';
  description: string;
  usageLimit?: number;
  usageMetric?: string;
}

export interface FeatureAccess {
  hasAccess: boolean;
  reason?: string;
  usageInfo?: {
    metric: string;
    limit: number;
    currentUsage: number;
    remaining: number;
  };
}

export interface ModuleFeatureAccess {
  core: { available: string[]; locked: string[] };
  premium: { available: string[]; locked: string[] };
  enterprise: { available: string[]; locked: string[] };
}

export function useFeatureGating(businessId?: string) {
  const { data: session } = useSession();
  const [features, setFeatures] = useState<Record<string, FeatureConfig>>({});
  const [moduleFeatures, setModuleFeatures] = useState<Record<string, ModuleFeatureAccess>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all available features
  useEffect(() => {
    if (!session?.user?.id) return;

    const loadFeatures = async () => {
      try {
        setLoading(true);
        const response = await authenticatedApiCall('/api/features/all', {
          method: 'GET'
        });
        
        if (response && typeof response === 'object' && 'features' in response) {
          setFeatures(response.features as Record<string, FeatureConfig>);
        }
      } catch (err) {
        console.error('Failed to load features:', err);
        setError('Failed to load features');
      } finally {
        setLoading(false);
      }
    };

    loadFeatures();
  }, [session?.user?.id]);

  // Check if user has access to a specific feature
  const hasFeature = async (featureName: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      const params = new URLSearchParams({
        feature: featureName
      });
      
      if (businessId) {
        params.append('businessId', businessId);
      }

      const response = await authenticatedApiCall(`/api/features/check?${params}`, {
        method: 'GET'
      });
      
      return response && typeof response === 'object' && 'hasAccess' in response ? response.hasAccess as boolean : false;
    } catch (err) {
      console.error(`Failed to check feature access for ${featureName}:`, err);
      return false;
    }
  };

  // Check feature access with detailed information
  const checkFeatureAccess = async (featureName: string): Promise<FeatureAccess> => {
    if (!session?.user?.id) {
      return { hasAccess: false, reason: 'Not authenticated' };
    }

    try {
      const params = new URLSearchParams({
        feature: featureName
      });
      
      if (businessId) {
        params.append('businessId', businessId);
      }

      const response = await authenticatedApiCall(`/api/features/check?${params}`, {
        method: 'GET'
      });
      
      return {
        hasAccess: response && typeof response === 'object' && 'hasAccess' in response ? response.hasAccess as boolean : false,
        reason: response && typeof response === 'object' && 'reason' in response ? response.reason as string : 'Unknown',
        usageInfo: response && typeof response === 'object' && 'usageInfo' in response ? response.usageInfo as {
          metric: string;
          limit: number;
          currentUsage: number;
          remaining: number;
        } : undefined
      };
    } catch (err) {
      console.error(`Failed to check feature access for ${featureName}:`, err);
      return { hasAccess: false, reason: 'Failed to check access' };
    }
  };

  // Get module feature access summary
  const getModuleFeatureAccess = async (module: string): Promise<ModuleFeatureAccess> => {
    if (!session?.user?.id) {
      return { core: { available: [], locked: [] }, premium: { available: [], locked: [] }, enterprise: { available: [], locked: [] } };
    }

    // Return cached if available
    if (moduleFeatures[module]) {
      return moduleFeatures[module];
    }

    try {
      const params = new URLSearchParams({
        module
      });
      
      if (businessId) {
        params.append('businessId', businessId);
      }

      const response = await authenticatedApiCall(`/api/features/module?${params}`, {
        method: 'GET'
      });
      
      const moduleAccess = response && typeof response === 'object' && 'access' in response ? response.access as ModuleFeatureAccess : { core: { available: [], locked: [] }, premium: { available: [], locked: [] }, enterprise: { available: [], locked: [] } };
      
      // Cache the result
      setModuleFeatures(prev => ({
        ...prev,
        [module]: moduleAccess
      }));
      
      return moduleAccess;
    } catch (err) {
      console.error(`Failed to get module feature access for ${module}:`, err);
      return { core: { available: [], locked: [] }, premium: { available: [], locked: [] }, enterprise: { available: [], locked: [] } };
    }
  };

  // Get features by category
  const getFeaturesByCategory = (category: 'core' | 'premium' | 'enterprise'): FeatureConfig[] => {
    return Object.values(features).filter(feature => feature.category === category);
  };

  // Get features by module
  const getFeaturesByModule = (module: string): FeatureConfig[] => {
    return Object.values(features).filter(feature => feature.module === module);
  };

  // Get features by tier
  const getFeaturesByTier = (tier: 'free' | 'standard' | 'enterprise'): FeatureConfig[] => {
    return Object.values(features).filter(feature => feature.requiredTier === tier);
  };

  // Check if user has enterprise access
  const hasEnterpriseAccess = async (): Promise<boolean> => {
    return await hasFeature('dashboard_advanced_analytics') || 
           await hasFeature('drive_advanced_sharing') ||
           await hasFeature('chat_encryption') ||
           await hasFeature('calendar_resource_booking');
  };

  // Check if user has standard access
  const hasStandardAccess = async (): Promise<boolean> => {
    return await hasFeature('drive_basic_sharing') || 
           await hasFeature('chat_file_sharing') ||
           await hasFeature('calendar_attendees');
  };

  // Record feature usage
  const recordUsage = async (featureName: string, quantity: number = 1): Promise<void> => {
    if (!session?.user?.id) return;

    try {
      await authenticatedApiCall('/api/features/usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feature: featureName,
          quantity,
          businessId
        })
      });
    } catch (err) {
      console.error(`Failed to record usage for ${featureName}:`, err);
    }
  };

  return {
    // State
    features,
    moduleFeatures,
    loading,
    error,
    
    // Feature checking methods
    hasFeature,
    checkFeatureAccess,
    getModuleFeatureAccess,
    
    // Helper methods
    getFeaturesByCategory,
    getFeaturesByModule,
    getFeaturesByTier,
    hasEnterpriseAccess,
    hasStandardAccess,
    
    // Usage tracking
    recordUsage
  };
}

// Hook for checking a specific feature
export function useFeature(featureName: string, businessId?: string) {
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [accessInfo, setAccessInfo] = useState<FeatureAccess | null>(null);
  const { data: session } = useSession();
  const { checkFeatureAccess } = useFeatureGating(businessId);

  useEffect(() => {
    if (!session?.user?.id || !featureName) {
      setLoading(false);
      return;
    }

    const checkAccess = async () => {
      try {
        setLoading(true);
        const access = await checkFeatureAccess(featureName);
        setHasAccess(access.hasAccess);
        setAccessInfo(access);
      } catch (err) {
        console.error(`Failed to check feature ${featureName}:`, err);
        setHasAccess(false);
        setAccessInfo({ hasAccess: false, reason: 'Check failed' });
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [featureName, session?.user?.id, businessId, checkFeatureAccess]);

  return {
    hasAccess,
    loading,
    accessInfo
  };
}

// Hook for checking module access
export function useModuleFeatures(module: string, businessId?: string) {
  const [moduleAccess, setModuleAccess] = useState<ModuleFeatureAccess>({
    core: { available: [], locked: [] },
    premium: { available: [], locked: [] },
    enterprise: { available: [], locked: [] }
  });
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();
  const { getModuleFeatureAccess } = useFeatureGating(businessId);

  useEffect(() => {
    if (!session?.user?.id || !module) {
      setLoading(false);
      return;
    }

    const loadModuleAccess = async () => {
      try {
        setLoading(true);
        const access = await getModuleFeatureAccess(module);
        setModuleAccess(access);
      } catch (err) {
        console.error(`Failed to load module access for ${module}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadModuleAccess();
  }, [module, session?.user?.id, businessId, getModuleFeatureAccess]);

  return {
    moduleAccess,
    loading,
    hasCore: moduleAccess.core.available.length > 0,
    hasPremium: moduleAccess.premium.available.length > 0,
    hasEnterprise: moduleAccess.enterprise.available.length > 0
  };
}