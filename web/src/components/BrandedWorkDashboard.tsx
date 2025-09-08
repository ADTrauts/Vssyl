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
  Brain,
  ArrowRight
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

// Helper function for time-based greeting
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning!';
  if (hour < 17) return 'Good afternoon!';
  return 'Good evening!';
};

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
    
    // Navigate to the new workspace structure
    if (module === 'dashboard') {
      router.push(`/business/${businessId}/workspace`);
    } else {
      router.push(`/business/${businessId}/workspace/${module}`);
    }
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
    // Prefer logo managed in Business Admin branding, fallback to business.logo
    logo: (business as any)?.branding?.logoUrl || business.logo,
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
              tone="onPrimary"
              size="sm"
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Work</span>
            </BrandedButton>
          </div>
        </BrandedHeader>

        {/* Main Content - Enhanced UX */}
        <main className="flex-1 p-8">
          {/* AI Assistant - Welcome & Daily Briefing */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {getGreeting()} Your AI Assistant is ready
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Get personalized insights, company announcements, schedule optimization, and daily task recommendations tailored for your role.
                  </p>
                  <EmployeeAIAssistant businessId={businessId} />
                </div>
              </div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Briefcase className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Welcome to {business.name}
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              Your business workspace is ready
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Choose how you'd like to access your business tools and collaborate with your team.
            </p>
          </div>

          {/* Primary Action - Main Workspace */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Get Started</h2>
              <p className="text-gray-600">Jump into your full business workspace with all tools and features</p>
            </div>
            
            {availableModules.filter(m => m.id === 'dashboard').map((module) => (
              <div
                key={module.id}
                className="cursor-pointer group"
                onClick={() => handleModuleClick(module.id)}
              >
                <BrandedCard className="p-8 hover:shadow-xl transition-all duration-300 border-2 border-transparent group-hover:border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <div className="flex items-center justify-center space-x-6">
                    <div className="p-4 bg-blue-500 rounded-xl group-hover:bg-blue-600 transition-colors">
                      <module.icon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Enter Workspace
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Access your complete business dashboard with all modules and tools
                      </p>
                      <div className="inline-flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                        <span>Open Dashboard</span>
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </BrandedCard>
              </div>
            ))}
          </div>

          {/* Quick Access Modules */}
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Access</h3>
              <p className="text-gray-600">Jump directly to specific tools</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availableModules.filter(m => ['drive', 'chat', 'calendar'].includes(m.id)).map((module) => (
                <div
                  key={module.id}
                  className="cursor-pointer group"
                  onClick={() => handleModuleClick(module.id)}
                >
                  <BrandedCard className="p-6 hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-blue-100 transition-colors">
                        <module.icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {module.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {module.id === 'drive' ? 'Files and documents' : 
                         module.id === 'chat' ? 'Team communication' : 
                         'Schedule and events'}
                      </p>
                      <div className="text-blue-600 text-sm font-medium group-hover:text-blue-700">
                        Open {module.name} →
                      </div>
                    </div>
                  </BrandedCard>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Modules */}
          {availableModules.filter(m => !['dashboard', 'drive', 'chat', 'calendar'].includes(m.id)).length > 0 && (
            <div className="max-w-6xl mx-auto mt-12">
              <div className="text-center mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">More Tools</h3>
                <p className="text-gray-600">Additional modules available for your business</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableModules.filter(m => !['dashboard', 'drive', 'chat', 'calendar'].includes(m.id)).map((module) => (
                  <div
                    key={module.id}
                    className="cursor-pointer group"
                    onClick={() => handleModuleClick(module.id)}
                  >
                    <BrandedCard className="p-4 hover:shadow-md transition-all duration-200 border border-gray-200 group-hover:border-gray-300">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                          <module.icon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {module.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Access {module.name.toLowerCase()}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                    </BrandedCard>
                  </div>
                ))}
              </div>
            </div>
          )}


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
          </main>
        </div>
      </BusinessBrandingProvider>
    );
  } 