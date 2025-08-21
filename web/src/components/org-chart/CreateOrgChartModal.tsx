'use client';

import { useState } from 'react';
import { Modal, Button, Input } from 'shared/components';
import { Building2, Users, Shield, Zap } from 'lucide-react';

interface CreateOrgChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (industry?: string) => Promise<void>;
}

const industryTemplates = [
  {
    id: 'technology',
    name: 'Technology Company',
    description: 'Software development, engineering, and product teams',
    icon: '💻',
    features: ['Engineering teams', 'Product management', 'Design teams', 'Sales & marketing'],
    tiers: 5,
    departments: 8
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Hospitality',
    description: 'Food service, customer experience, and operations',
    icon: '🍽️',
    features: ['Kitchen staff', 'Front of house', 'Management', 'Support staff'],
    tiers: 4,
    departments: 6
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    description: 'Production, quality control, and supply chain',
    icon: '🏭',
    features: ['Production teams', 'Quality assurance', 'Maintenance', 'Logistics'],
    tiers: 5,
    departments: 7
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    description: 'Medical staff, administration, and support services',
    icon: '🏥',
    features: ['Medical staff', 'Nursing', 'Administration', 'Support services'],
    tiers: 6,
    departments: 9
  },
  {
    id: 'retail',
    name: 'Retail',
    description: 'Store operations, sales, and customer service',
    icon: '🛍️',
    features: ['Store staff', 'Sales teams', 'Customer service', 'Management'],
    tiers: 4,
    departments: 5
  },
  {
    id: 'custom',
    name: 'Custom Structure',
    description: 'Build your own organizational structure from scratch',
    icon: '🔧',
    features: ['Flexible design', 'Custom departments', 'Tailored roles', 'Adaptive structure'],
    tiers: 0,
    departments: 0
  }
];

export function CreateOrgChartModal({ isOpen, onClose, onCreate }: CreateOrgChartModalProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!selectedIndustry) return;
    
    setIsCreating(true);
    try {
      const industry = selectedIndustry === 'custom' ? undefined : selectedIndustry;
      await onCreate(industry);
    } finally {
      setIsCreating(false);
    }
  };

  const selectedTemplate = industryTemplates.find(t => t.id === selectedIndustry);

  const handleClose = () => {
    setSelectedIndustry('');
    setCustomName('');
    onClose();
  };

  return (
          <Modal
        open={isOpen}
        onClose={handleClose}
        title="Create Organization Chart"
        size="large"
      >
      <div className="space-y-6">
        {/* Introduction */}
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Choose Your Organization Structure
          </h3>
          <p className="text-gray-600">
            Select an industry template to get started quickly, or create a custom structure
          </p>
        </div>

        {/* Industry Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Industry Template
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {industryTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedIndustry(template.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                  selectedIndustry === template.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{template.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {template.description}
                    </p>
                    {template.id !== 'custom' && (
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1" />
                          {template.tiers} tiers
                        </span>
                        <span className="flex items-center">
                          <Building2 className="w-3 h-3 mr-1" />
                          {template.departments} departments
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Name Input */}
        {selectedIndustry === 'custom' && (
          <div>
            <label htmlFor="customName" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <Input
              id="customName"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Enter your organization name"
              className="w-full"
            />
          </div>
        )}

        {/* Template Preview */}
        {selectedTemplate && selectedIndustry !== 'custom' && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2 text-yellow-500" />
              What's Included
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedTemplate.features.map((feature, index) => (
                <div key={index} className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
                  {feature}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Organizational Tiers:</span>
                <span className="font-medium text-gray-900">{selectedTemplate.tiers}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Departments:</span>
                <span className="font-medium text-gray-900">{selectedTemplate.departments}</span>
              </div>
            </div>
          </div>
        )}

        {/* Benefits */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            What You'll Get
          </h4>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
              Pre-configured organizational tiers and departments
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
              Industry-standard permission templates
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
              Role-based access control system
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
              Employee assignment and management tools
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!selectedIndustry || (selectedIndustry === 'custom' && !customName) || isCreating}
            className="flex items-center space-x-2"
          >
            {isCreating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Create Organization Chart</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
