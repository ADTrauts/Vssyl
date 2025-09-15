'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { adminApiService } from '../../../lib/adminApiService';
import {
  Code,
  Users,
  Package,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Rocket,
  Box,
  Wrench,
  ArrowRight,
  Settings,
  Eye,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

interface DeveloperStats {
  totalDevelopers: number;
  activeDevelopers: number;
  totalModules: number;
  pendingSubmissions: number;
  totalRevenue: number;
  pendingPayouts: number;
  averageRating: number;
  topCategory: string;
}

interface DeveloperPayout {
  id: string;
  developerId: string;
  developerName: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

export default function AdminDevelopersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DeveloperStats | null>(null);
  const [payouts, setPayouts] = useState<DeveloperPayout[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadDeveloperData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsRes, payoutsRes] = await Promise.all([
        adminApiService.getDeveloperStats(),
        adminApiService.getDeveloperPayouts({ page: 1, limit: 10 })
      ]);

      if (statsRes.error) {
        setError(statsRes.error);
        return;
      }

      if (payoutsRes.error) {
        setError(payoutsRes.error);
        return;
      }

      setStats(statsRes.data as DeveloperStats);
      setPayouts((payoutsRes.data as any)?.payouts || []);
      setError(null);
    } catch (err) {
      setError('Failed to load developer data');
      console.error('Developer data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeveloperData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadDeveloperData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Spinner size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Code className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Developer Management</h1>
            <p className="text-gray-600">Manage developers, review submissions, and handle payouts</p>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Error">
          {error}
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Developers</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalDevelopers || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Submissions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.pendingSubmissions || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Modules</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalModules || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${(stats?.totalRevenue || 0).toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin-portal/modules">
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="p-2 rounded-lg bg-blue-100 w-fit mb-3">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Review Submissions</h3>
              <p className="text-sm text-gray-600">Review pending module submissions</p>
            </div>
          </Link>
          <Link href="/admin-portal/billing">
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="p-2 rounded-lg bg-green-100 w-fit mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Manage Payouts</h3>
              <p className="text-sm text-gray-600">Process developer payouts</p>
            </div>
          </Link>
          <Link href="/admin-portal/analytics">
            <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <div className="p-2 rounded-lg bg-purple-100 w-fit mb-3">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">Developer Analytics</h3>
              <p className="text-sm text-gray-600">View developer performance metrics</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Payouts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Payouts</h2>
          <Link href="/admin-portal/billing">
            <Button className="flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>View All</span>
            </Button>
          </Link>
        </div>
        <Card className="p-6">
          {payouts.length > 0 ? (
            <div className="space-y-4">
              {payouts.slice(0, 5).map((payout) => (
                <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <DollarSign className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{payout.developerName}</h3>
                      <p className="text-sm text-gray-600">Payout #{payout.id.slice(-8)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-lg font-semibold text-gray-900">
                      ${payout.amount.toLocaleString()}
                    </span>
                    <Badge 
                      color={payout.status === 'paid' ? 'green' : payout.status === 'pending' ? 'yellow' : 'red'}
                    >
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No recent payouts</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

