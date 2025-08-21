'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Home } from 'lucide-react';
import { Button, Card, Alert, Spinner } from 'shared/components';
import HouseholdMemberManager from '../../../components/household/HouseholdMemberManager';
import { getHouseholds, Household } from '../../../api/household';
import { getDashboard } from '../../../api/dashboard';
import { Dashboard } from 'shared/types';

export default function HouseholdManagePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  
  const [household, setHousehold] = useState<Household | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dashboardId = searchParams.get('dashboard');

  useEffect(() => {
    if (!session?.accessToken) {
      router.push('/auth/login');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load dashboard first to get context
        if (dashboardId) {
          const dashboardData = await getDashboard(session.accessToken!, dashboardId);
          setDashboard(dashboardData);
        }

        // Load user's households to find the one associated with this dashboard
        const households = await getHouseholds(session.accessToken!);
        
        // For now, we'll use the first household or primary household
        // In the future, we should match by dashboard.householdId
        const primaryHousehold = households.find(h => h.isPrimary) || households[0];
        
        if (!primaryHousehold) {
          setError('No household found. Please create a household first.');
          return;
        }

        setHousehold(primaryHousehold);
      } catch (err) {
        console.error('Error loading household data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load household data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.accessToken, dashboardId, router]);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to access household management.</p>
          <Button onClick={() => router.push('/auth/login')}>
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner size={32} />
          <p className="mt-4 text-gray-600">Loading household data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <Alert type="error" title="Error loading household">
            {error}
          </Alert>
          <div className="flex space-x-3 mt-6">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Go Back
            </Button>
            <Button
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full text-center">
          <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-4">No Household Found</h2>
          <p className="text-gray-600 mb-6">
            You need to create a household before you can manage members.
          </p>
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-orange-600 hover:bg-orange-700"
          >
            Create Household
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-3">
                <Home className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-semibold text-gray-900">
                  Household Management
                </h1>
              </div>
            </div>

            {dashboard && (
              <Button
                variant="secondary"
                onClick={() => router.push(`/dashboard/${dashboard.id}`)}
                className="flex items-center space-x-2"
              >
                <span>Back to Dashboard</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <HouseholdMemberManager householdId={household.id} />
      </div>
    </div>
  );
} 