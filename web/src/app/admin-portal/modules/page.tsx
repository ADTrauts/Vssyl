'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input, Tabs } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import SecurityDashboard from '../../../components/admin/SecurityDashboard';
import { 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  FileText,
  Settings,
  Shield,
  Users,
  TrendingUp,
  DollarSign,
  Filter,
  Search,
  RefreshCw,
  BarChart3,
  Code,
  Star,
  Package,
  Brain,
  Zap,
  History
} from 'lucide-react';

interface ModuleVersionRow {
  id: string;
  version: string;
  status: string;
  isCurrent: boolean;
  createdAt: string;
  artifact: {
    scanStatus: string;
    sha256: string;
    sizeBytes: number;
  } | null;
}

interface ModuleSubmission {
  id: string;
  moduleId: string;
  submitterId: string;
  submitter: {
    id: string;
    name: string;
    email: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  module: {
    id: string;
    name: string;
    description: string;
    version: string;
    category: string;
    developer: {
      id: string;
      name: string;
      email: string;
    };
    manifest: Record<string, unknown>;
    permissions: string[];
    dependencies: string[];
    downloads?: number;
    rating?: number;
    reviewCount?: number;
    pricingTier?: string;
    revenueSplit?: number;
    business?: {
      id: string;
      name: string;
      isDeveloperBusiness: boolean;
      developerBusinessLinkedAt?: string | Date | null;
      developerBusinessLinkedBy?: string | null;
    } | null;
    versions?: Array<{
      id: string;
      version: string;
      status: string;
      isCurrent: boolean;
      artifact?: {
        scanStatus: string;
        sha256: string;
        sizeBytes: number;
      } | null;
    }>;
  };
  securityValidation?: {
    securityScore: number;
    status: 'pending' | 'passed' | 'failed' | 'warning';
    warnings: string[];
    recommendations: string[];
  };
}

interface ModuleStats {
  totalSubmissions: number;
  pendingReviews: number;
  approvedToday: number;
  rejectedToday: number;
  totalRevenue: number;
  activeDevelopers: number;
  averageRating: number;
  topCategory: string;
}

interface ModuleFilters {
  status: string;
  category: string;
  developer: string;
  dateRange: string;
  qualityScore: string;
  [key: string]: unknown;
}

interface ModuleAIStatus {
  moduleId: string;
  moduleName: string;
  description: string | null;
  category: string | null;
  status: string;
  version: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  aiContextRegistered: boolean;
  aiContext: {
    purpose: string;
    category: string;
    keywords: string[];
    patterns: string[];
    concepts: string[];
    entities: any[];
    actions: any[];
    contextProviders: Array<{
      name: string;
      endpoint: string;
      description?: string;
      cacheDuration?: number;
    }>;
    relationships: any[];
    version: string;
    registeredAt: Date | string;
    lastUpdated: Date | string;
  } | null;
}

interface ModuleAIStatusSummary {
  totalModules: number;
  registered: number;
  notRegistered: number;
  registrationRate: number;
  healthStatus: 'good' | 'warning' | 'critical';
}

export default function AdminModulesPage() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'ai-context'>('submissions');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ModuleSubmission[]>([]);
  const [stats, setStats] = useState<ModuleStats | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ModuleSubmission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [selectedSubmissionDetails, setSelectedSubmissionDetails] = useState<ModuleSubmission | null>(null);
  const [showSubmissionDetailsModal, setShowSubmissionDetailsModal] = useState(false);
  const [filters, setFilters] = useState<ModuleFilters>({
    status: 'all',
    category: 'all',
    developer: 'all',
    dateRange: 'all',
    qualityScore: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);

  const [versionByModuleId, setVersionByModuleId] = useState<
    Record<string, ModuleVersionRow[] | 'loading' | 'error'>
  >({});
  const [promotePreviousModal, setPromotePreviousModal] = useState<{
    moduleId: string;
    moduleName: string;
  } | null>(null);
  const [promoteRowModal, setPromoteRowModal] = useState<{
    moduleId: string;
    moduleName: string;
    version: string;
  } | null>(null);
  const [promoteLoading, setPromoteLoading] = useState(false);
  
  // AI Context Status state
  const [aiContextLoading, setAiContextLoading] = useState(false);
  const [aiContextError, setAiContextError] = useState<string | null>(null);
  const [aiContextModules, setAiContextModules] = useState<ModuleAIStatus[]>([]);
  const [aiContextSummary, setAiContextSummary] = useState<ModuleAIStatusSummary | null>(null);
  const [aiContextSearch, setAiContextSearch] = useState('');
  const [aiContextFilter, setAiContextFilter] = useState<'all' | 'registered' | 'not-registered'>('all');
  const [registering, setRegistering] = useState(false);
  const [selectedModule, setSelectedModule] = useState<ModuleAIStatus | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTestProvidersModal, setShowTestProvidersModal] = useState(false);
  const [testingProviders, setTestingProviders] = useState(false);
  const [providerTestResults, setProviderTestResults] = useState<Record<string, { success: boolean; error?: string; data?: unknown }>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load submissions and stats
      const [submissionsRes, statsRes] = await Promise.all([
        adminApiService.getModuleSubmissions(filters),
        adminApiService.getModuleStats()
      ]);

      // Ensure submissions is always an array
      const submissionsData = (submissionsRes as any)?.data;
      console.log('Submissions response:', { 
        submissionsRes, 
        submissionsData, 
        isArray: Array.isArray(submissionsData),
        type: typeof submissionsData,
        keys: submissionsData ? Object.keys(submissionsData) : null
      });
      
