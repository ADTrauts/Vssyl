'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Folder, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  Briefcase,
  Home,
  Brain
} from 'lucide-react';
import { Card, Button, Badge, Avatar, Alert, Spinner } from 'shared/components';
import { useWorkAuth } from '../contexts/WorkAuthContext';
import { useBusinessConfiguration, BusinessModule } from '../contexts/BusinessConfigurationContext';
import { useBusinessBranding, BusinessBrandingProvider, BrandedHeader, BrandedButton, BrandedCard } from './BusinessBranding';
import { getBusiness } from '../api/business';
import { EmployeeAIAssistant } from './work/EmployeeAIAssistant';

interface Business {
  id: string;
  name: string;
  logo?: string;
  industry?: string;
  branding?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    customCSS?: string;
  };
}

interface BrandedWorkDashboardProps {
  businessId: string;
  onSwitchToPersonal: () => void;
}

export default function BrandedWorkDashboard({ 
  businessId, 
  onSwitchToPersonal 
}: BrandedWorkDashboardProps) {
  const { data: session } = useSession();
  const { workCredentials, logoutWork } = useWorkAuth();
  const { 
    configuration, 
    loading: configLoading, 
    error: configError,
    getEnabledModules,
    hasPermission 
  } = useBusinessConfiguration();
  const router = useRouter();
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState('dashboard');

  useEffect(() => {
    if (session?.accessToken) {
      loadBusiness();
    }
  }, [session?.accessToken, businessId]);

  const loadBusiness = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!session?.accessToken) {
        setError('No authentication token available');
        return;
      }
      
      const response = await getBusiness(businessId, session.accessToken);
      if (response.success) {
        setBusiness(response.data);
      } else {
        setError('Failed to load business');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load business');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutWork = () => {
    logoutWork();
    onSwitchToPersonal();
  };

  const handleModuleClick = (module: string) => {
    if (!hasPermission(module, 'view') && module !== 'dashboard') {
      setError('You do not have permission to access this module');
      return;
    }
    setActiveModule(module);
    setError(null);
  };

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'dashboard': return LayoutDashboard;
      case 'drive': return Folder;
      case 'chat': return MessageSquare;
      case 'members': return Users;
      case 'admin': return Settings;
      default: return LayoutDashboard;
    }
  };

  const getModuleName = (module: string) => {
    switch (module) {
      case 'dashboard': return 'Dashboard';
      case 'drive': return 'Drive';
      case 'chat': return 'Chat';
      case 'members': return 'Members';
      case 'admin': return 'Admin';
      default: return module;
    }
  };

  // Get available modules from business configuration
  const getAvailableModules = () => {
    if (!configuration) return [];
    
    const enabledModules = getEnabledModules();
    
    return enabledModules.map(module => ({
      id: module.id,
      name: module.name,
      icon: getModuleIcon(module.id),
      permission: module.id === 'dashboard' ? null : 'view'
    }));
  };

  if (loading || configLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size={32} />
      </div>
    );
  }

  if (error || configError) {
    return (
      <div className="p-6">
        <Alert type="error" title="Error Loading Work Dashboard">
          {error || configError}
        </Alert>
      </div>
    );
  }

  if (!business || !configuration) {
    return (
      <div className="p-6">
        <Alert type="error" title="Business Not Found">
          The requested business could not be found or configuration is not available.
        </Alert>
      </div>
    );
  }

  // Create branding object for the provider
  const branding = {
    id: business.id,
    name: business.name,
    logo: business.logo,
    primaryColor: configuration.branding.primaryColor,
    secondaryColor: configuration.branding.secondaryColor,
    accentColor: configuration.branding.accentColor,
    fontFamily: configuration.branding.fontFamily,
    customCSS: business.branding?.customCSS || '',
  };

  const availableModules = getAvailableModules();

  return (
    <BusinessBrandingProvider initialBranding={branding}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <BrandedHeader
          title={business.name}
          subtitle={`Work Dashboard - ${workCredentials?.role || 'Employee'}`}
        >
          <div className="flex items-center space-x-3">
            <Badge color="green">
              {workCredentials?.role || 'Employee'}
            </Badge>
            <BrandedButton
              onClick={handleLogoutWork}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Work</span>
            </BrandedButton>
          </div>
        </BrandedHeader>

        {/* Main Content (no sidebar) */}
        <main className="flex-1 p-6">
          {/* Module Content */}
          <div className="space-y-6">
            {/* Module Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableModules.map((module) => (
                <div
                  key={module.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleModuleClick(module.id)}
                >
                  <BrandedCard className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <module.icon className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {module.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {module.id === 'dashboard' ? 'Main workspace' : `Access ${module.name.toLowerCase()}`}
                        </p>
                      </div>
                    </div>
                  </BrandedCard>
                </div>
              ))}
            </div>

            {/* Employee AI Assistant */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-blue-600" />
                AI Assistant
              </h2>
              <EmployeeAIAssistant businessId={businessId} />
            </div>

            {/* No Modules Message */}
            {availableModules.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Briefcase className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No modules available
                </h3>
                <p className="text-gray-600">
                  Your business administrator hasn't enabled any modules yet.
                </p>
              </div>
            )}

            {/* Module Status Info */}
            {configuration && (
              <div className="bg-white rounded-lg border p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Module Status
                </h4>
                <div className="text-sm text-gray-600">
                  <p>Enabled: {getEnabledModules().length} modules</p>
                  <p>Total: {configuration.enabledModules.length} modules</p>
                  <p>Auto-sync: {configuration.settings.autoSync ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </BusinessBrandingProvider>
  );
} 