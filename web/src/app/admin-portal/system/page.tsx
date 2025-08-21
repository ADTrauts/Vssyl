'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert, Spinner, Modal, Input } from 'shared/components';
import { 
  Server, 
  Settings, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Upload,
  Wrench,
  Shield,
  Clock,
  HardDrive,
  Network,
  Cpu,
  Zap
} from 'lucide-react';
import { adminApiService } from '../../../lib/adminApiService';

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: string;
  responseTime: number;
  activeConnections: number;
  errorRate: number;
}

interface SystemConfig {
  id: string;
  configKey: string;
  configValue: any;
  description?: string;
  updatedBy: string;
  updatedAt: string;
}

interface BackupStatus {
  lastBackup: string;
  nextBackup: string;
  backupSize: string;
  status: 'success' | 'failed' | 'in_progress';
  retentionDays: number;
}

interface MaintenanceMode {
  enabled: boolean;
  message: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export default function SystemPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [maintenanceMode, setMaintenanceMode] = useState<MaintenanceMode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [editingConfig, setEditingConfig] = useState<string | null>(null);
  const [configValue, setConfigValue] = useState<string>('');

  useEffect(() => {
    loadSystemData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadSystemData = async () => {
    try {
      setLoading(true);
      const [metricsRes, configsRes, backupRes, maintenanceRes] = await Promise.all([
        adminApiService.getSystemHealth(),
        adminApiService.getSystemConfig(),
        adminApiService.getBackupStatus(),
        adminApiService.getMaintenanceMode()
      ]);

      if (metricsRes.error) {
        setError(metricsRes.error);
        return;
      }

      setSystemMetrics((metricsRes.data as any) ?? null);
      setSystemConfigs((configsRes.data as any[]) ?? []);
      setBackupStatus(backupRes.data as BackupStatus);
      setMaintenanceMode(maintenanceRes.data as MaintenanceMode);
      setError(null);
    } catch (err) {
      setError('Failed to load system data');
      console.error('System error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSystemConfig = async (configKey: string, value: any) => {
    try {
      const response = await adminApiService.updateSystemConfig(configKey, value, 'Updated via admin panel');
      if (response.error) {
        setError(response.error);
        return;
      }

      setEditingConfig(null);
      setConfigValue('');
      loadSystemData();
    } catch (err) {
      setError('Failed to update system configuration');
    }
  };

  const toggleMaintenanceMode = async (enabled: boolean, message?: string) => {
    try {
      const response = await adminApiService.setMaintenanceMode(enabled, message);
      if (response.error) {
        setError(response.error);
        return;
      }

      loadSystemData();
    } catch (err) {
      setError('Failed to toggle maintenance mode');
    }
  };

  const createBackup = async () => {
    try {
      const response = await adminApiService.createBackup();
      if (response.error) {
        setError(response.error);
        return;
      }

      loadSystemData();
    } catch (err) {
      setError('Failed to create backup');
    }
  };

  const getHealthColor = (value: number) => {
    if (value < 50) return 'text-green-600';
    if (value < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getHealthIcon = (value: number) => {
    if (value < 50) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (value < 80) return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  if (loading && !systemMetrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
            <p className="text-gray-600 mt-2">Monitor and manage system health and configuration</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
          <p className="text-gray-600 mt-2">Monitor and manage system health and configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
              autoRefresh 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </span>
          </button>
          <button
            onClick={loadSystemData}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* System Health */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemMetrics.cpu)}`}>
                  {systemMetrics.cpu}%
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getHealthColor(systemMetrics.cpu).replace('text-', 'bg-')}`}
                  style={{ width: `${systemMetrics.cpu}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemMetrics.memory)}`}>
                  {systemMetrics.memory}%
                </p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <Database className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getHealthColor(systemMetrics.memory).replace('text-', 'bg-')}`}
                  style={{ width: `${systemMetrics.memory}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Disk Usage</p>
                <p className={`text-2xl font-bold ${getHealthColor(systemMetrics.disk)}`}>
                  {systemMetrics.disk}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${getHealthColor(systemMetrics.disk).replace('text-', 'bg-')}`}
                  style={{ width: `${systemMetrics.disk}%` }}
                ></div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Network</p>
                <p className="text-2xl font-bold text-blue-600">
                  {systemMetrics.network} Mbps
                </p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Network className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* System Status */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-green-600">{systemMetrics.uptime}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold text-blue-600">{systemMetrics.responseTime}ms</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold text-purple-600">{systemMetrics.activeConnections}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Network className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className={`text-2xl font-bold ${systemMetrics.errorRate < 1 ? 'text-green-600' : 'text-red-600'}`}>
                  {systemMetrics.errorRate}%
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Maintenance Mode */}
      {maintenanceMode && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Maintenance Mode</h3>
            <div className="flex items-center space-x-2">
              {maintenanceMode.enabled ? (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                  MAINTENANCE ACTIVE
                </span>
              ) : (
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  SYSTEM ONLINE
                </span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {maintenanceMode.enabled && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Maintenance Mode Active</span>
                </div>
                <p className="text-sm text-yellow-700">{maintenanceMode.message}</p>
                {maintenanceMode.scheduledEnd && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Scheduled to end: {new Date(maintenanceMode.scheduledEnd).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleMaintenanceMode(!maintenanceMode.enabled)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  maintenanceMode.enabled
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {maintenanceMode.enabled ? 'Disable Maintenance' : 'Enable Maintenance'}
                </span>
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Backup Status */}
      {backupStatus && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Backup Status</h3>
            <button
              onClick={createBackup}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Create Backup</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Backup:</span>
                <span className="text-sm font-medium">{new Date(backupStatus.lastBackup).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Next Backup:</span>
                <span className="text-sm font-medium">{new Date(backupStatus.nextBackup).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Backup Size:</span>
                <span className="text-sm font-medium">{backupStatus.backupSize}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  backupStatus.status === 'success' ? 'bg-green-100 text-green-700' :
                  backupStatus.status === 'failed' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {backupStatus.status.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Retention:</span>
                <span className="text-sm font-medium">{backupStatus.retentionDays} days</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* System Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">System Configuration</h3>
          <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Import Config</span>
          </button>
        </div>

        <div className="space-y-4">
          {systemConfigs.map((config) => (
            <div key={config.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{config.configKey}</h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      {config.description || 'No description'}
                    </span>
                  </div>
                  
                  {editingConfig === config.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={configValue}
                        onChange={(e) => setConfigValue(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        placeholder="Enter new value"
                      />
                      <button
                        onClick={() => updateSystemConfig(config.configKey, configValue)}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingConfig(null)}
                        className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          Current Value: <span className="font-medium">{JSON.stringify(config.configValue)}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Updated by {config.updatedBy} on {new Date(config.updatedAt).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setEditingConfig(config.id);
                          setConfigValue(JSON.stringify(config.configValue));
                        }}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
} 