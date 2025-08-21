"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  getGovernancePolicies, 
  createGovernancePolicy, 
  updateGovernancePolicy, 
  deleteGovernancePolicy,
  enforceGovernancePolicies,
  getPolicyViolations,
  resolvePolicyViolation,
  type GovernancePolicy,
  type GovernancePolicyCreateRequest,
  type GovernancePolicyUpdateRequest,
  type PolicyViolation,
  type PolicyViolationResponse
} from '../api/governance';
import { Button, Card, Badge, Input, Textarea, Modal, Alert, Spinner } from 'shared/components';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Info,
  Settings,
  FileText,
  Users,
  Lock,
  Clock
} from 'lucide-react';

interface GovernanceManagementDashboardProps {
  className?: string;
}

export default function GovernanceManagementDashboard({ className = '' }: GovernanceManagementDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'policies' | 'violations' | 'enforcement'>('policies');
  
  // Governance Policies State
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<GovernancePolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<GovernancePolicyCreateRequest>({
    name: '',
    description: '',
    policyType: 'classification',
    rules: [],
    isActive: true
  });

  // Policy Violations State
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [violationsPagination, setViolationsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Policy Enforcement State
  const [enforcementForm, setEnforcementForm] = useState({
    resourceType: '',
    resourceId: '',
    content: '',
    metadata: ''
  });
  const [enforcementResult, setEnforcementResult] = useState<any>(null);
  const [loadingEnforcement, setLoadingEnforcement] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Load governance policies
  const loadPolicies = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingPolicies(true);
      setError(null);
      const response = await getGovernancePolicies(session.accessToken);
      setPolicies(response.data);
    } catch (err) {
      console.error('Error loading governance policies:', err);
      setError('Failed to load governance policies');
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Load policy violations
  const loadViolations = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingViolations(true);
      setError(null);
      const response = await getPolicyViolations(session.accessToken, {
        page: violationsPagination.page,
        limit: violationsPagination.limit
      });
      setViolations(response.data.violations);
      setViolationsPagination(response.data.pagination);
    } catch (err) {
      console.error('Error loading policy violations:', err);
      setError('Failed to load policy violations');
    } finally {
      setLoadingViolations(false);
    }
  };

  // Create governance policy
  const handleCreatePolicy = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await createGovernancePolicy(session.accessToken, policyForm);
      setShowPolicyModal(false);
      setPolicyForm({
        name: '',
        description: '',
        policyType: 'classification',
        rules: [],
        isActive: true
      });
      loadPolicies();
    } catch (err) {
      console.error('Error creating governance policy:', err);
      setError('Failed to create governance policy');
    }
  };

  // Update governance policy
  const handleUpdatePolicy = async () => {
    if (!session?.accessToken || !editingPolicy) return;
    
    try {
      setError(null);
      await updateGovernancePolicy(session.accessToken, editingPolicy.id, policyForm);
      setShowPolicyModal(false);
      setEditingPolicy(null);
      setPolicyForm({
        name: '',
        description: '',
        policyType: 'classification',
        rules: [],
        isActive: true
      });
      loadPolicies();
    } catch (err) {
      console.error('Error updating governance policy:', err);
      setError('Failed to update governance policy');
    }
  };

  // Delete governance policy
  const handleDeletePolicy = async (id: string) => {
    if (!session?.accessToken) return;
    
    if (!confirm('Are you sure you want to delete this governance policy?')) return;
    
    try {
      setError(null);
      await deleteGovernancePolicy(session.accessToken, id);
      loadPolicies();
    } catch (err) {
      console.error('Error deleting governance policy:', err);
      setError('Failed to delete governance policy');
    }
  };

  // Enforce governance policies
  const handleEnforcePolicies = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingEnforcement(true);
      setError(null);
      const response = await enforceGovernancePolicies(session.accessToken, {
        resourceType: enforcementForm.resourceType,
        resourceId: enforcementForm.resourceId,
        content: enforcementForm.content || undefined,
        metadata: enforcementForm.metadata ? JSON.parse(enforcementForm.metadata) : undefined
      });
      setEnforcementResult(response.data);
    } catch (err) {
      console.error('Error enforcing governance policies:', err);
      setError('Failed to enforce governance policies');
    } finally {
      setLoadingEnforcement(false);
    }
  };

  // Resolve policy violation
  const handleResolveViolation = async (violationId: string, resolutionNotes?: string) => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await resolvePolicyViolation(session.accessToken, violationId, resolutionNotes);
      loadViolations();
    } catch (err) {
      console.error('Error resolving policy violation:', err);
      setError('Failed to resolve policy violation');
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (session?.accessToken) {
      loadPolicies();
      loadViolations();
    }
  }, [session?.accessToken]);

  // Load violations when tab changes
  useEffect(() => {
    if (activeTab === 'violations' && session?.accessToken) {
      loadViolations();
    }
  }, [activeTab, session?.accessToken]);

  // Open policy modal for editing
  const openEditPolicy = (policy: GovernancePolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      description: policy.description || '',
      policyType: policy.policyType,
      rules: policy.rules,
      isActive: policy.isActive
    });
    setShowPolicyModal(true);
  };

  // Open policy modal for creating
  const openCreatePolicy = () => {
    setEditingPolicy(null);
    setPolicyForm({
      name: '',
      description: '',
      policyType: 'classification',
      rules: [],
      isActive: true
    });
    setShowPolicyModal(true);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getPolicyTypeIcon = (policyType: string) => {
    switch (policyType) {
      case 'classification': return <Shield className="w-4 h-4" />;
      case 'retention': return <Clock className="w-4 h-4" />;
      case 'access': return <Users className="w-4 h-4" />;
      case 'encryption': return <Lock className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Governance Management</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setActiveTab('policies')} variant={activeTab === 'policies' ? 'primary' : 'secondary'}>
            <Shield className="w-4 h-4 mr-2" />
            Policies
          </Button>
          <Button onClick={() => setActiveTab('violations')} variant={activeTab === 'violations' ? 'primary' : 'secondary'}>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Violations
          </Button>
          <Button onClick={() => setActiveTab('enforcement')} variant={activeTab === 'enforcement' ? 'primary' : 'secondary'}>
            <Settings className="w-4 h-4 mr-2" />
            Enforcement
          </Button>
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Governance Policies</h3>
            <Button onClick={openCreatePolicy}>
              <Plus className="w-4 h-4 mr-2" />
              Create Policy
            </Button>
          </div>

          {loadingPolicies ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="grid gap-4">
              {policies.map((policy) => (
                <Card key={policy.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getPolicyTypeIcon(policy.policyType)}
                        <h4 className="font-semibold">{policy.name}</h4>
                        <Badge color={policy.isActive ? 'green' : 'gray'}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge color="blue">{policy.policyType}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <div className="text-sm text-gray-500">
                        Rules: {policy.rules.length} | Created: {new Date(policy.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditPolicy(policy)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="secondary" color="red" onClick={() => handleDeletePolicy(policy.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Violations Tab */}
      {activeTab === 'violations' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Policy Violations</h3>

          {loadingViolations ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <div className="space-y-4">
              {violations.map((violation) => (
                <Card key={violation.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge color={getSeverityColor(violation.severity)}>
                          {violation.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {violation.resourceType} - {violation.resourceId}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{violation.message}</p>
                      <div className="text-xs text-gray-500">
                        Detected: {new Date(violation.detectedAt).toLocaleString()}
                        {violation.resolvedAt && (
                          <span className="ml-4">
                            Resolved: {new Date(violation.resolvedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    {!violation.resolvedAt && (
                      <Button size="sm" onClick={() => handleResolveViolation(violation.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Enforcement Tab */}
      {activeTab === 'enforcement' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Policy Enforcement</h3>
          
          <Card className="p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resource Type</label>
                <Input
                  value={enforcementForm.resourceType}
                  onChange={(e) => setEnforcementForm({ ...enforcementForm, resourceType: e.target.value })}
                  placeholder="e.g., message, file, conversation"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resource ID</label>
                <Input
                  value={enforcementForm.resourceId}
                  onChange={(e) => setEnforcementForm({ ...enforcementForm, resourceId: e.target.value })}
                  placeholder="Resource identifier"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Content (Optional)</label>
                <Textarea
                  value={enforcementForm.content}
                  onChange={(e) => setEnforcementForm({ ...enforcementForm, content: e.target.value })}
                  placeholder="Content to analyze"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Metadata (Optional)</label>
                <Textarea
                  value={enforcementForm.metadata}
                  onChange={(e) => setEnforcementForm({ ...enforcementForm, metadata: e.target.value })}
                  placeholder='{"key": "value"}'
                  rows={2}
                />
              </div>
              <Button onClick={handleEnforcePolicies} disabled={loadingEnforcement}>
                {loadingEnforcement ? <Spinner size={16} /> : <Shield className="w-4 h-4 mr-2" />}
                Enforce Policies
              </Button>
            </div>
          </Card>

          {enforcementResult && (
            <Card className="p-4">
              <h4 className="font-semibold mb-2">Enforcement Results</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Policies:</span>
                  <span>{enforcementResult.totalPolicies}</span>
                </div>
                <div className="flex justify-between">
                  <span>Violations Found:</span>
                  <span>{enforcementResult.totalViolations}</span>
                </div>
                <div className="flex justify-between">
                  <span>Actions Executed:</span>
                  <span>{enforcementResult.actions.length}</span>
                </div>
              </div>
              
              {enforcementResult.violations.length > 0 && (
                <div className="mt-4">
                  <h5 className="font-medium mb-2">Violations:</h5>
                  <div className="space-y-2">
                    {enforcementResult.violations.map((violation: any, index: number) => (
                      <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                        <div className="font-medium">{violation.policyName}</div>
                        <div className="text-gray-600">{violation.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Policy Modal */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPolicy ? 'Edit Governance Policy' : 'Create Governance Policy'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={policyForm.name}
                onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                placeholder="Policy name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={policyForm.description}
                onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
                placeholder="Policy description"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Policy Type</label>
              <select
                value={policyForm.policyType}
                onChange={(e) => setPolicyForm({ ...policyForm, policyType: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="classification">Classification</option>
                <option value="retention">Retention</option>
                <option value="access">Access</option>
                <option value="encryption">Encryption</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={policyForm.isActive}
                onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
                className="rounded"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Active</label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>
              Cancel
            </Button>
            <Button onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}>
              {editingPolicy ? 'Update Policy' : 'Create Policy'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 