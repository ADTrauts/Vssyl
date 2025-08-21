'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  getRetentionPolicies,
  createRetentionPolicy,
  updateRetentionPolicy,
  deleteRetentionPolicy,
  getRetentionStatus,
  triggerCleanup,
  getDataClassifications,
  classifyData,
  getBackupRecords,
  createBackup,
  getClassificationRules,
  createClassificationRule,
  updateClassificationRule,
  deleteClassificationRule,
  getClassificationTemplates,
  createClassificationTemplate,
  bulkClassifyData,
  getExpiringClassifications,
  autoClassifyData,
  type RetentionPolicy,
  type RetentionStatus,
  type DataClassification,
  type BackupRecord,
  type RetentionPolicyCreateRequest,
  type DataClassificationCreateRequest,
  type BackupCreateRequest,
  type ClassificationRule,
  type ClassificationTemplate,
  type BulkClassificationRequest,
  type BulkClassificationItem
} from '../api/retention';
import { Card, Button, Badge, Alert, Spinner, Modal } from '../../../shared/src/components';

interface RetentionManagementDashboardProps {
  className?: string;
}

export default function RetentionManagementDashboard({ className = '' }: RetentionManagementDashboardProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'policies' | 'classifications' | 'backups' | 'status' | 'rules' | 'templates' | 'bulk' | 'expiring'>('policies');
  
  // Retention Policies State
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RetentionPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<RetentionPolicyCreateRequest>({
    name: '',
    description: '',
    resourceType: '',
    retentionPeriod: 365,
    archiveAfter: undefined,
    deleteAfter: undefined,
    isActive: true
  });

  // Retention Status State
  const [status, setStatus] = useState<RetentionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Data Classifications State
  const [classifications, setClassifications] = useState<DataClassification[]>([]);
  const [loadingClassifications, setLoadingClassifications] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [classificationForm, setClassificationForm] = useState<DataClassificationCreateRequest>({
    resourceType: '',
    resourceId: '',
    sensitivity: 'PUBLIC',
    expiresAt: undefined,
    notes: ''
  });

  // Backup Records State
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupForm, setBackupForm] = useState<BackupCreateRequest>({
    backupType: 'database',
    notes: ''
  });

  // Classification Rules State
  const [rules, setRules] = useState<ClassificationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ClassificationRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    description: '',
    pattern: '',
    resourceType: '',
    sensitivity: 'PUBLIC' as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED',
    priority: 0,
    isActive: true
  });

  // Classification Templates State
  const [templates, setTemplates] = useState<ClassificationTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    sensitivity: 'PUBLIC' as 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED',
    expiresIn: undefined as number | undefined,
    notes: ''
  });

  // Bulk Classification State
  const [bulkItems, setBulkItems] = useState<BulkClassificationItem[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    sensitivity: 'PUBLIC' as const,
    expiresAt: '',
    notes: ''
  });

  // Expiring Classifications State
  const [expiringClassifications, setExpiringClassifications] = useState<DataClassification[]>([]);
  const [loadingExpiring, setLoadingExpiring] = useState(false);

  // Error State
  const [error, setError] = useState<string | null>(null);

  // Load retention policies
  const loadPolicies = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingPolicies(true);
      setError(null);
      const response = await getRetentionPolicies(session.accessToken);
      setPolicies(response.data);
    } catch (err) {
      console.error('Error loading retention policies:', err);
      setError('Failed to load retention policies');
    } finally {
      setLoadingPolicies(false);
    }
  };

  // Load retention status
  const loadStatus = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingStatus(true);
      setError(null);
      const response = await getRetentionStatus(session.accessToken);
      setStatus(response.data);
    } catch (err) {
      console.error('Error loading retention status:', err);
      setError('Failed to load retention status');
    } finally {
      setLoadingStatus(false);
    }
  };

  // Load data classifications
  const loadClassifications = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingClassifications(true);
      setError(null);
      const response = await getDataClassifications(session.accessToken, { limit: 50 });
      setClassifications(response.data.classifications);
    } catch (err) {
      console.error('Error loading data classifications:', err);
      setError('Failed to load data classifications');
    } finally {
      setLoadingClassifications(false);
    }
  };

  // Load backup records
  const loadBackups = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingBackups(true);
      setError(null);
      const response = await getBackupRecords(session.accessToken, { limit: 50 });
      setBackups(response.data.backups);
    } catch (err) {
      console.error('Error loading backup records:', err);
      setError('Failed to load backup records');
    } finally {
      setLoadingBackups(false);
    }
  };

  // Load classification rules
  const loadRules = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingRules(true);
      setError(null);
      const response = await getClassificationRules(session.accessToken);
      setRules(response.data);
    } catch (err) {
      console.error('Error loading classification rules:', err);
      setError('Failed to load classification rules');
    } finally {
      setLoadingRules(false);
    }
  };

  // Load classification templates
  const loadTemplates = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingTemplates(true);
      setError(null);
      const response = await getClassificationTemplates(session.accessToken);
      setTemplates(response.data);
    } catch (err) {
      console.error('Error loading classification templates:', err);
      setError('Failed to load classification templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Load expiring classifications
  const loadExpiringClassifications = async () => {
    if (!session?.accessToken) return;
    
    try {
      setLoadingExpiring(true);
      setError(null);
      const response = await getExpiringClassifications(session.accessToken, { days: 30 });
      setExpiringClassifications(response.data.classifications);
    } catch (err) {
      console.error('Error loading expiring classifications:', err);
      setError('Failed to load expiring classifications');
    } finally {
      setLoadingExpiring(false);
    }
  };

  // Create retention policy
  const handleCreatePolicy = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await createRetentionPolicy(session.accessToken, policyForm);
      setShowPolicyModal(false);
      setPolicyForm({
        name: '',
        description: '',
        resourceType: '',
        retentionPeriod: 365,
        archiveAfter: undefined,
        deleteAfter: undefined,
        isActive: true
      });
      loadPolicies();
    } catch (err) {
      console.error('Error creating retention policy:', err);
      setError('Failed to create retention policy');
    }
  };

  // Update retention policy
  const handleUpdatePolicy = async () => {
    if (!session?.accessToken || !editingPolicy) return;
    
    try {
      setError(null);
      await updateRetentionPolicy(session.accessToken, editingPolicy.id, policyForm);
      setShowPolicyModal(false);
      setEditingPolicy(null);
      setPolicyForm({
        name: '',
        description: '',
        resourceType: '',
        retentionPeriod: 365,
        archiveAfter: undefined,
        deleteAfter: undefined,
        isActive: true
      });
      loadPolicies();
    } catch (err) {
      console.error('Error updating retention policy:', err);
      setError('Failed to update retention policy');
    }
  };

  // Delete retention policy
  const handleDeletePolicy = async (id: string) => {
    if (!session?.accessToken) return;
    
    if (!confirm('Are you sure you want to delete this retention policy?')) return;
    
    try {
      setError(null);
      await deleteRetentionPolicy(session.accessToken, id);
      loadPolicies();
    } catch (err) {
      console.error('Error deleting retention policy:', err);
      setError('Failed to delete retention policy');
    }
  };

  // Trigger cleanup
  const handleTriggerCleanup = async (resourceType: string) => {
    if (!session?.accessToken) return;
    
    if (!confirm(`Are you sure you want to trigger cleanup for ${resourceType}?`)) return;
    
    try {
      setError(null);
      await triggerCleanup(session.accessToken, resourceType);
      loadStatus();
    } catch (err) {
      console.error('Error triggering cleanup:', err);
      setError('Failed to trigger cleanup');
    }
  };

  // Classify data
  const handleClassifyData = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await classifyData(session.accessToken, classificationForm);
      setShowClassificationModal(false);
      setClassificationForm({
        resourceType: '',
        resourceId: '',
        sensitivity: 'PUBLIC',
        expiresAt: undefined,
        notes: ''
      });
      loadClassifications();
    } catch (err) {
      console.error('Error classifying data:', err);
      setError('Failed to classify data');
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await createBackup(session.accessToken, backupForm);
      setShowBackupModal(false);
      setBackupForm({
        backupType: 'database',
        notes: ''
      });
      loadBackups();
    } catch (err) {
      console.error('Error creating backup:', err);
      setError('Failed to create backup');
    }
  };

  // Create classification rule
  const handleCreateRule = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await createClassificationRule(session.accessToken, ruleForm);
      setShowRuleModal(false);
      setRuleForm({
        name: '',
        description: '',
        pattern: '',
        resourceType: '',
        sensitivity: 'PUBLIC',
        priority: 0,
        isActive: true
      });
      loadRules();
    } catch (err) {
      console.error('Error creating classification rule:', err);
      setError('Failed to create classification rule');
    }
  };

  // Update classification rule
  const handleUpdateRule = async () => {
    if (!session?.accessToken || !editingRule) return;
    
    try {
      setError(null);
      await updateClassificationRule(session.accessToken, editingRule.id, ruleForm);
      setShowRuleModal(false);
      setEditingRule(null);
      setRuleForm({
        name: '',
        description: '',
        pattern: '',
        resourceType: '',
        sensitivity: 'PUBLIC',
        priority: 0,
        isActive: true
      });
      loadRules();
    } catch (err) {
      console.error('Error updating classification rule:', err);
      setError('Failed to update classification rule');
    }
  };

  // Delete classification rule
  const handleDeleteRule = async (id: string) => {
    if (!session?.accessToken) return;
    
    if (!confirm('Are you sure you want to delete this classification rule?')) return;
    
    try {
      setError(null);
      await deleteClassificationRule(session.accessToken, id);
      loadRules();
    } catch (err) {
      console.error('Error deleting classification rule:', err);
      setError('Failed to delete classification rule');
    }
  };

  // Create classification template
  const handleCreateTemplate = async () => {
    if (!session?.accessToken) return;
    
    try {
      setError(null);
      await createClassificationTemplate(session.accessToken, templateForm);
      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        description: '',
        sensitivity: 'PUBLIC',
        expiresIn: undefined,
        notes: ''
      });
      loadTemplates();
    } catch (err) {
      console.error('Error creating classification template:', err);
      setError('Failed to create classification template');
    }
  };

  // Bulk classify data
  const handleBulkClassify = async () => {
    if (!session?.accessToken || bulkItems.length === 0) return;
    
    try {
      setError(null);
      const data: BulkClassificationRequest = {
        items: bulkItems,
        sensitivity: bulkForm.sensitivity,
        expiresAt: bulkForm.expiresAt || undefined,
        notes: bulkForm.notes || undefined
      };
      
      const response = await bulkClassifyData(session.accessToken, data);
      setShowBulkModal(false);
      setBulkItems([]);
      setBulkForm({
        sensitivity: 'PUBLIC',
        expiresAt: '',
        notes: ''
      });
      loadClassifications();
      
      // Show results
      alert(`Bulk classification completed: ${response.data.successfulCount} successful, ${response.data.failedCount} failed`);
    } catch (err) {
      console.error('Error bulk classifying data:', err);
      setError('Failed to bulk classify data');
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (!session?.accessToken) return;
    
    switch (activeTab) {
      case 'policies':
        loadPolicies();
        break;
      case 'status':
        loadStatus();
        break;
      case 'classifications':
        loadClassifications();
        break;
      case 'backups':
        loadBackups();
        break;
      case 'rules':
        loadRules();
        break;
      case 'templates':
        loadTemplates();
        break;
      case 'expiring':
        loadExpiringClassifications();
        break;
    }
  }, [activeTab, session?.accessToken]);

  // Open policy modal for editing
  const openEditPolicy = (policy: RetentionPolicy) => {
    setEditingPolicy(policy);
    setPolicyForm({
      name: policy.name,
      description: policy.description || '',
      resourceType: policy.resourceType,
      retentionPeriod: policy.retentionPeriod,
      archiveAfter: policy.archiveAfter || undefined,
      deleteAfter: policy.deleteAfter || undefined,
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
      resourceType: '',
      retentionPeriod: 365,
      archiveAfter: undefined,
      deleteAfter: undefined,
      isActive: true
    });
    setShowPolicyModal(true);
  };

  // Open rule modal for editing
  const openEditRule = (rule: ClassificationRule) => {
    setEditingRule(rule);
    setRuleForm({
      name: rule.name,
      description: rule.description || '',
      pattern: rule.pattern,
      resourceType: rule.resourceType,
      sensitivity: rule.sensitivity,
      priority: rule.priority,
      isActive: rule.isActive
    });
    setShowRuleModal(true);
  };

  // Open rule modal for creating
  const openCreateRule = () => {
    setEditingRule(null);
    setRuleForm({
      name: '',
      description: '',
      pattern: '',
      resourceType: '',
      sensitivity: 'PUBLIC',
      priority: 0,
      isActive: true
    });
    setShowRuleModal(true);
  };

  // Add item to bulk classification
  const addBulkItem = (resourceType: string, resourceId: string) => {
    setBulkItems([...bulkItems, { resourceType, resourceId }]);
  };

  // Remove item from bulk classification
  const removeBulkItem = (index: number) => {
    setBulkItems(bulkItems.filter((_, i) => i !== index));
  };

  const getSensitivityColor = (sensitivity: string) => {
    switch (sensitivity) {
      case 'PUBLIC': return 'green';
      case 'INTERNAL': return 'blue';
      case 'CONFIDENTIAL': return 'yellow';
      case 'RESTRICTED': return 'red';
      default: return 'gray';
    }
  };

  const getBackupStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'failed': return 'red';
      case 'verifying': return 'yellow';
      case 'restoring': return 'blue';
      default: return 'gray';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Data Retention & Governance</h2>
        <div className="flex space-x-2">
          <Button onClick={() => setActiveTab('policies')} variant={activeTab === 'policies' ? 'primary' : 'secondary'}>
            Policies
          </Button>
          <Button onClick={() => setActiveTab('status')} variant={activeTab === 'status' ? 'primary' : 'secondary'}>
            Status
          </Button>
          <Button onClick={() => setActiveTab('classifications')} variant={activeTab === 'classifications' ? 'primary' : 'secondary'}>
            Classifications
          </Button>
          <Button onClick={() => setActiveTab('rules')} variant={activeTab === 'rules' ? 'primary' : 'secondary'}>
            Rules
          </Button>
          <Button onClick={() => setActiveTab('templates')} variant={activeTab === 'templates' ? 'primary' : 'secondary'}>
            Templates
          </Button>
          <Button onClick={() => setActiveTab('bulk')} variant={activeTab === 'bulk' ? 'primary' : 'secondary'}>
            Bulk
          </Button>
          <Button onClick={() => setActiveTab('expiring')} variant={activeTab === 'expiring' ? 'primary' : 'secondary'}>
            Expiring
          </Button>
          <Button onClick={() => setActiveTab('backups')} variant={activeTab === 'backups' ? 'primary' : 'secondary'}>
            Backups
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Retention Policies</h3>
            <Button onClick={openCreatePolicy}>
              Create Policy
            </Button>
          </div>
          
          {loadingPolicies ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {policies.map((policy) => (
                <Card key={policy.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{policy.name}</h4>
                        <Badge color={policy.isActive ? 'green' : 'gray'}>
                          {policy.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{policy.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Resource Type:</span> {policy.resourceType}
                        </div>
                        <div>
                          <span className="font-medium">Retention Period:</span> {policy.retentionPeriod} days
                        </div>
                        {policy.archiveAfter && (
                          <div>
                            <span className="font-medium">Archive After:</span> {policy.archiveAfter} days
                          </div>
                        )}
                        {policy.deleteAfter && (
                          <div>
                            <span className="font-medium">Delete After:</span> {policy.deleteAfter} days
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditPolicy(policy)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDeletePolicy(policy.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Status Tab */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Retention Status</h3>
          
          {loadingStatus ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : status ? (
            <div className="grid gap-6">
              {/* Resource Counts */}
              <Card className="p-4">
                <h4 className="font-semibold mb-4">Resource Counts</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{status.resourceCounts.files}</div>
                    <div className="text-sm text-gray-600">Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{status.resourceCounts.messages}</div>
                    <div className="text-sm text-gray-600">Messages</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{status.resourceCounts.conversations}</div>
                    <div className="text-sm text-gray-600">Conversations</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{status.resourceCounts.auditLogs}</div>
                    <div className="text-sm text-gray-600">Audit Logs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{status.resourceCounts.classifications}</div>
                    <div className="text-sm text-gray-600">Classifications</div>
                  </div>
                </div>
              </Card>

              {/* Active Policies */}
              <Card className="p-4">
                <h4 className="font-semibold mb-4">Active Policies</h4>
                <div className="space-y-2">
                  {status.policies.filter(p => p.isActive).map((policy) => (
                    <div key={policy.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{policy.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({policy.resourceType})</span>
                      </div>
                      <Button size="sm" onClick={() => handleTriggerCleanup(policy.resourceType)}>
                        Cleanup
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No retention status available
            </div>
          )}
        </div>
      )}

      {/* Classifications Tab */}
      {activeTab === 'classifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Data Classifications</h3>
            <Button onClick={() => setShowClassificationModal(true)}>
              Classify Data
            </Button>
          </div>
          
          {loadingClassifications ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {classifications.map((classification) => (
                <Card key={classification.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{classification.resourceType}</span>
                        <Badge color={getSensitivityColor(classification.sensitivity)}>
                          {classification.sensitivity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">ID: {classification.resourceId}</p>
                      {classification.notes && (
                        <p className="text-sm text-gray-600 mb-2">{classification.notes}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Classified: {new Date(classification.classifiedAt).toLocaleDateString()}
                        {classification.expiresAt && (
                          <span className="ml-4">Expires: {new Date(classification.expiresAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Backup Records</h3>
            <Button onClick={() => setShowBackupModal(true)}>
              Create Backup
            </Button>
          </div>
          
          {loadingBackups ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {backups.map((backup) => (
                <Card key={backup.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{backup.backupType}</span>
                        <Badge color={getBackupStatusColor(backup.status)}>
                          {backup.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{backup.backupPath}</p>
                      {backup.notes && (
                        <p className="text-sm text-gray-600 mb-2">{backup.notes}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Created: {new Date(backup.createdAt).toLocaleDateString()}
                        <span className="ml-4">Size: {(backup.backupSize / 1024 / 1024).toFixed(2)} MB</span>
                        <span className="ml-4">Expires: {new Date(backup.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Classification Rules</h3>
            <Button onClick={openCreateRule}>
              Create Rule
            </Button>
          </div>
          
          {loadingRules ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {rules.map((rule) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{rule.name}</h4>
                        <Badge color={rule.isActive ? 'green' : 'gray'}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge color="blue">Priority: {rule.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Resource Type:</span> {rule.resourceType}
                        </div>
                        <div>
                          <span className="font-medium">Sensitivity:</span> {rule.sensitivity}
                        </div>
                        <div>
                          <span className="font-medium">Pattern:</span> <code className="bg-gray-100 px-1 rounded">{rule.pattern}</code>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary" onClick={() => openEditRule(rule)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => handleDeleteRule(rule.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Classification Templates</h3>
            <Button onClick={() => setShowTemplateModal(true)}>
              Create Template
            </Button>
          </div>
          
          {loadingTemplates ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((template) => (
                <Card key={template.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge color={getSensitivityColor(template.sensitivity)}>
                          {template.sensitivity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      {template.notes && (
                        <p className="text-sm text-gray-600 mb-2">{template.notes}</p>
                      )}
                      <div className="text-sm text-gray-500">
                        {template.expiresIn ? `Expires in ${template.expiresIn} days` : 'No expiration'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bulk Classification Tab */}
      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Bulk Classification</h3>
            <Button onClick={() => setShowBulkModal(true)} disabled={bulkItems.length === 0}>
              Classify Items ({bulkItems.length})
            </Button>
          </div>
          
          <Card className="p-4">
            <h4 className="font-semibold mb-4">Selected Items</h4>
            {bulkItems.length === 0 ? (
              <p className="text-gray-500">No items selected for bulk classification</p>
            ) : (
              <div className="space-y-2">
                {bulkItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{item.resourceType}: {item.resourceId}</span>
                    <Button size="sm" variant="secondary" onClick={() => removeBulkItem(index)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <h4 className="font-semibold mb-4">Quick Add Items</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="file">File</option>
                  <option value="message">Message</option>
                  <option value="conversation">Conversation</option>
                  <option value="dashboard">Dashboard</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
                <input
                  type="text"
                  placeholder="Enter resource ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
            <Button className="mt-2" onClick={() => addBulkItem('file', 'sample-file-id')}>
              Add Sample Item
            </Button>
          </Card>
        </div>
      )}

      {/* Expiring Classifications Tab */}
      {activeTab === 'expiring' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Expiring Classifications (Next 30 Days)</h3>
          
          {loadingExpiring ? (
            <div className="flex justify-center py-8">
              <Spinner size={32} />
            </div>
          ) : (
            <div className="grid gap-4">
              {expiringClassifications.map((classification) => (
                <Card key={classification.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{classification.resourceType}</span>
                        <Badge color={getSensitivityColor(classification.sensitivity)}>
                          {classification.sensitivity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">ID: {classification.resourceId}</p>
                      {classification.notes && (
                        <p className="text-sm text-gray-600 mb-2">{classification.notes}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Expires: {classification.expiresAt ? new Date(classification.expiresAt).toLocaleDateString() : 'No expiration'}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Policy Modal */}
      <Modal
        open={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title={editingPolicy ? 'Edit Retention Policy' : 'Create Retention Policy'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={policyForm.name}
              onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={policyForm.description}
              onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={policyForm.resourceType}
              onChange={(e) => setPolicyForm({ ...policyForm, resourceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Resource Type</option>
              <option value="file">File</option>
              <option value="message">Message</option>
              <option value="conversation">Conversation</option>
              <option value="auditLog">Audit Log</option>
              <option value="dashboard">Dashboard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Retention Period (days)</label>
            <input
              type="number"
              value={policyForm.retentionPeriod}
              onChange={(e) => setPolicyForm({ ...policyForm, retentionPeriod: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Archive After (days)</label>
              <input
                type="number"
                value={policyForm.archiveAfter || ''}
                onChange={(e) => setPolicyForm({ ...policyForm, archiveAfter: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Delete After (days)</label>
              <input
                type="number"
                value={policyForm.deleteAfter || ''}
                onChange={(e) => setPolicyForm({ ...policyForm, deleteAfter: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={policyForm.isActive}
              onChange={(e) => setPolicyForm({ ...policyForm, isActive: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>
              Cancel
            </Button>
            <Button onClick={editingPolicy ? handleUpdatePolicy : handleCreatePolicy}>
              {editingPolicy ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Classification Modal */}
      <Modal
        open={showClassificationModal}
        onClose={() => setShowClassificationModal(false)}
        title="Classify Data"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={classificationForm.resourceType}
              onChange={(e) => setClassificationForm({ ...classificationForm, resourceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Resource Type</option>
              <option value="file">File</option>
              <option value="message">Message</option>
              <option value="conversation">Conversation</option>
              <option value="dashboard">Dashboard</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource ID</label>
            <input
              type="text"
              value={classificationForm.resourceId}
              onChange={(e) => setClassificationForm({ ...classificationForm, resourceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity</label>
            <select
              value={classificationForm.sensitivity}
              onChange={(e) => setClassificationForm({ ...classificationForm, sensitivity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={classificationForm.expiresAt || ''}
              onChange={(e) => setClassificationForm({ ...classificationForm, expiresAt: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={classificationForm.notes}
              onChange={(e) => setClassificationForm({ ...classificationForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowClassificationModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleClassifyData}>
              Classify
            </Button>
          </div>
        </div>
      </Modal>

      {/* Backup Modal */}
      <Modal
        open={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Create Backup"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Backup Type</label>
            <select
              value={backupForm.backupType}
              onChange={(e) => setBackupForm({ ...backupForm, backupType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="database">Database</option>
              <option value="files">Files</option>
              <option value="full">Full System</option>
              <option value="incremental">Incremental</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={backupForm.notes}
              onChange={(e) => setBackupForm({ ...backupForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowBackupModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBackup}>
              Create Backup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Rule Modal */}
      <Modal
        open={showRuleModal}
        onClose={() => setShowRuleModal(false)}
        title={editingRule ? 'Edit Classification Rule' : 'Create Classification Rule'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={ruleForm.name}
              onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={ruleForm.description}
              onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pattern (Regex)</label>
            <input
              type="text"
              value={ruleForm.pattern}
              onChange={(e) => setRuleForm({ ...ruleForm, pattern: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter regex pattern"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
              <select
                value={ruleForm.resourceType}
                onChange={(e) => setRuleForm({ ...ruleForm, resourceType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Resource Type</option>
                <option value="file">File</option>
                <option value="message">Message</option>
                <option value="conversation">Conversation</option>
                <option value="dashboard">Dashboard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity</label>
              <select
                value={ruleForm.sensitivity}
                onChange={(e) => setRuleForm({ ...ruleForm, sensitivity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <input
                type="number"
                value={ruleForm.priority}
                onChange={(e) => setRuleForm({ ...ruleForm, priority: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center mt-6">
              <input
                type="checkbox"
                checked={ruleForm.isActive}
                onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                className="mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowRuleModal(false)}>
              Cancel
            </Button>
            <Button onClick={editingRule ? handleUpdateRule : handleCreateRule}>
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Template Modal */}
      <Modal
        open={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        title="Create Classification Template"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              type="text"
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={templateForm.description}
              onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity</label>
              <select
                value={templateForm.sensitivity}
                onChange={(e) => setTemplateForm({ ...templateForm, sensitivity: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires In (days)</label>
              <input
                type="number"
                value={templateForm.expiresIn || ''}
                onChange={(e) => setTemplateForm({ ...templateForm, expiresIn: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Leave empty for no expiration"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={templateForm.notes}
              onChange={(e) => setTemplateForm({ ...templateForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate}>
              Create Template
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Classification Modal */}
      <Modal
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Classify Items"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sensitivity</label>
            <select
              value={bulkForm.sensitivity}
              onChange={(e) => setBulkForm({ ...bulkForm, sensitivity: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (optional)</label>
            <input
              type="datetime-local"
              value={bulkForm.expiresAt}
              onChange={(e) => setBulkForm({ ...bulkForm, expiresAt: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={bulkForm.notes}
              onChange={(e) => setBulkForm({ ...bulkForm, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>
          <div className="text-sm text-gray-600">
            This will classify {bulkItems.length} items as {bulkForm.sensitivity}
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkClassify}>
              Classify Items
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 