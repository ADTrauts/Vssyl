import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, Plug, GitBranch, Database,
  Cloud, Globe, Shield, Key,
  X, Check, Plus, Minus, RefreshCw,
  AlertTriangle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface SearchIntegrationProps {
  searchId: string;
  onUpdate: (updates: any) => void;
}

interface Integration {
  id: string;
  name: string;
  type: 'git' | 'database' | 'cloud' | 'api';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  settings: Record<string, any>;
}

interface GitIntegration extends Integration {
  type: 'git';
  settings: {
    repository: string;
    branch: string;
    token: string;
    autoSync: boolean;
    syncInterval: number;
  };
}

interface DatabaseIntegration extends Integration {
  type: 'database';
  settings: {
    type: 'postgres' | 'mysql' | 'mongodb';
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    autoSync: boolean;
    syncInterval: number;
  };
}

interface CloudIntegration extends Integration {
  type: 'cloud';
  settings: {
    provider: 'aws' | 'gcp' | 'azure';
    bucket: string;
    region: string;
    accessKey: string;
    secretKey: string;
    autoSync: boolean;
    syncInterval: number;
  };
}

interface ApiIntegration extends Integration {
  type: 'api';
  settings: {
    endpoint: string;
    method: 'get' | 'post';
    headers: Record<string, string>;
    body: string;
    autoSync: boolean;
    syncInterval: number;
  };
}

export function SearchIntegration({ searchId, onUpdate }: SearchIntegrationProps) {
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newIntegration, setNewIntegration] = useState<Partial<Integration>>({
    type: 'git',
    settings: {}
  });

  useEffect(() => {
    loadIntegrations();
  }, [searchId]);

  const loadIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/integrations`);
      if (!response.ok) throw new Error('Failed to load integrations');
      const data = await response.json();
      setIntegrations(data);
    } catch (error) {
      toast.error('Failed to load integrations');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/integrations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIntegration),
      });
      if (!response.ok) throw new Error('Failed to add integration');
      await loadIntegrations();
      setShowAddModal(false);
      setNewIntegration({ type: 'git', settings: {} });
      toast.success('Integration added successfully');
    } catch (error) {
      toast.error('Failed to add integration');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIntegration = async (id: string, updates: Partial<Integration>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/integrations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update integration');
      await loadIntegrations();
      toast.success('Integration updated successfully');
    } catch (error) {
      toast.error('Failed to update integration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/integrations/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete integration');
      await loadIntegrations();
      toast.success('Integration deleted successfully');
    } catch (error) {
      toast.error('Failed to delete integration');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncIntegration = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/integrations/${id}/sync`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to sync integration');
      await loadIntegrations();
      toast.success('Integration synced successfully');
    } catch (error) {
      toast.error('Failed to sync integration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Search Integrations</h2>
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Integration
        </Button>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => (
          <Card key={integration.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {integration.type === 'git' && <GitBranch className="h-4 w-4" />}
                  {integration.type === 'database' && <Database className="h-4 w-4" />}
                  {integration.type === 'cloud' && <Cloud className="h-4 w-4" />}
                  {integration.type === 'api' && <Globe className="h-4 w-4" />}
                  <h3 className="font-medium">{integration.name}</h3>
                  <Badge
                    variant={
                      integration.status === 'connected'
                        ? 'success'
                        : integration.status === 'error'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSyncIntegration(integration.id)}
                    disabled={loading}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteIntegration(integration.id)}
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Auto Sync</Label>
                  <Switch
                    checked={integration.settings.autoSync}
                    onCheckedChange={(checked) =>
                      handleUpdateIntegration(integration.id, {
                        settings: {
                          ...integration.settings,
                          autoSync: checked,
                        },
                      })
                    }
                  />
                </div>

                {integration.settings.autoSync && (
                  <div className="space-y-2">
                    <Label>Sync Interval (minutes)</Label>
                    <Select
                      value={integration.settings.syncInterval.toString()}
                      onValueChange={(value) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            syncInterval: parseInt(value),
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">24 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {integration.type === 'git' && (
                  <div className="space-y-2">
                    <Label>Repository</Label>
                    <Input
                      value={integration.settings.repository}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            repository: e.target.value,
                          },
                        })
                      }
                    />
                    <Label>Branch</Label>
                    <Input
                      value={integration.settings.branch}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            branch: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {integration.type === 'database' && (
                  <div className="space-y-2">
                    <Label>Database Type</Label>
                    <Select
                      value={integration.settings.type}
                      onValueChange={(value) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            type: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="postgres">PostgreSQL</SelectItem>
                        <SelectItem value="mysql">MySQL</SelectItem>
                        <SelectItem value="mongodb">MongoDB</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label>Host</Label>
                    <Input
                      value={integration.settings.host}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            host: e.target.value,
                          },
                        })
                      }
                    />
                    <Label>Port</Label>
                    <Input
                      type="number"
                      value={integration.settings.port}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            port: parseInt(e.target.value),
                          },
                        })
                      }
                    />
                    <Label>Database</Label>
                    <Input
                      value={integration.settings.database}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            database: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {integration.type === 'cloud' && (
                  <div className="space-y-2">
                    <Label>Provider</Label>
                    <Select
                      value={integration.settings.provider}
                      onValueChange={(value) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            provider: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aws">AWS</SelectItem>
                        <SelectItem value="gcp">Google Cloud</SelectItem>
                        <SelectItem value="azure">Azure</SelectItem>
                      </SelectContent>
                    </Select>
                    <Label>Bucket</Label>
                    <Input
                      value={integration.settings.bucket}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            bucket: e.target.value,
                          },
                        })
                      }
                    />
                    <Label>Region</Label>
                    <Input
                      value={integration.settings.region}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            region: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                )}

                {integration.type === 'api' && (
                  <div className="space-y-2">
                    <Label>Endpoint</Label>
                    <Input
                      value={integration.settings.endpoint}
                      onChange={(e) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            endpoint: e.target.value,
                          },
                        })
                      }
                    />
                    <Label>Method</Label>
                    <Select
                      value={integration.settings.method}
                      onValueChange={(value) =>
                        handleUpdateIntegration(integration.id, {
                          settings: {
                            ...integration.settings,
                            method: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="get">GET</SelectItem>
                        <SelectItem value="post">POST</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Security Note</AlertTitle>
                  <AlertDescription>
                    Sensitive information like tokens and credentials are stored securely and never displayed.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Add Integration</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newIntegration.name || ''}
                  onChange={(e) =>
                    setNewIntegration({
                      ...newIntegration,
                      name: e.target.value,
                    })
                  }
                  placeholder="Integration name"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newIntegration.type}
                  onValueChange={(value: Integration['type']) =>
                    setNewIntegration({
                      ...newIntegration,
                      type: value,
                      settings: {},
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="git">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        Git
                      </div>
                    </SelectItem>
                    <SelectItem value="database">
                      <div className="flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Database
                      </div>
                    </SelectItem>
                    <SelectItem value="cloud">
                      <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        Cloud Storage
                      </div>
                    </SelectItem>
                    <SelectItem value="api">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        API
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddIntegration}
                  disabled={!newIntegration.name || !newIntegration.type || loading}
                >
                  Add Integration
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 