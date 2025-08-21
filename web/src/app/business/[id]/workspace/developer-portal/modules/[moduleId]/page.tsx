'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, Button, Spinner, Alert, Badge } from 'shared/components';
import { getModuleAnalytics, updateModulePricing } from '../../../../../../../api/developerPortal';
import { BarChart3, Settings, ArrowLeft } from 'lucide-react';

export default function ModuleDetailsPage() {
  const params = useParams();
  const businessId = params.id as string;
  const moduleId = params.moduleId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [base, setBase] = useState('');
  const [enterprise, setEnterprise] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getModuleAnalytics(moduleId);
        setAnalytics(data);
      } catch (e: any) {
        setError(e?.message || 'Failed to load module');
      } finally {
        setLoading(false);
      }
    })();
  }, [moduleId]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);

  const savePricing = async () => {
    try {
      setLoading(true);
      setError(null);
      await updateModulePricing(moduleId, parseFloat(base || '0'), enterprise ? parseFloat(enterprise) : undefined);
    } catch (e: any) {
      setError(e?.message || 'Failed to update pricing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Alert type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="secondary" onClick={() => history.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Module Details</h1>
          <Badge color="blue">{analytics?.moduleName || moduleId}</Badge>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-gray-600">Monthly Revenue</p>
            <p className="font-semibold">{formatCurrency(analytics?.monthlyRevenue)}</p>
          </div>
          <div>
            <p className="text-gray-600">Active Subs</p>
            <p className="font-semibold">{analytics?.activeSubscriptions || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Installations</p>
            <p className="font-semibold">{analytics?.totalInstallations || 0}</p>
          </div>
          <div>
            <p className="text-gray-600">Avg Rating</p>
            <p className="font-semibold">{(analytics?.averageRating || 0).toFixed(1)}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <Settings className="w-4 h-4 text-gray-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Base Price (USD)</label>
            <input className="w-full p-2 border rounded" value={base} onChange={(e) => setBase(e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Enterprise Price (USD)</label>
            <input className="w-full p-2 border rounded" value={enterprise} onChange={(e) => setEnterprise(e.target.value)} placeholder="0.00" />
          </div>
          <div className="flex items-end">
            <Button onClick={savePricing}>Save Pricing</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

