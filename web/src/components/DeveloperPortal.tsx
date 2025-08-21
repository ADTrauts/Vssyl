'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert, Modal } from 'shared/components';
import { 
  getDeveloperDashboard,
  getDeveloperStats,
  getModuleRevenue,
  requestPayout,
  getPayoutHistory,
  type DeveloperStats,
  type ModuleRevenue,
} from '../api/developerPortal';
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
  Loader
} from 'lucide-react';

interface DeveloperPortalProps {
  open: boolean;
  onClose: () => void;
}

export default function DeveloperPortal({ open, onClose }: DeveloperPortalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [moduleRevenue, setModuleRevenue] = useState<ModuleRevenue[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadDashboard();
    }
  }, [open]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dashboard = await getDeveloperDashboard();
      setStats(dashboard.stats);
      setModuleRevenue(dashboard.moduleRevenue);
      setPayoutHistory(dashboard.payoutHistory);
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load developer dashboard');
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
      
      await requestPayout(parseFloat(payoutAmount));
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

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Developer Portal" size="large">
      <div className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size={32} />
            <span className="ml-2">Loading developer dashboard...</span>
          </div>
        ) : error ? (
          <Alert type="error" title="Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        ) : (
          <>
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

            {/* Payout Section */}
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

            {/* Module Revenue */}
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
          </>
        )}
      </div>

      {/* Payout Modal */}
      <Modal 
        open={showPayoutModal} 
        onClose={() => setShowPayoutModal(false)}
        title="Request Payout"
      >
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
      </Modal>
    </Modal>
  );
} 