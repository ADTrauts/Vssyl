'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge, Alert, Spinner } from 'shared/components';
import { ArrowRight, Check, X, AlertCircle, Info } from 'lucide-react';
import PlanComparison, { Tier, TierOrString } from './PlanComparison';
import { authenticatedApiCall } from '../lib/apiUtils';

interface UpgradeFlowProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: TierOrString;
  subscriptionId?: string;
  businessId?: string;
  onSuccess?: () => void;
  /** Pre-select tier when opened from deep link */
  initialSelectedTier?: TierOrString;
}

// Note: Stripe handles proration automatically when updating subscriptions
// We'll show an estimated proration message but Stripe calculates the actual amount
export default function UpgradeFlow({
  isOpen,
  onClose,
  currentTier = 'free',
  subscriptionId,
  businessId,
  onSuccess,
  initialSelectedTier,
}: UpgradeFlowProps) {
  const [selectedTier, setSelectedTier] = useState<TierOrString | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setSelectedTier(null);
      setError(null);
    } else if (initialSelectedTier && initialSelectedTier !== currentTier) {
      setSelectedTier(initialSelectedTier);
      setStep('confirm');
    }
  }, [isOpen, initialSelectedTier, currentTier]);

  const handleSelectTier = (tier: TierOrString) => {
    setSelectedTier(tier);
    setStep('confirm');
  };

  const handleConfirm = async () => {
    if (!selectedTier) {
      setError('Please select a plan');
      return;
    }

    if (selectedTier === currentTier) {
      setError('You are already on this plan');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // If upgrading to a paid tier from free, use checkout flow
      if (currentTier === 'free' && selectedTier !== 'free') {
        // Create checkout session
        const response = await authenticatedApiCall<{ sessionId: string; url: string }>(
          '/api/billing/checkout/session',
          {
            method: 'POST',
            body: JSON.stringify({
              tier: selectedTier,
              billingCycle,
              businessId: businessId || null,
            }),
          }
        );

        if (response.url) {
          window.location.href = response.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      } else if (subscriptionId) {
        // Update existing subscription (Stripe handles proration automatically)
        await authenticatedApiCall(`/api/billing/subscriptions/${subscriptionId}`, {
          method: 'PUT',
          body: JSON.stringify({
            tier: selectedTier,
            businessId: businessId || null,
          }),
        });

        // Success
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        throw new Error('Unable to update subscription. Please contact support.');
      }
    } catch (err) {
      console.error('Failed to update subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTierComparison = () => {
    if (!selectedTier) return null;

    // Filter tiers based on user type (personal vs business)
    const getUserTiers = (): TierOrString[] => {
      if (businessId) {
        return ['free', 'business_basic', 'business_advanced', 'enterprise'];
      } else {
        return ['free', 'pro'];
      }
    };

    const tierHierarchy: TierOrString[] = getUserTiers();
    const currentIndex = tierHierarchy.indexOf(currentTier as TierOrString);
    const selectedIndex = tierHierarchy.indexOf(selectedTier);

    if (selectedIndex > currentIndex) {
      return { type: 'upgrade' as const, message: 'You are upgrading to a higher tier' };
    } else if (selectedIndex < currentIndex) {
      return { type: 'downgrade' as const, message: 'You are downgrading to a lower tier' };
    }
    return null;
  };

  const comparison = getTierComparison();

  return (
    <Modal open={isOpen} onClose={onClose} title="Change Subscription Plan" size="large">
      <div className="space-y-6">
        {step === 'select' && (
          <>
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Choose a new plan. Your subscription will be updated immediately, and Stripe will automatically prorate any charges.
              </p>
            </div>

            <PlanComparison
              currentTier={currentTier}
              onSelectTier={handleSelectTier}
              showActions={true}
              userType={businessId ? 'business' : 'personal'}
            />
          </>
        )}

        {step === 'confirm' && selectedTier && (
          <>
            <div className="space-y-4">
              <Alert
                type={comparison?.type === 'upgrade' ? 'info' : 'warning'}
                title={comparison?.type === 'upgrade' ? 'Upgrade Plan' : 'Downgrade Plan'}
              >
                <div className="space-y-2">
                  <p className="text-sm">{comparison?.message}</p>
                  <p className="text-sm font-medium">
                    Current Plan: <span className="capitalize">{currentTier.replace('_', ' ')}</span>
                  </p>
                  <p className="text-sm font-medium">
                    New Plan: <span className="capitalize">{selectedTier.replace('_', ' ')}</span>
                  </p>
                </div>
              </Alert>

              {currentTier !== 'free' && selectedTier !== 'free' && (
                <Alert type="info" title="Proration">
                  <div className="space-y-1 text-sm">
                    <p>
                      Stripe will automatically calculate and apply prorated charges for the remainder of your current billing period.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      If you're upgrading, you'll be charged the difference. If you're downgrading, you'll receive a credit.
                    </p>
                  </div>
                </Alert>
              )}

              {selectedTier === 'free' && currentTier !== 'free' && (
                <Alert type="warning" title="Downgrading to Free">
                  <div className="space-y-1 text-sm">
                    <p>
                      Downgrading to the Free plan will cancel your paid subscription at the end of your current billing period.
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      You'll retain access to all paid features until then.
                    </p>
                  </div>
                </Alert>
              )}

              <Card>
                <div className="p-4">
                  <h4 className="font-semibold mb-3">Plan Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Current Plan:</span>
                      <span className="font-medium capitalize">{currentTier.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Plan:</span>
                      <span className="font-medium capitalize">{selectedTier.replace('_', ' ')}</span>
                    </div>
                    {currentTier !== 'free' && selectedTier !== 'free' && (
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-600 dark:text-gray-400">Proration:</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">Calculated by Stripe</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {error && (
              <Alert type="error" title="Error">
                {error}
              </Alert>
            )}

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setStep('select')} disabled={loading}>
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? (
                  <>
                    <span className="mr-2"><Spinner size={16} /></span> Processing...
                  </>
                ) : (
                  <>
                    Confirm Change <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

