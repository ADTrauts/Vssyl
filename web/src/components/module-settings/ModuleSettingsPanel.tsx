'use client';

import React, { useState } from 'react';
import { Card, Button, Tabs } from 'shared/components';
import { Settings, Save, RotateCcw, Shield, Users, Database, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ModuleSettingsPanelProps {
  moduleId: string;
  moduleName: string;
  moduleType: 'drive' | 'chat' | 'calendar' | 'analytics' | 'members' | 'admin';
  currentConfig: any;
  onSave: (config: any) => Promise<void>;
  onClose: () => void;
}

interface ModuleConfig {
  permissions: string[];
  storage?: {
    quota: number;
    compression: boolean;
    backup: boolean;
  };
  notifications?: {
    email: boolean;
    push: boolean;
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  security?: {
    encryption: boolean;
    auditLog: boolean;
    accessControl: 'strict' | 'moderate' | 'open';
  };
  integrations?: {
    externalServices: string[];
    webhooks: boolean;
    apiAccess: boolean;
  };
}

export default function ModuleSettingsPanel({
  moduleId,
  moduleName,
  moduleType,
  currentConfig,
  onSave,
  onClose
}: ModuleSettingsPanelProps) {
  const [config, setConfig] = useState<ModuleConfig>(currentConfig || {});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(config);
      toast.success(`${moduleName} settings saved successfully`);
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig(currentConfig || {});
    toast.success('Settings reset to previous values');
  };

  const updateConfig = (path: string, value: any) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current: any = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  const getModuleIcon = () => {
    switch (moduleType) {
      case 'drive':
        return <Database className="w-5 h-5" />;
      case 'chat':
        return <Users className="w-5 h-5" />;
      case 'calendar':
        return <Bell className="w-5 h-5" />;
      case 'analytics':
        return <Database className="w-5 h-5" />;
      case 'members':
        return <Users className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              {getModuleIcon()}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {moduleName} Settings
              </h2>
              <p className="text-sm text-gray-600">
                Configure {moduleName.toLowerCase()} module settings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <Tabs
            tabs={[
              { label: 'General', key: 'general' },
              { label: 'Permissions', key: 'permissions' },
              { label: 'Security', key: 'security' },
              { label: 'Integrations', key: 'integrations' }
            ]}
            value={activeTab}
            onChange={setActiveTab}
          >
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">General Configuration</h3>
                
                  {/* Module-specific general settings */}
                  {moduleType === 'drive' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Storage Quota (GB)
                        </label>
                        <input
                          type="number"
                          value={config.storage?.quota || 10}
                          onChange={(e) => updateConfig('storage.quota', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="1000"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="compression"
                          checked={config.storage?.compression || false}
                          onChange={(e) => updateConfig('storage.compression', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="compression" className="text-sm text-gray-700">
                          Enable file compression
                        </label>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="backup"
                          checked={config.storage?.backup || false}
                          onChange={(e) => updateConfig('storage.backup', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="backup" className="text-sm text-gray-700">
                          Enable automatic backups
                        </label>
                      </div>
                    </div>
                  )}

                  {moduleType === 'chat' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message Retention (days)
                        </label>
                        <input
                          type="number"
                          value={30}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="1"
                          max="365"
                        />
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="read-receipts"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="read-receipts" className="text-sm text-gray-700">
                          Enable read receipts
                        </label>
                      </div>
                    </div>
                  )}

                  {moduleType === 'calendar' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Default Event Duration (minutes)
                        </label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option value="15">15 minutes</option>
                          <option value="30" selected>30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="90">1.5 hours</option>
                        </select>
                      </div>
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id="auto-reminders"
                          defaultChecked
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="auto-reminders" className="text-sm text-gray-700">
                          Enable automatic reminders
                        </label>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Permissions Settings */}
            {activeTab === 'permissions' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Access Permissions</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Roles with Access
                      </label>
                      <div className="space-y-2">
                        {['Admin', 'Manager', 'Employee', 'Guest'].map((role) => (
                          <div key={role} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`role-${role.toLowerCase()}`}
                              defaultChecked={['Admin', 'Manager'].includes(role)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`role-${role.toLowerCase()}`} className="text-sm text-gray-700">
                              {role}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Department Access
                      </label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="all">All Departments</option>
                        <option value="specific">Specific Departments Only</option>
                        <option value="none">No Department Access</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Security Configuration</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="encryption"
                        checked={config.security?.encryption || false}
                        onChange={(e) => updateConfig('security.encryption', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="encryption" className="text-sm text-gray-700">
                        Enable end-to-end encryption
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="audit-log"
                        checked={config.security?.auditLog || false}
                        onChange={(e) => updateConfig('security.auditLog', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="audit-log" className="text-sm text-gray-700">
                        Enable audit logging
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Access Control Level
                      </label>
                      <select
                        value={config.security?.accessControl || 'moderate'}
                        onChange={(e) => updateConfig('security.accessControl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="strict">Strict (Admin approval required)</option>
                        <option value="moderate">Moderate (Role-based access)</option>
                        <option value="open">Open (Self-service access)</option>
                      </select>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Integrations Settings */}
            {activeTab === 'integrations' && (
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">External Integrations</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="webhooks"
                        checked={config.integrations?.webhooks || false}
                        onChange={(e) => updateConfig('integrations.webhooks', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="webhooks" className="text-sm text-gray-700">
                        Enable webhook notifications
                      </label>
                    </div>

                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="api-access"
                        checked={config.integrations?.apiAccess || false}
                        onChange={(e) => updateConfig('integrations.apiAccess', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="api-access" className="text-sm text-gray-700">
                        Enable API access
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Connected Services
                      </label>
                      <div className="space-y-2">
                        {['Slack', 'Microsoft Teams', 'Google Workspace', 'Zoom'].map((service) => (
                          <div key={service} className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`service-${service.toLowerCase().replace(' ', '-')}`}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor={`service-${service.toLowerCase().replace(' ', '-')}`} className="text-sm text-gray-700">
                              {service}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </Tabs>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <Button variant="secondary" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
