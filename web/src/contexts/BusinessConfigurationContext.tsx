'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useWorkAuth } from './WorkAuthContext';
import { installModule, uninstallModule, configureModule, getInstalledModules, ModuleDetails } from '../api/modules';
import { 
  OrganizationalTier, 
  Department, 
  Position, 
  EmployeePosition, 
  Permission,
  PermissionSet,
  getOrgChartStructure,
  getBusinessEmployees 
} from '../api/orgChart';
import { toast } from 'react-hot-toast';

// Types for business configuration
export interface BusinessModule {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: 'enabled' | 'disabled' | 'pending';
  permissions: string[];
  icon?: string;
}

export interface BusinessPermission {
  id: string;
  name: string;
  description: string;
  moduleId: string;
}

export interface BusinessRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: 'company' | 'department' | 'individual';
}

export interface BusinessDepartment {
  id: string;
  name: string;
  description?: string;
  parentDepartmentId?: string;
  roles: BusinessRole[];
}

export interface BusinessConfiguration {
  businessId: string;
  name: string;
  enabledModules: BusinessModule[];
  modulePermissions: Record<string, string[]>;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    logo?: string;
  };
  settings: {
    allowModuleInstallation: boolean;
    requireApproval: boolean;
    autoSync: boolean;
  };
  departments: BusinessDepartment[];
  roles: BusinessRole[];
  permissions: BusinessPermission[];
  // Org Chart Integration
  orgChart: {
    tiers: OrganizationalTier[];
    departments: Department[];
    positions: Position[];
    employeePositions: EmployeePosition[];
    permissions: Permission[];
    permissionSets: PermissionSet[];
  };
  // Position-based permissions
  positionPermissions: Record<string, string[]>; // positionId -> permissions
  departmentModules: Record<string, string[]>; // departmentId -> moduleIds  
  tierPermissions: Record<string, string[]>; // tierId -> permissions
}

interface BusinessConfigurationContextType {
  configuration: BusinessConfiguration | null;
  loading: boolean;
  error: string | null;
  loadConfiguration: (businessId: string) => Promise<void>;
  updateModuleStatus: (moduleId: string, status: 'enabled' | 'disabled') => Promise<void>;
  updateModulePermissions: (moduleId: string, permissions: string[]) => Promise<void>;
  installNewModule: (moduleId: string, moduleName: string) => Promise<boolean>;
  updateBranding: (branding: Partial<BusinessConfiguration['branding']>) => Promise<void>;
  updateSettings: (settings: Partial<BusinessConfiguration['settings']>) => Promise<void>;
  subscribeToUpdates: (businessId: string) => void;
  unsubscribeFromUpdates: (businessId: string) => void;
  getEnabledModules: () => BusinessModule[];
  hasPermission: (moduleId: string, permission: string) => boolean;
  getUserRole: (userId: string) => BusinessRole | null;
  // Org Chart Methods
  loadOrgChart: (businessId: string) => Promise<void>;
  getUserPosition: (userId: string) => Position | null;
  getUserDepartment: (userId: string) => Department | null;
  hasPositionPermission: (userId: string, permission: string) => boolean;
  getModulesForUser: (userId: string) => BusinessModule[];
  updatePositionPermissions: (positionId: string, permissions: string[]) => Promise<void>;
  updateDepartmentModules: (departmentId: string, moduleIds: string[]) => Promise<void>;
  syncOrgChartChanges: () => Promise<void>;
}

const BusinessConfigurationContext = createContext<BusinessConfigurationContextType | undefined>(undefined);

interface BusinessConfigurationProviderProps {
  children: React.ReactNode;
  businessId?: string; // Optional businessId for direct business access
}

