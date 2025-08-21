'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye
} from 'lucide-react';

interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  tier: 'free' | 'standard' | 'enterprise';
  status: 'active' | 'cancelled' | 'past_due' | 'unpaid';
  amount: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Payment {
  id: string;
  subscriptionId: string;
  amount: number;
  status: 'succeeded' | 'failed' | 'pending';
  createdAt: string;
  customerEmail: string;
}

interface DeveloperPayout {
  id: string;
  developerId: string;
  developerName: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  requestedAt: string;
  paidAt?: string;
}

export default function FinancialManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'payments' | 'payouts'>('subscriptions');

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for now - replace with actual API calls
      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub_1',
          userId: 'user_1',
          userEmail: 'john.doe@example.com',
          tier: 'standard',
          status: 'active',
          amount: 49.99,
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          cancelAtPeriodEnd: false,
        },
        {
          id: 'sub_2',
          userId: 'user_2',
          userEmail: 'jane.smith@example.com',
          tier: 'enterprise',
          status: 'active',
          amount: 199.99,
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          cancelAtPeriodEnd: false,
        },
        {
          id: 'sub_3',
          userId: 'user_3',
          userEmail: 'bob.wilson@example.com',
          tier: 'standard',
          status: 'past_due',
          amount: 49.99,
          currentPeriodStart: '2024-01-01T00:00:00Z',
          currentPeriodEnd: '2024-02-01T00:00:00Z',
          cancelAtPeriodEnd: false,
        },
      ];

      const mockPayments: Payment[] = [
        {
          id: 'pay_1',
          subscriptionId: 'sub_1',
          amount: 49.99,
          status: 'succeeded',
          createdAt: '2024-01-01T10:30:00Z',
          customerEmail: 'john.doe@example.com',
        },
        {
          id: 'pay_2',
          subscriptionId: 'sub_2',
          amount: 199.99,
          status: 'succeeded',
          createdAt: '2024-01-01T11:15:00Z',
          customerEmail: 'jane.smith@example.com',
        },
        {
          id: 'pay_3',
          subscriptionId: 'sub_3',
          amount: 49.99,
          status: 'failed',
          createdAt: '2024-01-01T12:00:00Z',
          customerEmail: 'bob.wilson@example.com',
        },
      ];

      const mockPayouts: DeveloperPayout[] = [
        {
          id: 'payout_1',
          developerId: 'dev_1',
          developerName: 'John Developer',
          amount: 1250.00,
          status: 'paid',
          requestedAt: '2024-01-15T09:00:00Z',
          paidAt: '2024-01-16T14:30:00Z',
        },
        {
          id: 'payout_2',
          developerId: 'dev_2',
          developerName: 'Jane Developer',
          amount: 875.50,
          status: 'pending',
          requestedAt: '2024-01-20T10:00:00Z',
        },
        {
          id: 'payout_3',
          developerId: 'dev_3',
          developerName: 'Bob Developer',
          amount: 2100.00,
          status: 'failed',
          requestedAt: '2024-01-18T11:00:00Z',
        },
      ];

      setSubscriptions(mockSubscriptions);
      setPayments(mockPayments);
      setPayouts(mockPayouts);
    } catch (err) {
      setError('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green">Active</Badge>;
      case 'cancelled':
        return <Badge color="gray">Cancelled</Badge>;
      case 'past_due':
        return <Badge color="yellow">Past Due</Badge>;
      case 'unpaid':
        return <Badge color="red">Unpaid</Badge>;
      case 'succeeded':
        return <Badge color="green">Succeeded</Badge>;
      case 'failed':
        return <Badge color="red">Failed</Badge>;
      case 'pending':
        return <Badge color="yellow">Pending</Badge>;
      case 'paid':
        return <Badge color="green">Paid</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'free':
        return <Badge color="gray">Free</Badge>;
      case 'standard':
        return <Badge color="blue">Standard</Badge>;
      case 'enterprise':
        return <Badge color="blue">Enterprise</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge color="blue">Admin</Badge>;
      case 'USER':
        return <Badge color="green">User</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  const handleFinancialAction = async (itemId: string, action: string) => {
    try {
      console.log(`Performing financial action ${action} on item ${itemId}`);
      // Implement financial actions
    } catch (error) {
      console.error('Error performing financial action:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={32} />
        <span className="ml-2">Loading financial data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert type="error" title="Error" className="mb-6">
        {error}
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600 mt-2">Manage subscriptions, payments, and developer payouts</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="secondary">
            <DollarSign className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="primary">
            <CreditCard className="w-4 h-4 mr-2" />
            Process Payouts
          </Button>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${subscriptions.reduce((sum, sub) => sum + sub.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter(sub => sub.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Past Due</p>
              <p className="text-2xl font-bold text-gray-900">
                {subscriptions.filter(sub => sub.status === 'past_due').length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-gray-900">
                ${payouts.filter(payout => payout.status === 'pending').reduce((sum, payout) => sum + payout.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
            { id: 'payments', label: 'Payments', count: payments.length },
            { id: 'payouts', label: 'Developer Payouts', count: payouts.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'subscriptions' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((subscription) => (
                  <tr key={subscription.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{subscription.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getTierBadge(subscription.tier)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(subscription.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${subscription.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFinancialAction(subscription.id, 'view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {subscription.status === 'past_due' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFinancialAction(subscription.id, 'retry')}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFinancialAction(subscription.id, 'cancel')}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'payments' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.customerEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payment.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFinancialAction(payment.id, 'view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payment.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFinancialAction(payment.id, 'retry')}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'payouts' && (
        <Card className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Developer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payout.developerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${payout.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payout.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payout.paidAt ? new Date(payout.paidAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFinancialAction(payout.id, 'view')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {payout.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFinancialAction(payout.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                        {payout.status === 'failed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleFinancialAction(payout.id, 'retry')}
                          >
                            <CreditCard className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
} 