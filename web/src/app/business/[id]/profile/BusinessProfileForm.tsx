'use client';

import { useState } from 'react';
import { Card, Button, Input, Textarea, Badge, Toast } from 'shared/components';

interface Business {
  id: string;
  name: string;
  ein: string;
  einVerified: boolean;
  industry?: string;
  size?: string;
  website?: string;
  address?: any;
  phone?: string;
  email?: string;
  description?: string;
  logo?: string;
}

interface BusinessProfileFormProps {
  business: Business;
  onUpdate: (data: Partial<Business>) => Promise<{ success: boolean; error?: string }>;
  canEdit: boolean;
}

const INDUSTRY_OPTIONS = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Retail',
  'Manufacturing',
  'Real Estate',
  'Consulting',
  'Legal',
  'Marketing',
  'Non-Profit',
  'Other'
];

const SIZE_OPTIONS = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees'
];

// Create a simple FormGroup component
function FormGroup({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

export function BusinessProfileForm({ business, onUpdate, canEdit }: BusinessProfileFormProps) {
  const [formData, setFormData] = useState({
    name: business.name || '',
    industry: business.industry || '',
    size: business.size || '',
    website: business.website || '',
    phone: business.phone || '',
    email: business.email || '',
    description: business.description || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onUpdate(formData);
      if (result.success) {
        setToast({ type: 'success', message: 'Business profile updated successfully!' });
        setIsEditing(false);
      } else {
        setToast({ type: 'error', message: result.error || 'Failed to update business profile' });
      }
    } catch (error) {
      setToast({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: business.name || '',
      industry: business.industry || '',
      size: business.size || '',
      website: business.website || '',
      phone: business.phone || '',
      email: business.email || '',
      description: business.description || ''
    });
    setIsEditing(false);
  };

  const hasChanges = () => {
    return (
      formData.name !== (business.name || '') ||
      formData.industry !== (business.industry || '') ||
      formData.size !== (business.size || '') ||
      formData.website !== (business.website || '') ||
      formData.phone !== (business.phone || '') ||
      formData.email !== (business.email || '') ||
      formData.description !== (business.description || '')
    );
  };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Business Profile</h2>
            {canEdit && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || !hasChanges()}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup label="Business Name" required>
                  <Input
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    placeholder="Enter business name"
                    disabled={!isEditing}
                  />
                </FormGroup>

                <FormGroup label="EIN">
                  <div className="flex items-center gap-2">
                    <Input
                      value={business.ein}
                      placeholder="EIN"
                      disabled
                      className="flex-1"
                    />
                    <Badge color={business.einVerified ? 'green' : 'yellow'}>
                      {business.einVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </div>
                </FormGroup>

                <FormGroup label="Industry">
                  <select
                    value={formData.industry}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('industry', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map(industry => (
                      <option key={industry} value={industry}>
                        {industry}
                      </option>
                    ))}
                  </select>
                </FormGroup>

                <FormGroup label="Company Size">
                  <select
                    value={formData.size}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('size', e.target.value)}
                    disabled={!isEditing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    <option value="">Select size</option>
                    {SIZE_OPTIONS.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </FormGroup>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormGroup label="Website">
                  <Input
                    value={formData.website}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    disabled={!isEditing}
                    type="url"
                  />
                </FormGroup>

                <FormGroup label="Phone">
                  <Input
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    disabled={!isEditing}
                    type="tel"
                  />
                </FormGroup>

                <FormGroup label="Email">
                  <Input
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                    placeholder="contact@business.com"
                    disabled={!isEditing}
                    type="email"
                  />
                </FormGroup>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
              <FormGroup label="About the Business">
                <Textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  placeholder="Tell us about your business..."
                  disabled={!isEditing}
                  rows={4}
                />
              </FormGroup>
            </div>

            {!canEdit && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <p className="text-blue-800 text-sm">
                  You don't have permission to edit this business profile. Contact an administrator to make changes.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          open={true}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
} 