'use client';

import React, { useState, useEffect } from 'react';
import { getSession } from 'next-auth/react';
import { Card, Button, Badge, Spinner, Alert, Tabs, Input, Modal } from 'shared/components';
import { DollarSign, Edit, History, TrendingUp, Mail, RefreshCw, Save, X, Plus } from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';

interface PricingConfig {
  id: string;
  tier: string;
  billingCycle: 'monthly' | 'yearly';
  basePrice: number;
  perEmployeePrice?: number | null;
  includedEmployees?: number | null;
  queryPackSmall?: number | null;
  queryPackMedium?: number | null;
  queryPackLarge?: number | null;
  queryPackEnterprise?: number | null;
  baseAIAllowance?: number | null;
  stripePriceId?: string | null;
  isActive: boolean;
  effectiveDate: string;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PricingManagementPage() {
  const [pricing, setPricing] = useState<PricingConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [editingPrice, setEditingPrice] = useState<PricingConfig | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingConfig>>({});
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [impact, setImpact] = useState<any>(null);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [updateExistingSubscriptions, setUpdateExistingSubscriptions] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCreateTierModal, setShowCreateTierModal] = useState(false);
  const [createTierForm, setCreateTierForm] = useState({
    tier: '',
    displayName: '',
    basePriceMonthly: '',
    basePriceYearly: '',
    perEmployeePrice: '',
    includedEmployees: '',
  });
  const [loadingCreateTier, setLoadingCreateTier] = useState(false);
  const [loadingSeed, setLoadingSeed] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; created?: string[] } | null>(null);
  const [stripeSaveMessage, setStripeSaveMessage] = useState<{ outcome: string; message?: string } | null>(null);

  useEffect(() => {
    loadPricing();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadPriceHistory();
    }
  }, [activeTab]);

  const loadPricing = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/pricing');
      if (!response.ok) {
        throw new Error('Failed to load pricing');
      }
      const data = await response.json();
      setPricing(data.pricing || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pricing');
    } finally {
      setLoading(false);
    }
  };

  const runSeedPricing = async () => {
    try {
      setLoadingSeed(true);
      setError(null);
      setSeedResult(null);
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
      const response = await fetch('/api/pricing/seed', { method: 'POST', headers });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to seed pricing');
      }
      setSeedResult({ success: true, created: data.created });
      await loadPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed pricing');
      setSeedResult({ success: false });
    } finally {
      setLoadingSeed(false);
    }
  };

  const loadPriceHistory = async () => {
    try {
      setError(null);
      const result = await adminApiService.getPriceHistory();
      if (result.error) {
        throw new Error(result.error);
      }
      setPriceHistory(result.data?.history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load price history');
    }
  };

  const calculateImpact = async () => {
    if (!editingPrice || !editForm.basePrice) return;

    try {
      setLoadingImpact(true);
      setError(null);
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
      const response = await fetch('/api/pricing/calculate-impact', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: editingPrice.tier,
          newBasePrice: editForm.basePrice,
          billingCycle: editingPrice.billingCycle,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate impact');
      }

      const data = await response.json();
      setImpact(data.impact);
      setShowPreview(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate impact');
    } finally {
      setLoadingImpact(false);
    }
  };

  const handleEdit = (price: PricingConfig) => {
    setStripeSaveMessage(null);
    setEditingPrice(price);
    setEditForm({
      basePrice: price.basePrice,
      perEmployeePrice: price.perEmployeePrice || undefined,
      includedEmployees: price.includedEmployees || undefined,
      queryPackSmall: price.queryPackSmall || undefined,
      queryPackMedium: price.queryPackMedium || undefined,
      queryPackLarge: price.queryPackLarge || undefined,
      queryPackEnterprise: price.queryPackEnterprise || undefined,
      baseAIAllowance: price.baseAIAllowance || undefined,
      stripePriceId: price.stripePriceId || undefined,
    });
  };

  const handleSave = async () => {
    if (!editingPrice) return;

    try {
      setLoading(true);
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      }
      const response = await fetch('/api/pricing', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tier: editingPrice.tier,
          billingCycle: editingPrice.billingCycle,
          basePrice: editForm.basePrice,
          perEmployeePrice: editForm.perEmployeePrice,
          includedEmployees: editForm.includedEmployees,
          queryPackSmall: editForm.queryPackSmall,
          queryPackMedium: editForm.queryPackMedium,
          queryPackLarge: editForm.queryPackLarge,
          queryPackEnterprise: editForm.queryPackEnterprise,
          baseAIAllowance: editForm.baseAIAllowance,
          stripePriceId: editForm.stripePriceId,
          sendNotifications,
          updateExistingSubscriptions,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update pricing');
      }

      const data = await response.json().catch(() => ({}));
      // Show Stripe results for base price or query packs
      if (data.stripe?.basePriceOutcome || data.stripe?.queryPacks?.length > 0) {
        const queryPackResults = data.stripe?.queryPacks || [];
        const hasQueryPackChanges = queryPackResults.length > 0;
        const hasBasePriceChange = data.stripe?.basePriceOutcome && data.stripe.basePriceOutcome !== 'skipped_no_change';
        
        // Build message combining base price and query pack results
        let message = '';
        if (hasBasePriceChange) {
          message = `Base price: ${data.stripe.message || data.stripe.basePriceOutcome}`;
        }
        if (hasQueryPackChanges) {
          const packMessages = queryPackResults.map((qp: any) => 
            `${qp.packType}: ${qp.outcome === 'created' ? 'Stripe updated' : qp.message || qp.outcome}`
          ).join('; ');
          if (message) message += ' | ';
          message += `Query packs: ${packMessages}`;
        }
        
        // Determine overall outcome (success if any created, warning if skipped, error if any error)
        const hasCreated = data.stripe?.basePriceOutcome === 'created' || queryPackResults.some((qp: any) => qp.outcome === 'created');
        const hasError = data.stripe?.basePriceOutcome === 'error' || queryPackResults.some((qp: any) => qp.outcome === 'error');
        
        setStripeSaveMessage({
          outcome: hasError ? 'error' : hasCreated ? 'created' : 'warning',
          message: message || 'Stripe sync completed',
        });
      } else {
        setStripeSaveMessage(null);
      }

      await loadPricing();
      setEditingPrice(null);
      setEditForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pricing');
      setStripeSaveMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTierName = (tier: string) => {
    return tier
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleCreateTier = async () => {
    const tier = createTierForm.tier.trim().toLowerCase().replace(/\s+/g, '_');
    const displayName = createTierForm.displayName.trim();
    const basePriceMonthly = parseFloat(createTierForm.basePriceMonthly);
    const basePriceYearly = parseFloat(createTierForm.basePriceYearly);
    if (!tier || !displayName || Number.isNaN(basePriceMonthly) || Number.isNaN(basePriceYearly) || basePriceMonthly < 0 || basePriceYearly < 0) {
      setError('Tier key, display name, and non-negative monthly/yearly prices are required.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(tier)) {
      setError('Tier key must be lowercase letters, numbers, and underscores only.');
      return;
    }
    try {
      setLoadingCreateTier(true);
      setError(null);
      const session = await getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.accessToken) headers['Authorization'] = `Bearer ${session.accessToken}`;
      const body: Record<string, unknown> = {
        tier,
        displayName,
        basePriceMonthly,
        basePriceYearly,
      };
      if (createTierForm.perEmployeePrice.trim() !== '') {
        const v = parseFloat(createTierForm.perEmployeePrice);
        if (!Number.isNaN(v) && v >= 0) body.perEmployeePrice = v;
      }
      if (createTierForm.includedEmployees.trim() !== '') {
        const v = parseInt(createTierForm.includedEmployees, 10);
        if (!Number.isNaN(v) && v >= 0) body.includedEmployees = v;
      }
      const response = await fetch('/api/pricing/tiers', { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create tier');
      }
      await loadPricing();
      setShowCreateTierModal(false);
      setCreateTierForm({ tier: '', displayName: '', basePriceMonthly: '', basePriceYearly: '', perEmployeePrice: '', includedEmployees: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tier');
    } finally {
      setLoadingCreateTier(false);
    }
  };

  // Group pricing by tier
  const pricingByTier = pricing.reduce((acc, price) => {
    if (!acc[price.tier]) {
      acc[price.tier] = { monthly: null, yearly: null };
    }
    if (price.billingCycle === 'monthly') {
      acc[price.tier].monthly = price;
    } else {
      acc[price.tier].yearly = price;
    }
    return acc;
  }, {} as Record<string, { monthly: PricingConfig | null; yearly: PricingConfig | null }>);

  if (loading && pricing.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pricing Management</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-1">Manage subscription tier pricing and query pack prices</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreateTierModal(true)}
            disabled={loading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add tier
          </Button>
          <Button
            variant="secondary"
            onClick={loadPricing}
            disabled={loading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={runSeedPricing}
            disabled={loadingSeed}
          >
            {loadingSeed ? <span className="mr-2 inline-block"><Spinner size={16} /></span> : <DollarSign className="w-4 h-4 mr-2" />}
            Seed pricing
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" title="Error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {seedResult?.success && (
        <Alert type="success" title="Pricing seeded" onClose={() => setSeedResult(null)}>
          Created: {seedResult.created?.join(', ') || 'all tiers'}
        </Alert>
      )}
      {stripeSaveMessage && (
        <Alert
          type={stripeSaveMessage.outcome === 'created' ? 'success' : stripeSaveMessage.outcome === 'error' ? 'error' : 'warning'}
          title={stripeSaveMessage.outcome === 'created' ? 'Stripe updated' : 'Stripe not updated'}
          onClose={() => setStripeSaveMessage(null)}
        >
          {stripeSaveMessage.outcome === 'created'
            ? 'New price created in Stripe; checkout will use it.'
            : stripeSaveMessage.message || stripeSaveMessage.outcome}
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="overview">Overview</Tabs.Trigger>
          <Tabs.Trigger value="history">Price History</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <Card className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Tier</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Monthly</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Yearly</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Per Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Included</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Query Packs</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(pricingByTier).map(([tier, prices]) => {
                    const m = prices.monthly;
                    const hasQueryPacks = m && (m.queryPackSmall != null || m.queryPackMedium != null || m.queryPackLarge != null || m.queryPackEnterprise != null);
                    const queryPackSummary = hasQueryPacks && m
                      ? [m.queryPackSmall, m.queryPackMedium, m.queryPackLarge, m.queryPackEnterprise]
                          .map(v => v != null ? formatCurrency(v) : '-')
                          .join(' / ')
                      : '-';
                    return (
                    <tr key={tier} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">{formatTierName(tier)}</td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {prices.monthly ? formatCurrency(prices.monthly.basePrice) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {prices.yearly ? formatCurrency(prices.yearly.basePrice) : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {prices.monthly?.perEmployeePrice
                          ? formatCurrency(prices.monthly.perEmployeePrice)
                          : '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        {prices.monthly?.includedEmployees || '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 text-xs" title="Small / Medium / Large / Enterprise">
                        {queryPackSummary}
                      </td>
                      <td className="py-3 px-4">
                        {prices.monthly?.isActive ? (
                          <Badge color="green">Active</Badge>
                        ) : (
                          <Badge color="gray">Inactive</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {prices.monthly && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => prices.monthly && handleEdit(prices.monthly)}
                              title="Edit Monthly Pricing"
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span className="text-xs">Monthly</span>
                            </Button>
                          )}
                          {prices.yearly && (
                        <Button
                          variant="ghost"
                          size="sm"
                              onClick={() => prices.yearly && handleEdit(prices.yearly)}
                              title="Edit Yearly Pricing"
                              className="flex items-center gap-1"
                        >
                              <Edit className="w-3 h-3" />
                              <span className="text-xs">Yearly</span>
                        </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </Card>
        </Tabs.Content>

        <Tabs.Content value="history">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Price Change History</h2>
              <Button variant="secondary" size="sm" onClick={loadPriceHistory}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            {priceHistory.length === 0 ? (
              <p className="text-gray-700 dark:text-gray-300">No price changes recorded yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Tier</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Change Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Old Value</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">New Value</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Changed By</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-gray-100">Notification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceHistory.map((change: any) => (
                      <tr key={change.id} className="border-b hover:bg-gray-50 dark:hover:bg-slate-800 dark:bg-slate-800">
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {new Date(change.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {formatTierName(change.pricingConfig?.tier || '')} ({change.pricingConfig?.billingCycle || ''})
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {change.changeType.replace('_', ' ')}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {change.changeType.includes('price') ? formatCurrency(change.oldValue) : change.oldValue}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {change.changeType.includes('price') ? formatCurrency(change.newValue) : change.newValue}
                        </td>
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {change.createdByUser?.name || change.createdByUser?.email || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          {change.notificationSent ? (
                            <Badge color="green">Sent</Badge>
                          ) : (
                            <Badge color="gray">Not Sent</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </Tabs.Content>
      </Tabs>

      {/* Edit Modal */}
      {editingPrice && (
        <Modal
          open={!!editingPrice}
          onClose={() => {
            setEditingPrice(null);
            setEditForm({});
          }}
          title={`Edit ${formatTierName(editingPrice.tier)} ${editingPrice.billingCycle} Pricing`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base Price ($)
              </label>
              <Input
                type="number"
                step="0.01"
                value={editForm.basePrice || ''}
                onChange={(e) => {
                  const newPrice = parseFloat(e.target.value);
                  setEditForm({ ...editForm, basePrice: newPrice });
                  setImpact(null);
                  setShowPreview(false);
                }}
              />
              {editingPrice && editForm.basePrice !== editingPrice.basePrice && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={calculateImpact}
                  disabled={loadingImpact}
                  className="mt-2"
                >
                  {loadingImpact ? (
                    <>
                      <span className="mr-2 inline-block">
                        <Spinner size={16} />
                      </span>
                      Calculating...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Preview Impact
                    </>
                  )}
                </Button>
              )}
            </div>

            {showPreview && impact && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Impact Preview</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Affected Subscriptions:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{impact.affectedSubscriptions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">Current Monthly Revenue:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(impact.currentRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">New Monthly Revenue:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(impact.newRevenue)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-700 dark:text-gray-300">Revenue Change:</span>
                    <span className={`font-medium ${impact.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {impact.revenueChange >= 0 ? '+' : ''}{formatCurrency(impact.revenueChange)} ({impact.revenueChangePercent >= 0 ? '+' : ''}{impact.revenueChangePercent.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Per Employee Price ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.perEmployeePrice || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        perEmployeePrice: parseFloat(e.target.value) || undefined,
                      })
                    }
                placeholder="0.00"
                  />
              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">Leave empty if not applicable</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Included Employees
                  </label>
                  <Input
                    type="number"
                    value={editForm.includedEmployees || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        includedEmployees: parseInt(e.target.value) || undefined,
                      })
                    }
                placeholder="0"
                  />
              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">Number of employees included in base price</p>
                </div>

            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">AI Query Pack Prices</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Small Pack (500 queries) ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.queryPackSmall || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        queryPackSmall: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="10.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Medium Pack (2,500 queries) ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.queryPackMedium || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        queryPackMedium: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="40.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Large Pack (5,000 queries) ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.queryPackLarge || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        queryPackLarge: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="70.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enterprise Pack (10,000 queries) ($)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editForm.queryPackEnterprise || ''}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        queryPackEnterprise: parseFloat(e.target.value) || undefined,
                      })
                    }
                    placeholder="120.00"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400">Query pack prices are global (same for all tiers). Changes will sync to Stripe.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Stripe Price ID (optional)
              </label>
              <Input
                type="text"
                value={editForm.stripePriceId || ''}
                onChange={(e) =>
                  setEditForm({ ...editForm, stripePriceId: e.target.value || undefined })
                }
                placeholder="price_..."
              />
            </div>

            {editingPrice && editForm.basePrice !== editingPrice.basePrice && (
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sendNotifications"
                  checked={sendNotifications}
                  onChange={(e) => setSendNotifications(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="sendNotifications" className="text-sm text-gray-700 dark:text-gray-300">
                  Send email notifications to affected subscribers
                </label>
                </div>
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="updateExistingSubscriptions"
                    checked={updateExistingSubscriptions}
                    onChange={(e) => setUpdateExistingSubscriptions(e.target.checked)}
                    className="w-4 h-4 mt-0.5"
                  />
                  <div>
                    <label htmlFor="updateExistingSubscriptions" className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                      Update existing subscriptions to new price
                    </label>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">
                      All active subscriptions for this tier will be updated to the new price. 
                      The new price will take effect on their next billing cycle (no proration).
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 dark:text-gray-400 mt-1">
                      ⚠️ If unchecked, existing customers will keep their current price (grandfathered pricing).
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingPrice(null);
                  setEditForm({});
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create new tier modal */}
      <Modal
        open={showCreateTierModal}
        onClose={() => {
          setShowCreateTierModal(false);
          setCreateTierForm({ tier: '', displayName: '', basePriceMonthly: '', basePriceYearly: '', perEmployeePrice: '', includedEmployees: '' });
        }}
        title="Create new tier"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">Add a new subscription tier. A Stripe product and monthly/yearly prices will be created and the tier will appear in the billing modal.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tier key (slug)</label>
            <Input
              value={createTierForm.tier}
              onChange={(e) => setCreateTierForm({ ...createTierForm, tier: e.target.value })}
              placeholder="e.g. pro_plus"
            />
            <p className="text-xs text-gray-700 dark:text-gray-300 mt-1">Lowercase letters, numbers, underscores only</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display name</label>
            <Input
              value={createTierForm.displayName}
              onChange={(e) => setCreateTierForm({ ...createTierForm, displayName: e.target.value })}
              placeholder="e.g. Pro Plus"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createTierForm.basePriceMonthly}
                onChange={(e) => setCreateTierForm({ ...createTierForm, basePriceMonthly: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly price ($)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createTierForm.basePriceYearly}
                onChange={(e) => setCreateTierForm({ ...createTierForm, basePriceYearly: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Per employee price ($) — optional</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={createTierForm.perEmployeePrice}
                onChange={(e) => setCreateTierForm({ ...createTierForm, perEmployeePrice: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Included employees — optional</label>
              <Input
                type="number"
                min="0"
                value={createTierForm.includedEmployees}
                onChange={(e) => setCreateTierForm({ ...createTierForm, includedEmployees: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="secondary"
              onClick={() => setShowCreateTierModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateTier} disabled={loadingCreateTier}>
              {loadingCreateTier ? <span className="mr-2 inline-block"><Spinner size={16} /></span> : <Plus className="w-4 h-4 mr-2" />}
              Create tier
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

