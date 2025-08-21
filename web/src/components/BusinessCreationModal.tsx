'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal, Button, Input, Alert, Spinner } from 'shared/components';
import { businessAPI } from '../api/business';
import { linkModuleToBusiness } from '../api/modules';
import { Building2, Link, Plus, CheckCircle } from 'lucide-react';

interface BusinessCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleName?: string;
  moduleId?: string;
  onBusinessCreated?: (businessId: string) => void;
}

interface BusinessFormData {
  name: string;
  ein: string;
  industry: string;
  size: string;
  website: string;
  phone: string;
  email: string;
  description: string;
}

export default function BusinessCreationModal({ 
  isOpen, 
  onClose, 
  moduleName,
  moduleId,
  onBusinessCreated 
}: BusinessCreationModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'create' | 'link'>('choice');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [businesses, setBusinesses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    ein: '',
    industry: '',
    size: '',
    website: '',
    phone: '',
    email: '',
    description: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await businessAPI.createBusiness(formData);
      
      if (response.success) {
        setSuccess(true);
        
        // Link module to business if moduleId is provided
        if (moduleId && response.data.id) {
          try {
            await linkModuleToBusiness(moduleId, response.data.id);
            console.log('Module linked to business successfully');
          } catch (err) {
            console.error('Error linking module to business:', err);
            // Continue anyway - the business was created successfully
          }
        }
        
        if (onBusinessCreated) {
          onBusinessCreated(response.data.id);
        }
        // Redirect to business workspace after a short delay
        setTimeout(() => {
          router.push(`/business/${response.data.id}/workspace`);
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkExisting = () => {
    setMode('link');
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await businessAPI.getUserBusinesses();
        if (resp?.success && Array.isArray(resp.data)) {
          setBusinesses(resp.data.map((b: any) => ({ id: b.id, name: b.name })));
        } else {
          setBusinesses([]);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load your businesses');
      } finally {
        setLoading(false);
      }
    })();
  };

  const resetModal = () => {
    setMode('choice');
    setError(null);
    setSuccess(false);
    setFormData({
      name: '',
      ein: '',
      industry: '',
      size: '',
      website: '',
      phone: '',
      email: '',
      description: ''
    });
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderChoiceMode = () => (
    <div className="text-center">
      <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {moduleName ? `Great! "${moduleName}" is ready for review.` : 'Module Submitted Successfully!'}
      </h2>
      <p className="text-gray-600 mb-6">
        To access analytics and manage your module, you'll need a business profile. 
        Would you like to create a new business or link to an existing one?
      </p>
      
      <div className="space-y-4">
        <Button
          onClick={() => setMode('create')}
          className="w-full justify-center"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Business
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => setMode('link')}
          className="w-full justify-center"
          size="lg"
        >
          <Link className="w-5 h-5 mr-2" />
          Link to Existing Business
        </Button>
        
        <Button
          variant="ghost"
          onClick={handleClose}
          className="w-full"
        >
          Skip for Now
        </Button>
      </div>
    </div>
  );

  const renderCreateMode = () => (
    <div>
      <div className="text-center mb-6">
        <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Business</h2>
        <p className="text-gray-600">
          Set up your business profile to manage your module and access analytics
        </p>
      </div>

      {error && (
        <Alert type="error" title="Error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleCreateBusiness} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Name *
            </label>
            <Input
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Your Business Name"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Industry</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="retail">Retail</option>
              <option value="manufacturing">Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Size
            </label>
            <select
              name="size"
              value={formData.size}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Size</option>
              <option value="1-10">1-10 employees</option>
              <option value="11-50">11-50 employees</option>
              <option value="51-200">51-200 employees</option>
              <option value="201-1000">201-1000 employees</option>
              <option value="1000+">1000+ employees</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <Input
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://yourcompany.com"
              type="url"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Brief description of your business..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMode('choice')}
            className="flex-1"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={loading || !formData.name}
            className="flex-1"
          >
            {loading ? (
              <>
                <Spinner size={16} />
                Creating...
              </>
            ) : (
              'Create Business'
            )}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderLinkMode = () => (
    <div>
      <div className="text-center mb-4">
        <Link className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Link to Existing Business</h2>
        <p className="text-gray-600">
          Choose an existing business to link your module for analytics and management.
        </p>
      </div>

      {error && (
        <Alert type="error" title="Error" className="mb-4">
          {error}
        </Alert>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Spinner size={24} />
          </div>
        ) : (
          <>
            {businesses.length === 0 ? (
              <div className="p-4 bg-gray-50 rounded-md text-sm text-gray-600">
                You have no businesses yet. Create a new one instead.
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Business</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedBusinessId}
                  onChange={(e) => setSelectedBusinessId(e.target.value)}
                >
                  <option value="">Choose a business</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                onClick={() => setMode('choice')}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                disabled={!selectedBusinessId || !moduleId}
                className="flex-1"
                onClick={async () => {
                  if (!selectedBusinessId || !moduleId) return;
                  try {
                    setLoading(true);
                    setError(null);
                    await linkModuleToBusiness(moduleId, selectedBusinessId);
                    if (onBusinessCreated) {
                      onBusinessCreated(selectedBusinessId);
                    }
                    router.push(`/business/${selectedBusinessId}/workspace`);
                    onClose();
                  } catch (e: any) {
                    setError(e?.message || 'Failed to link module to business');
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Link Business
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderSuccessMode = () => (
    <div className="text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Created!</h2>
      <p className="text-gray-600 mb-4">
        Your business "{formData.name}" has been successfully created. 
        You'll be redirected to your business workspace shortly.
      </p>
      <div className="animate-pulse">
        <div className="h-2 bg-gray-200 rounded mb-2"></div>
        <div className="h-2 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    </div>
  );

  return (
    <Modal
      open={isOpen}
      onClose={handleClose}
      size="large"
      title=""
    >
      <div className="p-6">
        {success ? renderSuccessMode() :
         mode === 'choice' ? renderChoiceMode() :
         mode === 'create' ? renderCreateMode() :
         mode === 'link' ? renderLinkMode() : null}
      </div>
    </Modal>
  );
} 