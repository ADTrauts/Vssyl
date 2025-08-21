'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input, Textarea, Badge, Alert, Spinner } from 'shared/components';
import { submitModule } from '../../../api/modules';
import BusinessCreationModal from '../../../components/BusinessCreationModal';
import { 
  Upload, 
  FileText, 
  Settings, 
  Code, 
  Shield, 
  CheckCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

interface ModuleSubmission {
  name: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  icon?: File;
  screenshots: File[];
  manifest: {
    permissions: string[];
    dependencies: string[];
    entryPoint: string;
    frontend?: { entryUrl: string };
    settings: Record<string, any>;
  };
  readme: string;
  license: string;
}

const CATEGORIES = [
  'PRODUCTIVITY',
  'COMMUNICATION', 
  'ANALYTICS',
  'DEVELOPMENT',
  'ENTERTAINMENT',
  'EDUCATION',
  'FINANCE',
  'HEALTH',
  'OTHER'
];

const LICENSE_OPTIONS = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'Custom'
];

export default function SubmitModulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [submittedModuleName, setSubmittedModuleName] = useState('');
  const [submittedModuleId, setSubmittedModuleId] = useState<string | null>(null);
  const [submission, setSubmission] = useState<ModuleSubmission>({
    name: '',
    description: '',
    version: '1.0.0',
    category: '',
    tags: [],
    screenshots: [],
    manifest: {
      permissions: [],
      dependencies: [],
      entryPoint: '',
      frontend: { entryUrl: '' },
      settings: {}
    },
    readme: '',
    license: 'MIT'
  });

  const [tagInput, setTagInput] = useState('');
  const [permissionInput, setPermissionInput] = useState('');
  const [dependencyInput, setDependencyInput] = useState('');

  const addTag = () => {
    if (tagInput.trim() && !submission.tags.includes(tagInput.trim())) {
      setSubmission(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setSubmission(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addPermission = () => {
    if (permissionInput.trim() && !submission.manifest.permissions.includes(permissionInput.trim())) {
      setSubmission(prev => ({
        ...prev,
        manifest: {
          ...prev.manifest,
          permissions: [...prev.manifest.permissions, permissionInput.trim()]
        }
      }));
      setPermissionInput('');
    }
  };

  const removePermission = (permission: string) => {
    setSubmission(prev => ({
      ...prev,
      manifest: {
        ...prev.manifest,
        permissions: prev.manifest.permissions.filter(p => p !== permission)
      }
    }));
  };

  const addDependency = () => {
    if (dependencyInput.trim() && !submission.manifest.dependencies.includes(dependencyInput.trim())) {
      setSubmission(prev => ({
        ...prev,
        manifest: {
          ...prev.manifest,
          dependencies: [...prev.manifest.dependencies, dependencyInput.trim()]
        }
      }));
      setDependencyInput('');
    }
  };

  const removeDependency = (dependency: string) => {
    setSubmission(prev => ({
      ...prev,
      manifest: {
        ...prev.manifest,
        dependencies: prev.manifest.dependencies.filter(d => d !== dependency)
      }
    }));
  };

  const handleFileUpload = (field: 'icon' | 'screenshots', files: FileList | null) => {
    if (!files) return;

    if (field === 'icon') {
      setSubmission(prev => ({ ...prev, icon: files[0] }));
    } else if (field === 'screenshots') {
      const newScreenshots = Array.from(files);
      setSubmission(prev => ({ 
        ...prev, 
        screenshots: [...prev.screenshots, ...newScreenshots] 
      }));
    }
  };

  const removeScreenshot = (index: number) => {
    setSubmission(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const isValidHttpsUrl = (value: string): boolean => {
    try {
      const url = new URL(value);
      return url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return submission.name.trim() !== '' && 
               submission.description.trim() !== '' && 
               submission.category !== '';
      case 2:
        return isValidHttpsUrl(submission.manifest.frontend?.entryUrl || '');
      case 3:
        return submission.readme.trim() !== '' && 
               submission.license !== '';
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields in the current step.');
      return;
    }

    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare submission data
      const submissionData = {
        name: submission.name,
        description: submission.description,
        version: submission.version,
        category: submission.category,
        tags: submission.tags,
        manifest: submission.manifest,
        dependencies: submission.manifest.dependencies,
        permissions: submission.manifest.permissions,
        readme: submission.readme,
        license: submission.license
      };

      const response = await submitModule(submissionData);
      
      setSuccess(true);
      setSubmittedModuleName(submission.name);
      
      // Extract module ID from the response for business linking
      const moduleId = response?.submission?.module?.id;
      setSubmittedModuleId(moduleId || null);
      setShowBusinessModal(true);
    } catch (err) {
      console.error('Error submitting module:', err);
      setError('Failed to submit module. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Module Name *
            </label>
            <Input
              value={submission.name}
              onChange={(e) => setSubmission(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Calendar, Analytics Dashboard"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Version *
            </label>
            <Input
              value={submission.version}
              onChange={(e) => setSubmission(prev => ({ ...prev, version: e.target.value }))}
              placeholder="1.0.0"
              required
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <Textarea
            value={submission.description}
            onChange={(e) => setSubmission(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Describe what your module does and its key features..."
            rows={4}
            required
          />
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={submission.category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubmission(prev => ({ ...prev, category: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category</option>
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <Button onClick={addTag} variant="secondary" size="sm">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {submission.tags.map(tag => (
              <Badge key={tag} color="blue" size="sm">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Module Configuration</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hosted Bundle URL (HTTPS) *
          </label>
          <Input
            value={submission.manifest.frontend?.entryUrl || ''}
            onChange={(e) => setSubmission(prev => ({
              ...prev,
              manifest: {
                ...prev.manifest,
                frontend: { entryUrl: e.target.value }
              }
            }))}
            placeholder="https://your-cdn.com/your-module/index.html"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Provide a publicly accessible HTTPS URL to your module's entry HTML.</p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Entry Point *
          </label>
          <Input
            value={submission.manifest.entryPoint}
            onChange={(e) => setSubmission(prev => ({
              ...prev,
              manifest: { ...prev.manifest, entryPoint: e.target.value }
            }))}
            placeholder="e.g., /calendar, /analytics"
            
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Required Permissions
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={permissionInput}
              onChange={(e) => setPermissionInput(e.target.value)}
              placeholder="e.g., files:read, chat:write"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPermission())}
            />
            <Button onClick={addPermission} variant="secondary" size="sm">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {submission.manifest.permissions.map(permission => (
              <Badge key={permission} color="yellow" size="sm">
                <Shield className="w-3 h-3 mr-1" />
                {permission}
                <button
                  onClick={() => removePermission(permission)}
                  className="ml-1 text-yellow-600 hover:text-yellow-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dependencies
          </label>
          <div className="flex gap-2 mb-2">
            <Input
              value={dependencyInput}
              onChange={(e) => setDependencyInput(e.target.value)}
              placeholder="e.g., react, lodash"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDependency())}
            />
            <Button onClick={addDependency} variant="secondary" size="sm">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {submission.manifest.dependencies.map(dependency => (
              <Badge key={dependency} color="gray" size="sm">
                <Code className="w-3 h-3 mr-1" />
                {dependency}
                <button
                  onClick={() => removeDependency(dependency)}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Module Icon
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload('icon', e.target.files)}
              className="hidden"
              id="icon-upload"
            />
            <label htmlFor="icon-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
              {submission.icon ? submission.icon.name : 'Upload icon (optional)'}
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Screenshots
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileUpload('screenshots', e.target.files)}
              className="hidden"
              id="screenshots-upload"
            />
            <label htmlFor="screenshots-upload" className="cursor-pointer text-blue-600 hover:text-blue-800">
              Upload screenshots (optional)
            </label>
          </div>
          {submission.screenshots.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {submission.screenshots.map((file, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Screenshot ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeScreenshot(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Documentation & Legal</h3>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            README *
          </label>
          <Textarea
            value={submission.readme}
            onChange={(e) => setSubmission(prev => ({ ...prev, readme: e.target.value }))}
            placeholder="Provide detailed documentation for your module..."
            rows={8}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            License *
          </label>
          <select
            value={submission.license}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSubmission(prev => ({ ...prev, license: e.target.value }))}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {LICENSE_OPTIONS.map(license => (
              <option key={license} value={license}>{license}</option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Submission Guidelines</h4>
              <ul className="mt-2 text-sm text-blue-800 space-y-1">
                <li>• Ensure your module follows security best practices</li>
                <li>• Provide clear documentation and usage examples</li>
                <li>• Test your module thoroughly before submission</li>
                <li>• All submissions will be reviewed by our team</li>
                <li>• Review process typically takes 2-3 business days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const steps = [
    { number: 1, title: 'Basic Information', icon: FileText },
    { number: 2, title: 'Configuration', icon: Settings },
    { number: 3, title: 'Documentation', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="secondary"
              onClick={() => router.push('/modules')}
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Submit Module</h1>
          <p className="text-gray-600 mt-2">
            Share your module with the community
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isActive ? 'border-blue-500 bg-blue-500 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 bg-white text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${
                      isActive ? 'text-blue-600' :
                      isCompleted ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert type="error" title="Error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert type="success" title="Success" className="mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              Module submitted successfully! Setting up business profile...
            </div>
          </Alert>
        )}

        {/* Form Content */}
        <Card className="p-8">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleSubmit}
              disabled={loading || !validateStep(currentStep)}
            >
              {loading ? (
                <>
                  <Spinner size={16} />
                  {currentStep === 3 ? 'Submitting...' : 'Loading...'}
                </>
              ) : currentStep === 3 ? (
                'Submit Module'
              ) : (
                'Next'
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Business Creation Modal */}
      <BusinessCreationModal
        isOpen={showBusinessModal}
        onClose={() => setShowBusinessModal(false)}
        moduleName={submittedModuleName}
        moduleId={submittedModuleId || undefined}
        onBusinessCreated={(businessId) => {
          console.log('Business created:', businessId);
          // Module is now linked to the business
        }}
      />
    </div>
  );
} 