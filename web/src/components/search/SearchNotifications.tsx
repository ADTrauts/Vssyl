import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Bell, BellOff, Check, X, Loader2,
  Mail, MessageSquare, Star, AlertTriangle,
  Clock, Calendar, Repeat, Settings, Plus, Search, Users, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatDistanceToNow } from 'date-fns';

interface SearchNotificationsProps {
  searchId: string;
  query: string;
  filters: any;
}

interface Notification {
  id: string;
  type: 'new_result' | 'collaborator' | 'comment' | 'share' | 'alert';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: any;
}

interface Alert {
  id: string;
  type: 'query' | 'result' | 'collaborator' | 'system';
  condition: string;
  frequency: 'realtime' | 'daily' | 'weekly';
  enabled: boolean;
  lastTriggered?: string;
}

export function SearchNotifications({ searchId, query, filters }: SearchNotificationsProps) {
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState({
    emailNotifications: false,
    desktopNotifications: true,
    soundEnabled: true,
    notificationFrequency: 'realtime',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  });

  useEffect(() => {
    loadNotifications();
    loadAlerts();
  }, [searchId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/notifications`);
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/alerts`);
      if (!response.ok) throw new Error('Failed to load alerts');
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/notifications/${id}/read`, {
        method: 'POST'
      });
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      toast.error('Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/notifications/${id}`, {
        method: 'DELETE'
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      toast.error('Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (type: Alert['type'], condition: string, frequency: Alert['frequency']) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, condition, frequency }),
      });
      if (!response.ok) throw new Error('Failed to create alert');
      const newAlert = await response.json();
      setAlerts(prev => [...prev, newAlert]);
      toast.success('Alert created successfully');
    } catch (error) {
      toast.error('Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAlert = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/alerts/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      setAlerts(prev => prev.map(a => 
        a.id === id ? { ...a, enabled } : a
      ));
    } catch (error) {
      toast.error('Failed to toggle alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/alerts/${id}`, {
        method: 'DELETE'
      });
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      toast.error('Failed to delete alert');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<typeof settings>) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/notification-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="notifications">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start justify-between p-3 rounded-lg ${
                    notification.read ? 'bg-gray-50' : 'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {notification.type === 'new_result' && <Star className="h-4 w-4 text-yellow-500" />}
                      {notification.type === 'collaborator' && <Users className="h-4 w-4 text-blue-500" />}
                      {notification.type === 'comment' && <MessageSquare className="h-4 w-4 text-green-500" />}
                      {notification.type === 'share' && <Share2 className="h-4 w-4 text-purple-500" />}
                      {notification.type === 'alert' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                    </div>
                    <div>
                      <p className="font-medium">{notification.title}</p>
                      <p className="text-sm text-gray-600">{notification.message}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(notification.timestamp))} ago
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Create New Alert</Label>
                <div className="flex gap-2">
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Alert type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="query">Query Alert</SelectItem>
                      <SelectItem value="result">Result Alert</SelectItem>
                      <SelectItem value="collaborator">Collaborator Alert</SelectItem>
                      <SelectItem value="system">System Alert</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Condition" />
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="realtime">Real-time</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        {alert.type === 'query' && <Search className="h-4 w-4 text-blue-500" />}
                        {alert.type === 'result' && <Star className="h-4 w-4 text-yellow-500" />}
                        {alert.type === 'collaborator' && <Users className="h-4 w-4 text-green-500" />}
                        {alert.type === 'system' && <Settings className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div>
                        <p className="font-medium">{alert.condition}</p>
                        <p className="text-sm text-gray-500">
                          {alert.frequency} • Last triggered{' '}
                          {alert.lastTriggered
                            ? formatDistanceToNow(new Date(alert.lastTriggered))
                            : 'never'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={(checked) => handleToggleAlert(alert.id, checked)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlert(alert.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notification Settings</Label>
                <div className="flex items-center justify-between">
                  <span>Email Notifications</span>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ emailNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Desktop Notifications</span>
                  <Switch
                    checked={settings.desktopNotifications}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ desktopNotifications: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Sound Alerts</span>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ soundEnabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notification Frequency</Label>
                <Select
                  value={settings.notificationFrequency}
                  onValueChange={(value) =>
                    handleSettingsUpdate({ notificationFrequency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Real-time</SelectItem>
                    <SelectItem value="daily">Daily Digest</SelectItem>
                    <SelectItem value="weekly">Weekly Summary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quiet Hours</Label>
                <div className="flex items-center justify-between">
                  <span>Enable Quiet Hours</span>
                  <Switch
                    checked={settings.quietHours.enabled}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({
                        quietHours: { ...settings.quietHours, enabled: checked },
                      })
                    }
                  />
                </div>
                {settings.quietHours.enabled && (
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) =>
                        handleSettingsUpdate({
                          quietHours: { ...settings.quietHours, start: e.target.value },
                        })
                      }
                    />
                    <Input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) =>
                        handleSettingsUpdate({
                          quietHours: { ...settings.quietHours, end: e.target.value },
                        })
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 