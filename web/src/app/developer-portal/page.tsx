'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { Card, Button, Badge, Spinner, Alert, Tabs } from 'shared/components';
import { 
  getDeveloperDashboard,
  getDeveloperStats,
  getModuleRevenue,
  getModuleAnalytics,
  updateModulePricing,
  requestPayout,
  getPayoutHistory,
  type DeveloperStats,
  type ModuleRevenue,
} from '../../api/developerPortal';
import { getBusinessModules } from '../../api/modules';
import { 
  DollarSign, 
  Users, 
  Download, 
  Star,
  TrendingUp,
  CreditCard,
  Calendar,
  BarChart3,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader,
  Code,
  Settings,
  Eye
} from 'lucide-react';

export default function DeveloperPortalPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [moduleRevenue, setModuleRevenue] = useState<ModuleRevenue[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [moduleAnalytics, setModuleAnalytics] = useState<any | null>(null);
  const [pricingBase, setPricingBase] = useState<string>('');
  const [pricingEnterprise, setPricingEnterprise] = useState<string>('');
  const [modules, setModules] = useState<Array<{ id: string; name: string }>>([]);
  const searchParams = useSearchParams();
  const pathname = usePathname();
  let businessId = searchParams.get('businessId') || undefined as string | undefined;
  if (!businessId && pathname?.startsWith('/business/')) {
    // Expect path like /business/{id}/workspace/developer-portal
    const parts = pathname.split('/').filter(Boolean);
    const businessIdx = parts.indexOf('business');
    if (businessIdx >= 0 && parts.length > businessIdx + 1) {
      businessId = parts[businessIdx + 1];
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [businessId]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboard = await getDeveloperDashboard(businessId);
      setStats(dashboard.stats);
      setModuleRevenue(dashboard.moduleRevenue);
      setPayoutHistory(dashboard.payoutHistory);

      // Load business modules if scoped
      if (businessId) {
        try {
          const bizModules = await getBusinessModules(businessId);
          setModules((bizModules || []).map((m: any) => ({ id: m.id, name: m.name })));
        } catch (_) {
          setModules([]);
        }
      } else {
        setModules([]);
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load developer portal');
    } finally {
      setLoading(false);
    }
  };

  const openModuleAnalytics = async (moduleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const analytics = await getModuleAnalytics(moduleId);
      setSelectedModuleId(moduleId);
      setModuleAnalytics(analytics);
    } catch (e: any) {
      setError(e?.message || 'Failed to load module analytics');
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    if (!selectedModuleId) return;
    const base = parseFloat(pricingBase || '0');
    const ent = pricingEnterprise ? parseFloat(pricingEnterprise) : undefined;
    try {
      setLoading(true);
      setError(null);
      await updateModulePricing(selectedModuleId, base, ent);
      await loadDashboard();
    } catch (e: any) {
      setError(e?.message || 'Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutRequest = async () => {
    if (!payoutAmount || parseFloat(payoutAmount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setPayoutLoading(true);
      setError(null);
      
      await requestPayout(parseFloat(payoutAmount), businessId);
      setShowPayoutModal(false);
      setPayoutAmount('');
      await loadDashboard(); // Refresh data
    } catch (err: any) {
      console.error('Error requesting payout:', err);
      setError(err.message || 'Failed to request payout');
    } finally {
      setPayoutLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getPayoutStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
        <span className="ml-2">Loading Developer Portal...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Developer Portal</h1>
            <p className="text-gray-600">Manage your modules and revenue</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge className="bg-blue-100 text-blue-800">
            <Code className="w-3 h-3 mr-1" />
            Developer
          </Badge>
          <Badge className="bg-green-100 text-green-800">
            <Eye className="w-3 h-3 mr-1" />
            Owner Access
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onChange={setActiveTab}
        tabs={[
          { key: 'overview', label: 'Overview' },
          { key: 'revenue', label: 'Revenue' },
          { key: 'payouts', label: 'Payouts' },
          { key: 'modules', label: 'Modules' }
        ]}
      >
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(stats?.totalRevenue || 0)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.activeSubscriptions || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <Download className="w-8 h-8 text-purple-500" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Downloads</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalDownloads || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-yellow-500" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.averageRating?.toFixed(1) || '0.0'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={() => setActiveTab('revenue')}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  View Revenue Analytics
                </Button>
                <Button onClick={() => setShowPayoutModal(true)}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
                <Button variant="secondary" onClick={() => setActiveTab('modules')}>
                  <Code className="w-4 h-4 mr-2" />
                  Manage Modules
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Module Revenue</h3>
              {moduleRevenue.length > 0 ? (
                <div className="space-y-4">
                  {moduleRevenue.map((module) => (
                    <div key={module.moduleId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{module.moduleName}</h4>
                        <Badge className="bg-green-100 text-green-800">
                          {module.activeSubscriptions} active
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Revenue</p>
                          <p className="font-semibold">{formatCurrency(module.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Monthly Recurring</p>
                          <p className="font-semibold">{formatCurrency(module.monthlyRecurringRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Lifetime Value</p>
                          <p className="font-semibold">{formatCurrency(module.lifetimeValue)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No modules with revenue yet</p>
                  <p className="text-sm">Create and publish modules to start earning</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Payouts</h3>
                <Button onClick={() => setShowPayoutModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Request Payout
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Total Payouts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats?.totalPayouts || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatCurrency(stats?.pendingPayouts || 0)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Available for Payout</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency((stats?.totalRevenue || 0) - (stats?.totalPayouts || 0))}
                  </p>
                </div>
              </div>

              {/* Payout History */}
              {payoutHistory.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recent Payouts</h4>
                  <div className="space-y-2">
                    {payoutHistory.slice(0, 5).map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          {getPayoutStatusIcon(payout.status)}
                          <span className="ml-2 text-sm font-medium">
                            {formatCurrency(payout.amount)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(payout.date).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'modules' && (
        <div className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Module Management</h3>
              {/* Business-scoped modules list */}
              {businessId && (
                <div className="mb-6">
                  <h4 className="font-medium mb-3">Your Modules</h4>
                  {modules.length === 0 ? (
                    <p className="text-sm text-gray-500">No modules linked to this business yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {modules.map((mod) => (
                        <div key={mod.id} className="flex items-center justify-between text-sm border rounded p-3">
                          <span className="text-gray-900">{mod.name}</span>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => openModuleAnalytics(mod.id)}
                            >
                              <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedModuleId(mod.id);
                                setPricingBase('');
                                setPricingEnterprise('');
                              }}
                            >
                              <Settings className="w-4 h-4 mr-1" /> Pricing
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => window.location.href = `/business/${businessId}/workspace/developer-portal/modules/${mod.id}`}
                            >
                              View
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Revenue-backed module list with inline analytics/pricing */}
              {moduleRevenue.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Code className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No modules yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {moduleRevenue.map((m) => (
                    <div key={m.moduleId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{m.moduleName}</h4>
                          <p className="text-sm text-gray-600">
                            Subscriptions: {m.activeSubscriptions} • MRR: {formatCurrency(m.monthlyRecurringRevenue)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="secondary" onClick={() => openModuleAnalytics(m.moduleId)}>
                            <BarChart3 className="w-4 h-4 mr-1" /> Analytics
                          </Button>
                          <Button size="sm" onClick={() => {
                            setSelectedModuleId(m.moduleId);
                            setPricingBase('');
                            setPricingEnterprise('');
                          }}>
                            <Settings className="w-4 h-4 mr-1" /> Pricing
                          </Button>
                        </div>
                      </div>
                      {selectedModuleId === m.moduleId && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Base Price (USD)</label>
                            <input className="w-full p-2 border rounded" value={pricingBase} onChange={(e) => setPricingBase(e.target.value)} placeholder="0.00" />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Enterprise Price (USD)</label>
                            <input className="w-full p-2 border rounded" value={pricingEnterprise} onChange={(e) => setPricingEnterprise(e.target.value)} placeholder="0.00" />
                          </div>
                          <div className="flex items-end">
                            <Button onClick={savePricing}>Save Pricing</Button>
                          </div>
                        </div>
                      )}
                      {moduleAnalytics && selectedModuleId === m.moduleId && (
                        <div className="mt-4 text-sm text-gray-700">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-gray-600">Monthly Revenue</p>
                              <p className="font-semibold">{formatCurrency(moduleAnalytics.monthlyRevenue || 0)}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Active Subs</p>
                              <p className="font-semibold">{moduleAnalytics.activeSubscriptions || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Installations</p>
                              <p className="font-semibold">{moduleAnalytics.totalInstallations || 0}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Avg Rating</p>
                              <p className="font-semibold">{(moduleAnalytics.averageRating || 0).toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
      </Tabs>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Request Payout</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payout Amount
                </label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Available for payout: {formatCurrency((stats?.totalRevenue || 0) - (stats?.totalPayouts || 0))}</p>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setShowPayoutModal(false)}
                  disabled={payoutLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayoutRequest}
                  disabled={payoutLoading || !payoutAmount}
                >
                  {payoutLoading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Request Payout
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 