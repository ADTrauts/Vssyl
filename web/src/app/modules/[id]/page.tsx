'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, Button, Badge, Spinner, Alert } from 'shared/components';
import { 
  getModuleDetails, 
  installModule, 
  uninstallModule,
  createModuleSubscription,
  type ModuleDetails 
} from '../../../api/modules';
import PaymentModal from '../../../components/PaymentModal';
import { 
  ArrowLeft, 
  Download, 
  Upload, 
  Star, 
  Users, 
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Crown
} from 'lucide-react';

export default function ModuleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const moduleId = params?.id as string;
  
  const [module, setModule] = useState<ModuleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    const loadModuleDetails = async () => {
      try {
        setLoading(true);
        const details = await getModuleDetails(moduleId);
        setModule(details);
      } catch (err) {
        console.error('Error loading module details:', err);
        setError('Failed to load module details');
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      loadModuleDetails();
    }
  }, [moduleId]);

  const handleInstall = async () => {
    if (!module) return;
    
    if (module.pricingTier && module.pricingTier !== 'free') {
      // Show payment modal for paid modules
      setShowPaymentModal(true);
      return;
    }
    
    // Handle free module installation
    setActionLoading(true);
    try {
      await installModule(moduleId);
      router.push('/modules?tab=installed');
    } catch (err) {
      console.error('Error installing module:', err);
      setError('Failed to install module');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Install the module after successful payment
    setActionLoading(true);
    try {
      await installModule(moduleId);
      router.push('/modules?tab=installed');
    } catch (err) {
      console.error('Error installing module after payment:', err);
      setError('Payment successful but failed to install module');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUninstall = async () => {
    setActionLoading(true);
    try {
      await uninstallModule(moduleId);
      router.push('/modules?tab=installed');
    } catch (err) {
      console.error('Error uninstalling module:', err);
      setError('Failed to uninstall module');
    } finally {
      setActionLoading(false);
    }
  };

  const getPricingBadge = (tier: string) => {
    const colors = {
      free: 'bg-green-100 text-green-800',
      premium: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    return colors[tier as keyof typeof colors] || colors.free;
  };

  const getPricingIcon = (tier: string) => {
    switch (tier) {
      case 'free': return null;
      case 'premium': return <CreditCard className="w-4 h-4" />;
      case 'enterprise': return <Crown className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size={32} />
        <span className="ml-2">Loading module details...</span>
      </div>
    );
  }

  if (error || !module) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert type="error" title="Error">
          {error || 'Module not found'}
        </Alert>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="secondary" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{module.name}</h1>
              <p className="text-gray-600">by {module.developer}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {module.pricingTier && (
              <Badge className={getPricingBadge(module.pricingTier)}>
                {getPricingIcon(module.pricingTier)}
                <span className="ml-1">
                  {module.pricingTier === 'free' ? 'Free' :
                   module.pricingTier === 'premium' ? 'Premium' : 'Enterprise'}
                </span>
              </Badge>
            )}
            <Badge className={module.isInstalled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
              {module.isInstalled ? 'Installed' : 'Available'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <div className="p-6">
                <h2 className="text-lg font-semibold mb-4">Description</h2>
                <p className="text-gray-700">{module.description}</p>
              </div>
            </Card>

            {/* Pricing Information */}
            {module.pricingTier && module.pricingTier !== 'free' && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Pricing</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="font-medium">Premium Plan</h3>
                        <p className="text-sm text-gray-600">Full access to all features</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${module.basePrice || 0}/month</div>
                        <div className="text-sm text-gray-500">or ${((module.basePrice || 0) * 12 * 0.8).toFixed(0)}/year</div>
                      </div>
                    </div>
                    
                    {module.enterprisePrice && module.enterprisePrice !== module.basePrice && (
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div>
                          <h3 className="font-medium">Enterprise Plan</h3>
                          <p className="text-sm text-gray-600">Custom pricing for large organizations</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${module.enterprisePrice}/month</div>
                          <div className="text-sm text-gray-500">Contact sales for details</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Reviews */}
            {module.reviews && module.reviews.length > 0 && (
              <Card>
                <div className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Reviews</h2>
                  <div className="space-y-4">
                    {module.reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`w-4 h-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-600">{review.reviewer.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Module Info */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Module Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span>{module.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span>{module.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Downloads:</span>
                    <span>{module.downloads}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span>{module.rating.toFixed(1)} ({module.reviewCount} reviews)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Updated:</span>
                    <span>{module.updatedAt ? new Date(module.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Installation */}
            <Card>
              <div className="p-6">
                <h3 className="font-semibold mb-4">Installation</h3>
                {module.isInstalled ? (
                  <div className="space-y-4">
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>Module is installed</span>
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={handleUninstall}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      {actionLoading ? <Spinner size={16} /> : 'Uninstall Module'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {module.pricingTier === 'free' ? (
                      <Button 
                        onClick={handleInstall}
                        disabled={actionLoading}
                        className="w-full"
                      >
                        {actionLoading ? <Spinner size={16} /> : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            Install Module
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button 
                          onClick={handleInstall}
                          disabled={actionLoading}
                          className="w-full"
                        >
                          {actionLoading ? <Spinner size={16} /> : (
                            <>
                              <CreditCard className="w-4 h-4 mr-2" />
                              Subscribe & Install
                            </>
                          )}
                        </Button>
                        <p className="text-xs text-gray-500 text-center">
                          {module.pricingTier === 'premium' 
                            ? `$${module.basePrice}/month subscription required`
                            : 'Enterprise pricing - contact sales'
                          }
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {module && module.pricingTier && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          module={{
            id: module.id,
            name: module.name,
            description: module.description,
            pricingTier: module.pricingTier,
            basePrice: module.basePrice || 0,
            enterprisePrice: module.enterprisePrice,
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </>
  );
} 