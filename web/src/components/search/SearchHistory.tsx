import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  History, Save, Clock, Trash2, Star,
  Filter, Search, Edit2, X, Check,
  Calendar, Tag, User, FileText, Folder,
  MessageSquare, Share2, Download, Copy,
  Sort, Help, Info, AlertCircle, Plus, Minus, MoreVertical, Trash,
  Settings, Paste
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Textarea } from '../ui/textarea';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchHistoryProps {
  searchId: string;
  query: string;
  filters: Record<string, unknown>;
  results: unknown[];
  onUpdate: (updates: Record<string, unknown>) => void;
}

interface HistoryEntry {
  id: string;
  query: string;
  filters: Record<string, unknown>;
  results: unknown[];
  timestamp: string;
  duration: number;
  user: string;
  metadata: Record<string, unknown>;
}

interface HistorySettings {
  autoSave: boolean;
  maxEntries: number;
  showMetadata: boolean;
  showDuration: boolean;
  showUser: boolean;
  defaultSort: string;
  defaultFilter: string;
  exportFormat: 'csv' | 'json' | 'excel';
}

export function SearchHistory({ 
  searchId,
  query,
  filters,
  results,
  onUpdate
}: SearchHistoryProps) {
  const [loading, setLoading] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [settings, setSettings] = useState<HistorySettings>({
    autoSave: true,
    maxEntries: 1000,
    showMetadata: true,
    showDuration: true,
    showUser: true,
    defaultSort: 'timestamp',
    defaultFilter: 'all',
    exportFormat: 'csv'
  });
  const [sortBy, setSortBy] = useState(settings.defaultSort);
  const [filterBy, setFilterBy] = useState(settings.defaultFilter);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistoryEntries = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history?sort=${sortBy}&filter=${filterBy}`);
      if (!response.ok) throw new Error('Failed to load history entries');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load history entries');
      return [];
    } finally {
      setLoading(false);
    }
  }, [searchId, sortBy, filterBy]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history/settings`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      return data;
    } catch (error) {
      toast.error('Failed to load settings');
      return {
        autoSave: true,
        maxEntries: 1000,
        showMetadata: true,
        showDuration: true,
        showUser: true,
        defaultSort: 'timestamp',
        defaultFilter: 'all',
        exportFormat: 'csv'
      };
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [historyData, settingsData] = await Promise.all([
          loadHistoryEntries(),
          loadSettings()
        ]);
        setHistoryEntries(historyData);
        setSettings(settingsData);
        setError(null);
      } catch (error) {
        console.error('Failed to initialize history data:', error);
        setError('Failed to load history data');
      }
    };
    initializeData();
  }, [loadHistoryEntries, loadSettings]);

  const handleSaveEntry = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          results,
          metadata: {}
        }),
      });
      if (!response.ok) throw new Error('Failed to save history entry');
      const updatedEntries = await loadHistoryEntries();
      setHistoryEntries(updatedEntries);
      toast.success('History entry saved successfully');
    } catch (error) {
      toast.error('Failed to save history entry');
    } finally {
      setLoading(false);
    }
  }, [searchId, query, filters, results, loadHistoryEntries]);

  const handleDeleteEntry = useCallback(async (entryId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history/${entryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete history entry');
      const updatedEntries = await loadHistoryEntries();
      setHistoryEntries(updatedEntries);
      toast.success('History entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete history entry');
    } finally {
      setLoading(false);
    }
  }, [searchId, loadHistoryEntries]);

  const handleExportData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: settings.exportFormat,
          sort: sortBy,
          filter: filterBy
        }),
      });
      if (!response.ok) throw new Error('Failed to export data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history-${searchId}-${new Date().toISOString()}.${settings.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
    } finally {
      setLoading(false);
    }
  }, [searchId, settings.exportFormat, sortBy, filterBy]);

  const handleUpdateSettings = useCallback(async (updates: Partial<HistorySettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/history/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      setSettings(prev => ({ ...prev, ...updates }));
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  }, [searchId]);

  useHotkeys('ctrl+enter, cmd+enter', () => {
    handleSaveEntry();
  }, [handleSaveEntry]);

  if (error) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-red-500">{error}</span>
          </div>
          <Button variant="outline" onClick={() => setError(null)}>
            <X className="h-4 w-4 mr-2" />
            Dismiss
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Search History</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="timestamp">Timestamp</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterBy} onValueChange={setFilterBy}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {historyEntries.map((entry) => (
          <Card key={entry.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => handleDeleteEntry(entry.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-2">
              <h3 className="font-medium">{entry.query}</h3>
              {settings.showMetadata && (
                <div className="mt-2 text-sm text-gray-500">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(entry.metadata, null, 2)}</pre>
                </div>
              )}
              {settings.showDuration && (
                <div className="mt-2 text-sm text-gray-500">
                  Duration: {entry.duration}ms
                </div>
              )}
              {settings.showUser && (
                <div className="mt-2 text-sm text-gray-500">
                  User: {entry.user}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {showSettingsModal && (
        <Card className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-[500px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">History Settings</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowSettingsModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Auto Save</Label>
                <Switch
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleUpdateSettings({ autoSave: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Metadata</Label>
                <Switch
                  checked={settings.showMetadata}
                  onCheckedChange={(checked) => handleUpdateSettings({ showMetadata: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show Duration</Label>
                <Switch
                  checked={settings.showDuration}
                  onCheckedChange={(checked) => handleUpdateSettings({ showDuration: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Show User</Label>
                <Switch
                  checked={settings.showUser}
                  onCheckedChange={(checked) => handleUpdateSettings({ showUser: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Max Entries</Label>
                <Input
                  type="number"
                  value={settings.maxEntries}
                  onChange={(e) => handleUpdateSettings({ maxEntries: parseInt(e.target.value) })}
                  className="w-[100px]"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Export Format</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value) => handleUpdateSettings({ exportFormat: value as 'csv' | 'json' | 'excel' })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
      )}
    </Card>
  );
} 