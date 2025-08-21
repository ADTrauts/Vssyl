'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge, Tabs } from 'shared/components';
import { 
  CreditCard, 
  Package, 
  Settings, 
  TrendingUp, 
  FileText, 
  Download,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useFeatureGating } from '../hooks/useFeatureGating';
import { FeatureUsageDisplay } from './FeatureGate';
import { authenticatedApiCall } from '../lib/apiUtils';

interface Subscription {
  id: string;
  tier: 'free' | 'standard' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface ModuleSubscription {
  id: string;
  moduleId: string;
  module: {
    name: string;
    description: string;
    icon?: string;
  };
  tier: 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due';
  amount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface UsageData {
  coreUsage: any[];
  moduleUsage: Array<{
    moduleId: string;
    moduleName: string;
    usage: any[];
  }>;
  period: {
    start: string;
    end: string;
  };
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
}

interface BillingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillingModal({ isOpen, onClose }: BillingModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [moduleSubscriptions, setModuleSubscriptions] = useState<ModuleSubscription[]>([]);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { features, loading: featuresLoading } = useFeatureGating();

  useEffect(() => {
    if (isOpen) {
      loadBillingData();
    }
  }, [isOpen]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      
      // Load subscription data
      try {
        const subscriptionData = await authenticatedApiCall('/api/billing/subscriptions/user');
        setSubscription(subscriptionData.subscription);
      } catch (error) {
        console.error('Failed to load subscription data:', error);
      }

      // Load module subscriptions
      try {
        const moduleSubsData = await authenticatedApiCall('/api/billing/modules/subscriptions');
        setModuleSubscriptions(moduleSubsData.subscriptions || []);
      } catch (error) {
        console.error('Failed to load module subscriptions:', error);
      }

      // Load usage data
      try {
        const usageData = await authenticatedApiCall('/api/billing/usage');
        setUsage(usageData);
      } catch (error) {
        console.error('Failed to load usage data:', error);
      }

      // Load invoices
      try {
        const invoicesData = await authenticatedApiCall('/api/billing/invoices');
        setInvoices(invoicesData.invoices || []);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'standard': return 'bg-blue-100 text-blue-800';
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'unpaid': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const tabs = [
    { label: 'Overview', key: 'overview' },
    { label: 'Modules', key: 'modules' },
    { label: 'Usage', key: 'usage' },
    { label: 'Invoices', key: 'invoices' },
  ];

  if (loading) {
    return (
      <Modal open={isOpen} onClose={onClose} title="Billing & Subscriptions" size="large">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Billing & Subscriptions" size="large">
      <div className="max-h-[80vh] overflow-y-auto">
        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab}>
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Current Subscription */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Your current subscription and billing information
                  </p>
                  
                  {subscription ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold capitalize">{subscription.tier} Plan</h3>
                          <p className="text-sm text-gray-600">
                            {subscription.tier === 'free' ? 'Free tier' : 
                             subscription.tier === 'standard' ? '$49.99/month' : 'Custom pricing'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getTierColor(subscription.tier)}>
                            {subscription.tier}
                          </Badge>
                          <Badge className={getStatusColor(subscription.status)}>
                            {subscription.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Billing Period:</span>
                          <p>{formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Auto-renewal:</span>
                          <p>{subscription.cancelAtPeriodEnd ? 'Cancelled' : 'Active'}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          Change Plan
                        </Button>
                        {subscription.status === 'active' && (
                          <Button variant="secondary" size="sm">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No active subscription found</p>
                      <Button className="mt-2">Subscribe to a Plan</Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* Feature Access */}
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Feature Access</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Features available with your current plan
                  </p>
                  
                  <div className="space-y-4">
                    {Object.values(features || {}).map((feature: any) => (
                      <div key={feature.name} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{feature.name}</h4>
                            <p className="text-sm text-gray-600">
                              Requires {feature.requiredTier} tier
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={feature.hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {feature.hasAccess ? 'Available' : 'Not Available'}
                            </Badge>
                          </div>
                        </div>
                        
                        {feature.hasAccess && feature.usageInfo && (
                          <FeatureUsageDisplay featureName={feature.name} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Active Modules</span>
                    </div>
                    <p className="text-2xl font-bold">{moduleSubscriptions.filter(s => s.status === 'active').length}</p>
                  </div>
                </Card>
                
                <Card>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">This Month</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {formatCurrency(moduleSubscriptions.reduce((sum, sub) => sum + sub.amount, 0))}
                    </p>
                  </div>
                </Card>
                
                <Card>
                  <div className="p-4">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Total Invoices</span>
                    </div>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'modules' && (
            <div className="space-y-4">
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Settings className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Module Subscriptions</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Manage your module subscriptions and billing
                  </p>
                  
                  {moduleSubscriptions.length > 0 ? (
                    <div className="space-y-4">
                      {moduleSubscriptions.map((sub) => (
                        <div key={sub.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">{sub.module.name}</h4>
                              <p className="text-sm text-gray-600">{sub.module.description}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getTierColor(sub.tier)}>
                                {sub.tier}
                              </Badge>
                              <Badge className={getStatusColor(sub.status)}>
                                {sub.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex items-center justify-between text-sm">
                            <span>{formatCurrency(sub.amount)}/month</span>
                            <span>Renews {formatDate(sub.currentPeriodEnd)}</span>
                          </div>
                          
                          <div className="mt-2 flex gap-2">
                            <Button variant="secondary" size="sm">
                              Manage
                            </Button>
                            <Button variant="secondary" size="sm">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No module subscriptions</p>
                      <Button className="mt-2">Browse Modules</Button>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Usage Analytics</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitor your usage across all modules
                  </p>
                  
                  {usage ? (
                    <div className="space-y-6">
                      {/* Core Usage */}
                      <div>
                        <h4 className="font-semibold mb-2">Core Platform Usage</h4>
                        <div className="space-y-2">
                          {usage.coreUsage.map((record: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <span className="text-sm font-medium">{record.metric}</span>
                              <span className="text-sm">{record.quantity} units</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Module Usage */}
                      <div>
                        <h4 className="font-semibold mb-2">Module Usage</h4>
                        <div className="space-y-4">
                          {usage.moduleUsage.map((moduleUsage) => (
                            <div key={moduleUsage.moduleId} className="border rounded-lg p-3">
                              <h5 className="font-medium mb-2">{moduleUsage.moduleName}</h5>
                              <div className="space-y-1">
                                {moduleUsage.usage.map((record: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between text-sm">
                                    <span>{record.metric}</span>
                                    <span>{record.quantity} units</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No usage data available</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-4">
              <Card>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="h-5 w-5" />
                    <h3 className="text-lg font-semibold">Invoice History</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    View and download your billing invoices
                  </p>
                  
                  {invoices.length > 0 ? (
                    <div className="space-y-4">
                      {invoices.map((invoice) => (
                        <div key={invoice.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold">Invoice #{invoice.id.slice(0, 8)}</h4>
                              <p className="text-sm text-gray-600">
                                {formatDate(invoice.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                              <Badge className={getStatusColor(invoice.status)}>
                                {invoice.status}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex gap-2">
                            <Button variant="secondary" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </Button>
                            <Button variant="secondary" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No invoices found</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </Tabs>
      </div>
    </Modal>
  );
} 