      // Handle different response formats
      let submissionsArray = [];
      if (Array.isArray(submissionsData)) {
        submissionsArray = submissionsData;
      } else if (submissionsData && typeof submissionsData === 'object') {
        // If it's an object, try to find the array property
        if (Array.isArray(submissionsData.submissions)) {
          submissionsArray = submissionsData.submissions;
        } else if (Array.isArray(submissionsData.data)) {
          submissionsArray = submissionsData.data;
        }
      }
      
      setSubmissions(submissionsArray);
      setStats((statsRes as any)?.data || null);
    } catch (err) {
      console.error('Error loading module data:', err);
      setError('Failed to load module data. Please try again.');
      
      // Fallback to mock data
      setSubmissions([
        {
          id: '1',
          moduleId: '1',
          submitterId: '1',
          submitter: {
            id: '1',
            name: 'John Developer',
            email: 'john@example.com'
          },
          status: 'PENDING',
          submittedAt: new Date(Date.now() - 86400000).toISOString(),
          module: {
            id: '1',
            name: 'Advanced Calendar',
            description: 'Enhanced calendar with team scheduling and integrations',
            version: '2.0.0',
            category: 'PRODUCTIVITY',
            developer: {
              id: '1',
              name: 'John Developer',
              email: 'john@example.com'
            },
            manifest: {
              permissions: ['calendar:read', 'calendar:write', 'team:read'],
              dependencies: ['react', 'date-fns'],
              entryPoint: '/calendar',
              settings: {}
            },
            permissions: ['calendar:read', 'calendar:write', 'team:read'],
            dependencies: ['react', 'date-fns'],
            downloads: 150,
            rating: 4.2,
            reviewCount: 12,
            pricingTier: 'premium',
            revenueSplit: 0.7
          }
        },
        {
          id: '2',
          moduleId: '2',
          submitterId: '2',
          submitter: {
            id: '2',
            name: 'Sarah Designer',
            email: 'sarah@example.com'
          },
          status: 'APPROVED',
          submittedAt: new Date(Date.now() - 172800000).toISOString(),
          reviewedAt: new Date(Date.now() - 86400000).toISOString(),
          module: {
            id: '2',
            name: 'Design System',
            description: 'Comprehensive design system with components and guidelines',
            version: '1.5.0',
            category: 'DEVELOPMENT',
            developer: {
              id: '2',
              name: 'Sarah Designer',
              email: 'sarah@example.com'
            },
            manifest: {
              permissions: ['design:read'],
              dependencies: ['react', 'styled-components'],
              entryPoint: '/design-system',
              settings: {}
            },
            permissions: ['design:read'],
            dependencies: ['react', 'styled-components'],
            downloads: 89,
            rating: 4.8,
            reviewCount: 8,
            pricingTier: 'free',
            revenueSplit: 0.7
          }
        }
      ]);

      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadAIContextData = useCallback(async () => {
    setAiContextLoading(true);
    setAiContextError(null);
    
    try {
      const response = await adminApiService.getModuleAIStatus();
      
      if (response.error) {
        setAiContextError(response.error);
        setAiContextLoading(false);
        return;
      }
      
      const data = response.data;
      if (data && data.modules) {
        setAiContextModules(data.modules);
        setAiContextSummary(data.summary || null);
      } else {
        // Handle case where data structure is different
        setAiContextModules([]);
        setAiContextSummary(null);
      }
    } catch (err) {
      console.error('Error loading AI context data:', err);
      setAiContextError('Failed to load AI context data. Please try again.');
    } finally {
      setAiContextLoading(false);
    }
  }, []);

  const handleRegisterMissingModules = useCallback(async () => {
    console.log('='.repeat(60));
    console.log('🚀 Starting module registration...');
    setRegistering(true);
    setAiContextError(null);
    
    try {
      const response = await adminApiService.registerBuiltInModules();
      
      console.log('📊 Registration response:', response);
      
      if (response.error) {
        console.error('❌ Registration error:', response.error);
        setAiContextError(`Registration failed: ${response.error}`);
        return;
      }
      
      const data = response.data;
      const errors: string[] = data?.registrationErrors || [];
      
      console.log('✅ Registration response:');
      console.log('   - Registered count:', data?.registeredCount);
      console.log('   - New registrations:', data?.newRegistrations);
      console.log('   - Total modules:', data?.totalModules);
      console.log('   - Built-in status:', data?.builtInModuleStatus);
      if (errors.length > 0) {
        console.error('   - Registration errors:', errors);
      }
      
      await loadAIContextData();
      console.log('='.repeat(60));
      
      const newRegs = data?.newRegistrations || 0;
      const totalRegs = data?.registeredCount || 0;
      let alertMsg = `Module registration completed!\n\nNew registrations: ${newRegs}\nTotal registered: ${totalRegs}`;
      if (errors.length > 0) {
        alertMsg += `\n\nErrors (${errors.length}):\n${errors.slice(0, 3).join('\n')}`;
        if (errors.length > 3) alertMsg += `\n... and ${errors.length - 3} more`;
      }
      alert(alertMsg);
    } catch (err) {
      console.error('❌ Error registering modules:', err);
      setAiContextError('Failed to register modules. Please try again.');
    } finally {
      setRegistering(false);
    }
  }, [loadAIContextData]);

  const handleTestProviders = useCallback(async (module: ModuleAIStatus) => {
    if (!module.aiContext || !module.aiContext.contextProviders || module.aiContext.contextProviders.length === 0) {
      setProviderTestResults({});
      return;
    }

    setTestingProviders(true);
    setProviderTestResults({});

    const results: Record<string, { success: boolean; error?: string; data?: unknown }> = {};
    let cachedBusinessId: string | undefined;

    const getDefaultBusinessId = async (): Promise<string | undefined> => {
      if (cachedBusinessId) return cachedBusinessId;
      try {
        const response = await fetch('/api/business', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) return undefined;
        const payload = await response.json();
        const businesses = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.businesses)
            ? payload.businesses
            : Array.isArray(payload?.data?.businesses)
              ? payload.data.businesses
              : [];
        const firstBusinessId = businesses.find((b: unknown) => {
          if (!b || typeof b !== 'object') return false;
          return 'id' in b && typeof (b as { id?: unknown }).id === 'string';
        }) as { id: string } | undefined;
        if (firstBusinessId?.id && firstBusinessId.id.length > 0) {
          cachedBusinessId = firstBusinessId.id;
          return firstBusinessId.id;
        }
      } catch {
        // No-op: businessId fallback is best-effort for provider tests
      }
      return undefined;
    };

    // Test each context provider endpoint
    for (const provider of module.aiContext.contextProviders) {
      try {
        const endpoint = provider.endpoint;
        let response = await adminApiService.testModuleAIProvider(endpoint);

        if (response.error && response.error.toLowerCase().includes('businessid is required')) {
          const fallbackBusinessId = await getDefaultBusinessId();
          if (fallbackBusinessId) {
            response = await adminApiService.testModuleAIProvider(endpoint, fallbackBusinessId);
          }
        }

        if (response.error) {
          results[provider.name] = {
            success: false,
            error: response.error,
          };
        } else {
          results[provider.name] = {
            success: true,
            data: response.data,
          };
        }
      } catch (error) {
        results[provider.name] = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    setProviderTestResults(results);
    setTestingProviders(false);
  }, []);

  // Load data
  useEffect(() => {
    try {
      if (activeTab === 'submissions') {
        loadData();
      } else if (activeTab === 'ai-context') {
        loadAIContextData();
      }
    } catch (error) {
      console.error('Error in useEffect data loading:', error);
      setError('Failed to load data. Please refresh the page.');
    }
  }, [loadData, loadAIContextData, activeTab]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, loadData]);

  const handleReview = (submission: ModuleSubmission, action: 'approve' | 'reject') => {
    setSelectedSubmission(submission);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!selectedSubmission || !reviewAction) return;

    setActionLoading(true);
    try {
      await adminApiService.reviewModuleSubmission(
        selectedSubmission.id, 
        reviewAction, 
        reviewNotes
      );

      // Update local state
      setSubmissions(prev => prev.map(sub => 
        sub.id === selectedSubmission.id 
          ? { 
              ...sub, 
              status: reviewAction === 'approve' ? 'APPROVED' : 'REJECTED',
              reviewedAt: new Date().toISOString(),
              reviewNotes: reviewNotes || undefined
            }
          : sub
      ));

      setShowReviewModal(false);
      setSelectedSubmission(null);
      setReviewAction(null);
      setReviewNotes('');
      
      // Reload stats
      loadData();
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedSubmissions.length === 0) return;

    setActionLoading(true);
    try {
      await adminApiService.bulkModuleAction(selectedSubmissions, action);
      
      // Update local state
      setSubmissions(prev => prev.map(sub => 
        selectedSubmissions.includes(sub.id)
          ? { 
              ...sub, 
              status: action === 'approve' ? 'APPROVED' : 'REJECTED',
              reviewedAt: new Date().toISOString()
            }
          : sub
      ));

      setSelectedSubmissions([]);
      loadData();
    } catch (err) {
      console.error('Error performing bulk action:', err);
      setError('Failed to perform bulk action. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const canPromotePrevious = (versions: ModuleVersionRow[]): boolean => {
    if (versions.length < 2) return false;
    const currentIdx = versions.findIndex(v => v.isCurrent);
    if (currentIdx === -1 || currentIdx >= versions.length - 1) return false;
    const previous = versions[currentIdx + 1];
    return previous.artifact?.scanStatus === 'PASSED';
  };

  const getLatestArtifactScanStatus = (submission: ModuleSubmission): string | null => {
    const latest = submission.module.versions?.[0];
    return latest?.artifact?.scanStatus || null;
  };

  const getReadinessChecklist = (submission: ModuleSubmission) => {
    const latest = submission.module.versions?.[0];
    const scanStatus = latest?.artifact?.scanStatus || null;
    const artifactScanPassed = scanStatus === 'PASSED';
    const frontend = submission.module.manifest?.frontend as Record<string, unknown> | undefined;
    const entryUrl =
      frontend && typeof frontend.entryUrl === 'string' ? frontend.entryUrl.trim() : '';
    const runtimeReady = Boolean(entryUrl) || artifactScanPassed;
    const publishReady = artifactScanPassed;

    return {
      artifactScanPassed,
      runtimeReady,
      publishReady,
      scanStatus: scanStatus || 'NOT_AVAILABLE',
      latestVersion: latest?.version || submission.module.version,
    };
  };

  const loadModuleVersions = useCallback(async (moduleId: string) => {
    setVersionByModuleId(prev => ({ ...prev, [moduleId]: 'loading' }));
    setError(null);
    const res = await adminApiService.getModuleVersions(moduleId);
    if (res.error) {
      setVersionByModuleId(prev => ({ ...prev, [moduleId]: 'error' }));
      setError(res.error);
      return;
    }
    const list = res.data?.versions ?? [];
    setVersionByModuleId(prev => ({ ...prev, [moduleId]: list }));
  }, []);

  const openSubmissionDetails = useCallback(
    (submission: ModuleSubmission, forceVersionRefresh = false) => {
      setSelectedSubmissionDetails(submission);
      setShowSubmissionDetailsModal(true);

      const existing = versionByModuleId[submission.module.id];
      if (forceVersionRefresh || existing === undefined || existing === 'error') {
        loadModuleVersions(submission.module.id);
      }
    },
    [loadModuleVersions, versionByModuleId]
  );

  const confirmPromotePrevious = async () => {
    if (!promotePreviousModal) return;
    setPromoteLoading(true);
    setError(null);
    const mid = promotePreviousModal.moduleId;
    try {
      const res = await adminApiService.promotePreviousModuleVersion(mid);
      if (res.error) throw new Error(res.error);
      setPromotePreviousModal(null);
      await loadData();
      await loadModuleVersions(mid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion failed');
    } finally {
      setPromoteLoading(false);
    }
  };

  const confirmPromoteVersion = async () => {
    if (!promoteRowModal) return;
    setPromoteLoading(true);
    setError(null);
    const mid = promoteRowModal.moduleId;
    const ver = promoteRowModal.version;
    try {
      const res = await adminApiService.promoteModuleVersion(mid, ver);
      if (res.error) throw new Error(res.error);
      setPromoteRowModal(null);
      await loadData();
      await loadModuleVersions(mid);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Promotion failed');
    } finally {
      setPromoteLoading(false);
    }
  };

  const getStatusBadge = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'PENDING':
        return <Badge color="yellow" size="sm">Pending Review</Badge>;
      case 'APPROVED':
        return <Badge color="green" size="sm">Approved</Badge>;
      case 'REJECTED':
        return <Badge color="red" size="sm">Rejected</Badge>;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: ModuleSubmission['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getSecurityBadge = (securityValidation?: ModuleSubmission['securityValidation']) => {
    if (!securityValidation) {
      return <Badge color="gray" size="sm">No Scan</Badge>;
    }

    switch (securityValidation.status) {
      case 'passed':
        return <Badge color="green" size="sm">Secure ({securityValidation.securityScore}/100)</Badge>;
      case 'warning':
        return <Badge color="yellow" size="sm">Warnings ({securityValidation.securityScore}/100)</Badge>;
      case 'failed':
        return <Badge color="red" size="sm">Failed ({securityValidation.securityScore}/100)</Badge>;
      case 'pending':
        return <Badge color="blue" size="sm">Scanning...</Badge>;
      default:
        return <Badge color="gray" size="sm">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Invalid Date';
    }
  };

  const filteredSubmissions = Array.isArray(submissions) ? submissions.filter(submission => {
    // Safety checks for malformed submission data
    if (!submission || !submission.module || !submission.submitter) {
      return false;
    }
    
    const matchesSearch = submission.module.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.submitter.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         false;
    
    const matchesStatus = filters.status === 'all' || submission.status === filters.status;
    const matchesCategory = filters.category === 'all' || submission.module.category === filters.category;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) : [];

  // Filter AI context modules
  const filteredAIContextModules = aiContextModules.filter(module => {
    const matchesSearch = !aiContextSearch || 
      module.moduleName.toLowerCase().includes(aiContextSearch.toLowerCase()) ||
      module.moduleId.toLowerCase().includes(aiContextSearch.toLowerCase());
    
    const matchesFilter = aiContextFilter === 'all' ||
      (aiContextFilter === 'registered' && module.aiContextRegistered) ||
      (aiContextFilter === 'not-registered' && !module.aiContextRegistered);
    
    return matchesSearch && matchesFilter;
  });

  const getHealthStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'critical': return 'text-red-600 bg-red-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Module Management</h1>
          <p className="text-gray-700 dark:text-gray-300">Review submissions, manage marketplace, and track developer performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="primary"
            onClick={() => setShowSecurityDashboard(true)}
          >
            <Shield className="w-4 h-4 mr-2" />
            Security Dashboard
          </Button>
          <Button
            variant="secondary"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-blue-50 text-blue-600' : ''}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          <Button onClick={loadData} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'submissions' | 'ai-context')}>
        <Tabs.List className="border-b border-gray-200 dark:border-slate-700">
          <Tabs.Trigger value="submissions" className="px-4 py-2">
            <Package className="w-4 h-4 mr-2 inline" />
            Submissions
          </Tabs.Trigger>
          <Tabs.Trigger value="ai-context" className="px-4 py-2">
            <Brain className="w-4 h-4 mr-2 inline" />
            AI Context Status
          </Tabs.Trigger>
        </Tabs.List>

        {/* Submissions Tab */}
        <Tabs.Content value="submissions" className="space-y-6 mt-6">
          {/* Stats Cards */}
          {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalSubmissions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pending Reviews</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.pendingReviews}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${(stats.totalRevenue || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Developers</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.activeDevelopers}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <Input
                placeholder="Search modules or developers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded"
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            >
              <option value="all">All Categories</option>
              <option value="PRODUCTIVITY">Productivity</option>
              <option value="COMMUNICATION">Communication</option>
              <option value="ANALYTICS">Analytics</option>
              <option value="DEVELOPMENT">Development</option>
              <option value="ENTERTAINMENT">Entertainment</option>
              <option value="EDUCATION">Education</option>
              <option value="FINANCE">Finance</option>
              <option value="HEALTH">Health</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedSubmissions.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedSubmissions.length} submission(s) selected
            </p>
            <div className="flex space-x-2">
              <Button
                size="sm"
                onClick={() => handleBulkAction('approve')}
                disabled={actionLoading}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Approve All
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleBulkAction('reject')}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Reject All
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Submissions List */}
      <Card className="p-6">
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-gray-500 dark:text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No submissions found</h3>
              <p className="text-gray-700 dark:text-gray-300">No module submissions match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSubmissions.map((submission) => (
                <div key={submission.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                  {(() => {
                    const readiness = getReadinessChecklist(submission);
                    const scanStatus = getLatestArtifactScanStatus(submission);
                    return (
                      <div className="mb-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 p-3">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                            Review Checklist
                          </span>
                          <Badge color={readiness.artifactScanPassed ? 'green' : 'yellow'} size="sm">
                            Artifact Scan: {scanStatus || 'Not available'}
                          </Badge>
                          {submission.module.business?.isDeveloperBusiness && (
                            <Badge color="blue" size="sm">Developer Business Linked</Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                          <div className={readiness.artifactScanPassed ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}>
                            {readiness.artifactScanPassed ? '✓' : '•'} Artifact scan passed
                          </div>
                          <div className={readiness.runtimeReady ? 'text-green-700 dark:text-green-300' : 'text-gray-700 dark:text-gray-300'}>
                            {readiness.runtimeReady ? '✓' : '•'} Runtime path ready
                          </div>
                          <div className={readiness.publishReady ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'}>
                            {readiness.publishReady ? '✓' : '!'} Publish readiness
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {submission.module.name}
                        </h3>
                        {getStatusBadge(submission.status)}
                        {getSecurityBadge(submission.securityValidation)}
                        <Badge color="gray" size="sm">
                          {submission.module.category}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">{submission.module.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Developer:</span>
                          <p className="text-gray-700 dark:text-gray-300">{submission.submitter.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Version:</span>
                          <p className="text-gray-700 dark:text-gray-300">{submission.module.version}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Submitted:</span>
                          <p className="text-gray-700 dark:text-gray-300">{formatDate(submission.submittedAt)}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Pricing:</span>
                          <p className="text-gray-700 dark:text-gray-300 capitalize">{submission.module.pricingTier || 'free'}</p>
                        </div>
                      </div>

                      {submission.module.downloads !== undefined && (
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="flex items-center">
                            <Download className="w-4 h-4 mr-1" />
                            {submission.module.downloads} downloads
                          </span>
                          <span className="flex items-center">
                            <Star className="w-4 h-4 mr-1" />
                            {submission.module.rating?.toFixed(1) || 'N/A'} ({submission.module.reviewCount || 0} reviews)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <input
                        type="checkbox"
                        checked={selectedSubmissions.includes(submission.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSubmissions(prev => [...prev, submission.id]);
                          } else {
                            setSelectedSubmissions(prev => prev.filter(id => id !== submission.id));
                          }
                        }}
                        className="rounded border-gray-300 dark:border-slate-600"
                      />
                    </div>
                  </div>

                  {submission.status === 'PENDING' && (
                    <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-slate-700 mt-4">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          const readiness = getReadinessChecklist(submission);
                          if (!readiness.publishReady) {
                            setError('Cannot approve yet: latest artifact scan must be PASSED.');
                            return;
                          }
                          handleReview(submission, 'approve');
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReview(submission, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSubmissionDetails(submission)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSubmissionDetails(submission, true)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Security Scan
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                      >
                        <Code className="w-4 h-4 mr-2" />
                        Sandbox After Approval
                      </Button>
                    </div>
                  )}

                  {submission.status === 'APPROVED' && (
                    <div className="pt-4 border-t border-gray-200 dark:border-slate-700 mt-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <History className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                          Version history & rollback
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => loadModuleVersions(submission.module.id)}
                            disabled={versionByModuleId[submission.module.id] === 'loading'}
                          >
                            {versionByModuleId[submission.module.id] === undefined
                              ? 'Load version history'
                              : 'Refresh versions'}
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={
                              promoteLoading ||
                              versionByModuleId[submission.module.id] === 'loading' ||
                              versionByModuleId[submission.module.id] === 'error' ||
                              versionByModuleId[submission.module.id] === undefined ||
                              !Array.isArray(versionByModuleId[submission.module.id]) ||
                              !canPromotePrevious(versionByModuleId[submission.module.id] as ModuleVersionRow[])
                            }
                            onClick={() =>
                              setPromotePreviousModal({
                                moduleId: submission.module.id,
                                moduleName: submission.module.name,
                              })
                            }
                          >
                            Promote previous version
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-700 dark:text-gray-300">
                        Promoting marks the chosen artifact-backed version as current for the marketplace. Requires a
                        passed artifact scan.
                      </p>

                      {versionByModuleId[submission.module.id] === 'loading' && (
                        <div className="flex justify-center py-4">
                          <Spinner size={28} />
                        </div>
                      )}
                      {versionByModuleId[submission.module.id] === 'error' && (
                        <p className="text-sm text-gray-700 dark:text-gray-300">Could not load versions. Try again.</p>
                      )}
                      {Array.isArray(versionByModuleId[submission.module.id]) &&
                        (versionByModuleId[submission.module.id] as ModuleVersionRow[]).length === 0 && (
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            No artifact versions on file yet. Versions appear after a developer uploads and finalizes a
                            build.
                          </p>
                        )}
                      {Array.isArray(versionByModuleId[submission.module.id]) &&
                        (versionByModuleId[submission.module.id] as ModuleVersionRow[]).length > 0 && (
                          <div className="overflow-x-auto rounded border border-gray-200 dark:border-slate-700">
                            <table className="min-w-full text-sm">
                              <thead className="bg-gray-50 dark:bg-slate-800 text-left text-gray-700 dark:text-gray-300">
                                <tr>
                                  <th className="px-3 py-2 font-medium">Version</th>
                                  <th className="px-3 py-2 font-medium">Status</th>
                                  <th className="px-3 py-2 font-medium">Current</th>
                                  <th className="px-3 py-2 font-medium">Scan</th>
                                  <th className="px-3 py-2 font-medium">Uploaded</th>
                                  <th className="px-3 py-2 font-medium">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(versionByModuleId[submission.module.id] as ModuleVersionRow[]).map(row => (
                                  <tr key={row.id} className="border-t border-gray-100 dark:border-slate-700">
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100 font-mono">{row.version}</td>
                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.status}</td>
                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{row.isCurrent ? 'Yes' : '—'}</td>
                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">
                                      {row.artifact?.scanStatus ?? '—'}
                                    </td>
                                    <td className="px-3 py-2 text-gray-700 dark:text-gray-300">{formatDate(row.createdAt)}</td>
                                    <td className="px-3 py-2">
                                      {!row.isCurrent &&
                                        row.artifact?.scanStatus === 'PASSED' && (
                                          <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={promoteLoading}
                                            onClick={() =>
                                              setPromoteRowModal({
                                                moduleId: submission.module.id,
                                                moduleName: submission.module.name,
                                                version: row.version,
                                              })
                                            }
                                          >
                                            Promote
                                          </Button>
                                        )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Review Modal */}
      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            {reviewAction === 'approve' ? 'Approve' : 'Reject'} Module
          </h2>
          
          {selectedSubmission && (
            <div className="mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                Reviewing: <strong>{selectedSubmission.module.name}</strong>
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Submitted by: {selectedSubmission.submitter.name} ({selectedSubmission.submitter.email})
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Category: {selectedSubmission.module.category}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Notes {reviewAction === 'reject' && '*'}
            </label>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={reviewAction === 'approve' 
                ? 'Optional notes for the developer...' 
                : 'Please provide a reason for rejection...'
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={reviewAction === 'reject'}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              variant="secondary"
              onClick={() => setShowReviewModal(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'primary' : 'secondary'}
              onClick={submitReview}
              disabled={actionLoading || (reviewAction === 'reject' && !reviewNotes.trim())}
            >
              {actionLoading ? (
                <>
                  <Spinner size={16} />
                  Submitting...
                </>
              ) : reviewAction === 'approve' ? (
                'Approve Module'
              ) : (
                'Reject Module'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={showSubmissionDetailsModal} onClose={() => setShowSubmissionDetailsModal(false)}>
        <div className="p-6 max-w-2xl">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Module Submission Details
          </h2>
          {selectedSubmissionDetails && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{selectedSubmissionDetails.module.name}</p>
                <p className="text-gray-700 dark:text-gray-300">{selectedSubmissionDetails.module.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 uppercase mb-1">Submitter</p>
                  <p className="text-gray-900 dark:text-gray-100">{selectedSubmissionDetails.submitter.name}</p>
                  <p className="text-gray-700 dark:text-gray-300">{selectedSubmissionDetails.submitter.email}</p>
                </div>
                <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                  <p className="text-xs text-gray-700 dark:text-gray-300 uppercase mb-1">Latest artifact</p>
                  <p className="text-gray-900 dark:text-gray-100">
                    Scan: {getLatestArtifactScanStatus(selectedSubmissionDetails) || 'Not available'}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300">
                    Version: {selectedSubmissionDetails.module.versions?.[0]?.version || selectedSubmissionDetails.module.version}
                  </p>
                </div>
              </div>

              <div className="rounded border border-gray-200 dark:border-slate-700 p-3">
                <p className="text-xs text-gray-700 dark:text-gray-300 uppercase mb-2">Version scan history</p>
                {selectedSubmissionDetails && versionByModuleId[selectedSubmissionDetails.module.id] === 'loading' && (
                  <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Spinner size={16} />
                    <span>Loading version scan details...</span>
                  </div>
                )}
                {selectedSubmissionDetails && versionByModuleId[selectedSubmissionDetails.module.id] === 'error' && (
                  <p className="text-gray-700 dark:text-gray-300">Could not load version scans. Try Security Scan again.</p>
                )}
                {selectedSubmissionDetails &&
                  Array.isArray(versionByModuleId[selectedSubmissionDetails.module.id]) &&
                  (versionByModuleId[selectedSubmissionDetails.module.id] as ModuleVersionRow[]).length === 0 && (
                    <p className="text-gray-700 dark:text-gray-300">No version scans recorded yet.</p>
                  )}
                {selectedSubmissionDetails &&
                  Array.isArray(versionByModuleId[selectedSubmissionDetails.module.id]) &&
                  (versionByModuleId[selectedSubmissionDetails.module.id] as ModuleVersionRow[]).length > 0 && (
                    <div className="space-y-1">
                      {(versionByModuleId[selectedSubmissionDetails.module.id] as ModuleVersionRow[]).map((row) => (
                        <div key={row.id} className="flex items-center justify-between text-gray-700 dark:text-gray-300">
                          <span className="font-mono text-xs">{row.version}</span>
                          <span className="text-xs">{row.artifact?.scanStatus || 'NOT_AVAILABLE'}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>

              <div>
                <p className="text-xs text-gray-700 dark:text-gray-300 uppercase mb-2">Declared permissions</p>
                <div className="flex flex-wrap gap-2">
                  {(selectedSubmissionDetails.module.permissions || []).length > 0 ? (
                    (selectedSubmissionDetails.module.permissions || []).map((perm) => (
                      <Badge key={perm} color="gray" size="sm">{perm}</Badge>
                    ))
                  ) : (
                    <span className="text-gray-700 dark:text-gray-300">No permissions declared.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="secondary"
                  onClick={() => window.open(`/modules/run/${selectedSubmissionDetails.module.id}`, '_blank', 'noopener,noreferrer')}
                  disabled={selectedSubmissionDetails.status !== 'APPROVED'}
                >
                  <Code className="w-4 h-4 mr-2" />
                  {selectedSubmissionDetails.status === 'APPROVED' ? 'Open Sandbox' : 'Sandbox After Approval'}
                </Button>
                <Button variant="secondary" onClick={() => setShowSubmissionDetailsModal(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={!!promotePreviousModal} onClose={() => !promoteLoading && setPromotePreviousModal(null)}>
        <div className="p-6 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Promote previous version</h2>
          {promotePreviousModal && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              This will archive the current published version and make the immediately previous scanned version the
              active one for <strong>{promotePreviousModal.moduleName}</strong>. Continue?
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPromotePreviousModal(null)} disabled={promoteLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmPromotePrevious} disabled={promoteLoading}>
              {promoteLoading ? (
                <>
                  <Spinner size={16} />
                  Promoting…
                </>
              ) : (
                'Confirm promote'
              )}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!promoteRowModal} onClose={() => !promoteLoading && setPromoteRowModal(null)}>
        <div className="p-6 max-w-md">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Promote this version</h2>
          {promoteRowModal && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Set version <strong className="font-mono">{promoteRowModal.version}</strong> as the current published
              version for <strong>{promoteRowModal.moduleName}</strong>?
            </p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setPromoteRowModal(null)} disabled={promoteLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmPromoteVersion} disabled={promoteLoading}>
              {promoteLoading ? (
                <>
                  <Spinner size={16} />
                  Promoting…
                </>
              ) : (
                'Confirm promote'
              )}
            </Button>
          </div>
        </div>
      </Modal>

        </Tabs.Content>

        {/* AI Context Status Tab */}
        <Tabs.Content value="ai-context" className="space-y-6 mt-6">
          {/* Summary Cards */}
          {aiContextSummary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Modules</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aiContextSummary.totalModules}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Registered</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aiContextSummary.registered}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Missing Context</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{aiContextSummary.notRegistered}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${getHealthStatusColor(aiContextSummary.healthStatus)}`}>
                    <Zap className="w-6 h-6" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Health Status</p>
                    <p className="text-2xl font-bold capitalize">{aiContextSummary.healthStatus}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{aiContextSummary.registrationRate}% registered</p>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Search and Filter */}
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </span>
                  <Input
                    placeholder="Search modules..."
                    value={aiContextSearch}
                    onChange={(e) => setAiContextSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <select
                  className="px-3 py-2 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded"
                  value={aiContextFilter}
                  onChange={(e) => setAiContextFilter(e.target.value as 'all' | 'registered' | 'not-registered')}
                >
                  <option value="all">All Modules</option>
                  <option value="registered">Registered</option>
                  <option value="not-registered">Missing Context</option>
                </select>
                <Button onClick={loadAIContextData} disabled={aiContextLoading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${aiContextLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                {aiContextSummary && aiContextSummary.notRegistered > 0 && (
                  <Button 
                    variant="primary" 
                    onClick={handleRegisterMissingModules} 
                    disabled={registering || aiContextLoading}
                  >
                    <Brain className={`w-4 h-4 mr-2 ${registering ? 'animate-pulse' : ''}`} />
                    Register Missing ({aiContextSummary.notRegistered})
                  </Button>
                )}
              </div>
            </div>
          </Card>

          {/* Error Alert */}
          {aiContextError && (
            <Alert onClose={() => setAiContextError(null)}>
              {aiContextError}
            </Alert>
          )}

          {/* Modules List */}
          <Card className="p-6">
            <div className="space-y-4">
              {aiContextLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner size={32} />
                </div>
              ) : filteredAIContextModules.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No modules found</h3>
                  <p className="text-gray-700 dark:text-gray-300">No modules match your current filters.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAIContextModules.map((module) => (
                    <div key={module.moduleId} className="border border-gray-200 dark:border-slate-700 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {module.moduleName}
                            </h3>
                            {module.aiContextRegistered ? (
                              <Badge color="green" size="sm">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Registered
                              </Badge>
                            ) : (
                              <Badge color="yellow" size="sm">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Missing Context
                              </Badge>
                            )}
                            {module.category && (
                              <Badge color="gray" size="sm">
                                {module.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            <span className="font-medium">ID:</span> {module.moduleId}
                            {module.description && (
                              <> • {module.description}</>
                            )}
                          </p>
                          
                          {module.aiContextRegistered && module.aiContext ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Keywords</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">{module.aiContext.keywords.length} keywords</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {module.aiContext.keywords.slice(0, 5).map((keyword, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                      {keyword}
                                    </span>
                                  ))}
                                  {module.aiContext.keywords.length > 5 && (
                                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                                      +{module.aiContext.keywords.length - 5}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Patterns</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">{module.aiContext.patterns.length} patterns</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {module.aiContext.patterns.slice(0, 3).map((pattern, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded truncate max-w-[200px]">
                                      {pattern}
                                    </span>
                                  ))}
                                  {module.aiContext.patterns.length > 3 && (
                                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                                      +{module.aiContext.patterns.length - 3}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Context Providers</p>
                                <p className="text-sm text-gray-900 dark:text-gray-100">{module.aiContext.contextProviders.length} providers</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {module.aiContext.contextProviders.map((provider, idx) => (
                                    <span key={idx} className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded">
                                      {provider.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                              <p className="text-sm text-yellow-800">
                                This module is not registered in the AI Context Registry. 
                                The AI system cannot provide context-aware responses for this module.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 ml-4">
                          {module.aiContextRegistered ? (
                            <>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => {
                                  setSelectedModule(module);
                                  setShowDetailsModal(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              <Button 
                                variant="secondary" 
                                size="sm"
                                onClick={() => {
                                  setSelectedModule(module);
                                  setShowTestProvidersModal(true);
                                  handleTestProviders(module);
                                }}
                                disabled={testingProviders}
                              >
                                <Zap className={`w-4 h-4 mr-2 ${testingProviders ? 'animate-pulse' : ''}`} />
                                {testingProviders ? 'Testing...' : 'Test Providers'}
                              </Button>
                            </>
                          ) : (
                            <Button 
                              variant="primary" 
                              size="sm"
                              onClick={handleRegisterMissingModules}
                            >
                              <Brain className="w-4 h-4 mr-2" />
                              Register Now
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </Tabs.Content>
      </Tabs>

      {/* Security Dashboard Modal */}
      <Modal
        open={showSecurityDashboard}
        onClose={() => setShowSecurityDashboard(false)}
        size="large"
      >
        <SecurityDashboard onClose={() => setShowSecurityDashboard(false)} />
      </Modal>

      {/* AI Context Details Modal */}
      <Modal
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedModule(null);
        }}
        size="large"
      >
        {selectedModule && selectedModule.aiContext && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              AI Context Details: {selectedModule.moduleName}
            </h2>
            
            <div className="space-y-6">
              {/* Purpose */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Purpose</h3>
                <p className="text-gray-900 dark:text-gray-100">{selectedModule.aiContext.purpose}</p>
              </div>

              {/* Category */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Category</h3>
                <Badge color="gray" size="sm">{selectedModule.aiContext.category}</Badge>
              </div>

              {/* Keywords */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Keywords ({selectedModule.aiContext.keywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedModule.aiContext.keywords.map((keyword, idx) => (
                    <Badge key={idx} color="blue" size="sm">{keyword}</Badge>
                  ))}
                </div>
              </div>

              {/* Patterns */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Patterns ({selectedModule.aiContext.patterns.length})
                </h3>
                <div className="space-y-1">
                  {selectedModule.aiContext.patterns.map((pattern, idx) => (
                    <div key={idx} className="p-2 bg-purple-50 rounded text-sm text-purple-900 font-mono">
                      {pattern}
                    </div>
                  ))}
                </div>
              </div>

              {/* Concepts */}
              {selectedModule.aiContext.concepts && selectedModule.aiContext.concepts.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Concepts ({selectedModule.aiContext.concepts.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.aiContext.concepts.map((concept, idx) => (
                      <Badge key={idx} color="green" size="sm">{concept}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Entities */}
              {selectedModule.aiContext.entities && selectedModule.aiContext.entities.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Entities ({selectedModule.aiContext.entities.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedModule.aiContext.entities.map((entity: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{entity.name} / {entity.pluralName}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{entity.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {selectedModule.aiContext.actions && selectedModule.aiContext.actions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Actions ({selectedModule.aiContext.actions.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedModule.aiContext.actions.map((action: any, idx: number) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-slate-800 rounded">
                        <div className="font-medium text-gray-900 dark:text-gray-100">{action.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{action.description}</div>
                        {action.permissions && action.permissions.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {action.permissions.map((perm: string, pIdx: number) => (
                              <Badge key={pIdx} color="yellow" size="sm">{perm}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Context Providers */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Context Providers ({selectedModule.aiContext.contextProviders.length})
                </h3>
                <div className="space-y-3">
                  {selectedModule.aiContext.contextProviders.map((provider, idx) => (
                    <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-green-900">{provider.name}</div>
                        <Badge color="green" size="sm">{provider.endpoint}</Badge>
                      </div>
                      <div className="text-sm text-green-700">{provider.description}</div>
                      {provider.cacheDuration && (
                        <div className="text-xs text-green-600 mt-1">
                          Cache: {Math.round(provider.cacheDuration / 1000)}s
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button onClick={() => {
                setShowDetailsModal(false);
                setSelectedModule(null);
              }}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Test Providers Modal */}
      <Modal
        open={showTestProvidersModal}
        onClose={() => {
          setShowTestProvidersModal(false);
          setSelectedModule(null);
          setProviderTestResults({});
        }}
        size="large"
      >
        {selectedModule && selectedModule.aiContext && (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Test Context Providers: {selectedModule.moduleName}
            </h2>
            
            {selectedModule.aiContext.contextProviders.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">This module has no context providers to test.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedModule.aiContext.contextProviders.map((provider, idx) => {
                  const result = providerTestResults[provider.name];
                  return (
                    <div key={idx} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{provider.name}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{provider.endpoint}</div>
                        </div>
                        {result ? (
                          result.success ? (
                            <Badge color="green" size="sm">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Success
                            </Badge>
                          ) : (
                            <Badge color="red" size="sm">
                              <XCircle className="w-3 h-3 mr-1" />
                              Failed
                            </Badge>
                          )
                        ) : testingProviders ? (
                          <Spinner size={16} />
                        ) : (
                          <Badge color="gray" size="sm">Not Tested</Badge>
                        )}
                      </div>
                      
                      {result && (
                        <div className="mt-3">
                          {result.success ? (
                            <div className="p-3 bg-green-50 rounded text-sm">
                              <div className="font-medium text-green-900 mb-1">Response:</div>
                              <pre className="text-xs text-green-700 overflow-auto max-h-32">
                                {JSON.stringify(result.data, null, 2)}
                              </pre>
                            </div>
                          ) : (
                            <div className="p-3 bg-red-50 rounded text-sm">
                              <div className="font-medium text-red-900 mb-1">Error:</div>
                              <div className="text-xs text-red-700">{result.error}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <Button 
                variant="secondary"
                onClick={() => {
                  setShowTestProvidersModal(false);
                  setSelectedModule(null);
                  setProviderTestResults({});
                }}
              >
                Close
              </Button>
              {selectedModule.aiContext.contextProviders.length > 0 && (
                <Button 
                  onClick={() => selectedModule && handleTestProviders(selectedModule)}
                  disabled={testingProviders}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${testingProviders ? 'animate-spin' : ''}`} />
                  {testingProviders ? 'Testing...' : 'Test All Providers'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
} 