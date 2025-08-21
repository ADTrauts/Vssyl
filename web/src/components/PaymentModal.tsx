'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Badge, Alert } from 'shared/components';
import {
  CreditCard,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader,
  Shield,
  Zap
} from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { createSubscription, getStripeError } from '../lib/stripe';

interface Module {
  id: string;
  name: string;
  description: string;
  pricingTier: 'free' | 'premium' | 'enterprise';
  basePrice: number;
  enterprisePrice?: number;
}

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  module: Module | null;
  onSuccess: () => void;
}

export default function PaymentModal({ open, onClose, module, onSuccess }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'enterprise'>('premium');
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');
  const [stripe, setStripe] = useState<any>(null);

  useEffect(() => {
    // Load Stripe
    const loadStripeInstance = async () => {
      const stripeInstance = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );
      setStripe(stripeInstance);
    };
    loadStripeInstance();
  }, []);

  useEffect(() => {
    if (module) {
      setSelectedTier(module.pricingTier === 'enterprise' ? 'enterprise' : 'premium');
    }
  }, [module]);

  const handlePayment = async () => {
    if (!module || !stripe) return;

    setLoading(true);
    setError(null);

    try {
      // Create subscription
      const subscription = await createSubscription({
        tier: selectedTier === 'premium' ? 'standard' : 'enterprise',
        interval: selectedInterval,
        moduleId: module.id,
      });

      // If we have a client secret, redirect to Stripe Checkout
      if (subscription.clientSecret) {
        const { error } = await stripe.confirmCardPayment(subscription.clientSecret);
        
        if (error) {
          throw new Error(getStripeError(error));
        }
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (!module) return 0;
    const basePrice = selectedTier === 'premium' ? module.basePrice : module.enterprisePrice || module.basePrice;
    return selectedInterval === 'year' ? basePrice * 12 * 0.8 : basePrice; // 20% discount for yearly
  };

  const getFormattedPrice = () => {
    const price = getPrice();
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  if (!module) return null;

  return (
    <Modal open={open} onClose={onClose} title="Subscribe to Module" size="large">
      <div className="space-y-6">
        {/* Module Info */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{module.name}</h3>
                <p className="text-gray-600">{module.description}</p>
              </div>
              <Badge className={
                module.pricingTier === 'premium' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
              }>
                {module.pricingTier === 'premium' ? 'Premium' : 'Enterprise'}
              </Badge>
            </div>
          </div>
        </Card>

        {/* Pricing Options */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Choose Your Plan</h3>

            <div className="space-y-4">
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedTier('premium')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedTier === 'premium'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Premium</div>
                    <div className="text-sm text-gray-600">${module.basePrice}/month</div>
                  </button>

                  {module.enterprisePrice && (
                    <button
                      type="button"
                      onClick={() => setSelectedTier('enterprise')}
                      className={`p-4 border rounded-lg text-left transition-colors ${
                        selectedTier === 'enterprise'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Enterprise</div>
                      <div className="text-sm text-gray-600">${module.enterprisePrice}/month</div>
                    </button>
                  )}
                </div>
              </div>

              {/* Billing Interval */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Billing Interval</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedInterval('month')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedInterval === 'month'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Monthly</div>
                    <div className="text-sm text-gray-600">${getPrice()}/month</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedInterval('year')}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      selectedInterval === 'year'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium">Yearly</div>
                    <div className="text-sm text-gray-600">${getPrice()}/month (20% off)</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Summary */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Module Subscription</span>
                <span>{getFormattedPrice()}</span>
              </div>

              <div className="flex justify-between">
                <span>Billing Interval</span>
                <span className="capitalize">{selectedInterval}ly</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{getFormattedPrice()}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Trust Indicators */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Your payment is secured by Stripe</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Shield className="w-4 h-4" />
            <span>SSL encrypted payment processing</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Zap className="w-4 h-4" />
            <span>Instant access after payment</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert type="error" title="Payment Error">
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>

          <Button
            onClick={handlePayment}
            disabled={loading || !stripe}
            className="flex-1"
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Subscribe Now
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
} 