export function BusinessConfigurationProvider({ children, businessId }: BusinessConfigurationProviderProps) {
  const { data: session } = useSession();
  const { workCredentials } = useWorkAuth();
  
  const [configuration, setConfiguration] = useState<BusinessConfiguration | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // WebSocket connection state
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsErrorCount, setWsErrorCount] = useState(0);
  const [usePolling, setUsePolling] = useState(false);
  const maxWsErrors = 3; // Maximum WebSocket errors before switching to polling
  const pollingInterval = 30000; // 30 seconds
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load business configuration
  const loadConfiguration = useCallback(async (businessId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Get installed modules for this business
      let businessModules: BusinessModule[] = [];
      
      try {
        const installedModules = await getInstalledModules({
          scope: 'business',
          businessId: businessId
        });
        
        console.log('Raw installed modules:', installedModules);
        
        // Transform installed modules to BusinessModule format
        businessModules = installedModules.map((module) => ({
          id: module.id,
          name: module.name,
          status: module.status === 'installed' ? 'enabled' : 'disabled',
          permissions: module.permissions || ['view'],
          category: module.category || 'business',
          description: module.description || ''
        }));
        
        console.log('Transformed business modules:', businessModules);
        
        // If no modules returned, use fallback
        if (businessModules.length === 0) {
          console.log('No business modules found, using fallback modules');
          businessModules = [
            {
              id: 'dashboard',
              name: 'Dashboard',
              description: 'Main business dashboard',
              category: 'core',
              status: 'enabled',
              permissions: ['view'],
              icon: 'dashboard'
            },
            {
              id: 'members',
              name: 'Members',
              description: 'Team member management',
              category: 'management',
              status: 'enabled',
              permissions: ['view', 'invite'],
              icon: 'users'
            },
            {
              id: 'analytics',
              name: 'Analytics',
              description: 'Business insights and reports',
              category: 'business',
              status: 'enabled',
              permissions: ['view'],
              icon: 'bar-chart'
            }
          ];
        }
      } catch (moduleError) {
        console.warn('Failed to load business modules, using fallback:', moduleError);
        // Use fallback modules
        businessModules = [
          {
            id: 'dashboard',
            name: 'Dashboard',
            description: 'Main business dashboard',
            category: 'core',
            status: 'enabled',
            permissions: ['view'],
            icon: 'dashboard'
          },
          {
            id: 'members',
            name: 'Members',
            description: 'Team member management',
            category: 'management',
            status: 'enabled',
            permissions: ['view', 'invite'],
            icon: 'users'
          },
          {
            id: 'analytics',
            name: 'Analytics',
            description: 'Business insights and reports',
            category: 'business',
            status: 'enabled',
            permissions: ['view'],
            icon: 'bar-chart'
          }
        ];
      }
      
      // Load org chart data
      let orgChartData;
      let employeeData: EmployeePosition[] = [];
      try {
        const [orgStructure, employees] = await Promise.all([
          getOrgChartStructure(businessId, session?.accessToken || ''),
          getBusinessEmployees(businessId, session?.accessToken || '')
        ]);
        
        orgChartData = orgStructure.success ? orgStructure.data : {
          tiers: [],
          departments: [],
          positions: [],
          hierarchy: { departments: [], positions: [] }
        };
        
        employeeData = employees.success ? employees.data : [];
      } catch (orgError) {
        console.warn('Failed to load org chart data:', orgError);
        orgChartData = {
          tiers: [],
          departments: [],
          positions: [],
          hierarchy: { departments: [], positions: [] }
        };
        employeeData = [];
      }

      // Load business data for branding
      let businessData: any = null;
      try {
        const businessResponse = await fetch(`/api/business/${businessId}`, {
          headers: session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : undefined
        });
        if (businessResponse.ok) {
          const businessResult = await businessResponse.json();
          businessData = businessResult.data;
        }
      } catch (error) {
        console.warn('Failed to load business data for branding:', error);
      }

      // Create business configuration
      const businessConfig: BusinessConfiguration = {
        businessId,
        name: businessData?.name || 'Sample Business',
        enabledModules: businessModules,
        modulePermissions: {
          'dashboard': ['view'],
          'drive': ['view', 'upload', 'delete'],
          'chat': ['view', 'send'],
          'members': ['view', 'invite'],
          'analytics': ['view']
        },
        branding: {
          primaryColor: businessData?.branding?.primaryColor || '#3b82f6',
          secondaryColor: businessData?.branding?.secondaryColor || '#1e40af',
          accentColor: businessData?.branding?.accentColor || '#f59e0b',
          fontFamily: businessData?.branding?.fontFamily || 'Inter',
          logo: businessData?.logo || businessData?.branding?.logo
        },
        settings: {
          allowModuleInstallation: true,
          requireApproval: false,
          autoSync: true
        },
        departments: [],
        roles: [
          {
            id: 'admin',
            name: 'Admin',
            description: 'Full access to all features',
            permissions: ['*'],
            level: 'company'
          },
          {
            id: 'manager',
            name: 'Manager',
            description: 'Can view and manage most features',
            permissions: ['view', 'manage'],
            level: 'department'
          },
          {
            id: 'employee',
            name: 'Employee',
            description: 'Basic access to enabled modules',
            permissions: ['view'],
            level: 'individual'
          }
        ],
        permissions: [
          {
            id: 'view',
            name: 'View',
            description: 'Can view module content',
            moduleId: 'all'
          },
          {
            id: 'upload',
            name: 'Upload',
            description: 'Can upload files and content',
            moduleId: 'all'
          },
          {
            id: 'delete',
            name: 'Delete',
            description: 'Can delete content',
            moduleId: 'all'
          },
          {
            id: 'invite',
            name: 'Invite',
            description: 'Can invite team members',
            moduleId: 'members'
          }
        ],
        // Org Chart Integration
        orgChart: {
          tiers: orgChartData.tiers || [],
          departments: orgChartData.departments || [],
          positions: orgChartData.positions || [],
          employeePositions: employeeData || [],
          permissions: [],
          permissionSets: []
        },
        // Default position-based permissions (will be loaded from backend later)
        positionPermissions: {},
        departmentModules: {},
        tierPermissions: {}
      };
      
      setConfiguration(businessConfig);
    } catch (err) {
      console.error('Failed to load business configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      
      // Fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Using fallback mock configuration for development');
        const mockConfiguration: BusinessConfiguration = {
          businessId,
          name: 'Sample Business',
          enabledModules: [
            {
              id: 'dashboard',
              name: 'Dashboard',
              description: 'Main business dashboard',
              category: 'core',
              status: 'enabled',
              permissions: ['view'],
              icon: 'dashboard'
            },
            {
              id: 'drive',
              name: 'Drive',
              description: 'File management system',
              category: 'productivity',
              status: 'enabled',
              permissions: ['view', 'upload', 'delete'],
              icon: 'folder'
            },
            {
              id: 'chat',
              name: 'Chat',
              description: 'Team communication',
              category: 'communication',
              status: 'enabled',
              permissions: ['view', 'send'],
              icon: 'message-square'
            },
            {
              id: 'members',
              name: 'Members',
              description: 'Team member management',
              category: 'management',
              status: 'enabled',
              permissions: ['view', 'invite'],
              icon: 'users'
            },
            {
              id: 'analytics',
              name: 'Analytics',
              description: 'Business insights and reports',
              category: 'business',
              status: 'disabled',
              permissions: ['view'],
              icon: 'bar-chart'
            }
          ],
          modulePermissions: {
            'dashboard': ['view'],
            'drive': ['view', 'upload', 'delete'],
            'chat': ['view', 'send'],
            'members': ['view', 'invite'],
            'analytics': ['view']
          },
          branding: {
            primaryColor: '#3b82f6',
            secondaryColor: '#1e40af',
            accentColor: '#f59e0b',
            fontFamily: 'Inter'
          },
          settings: {
            allowModuleInstallation: true,
            requireApproval: false,
            autoSync: true
          },
          departments: [],
          roles: [
            {
              id: 'admin',
              name: 'Administrator',
              description: 'Full business access',
              permissions: ['*'],
              level: 'company'
            },
            {
              id: 'manager',
              name: 'Manager',
              description: 'Department management access',
              permissions: ['view', 'upload', 'invite'],
              level: 'department'
            },
            {
              id: 'employee',
              name: 'Employee',
              description: 'Basic work access',
              permissions: ['view', 'upload'],
              level: 'individual'
            }
          ],
          permissions: [
            {
              id: 'view',
              name: 'View',
              description: 'Can view module content',
              moduleId: 'all'
            },
            {
              id: 'upload',
              name: 'Upload',
              description: 'Can upload files and content',
              moduleId: 'all'
            },
            {
              id: 'delete',
              name: 'Delete',
              description: 'Can delete content',
              moduleId: 'all'
            },
            {
              id: 'invite',
              name: 'Invite',
              description: 'Can invite team members',
              moduleId: 'members'
            }
          ],
          // Mock org chart data
          orgChart: {
            tiers: [],
            departments: [],
            positions: [],
            employeePositions: [],
            permissions: [],
            permissionSets: []
          },
          // Default position-based permissions
          positionPermissions: {},
          departmentModules: {},
          tierPermissions: {}
        };
        setConfiguration(mockConfiguration);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Update module status (enable/disable)
  const updateModuleStatus = useCallback(async (moduleId: string, status: 'enabled' | 'disabled') => {
    if (!configuration || !businessId) return;

    // Optimistic update
    const previousConfiguration = { ...configuration };
    const updatedModules = configuration.enabledModules.map(module =>
      module.id === moduleId ? { ...module, status } : module
    );
    
    setConfiguration({
      ...configuration,
      enabledModules: updatedModules
    });

    try {
      if (status === 'enabled') {
        // Install the module
        const result = await installModule(moduleId, {
          scope: 'business',
          businessId: businessId
        });
        
        // Update configuration with real installation data
        const newModule: BusinessModule = {
          id: moduleId,
          name: result.installation.moduleId, // You might want to get the actual name from the module
          status: 'enabled',
          permissions: ['view'], // Default permissions
          category: 'business',
          description: 'Business module'
        };
        
        setConfiguration(prev => ({
          ...prev!,
          enabledModules: [...prev!.enabledModules.filter(m => m.id !== moduleId), newModule]
        }));
        
        toast.success(`Module ${moduleId} installed successfully`);
      } else {
        // Uninstall the module
        await uninstallModule(moduleId, {
          scope: 'business',
          businessId: businessId
        });
        
        // Remove from configuration
        setConfiguration(prev => ({
          ...prev!,
          enabledModules: prev!.enabledModules.filter(m => m.id !== moduleId)
        }));
        
        toast.success(`Module ${moduleId} uninstalled successfully`);
      }

      // Send WebSocket update if connected
      if (websocket && wsConnected) {
        websocket.send(JSON.stringify({
          type: 'business_config_update',
          businessId,
          action: 'module_status_changed',
          moduleId,
          status
        }));
      }
    } catch (error) {
      // Rollback on error
      setConfiguration(previousConfiguration);
      toast.error(`Failed to ${status === 'enabled' ? 'install' : 'uninstall'} module ${moduleId}`);
      console.error('Module status update failed:', error);
    }
  }, [configuration, businessId, websocket, wsConnected]);

  // Update module permissions
  const updateModulePermissions = useCallback(async (moduleId: string, permissions: string[]) => {
    if (!configuration || !businessId) return;

    // Optimistic update
    const previousConfiguration = { ...configuration };
    const updatedModules = configuration.enabledModules.map(module =>
      module.id === moduleId ? { ...module, permissions } : module
    );
    
    setConfiguration({
      ...configuration,
      enabledModules: updatedModules
    });

    try {
      // Update module configuration
      await configureModule(moduleId, { 
        enabled: true, 
        permissions,
        settings: {}
      });
      
      // Send WebSocket update if connected
      if (websocket && wsConnected) {
        websocket.send(JSON.stringify({
          type: 'business_config_update',
          businessId,
          action: 'module_permissions_changed',
          moduleId,
          permissions
        }));
      }
      
      toast.success(`Permissions updated for module ${moduleId}`);
    } catch (error) {
      // Rollback on error
      setConfiguration(previousConfiguration);
      toast.error(`Failed to update permissions for module ${moduleId}`);
      console.error('Module permissions update failed:', error);
    }
  }, [configuration, businessId, websocket, wsConnected]);

  // Update branding
  const updateBranding = useCallback(async (branding: Partial<BusinessConfiguration['branding']>) => {
    if (!configuration) return;

    try {
      // Call the actual API to update business branding
      const response = await fetch(`/api/business/${configuration.businessId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.accessToken ? { 'Authorization': `Bearer ${session.accessToken}` } : {})
        },
        body: JSON.stringify({
          branding: {
            ...configuration.branding,
            ...branding
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update branding');
      }

      // Optimistic update
      setConfiguration(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          branding: {
            ...prev.branding,
            ...branding
          }
        };
      });

      // Emit WebSocket update
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'branding_changed',
          businessId: configuration.businessId,
          branding: {
            ...configuration.branding,
            ...branding
          }
        }));
      }
    } catch (err) {
      // Revert optimistic update on error
      await loadConfiguration(configuration.businessId);
      throw err;
    }
  }, [configuration, websocket, loadConfiguration, session?.accessToken]);

  // Update settings
  const updateSettings = useCallback(async (settings: Partial<BusinessConfiguration['settings']>) => {
    if (!configuration) return;

    try {
      // TODO: Replace with actual API call
      // await businessAPI.updateSettings(configuration.businessId, settings, session?.accessToken);

      // Optimistic update
      setConfiguration(prev => {
        if (!prev) return prev;
        
        return {
          ...prev,
          settings: {
            ...prev.settings,
            ...settings
          }
        };
      });

      // Emit WebSocket update
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({
          type: 'settings_changed',
          businessId: configuration.businessId,
          settings: {
            ...configuration.settings,
            ...settings
          }
        }));
      }
    } catch (err) {
      // Revert optimistic update on error
      await loadConfiguration(configuration.businessId);
      throw err;
    }
  }, [configuration, websocket, loadConfiguration]);

  // Install new module from marketplace
  const installNewModule = useCallback(async (moduleId: string, moduleName: string) => {
    if (!businessId) {
      toast.error('No business selected');
      return false;
    }

    try {
      // Install the module
      const result = await installModule(moduleId, {
        scope: 'business',
        businessId: businessId
      });
      
      // Add to configuration
      const newModule: BusinessModule = {
        id: moduleId,
        name: moduleName,
        status: 'enabled',
        permissions: ['view'], // Default permissions
        category: 'business',
        description: 'Newly installed business module'
      };
      
      setConfiguration(prev => ({
        ...prev!,
        enabledModules: [...prev!.enabledModules, newModule]
      }));
      
      // Send WebSocket update if connected
      if (websocket && wsConnected) {
        websocket.send(JSON.stringify({
          type: 'business_config_update',
          businessId,
          action: 'module_installed',
          moduleId,
          moduleName
        }));
      }
      
      toast.success(`Module ${moduleName} installed successfully`);
      return true;
    } catch (error) {
      toast.error(`Failed to install module ${moduleName}`);
      console.error('Module installation failed:', error);
      return false;
    }
  }, [businessId, websocket, wsConnected]);

  // Start polling as fallback
  const startPolling = useCallback((businessId: string) => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    
    console.log('Starting polling for business configuration updates');
    pollingRef.current = setInterval(() => {
      loadConfiguration(businessId);
    }, pollingInterval);
  }, [loadConfiguration, pollingInterval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Subscribe to WebSocket updates
  const subscribeToUpdates = useCallback((businessId: string) => {
    // During development, use polling by default to avoid WebSocket errors
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
      console.log('Development mode: using polling instead of WebSocket');
      setUsePolling(true);
      startPolling(businessId);
      return;
    }

    // Don't create new WebSocket if we're using polling or have too many errors
    if (usePolling || wsErrorCount >= maxWsErrors) {
      console.log('Using polling instead of WebSocket due to errors or configuration');
      startPolling(businessId);
      return;
    }

    // Close existing connection if any
    if (websocket) {
      websocket.close();
    }

    try {
      // Try to connect to real WebSocket first
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://vssyl.com/api';
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || apiBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + `/business/${businessId}`;
      const realWebSocket = new WebSocket(wsUrl);
      
      realWebSocket.onopen = () => {
        console.log('WebSocket connected successfully');
        setWsConnected(true);
        setWsErrorCount(0);
        setUsePolling(false);
      };

      realWebSocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'business_config_update' && data.businessId === businessId) {
            console.log('Received business config update via WebSocket');
            loadConfiguration(businessId);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      realWebSocket.onerror = (error) => {
        console.warn('WebSocket connection failed, falling back to polling');
        setWsErrorCount(prev => prev + 1);
        setWsConnected(false);
        
        // If too many errors, switch to polling permanently
        if (wsErrorCount + 1 >= maxWsErrors) {
          setUsePolling(true);
          startPolling(businessId);
        }
      };

      realWebSocket.onclose = () => {
        console.log('WebSocket connection closed');
        setWsConnected(false);
        
        // If not manually closed and we haven't switched to polling, try polling
        if (!usePolling && wsErrorCount < maxWsErrors) {
          startPolling(businessId);
        }
      };

      setWebsocket(realWebSocket);
    } catch (error) {
      console.warn('Failed to create WebSocket, using polling instead:', error);
      setUsePolling(true);
      startPolling(businessId);
    }
  }, [websocket, wsErrorCount, usePolling, maxWsErrors, loadConfiguration, startPolling]);

  // Unsubscribe from WebSocket updates
  const unsubscribeFromUpdates = useCallback(() => {
    if (websocket) {
      websocket.close();
      setWebsocket(null);
    }
    stopPolling();
    setWsConnected(false);
  }, [websocket, stopPolling]);

  // Get enabled modules
  const getEnabledModules = useCallback(() => {
    if (!configuration) return [];
    return configuration.enabledModules.filter(module => module.status === 'enabled');
  }, [configuration]);

  // Check if user has permission
  const hasPermission = useCallback((moduleId: string, permission: string) => {
    if (!configuration || !workCredentials) return false;
    
    const userRole = workCredentials.role;
    const roleConfig = configuration.roles.find(role => role.name.toLowerCase() === userRole.toLowerCase());
    
    if (!roleConfig) return false;
    
    // Admin has all permissions
    if (roleConfig.permissions.includes('*')) return true;
    
    // Check module-specific permissions
    const modulePermissions = configuration.modulePermissions[moduleId] || [];
    return modulePermissions.includes(permission);
  }, [configuration, workCredentials]);

  // Get user role
  const getUserRole = useCallback((userId: string) => {
    if (!configuration) return null;
    
    // TODO: Implement user role lookup
    // For now, return the employee role
    return configuration.roles.find(role => role.name.toLowerCase() === 'employee') || null;
  }, [configuration]);

  // Load org chart data
  const loadOrgChart = useCallback(async (businessId: string) => {
    if (!configuration) return;
    
    try {
      const [orgStructure, employees] = await Promise.all([
        getOrgChartStructure(businessId, session?.accessToken || ''),
        getBusinessEmployees(businessId, session?.accessToken || '')
      ]);
      
      const orgChartData = orgStructure.success ? orgStructure.data : {
        tiers: [],
        departments: [],
        positions: [],
        hierarchy: { departments: [], positions: [] }
      };
      
      const employeeData = employees.success ? employees.data : [];
      
      setConfiguration(prev => ({
        ...prev!,
        orgChart: {
          tiers: orgChartData.tiers || [],
          departments: orgChartData.departments || [],
          positions: orgChartData.positions || [],
          employeePositions: employeeData || [],
          permissions: [],
          permissionSets: []
        }
      }));
    } catch (error) {
      console.error('Failed to load org chart:', error);
      toast.error('Failed to load organizational chart');
    }
  }, [configuration, session?.accessToken]);

  // Get user's current position
  const getUserPosition = useCallback((userId: string) => {
    if (!configuration) return null;
    
    const employeePosition = configuration.orgChart.employeePositions.find(
      ep => ep.userId === userId && ep.isActive
    );
    
    if (!employeePosition) return null;
    
    return configuration.orgChart.positions.find(
      p => p.id === employeePosition.positionId
    ) || null;
  }, [configuration]);

  // Get user's department
  const getUserDepartment = useCallback((userId: string) => {
    if (!configuration) return null;
    
    const position = getUserPosition(userId);
    if (!position || !position.departmentId) return null;
    
    return configuration.orgChart.departments.find(
      d => d.id === position.departmentId
    ) || null;
  }, [configuration, getUserPosition]);

  // Check if user has position-based permission
  const hasPositionPermission = useCallback((userId: string, permission: string) => {
    if (!configuration) return false;
    
    const position = getUserPosition(userId);
    if (!position) return false;
    
    // Check position-specific permissions
    const positionPermissions = configuration.positionPermissions[position.id] || [];
    if (positionPermissions.includes(permission) || positionPermissions.includes('*')) {
      return true;
    }
    
    // Check tier-level permissions
    const tierPermissions = configuration.tierPermissions[position.tierId] || [];
    if (tierPermissions.includes(permission) || tierPermissions.includes('*')) {
      return true;
    }
    
    // Check department permissions (if applicable)
    const department = getUserDepartment(userId);
    if (department) {
      const deptModules = configuration.departmentModules[department.id] || [];
      // If permission is for a module this department can access
      if (deptModules.includes(permission)) {
        return true;
      }
    }
    
    return false;
  }, [configuration, getUserPosition, getUserDepartment]);

  // Get modules available to user based on position
  const getModulesForUser = useCallback((userId: string) => {
    if (!configuration) return [];
    
    const position = getUserPosition(userId);
    const department = getUserDepartment(userId);
    
    // Start with enabled modules
    let availableModules = configuration.enabledModules.filter(m => m.status === 'enabled');
    
    // Filter by department modules if user has department
    if (department) {
      const departmentModuleIds = configuration.departmentModules[department.id] || [];
      if (departmentModuleIds.length > 0) {
        availableModules = availableModules.filter(m => 
          departmentModuleIds.includes(m.id)
        );
      }
    }
    
    // Filter by position permissions
    if (position) {
      const positionPermissions = configuration.positionPermissions[position.id] || [];
      const tierPermissions = configuration.tierPermissions[position.tierId] || [];
      
      // If user has admin permissions, return all modules
      if (positionPermissions.includes('*') || tierPermissions.includes('*')) {
        return availableModules;
      }
      
      // Filter modules based on permissions
      availableModules = availableModules.filter(module => {
        const modulePermissions = configuration.modulePermissions[module.id] || [];
        return modulePermissions.some(perm => 
          positionPermissions.includes(perm) || tierPermissions.includes(perm)
        );
      });
    }
    
    return availableModules;
  }, [configuration, getUserPosition, getUserDepartment]);

  // Update position permissions
  const updatePositionPermissions = useCallback(async (positionId: string, permissions: string[]) => {
    if (!configuration) return;
    
    // Optimistic update
    const previousConfiguration = { ...configuration };
    setConfiguration(prev => ({
      ...prev!,
      positionPermissions: {
        ...prev!.positionPermissions,
        [positionId]: permissions
      }
    }));
    
    try {
      // TODO: Replace with actual API call to update position permissions
      // await orgChartAPI.updatePositionPermissions(positionId, permissions);
      
      // Send WebSocket update if connected
      if (websocket && wsConnected) {
        websocket.send(JSON.stringify({
          type: 'org_chart_update',
          businessId: configuration.businessId,
          action: 'position_permissions_changed',
          positionId,
          permissions
        }));
      }
      
      toast.success('Position permissions updated successfully');
    } catch (error) {
      // Rollback on error
      setConfiguration(previousConfiguration);
      toast.error('Failed to update position permissions');
      console.error('Position permissions update failed:', error);
    }
  }, [configuration, websocket, wsConnected]);

  // Update department modules
  const updateDepartmentModules = useCallback(async (departmentId: string, moduleIds: string[]) => {
    if (!configuration) return;
    
    // Optimistic update
    const previousConfiguration = { ...configuration };
    setConfiguration(prev => ({
      ...prev!,
      departmentModules: {
        ...prev!.departmentModules,
        [departmentId]: moduleIds
      }
    }));
    
    try {
      // TODO: Replace with actual API call to update department modules
      // await orgChartAPI.updateDepartmentModules(departmentId, moduleIds);
      
      // Send WebSocket update if connected
      if (websocket && wsConnected) {
        websocket.send(JSON.stringify({
          type: 'org_chart_update',
          businessId: configuration.businessId,
          action: 'department_modules_changed',
          departmentId,
          moduleIds
        }));
      }
      
      toast.success('Department modules updated successfully');
    } catch (error) {
      // Rollback on error
      setConfiguration(previousConfiguration);
      toast.error('Failed to update department modules');
      console.error('Department modules update failed:', error);
    }
  }, [configuration, websocket, wsConnected]);

  // Sync org chart changes
  const syncOrgChartChanges = useCallback(async () => {
    if (!configuration) return;
    
    try {
      await loadOrgChart(configuration.businessId);
      toast.success('Org chart synchronized successfully');
    } catch (error) {
      toast.error('Failed to sync org chart changes');
      console.error('Org chart sync failed:', error);
    }
  }, [configuration, loadOrgChart]);

  // Auto-load configuration when work context changes or businessId prop is provided
  useEffect(() => {
    const targetBusinessId = workCredentials?.businessId || businessId;
    
    if (targetBusinessId) {
      loadConfiguration(targetBusinessId);
      subscribeToUpdates(targetBusinessId);
      
      return () => {
        unsubscribeFromUpdates();
      };
    }
  }, [workCredentials?.businessId, businessId, loadConfiguration, subscribeToUpdates, unsubscribeFromUpdates]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);

  const value: BusinessConfigurationContextType = {
    configuration,
    loading,
    error,
    loadConfiguration,
    updateModuleStatus,
    updateModulePermissions,
    installNewModule,
    updateBranding,
    updateSettings,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    getEnabledModules,
    hasPermission,
    getUserRole,
    // Org Chart Methods
    loadOrgChart,
    getUserPosition,
    getUserDepartment,
    hasPositionPermission,
    getModulesForUser,
    updatePositionPermissions,
    updateDepartmentModules,
    syncOrgChartChanges
  };

  return (
    <BusinessConfigurationContext.Provider value={value}>
      {children}
    </BusinessConfigurationContext.Provider>
  );
}

export function useBusinessConfiguration() {
  const context = useContext(BusinessConfigurationContext);
  if (context === undefined) {
    throw new Error('useBusinessConfiguration must be used within a BusinessConfigurationProvider');
  }
  return context;
}
