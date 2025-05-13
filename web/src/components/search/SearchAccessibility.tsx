import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Keyboard, Eye, EyeOff, Contrast, 
  Volume2, VolumeX, ZoomIn, ZoomOut,
  Settings, Check, X, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { useHotkeys } from 'react-hotkeys-hook';

interface SearchAccessibilityProps {
  searchId: string;
  onShortcutChange: (shortcuts: Shortcut[]) => void;
  onSettingsChange: (settings: AccessibilitySettings) => void;
}

interface Shortcut {
  id: string;
  name: string;
  description: string;
  key: string;
  enabled: boolean;
}

interface AccessibilitySettings {
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  soundEnabled: boolean;
  soundVolume: number;
  zoomLevel: number;
}

export function SearchAccessibility({ 
  searchId, 
  onShortcutChange,
  onSettingsChange 
}: SearchAccessibilityProps) {
  const [loading, setLoading] = useState(false);
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    reducedMotion: false,
    fontSize: 16,
    lineHeight: 1.5,
    letterSpacing: 0,
    soundEnabled: true,
    soundVolume: 50,
    zoomLevel: 100
  });

  useEffect(() => {
    loadShortcuts();
    loadSettings();
  }, [searchId]);

  const loadShortcuts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/shortcuts`);
      if (!response.ok) throw new Error('Failed to load shortcuts');
      const data = await response.json();
      setShortcuts(data);
    } catch (error) {
      toast.error('Failed to load shortcuts');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/accessibility-settings`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      setSettings(data);
      applySettings(data);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutToggle = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/shortcuts/${id}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });
      setShortcuts(prev => prev.map(s => 
        s.id === id ? { ...s, enabled } : s
      ));
      onShortcutChange(shortcuts.map(s => 
        s.id === id ? { ...s, enabled } : s
      ));
    } catch (error) {
      toast.error('Failed to toggle shortcut');
    } finally {
      setLoading(false);
    }
  };

  const handleShortcutUpdate = async (id: string, key: string) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/shortcuts/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });
      setShortcuts(prev => prev.map(s => 
        s.id === id ? { ...s, key } : s
      ));
      onShortcutChange(shortcuts.map(s => 
        s.id === id ? { ...s, key } : s
      ));
    } catch (error) {
      toast.error('Failed to update shortcut');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = async (updates: Partial<AccessibilitySettings>) => {
    try {
      setLoading(true);
      await fetch(`/api/search/${searchId}/accessibility-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      const newSettings = { ...settings, ...updates };
      setSettings(newSettings);
      applySettings(newSettings);
      onSettingsChange(newSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const applySettings = (newSettings: AccessibilitySettings) => {
    // Apply high contrast mode
    document.documentElement.classList.toggle('high-contrast', newSettings.highContrast);
    
    // Apply reduced motion
    document.documentElement.classList.toggle('reduced-motion', newSettings.reducedMotion);
    
    // Apply font settings
    document.documentElement.style.setProperty('--font-size', `${newSettings.fontSize}px`);
    document.documentElement.style.setProperty('--line-height', `${newSettings.lineHeight}`);
    document.documentElement.style.setProperty('--letter-spacing', `${newSettings.letterSpacing}px`);
    
    // Apply zoom level
    document.documentElement.style.setProperty('--zoom-level', `${newSettings.zoomLevel}%`);
  };

  // Register keyboard shortcuts
  useHotkeys('ctrl+k, cmd+k', () => {
    // Focus search input
    const searchInput = document.querySelector('input[type="search"]');
    if (searchInput) (searchInput as HTMLInputElement).focus();
  });

  useHotkeys('esc', () => {
    // Clear search or close modals
    const activeModal = document.querySelector('.modal.active');
    if (activeModal) {
      // Close modal
    } else {
      // Clear search
    }
  });

  return (
    <div className="space-y-4">
      <Tabs defaultValue="shortcuts">
        <TabsList>
          <TabsTrigger value="shortcuts">
            <Keyboard className="h-4 w-4 mr-2" />
            Shortcuts
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Eye className="h-4 w-4 mr-2" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Volume2 className="h-4 w-4 mr-2" />
            Audio
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shortcuts" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{shortcut.name}</p>
                    <p className="text-sm text-gray-500">{shortcut.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      value={shortcut.key}
                      onChange={(e) => handleShortcutUpdate(shortcut.id, e.target.value)}
                      className="w-24"
                    />
                    <Switch
                      checked={shortcut.enabled}
                      onCheckedChange={(checked) => handleShortcutToggle(shortcut.id, checked)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Visual Settings</Label>
                <div className="flex items-center justify-between">
                  <span>High Contrast Mode</span>
                  <Switch
                    checked={settings.highContrast}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ highContrast: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Reduced Motion</span>
                  <Switch
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ reducedMotion: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([value]) =>
                    handleSettingsUpdate({ fontSize: value })
                  }
                  min={12}
                  max={24}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Line Height</Label>
                <Slider
                  value={[settings.lineHeight]}
                  onValueChange={([value]) =>
                    handleSettingsUpdate({ lineHeight: value })
                  }
                  min={1}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Letter Spacing</Label>
                <Slider
                  value={[settings.letterSpacing]}
                  onValueChange={([value]) =>
                    handleSettingsUpdate({ letterSpacing: value })
                  }
                  min={-1}
                  max={1}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Zoom Level</Label>
                <Slider
                  value={[settings.zoomLevel]}
                  onValueChange={([value]) =>
                    handleSettingsUpdate({ zoomLevel: value })
                  }
                  min={50}
                  max={200}
                  step={10}
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Audio Settings</Label>
                <div className="flex items-center justify-between">
                  <span>Sound Effects</span>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={(checked) =>
                      handleSettingsUpdate({ soundEnabled: checked })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sound Volume</Label>
                <Slider
                  value={[settings.soundVolume]}
                  onValueChange={([value]) =>
                    handleSettingsUpdate({ soundVolume: value })
                  }
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 