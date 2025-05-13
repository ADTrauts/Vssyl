import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Settings, Layout, Palette, Eye, EyeOff,
  Sun, Moon, Monitor, Grid, List, Columns,
  SlidersHorizontal, Filter, Search, Save,
  X, Check, Plus, Minus, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { ColorPicker } from '../ui/color-picker';

interface SearchCustomizationProps {
  searchId: string;
  onUpdate: (updates: any) => void;
}

interface LayoutSettings {
  type: 'list' | 'grid' | 'columns';
  density: 'compact' | 'normal' | 'spacious';
  showThumbnails: boolean;
  showMetadata: boolean;
  showHighlights: boolean;
  showSnippets: boolean;
  showActions: boolean;
}

interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderRadius: number;
  spacing: number;
}

interface SearchSettings {
  defaultSort: 'relevance' | 'date' | 'name' | 'size';
  defaultFilters: {
    type: string[];
    date: string;
    size: string;
    author: string;
  };
  showSuggestions: boolean;
  showHistory: boolean;
  showSavedSearches: boolean;
  showRelatedSearches: boolean;
  showPopularSearches: boolean;
}

interface PersonalizationSettings {
  shortcuts: Record<string, string>;
  notifications: {
    email: boolean;
    inApp: boolean;
    desktop: boolean;
  };
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
}

export function SearchCustomization({ searchId, onUpdate }: SearchCustomizationProps) {
  const [loading, setLoading] = useState(false);
  const [layout, setLayout] = useState<LayoutSettings>({
    type: 'list',
    density: 'normal',
    showThumbnails: true,
    showMetadata: true,
    showHighlights: true,
    showSnippets: true,
    showActions: true
  });
  const [appearance, setAppearance] = useState<AppearanceSettings>({
    theme: 'system',
    fontSize: 14,
    lineHeight: 1.5,
    fontFamily: 'system-ui',
    primaryColor: '#2563eb',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    borderRadius: 6,
    spacing: 4
  });
  const [search, setSearch] = useState<SearchSettings>({
    defaultSort: 'relevance',
    defaultFilters: {
      type: ['file', 'thread', 'folder'],
      date: 'all',
      size: 'all',
      author: 'all'
    },
    showSuggestions: true,
    showHistory: true,
    showSavedSearches: true,
    showRelatedSearches: true,
    showPopularSearches: true
  });
  const [personalization, setPersonalization] = useState<PersonalizationSettings>({
    shortcuts: {
      search: 'ctrl+k',
      filters: 'ctrl+f',
      save: 'ctrl+s',
      history: 'ctrl+h',
      export: 'ctrl+e',
      share: 'ctrl+shift+s'
    },
    notifications: {
      email: true,
      inApp: true,
      desktop: true
    },
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MMM d, yyyy',
    numberFormat: 'en-US'
  });

  useEffect(() => {
    loadSettings();
  }, [searchId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization`);
      if (!response.ok) throw new Error('Failed to load settings');
      const data = await response.json();
      setLayout(data.layout);
      setAppearance(data.appearance);
      setSearch(data.search);
      setPersonalization(data.personalization);
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLayout = async (updates: Partial<LayoutSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization/layout`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update layout settings');
      setLayout(prev => ({ ...prev, ...updates }));
      toast.success('Layout settings updated');
    } catch (error) {
      toast.error('Failed to update layout settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAppearance = async (updates: Partial<AppearanceSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization/appearance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update appearance settings');
      setAppearance(prev => ({ ...prev, ...updates }));
      toast.success('Appearance settings updated');
    } catch (error) {
      toast.error('Failed to update appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSearch = async (updates: Partial<SearchSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization/search`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update search settings');
      setSearch(prev => ({ ...prev, ...updates }));
      toast.success('Search settings updated');
    } catch (error) {
      toast.error('Failed to update search settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePersonalization = async (updates: Partial<PersonalizationSettings>) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization/personalization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update personalization settings');
      setPersonalization(prev => ({ ...prev, ...updates }));
      toast.success('Personalization settings updated');
    } catch (error) {
      toast.error('Failed to update personalization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/customization/reset`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset settings');
      await loadSettings();
      toast.success('Settings reset to defaults');
    } catch (error) {
      toast.error('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="layout">
        <TabsList>
          <TabsTrigger value="layout">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="search">
            <Search className="h-4 w-4 mr-2" />
            Search
          </TabsTrigger>
          <TabsTrigger value="personalization">
            <Settings className="h-4 w-4 mr-2" />
            Personalization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="layout" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Layout Type</Label>
                <div className="flex gap-2">
                  <Button
                    variant={layout.type === 'list' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ type: 'list' })}
                  >
                    <List className="h-4 w-4 mr-2" />
                    List
                  </Button>
                  <Button
                    variant={layout.type === 'grid' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ type: 'grid' })}
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={layout.type === 'columns' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ type: 'columns' })}
                  >
                    <Columns className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Density</Label>
                <div className="flex gap-2">
                  <Button
                    variant={layout.density === 'compact' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ density: 'compact' })}
                  >
                    Compact
                  </Button>
                  <Button
                    variant={layout.density === 'normal' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ density: 'normal' })}
                  >
                    Normal
                  </Button>
                  <Button
                    variant={layout.density === 'spacious' ? 'default' : 'outline'}
                    onClick={() => handleUpdateLayout({ density: 'spacious' })}
                  >
                    Spacious
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Show Thumbnails</Label>
                  <Switch
                    checked={layout.showThumbnails}
                    onCheckedChange={(checked) => 
                      handleUpdateLayout({ showThumbnails: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Metadata</Label>
                  <Switch
                    checked={layout.showMetadata}
                    onCheckedChange={(checked) => 
                      handleUpdateLayout({ showMetadata: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Highlights</Label>
                  <Switch
                    checked={layout.showHighlights}
                    onCheckedChange={(checked) => 
                      handleUpdateLayout({ showHighlights: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Snippets</Label>
                  <Switch
                    checked={layout.showSnippets}
                    onCheckedChange={(checked) => 
                      handleUpdateLayout({ showSnippets: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Actions</Label>
                  <Switch
                    checked={layout.showActions}
                    onCheckedChange={(checked) => 
                      handleUpdateLayout({ showActions: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={appearance.theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleUpdateAppearance({ theme: 'light' })}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={appearance.theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleUpdateAppearance({ theme: 'dark' })}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={appearance.theme === 'system' ? 'default' : 'outline'}
                    onClick={() => handleUpdateAppearance({ theme: 'system' })}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Font Size</Label>
                <Slider
                  value={[appearance.fontSize]}
                  min={12}
                  max={24}
                  step={1}
                  onValueChange={([value]) => 
                    handleUpdateAppearance({ fontSize: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Line Height</Label>
                <Slider
                  value={[appearance.lineHeight]}
                  min={1}
                  max={2}
                  step={0.1}
                  onValueChange={([value]) => 
                    handleUpdateAppearance({ lineHeight: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={appearance.fontFamily}
                  onValueChange={(value) => 
                    handleUpdateAppearance({ fontFamily: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system-ui">System UI</SelectItem>
                    <SelectItem value="inter">Inter</SelectItem>
                    <SelectItem value="roboto">Roboto</SelectItem>
                    <SelectItem value="open-sans">Open Sans</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                <ColorPicker
                  value={appearance.primaryColor}
                  onChange={(value) => 
                    handleUpdateAppearance({ primaryColor: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <ColorPicker
                  value={appearance.secondaryColor}
                  onChange={(value) => 
                    handleUpdateAppearance({ secondaryColor: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Accent Color</Label>
                <ColorPicker
                  value={appearance.accentColor}
                  onChange={(value) => 
                    handleUpdateAppearance({ accentColor: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Border Radius</Label>
                <Slider
                  value={[appearance.borderRadius]}
                  min={0}
                  max={12}
                  step={1}
                  onValueChange={([value]) => 
                    handleUpdateAppearance({ borderRadius: value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Spacing</Label>
                <Slider
                  value={[appearance.spacing]}
                  min={2}
                  max={8}
                  step={1}
                  onValueChange={([value]) => 
                    handleUpdateAppearance({ spacing: value })
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Default Sort</Label>
                <Select
                  value={search.defaultSort}
                  onValueChange={(value: SearchSettings['defaultSort']) => 
                    handleUpdateSearch({ defaultSort: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Default Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Type</Label>
                    <Select
                      value={search.defaultFilters.type.join(',')}
                      onValueChange={(value) => 
                        handleUpdateSearch({ 
                          defaultFilters: { 
                            ...search.defaultFilters,
                            type: value.split(',')
                          }
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="file,thread,folder">All</SelectItem>
                        <SelectItem value="file">Files</SelectItem>
                        <SelectItem value="thread">Threads</SelectItem>
                        <SelectItem value="folder">Folders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Date</Label>
                    <Select
                      value={search.defaultFilters.date}
                      onValueChange={(value) => 
                        handleUpdateSearch({ 
                          defaultFilters: { 
                            ...search.defaultFilters,
                            date: value
                          }
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                        <SelectItem value="year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Size</Label>
                    <Select
                      value={search.defaultFilters.size}
                      onValueChange={(value) => 
                        handleUpdateSearch({ 
                          defaultFilters: { 
                            ...search.defaultFilters,
                            size: value
                          }
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Sizes</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Author</Label>
                    <Select
                      value={search.defaultFilters.author}
                      onValueChange={(value) => 
                        handleUpdateSearch({ 
                          defaultFilters: { 
                            ...search.defaultFilters,
                            author: value
                          }
                        })
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Authors</SelectItem>
                        <SelectItem value="me">Me</SelectItem>
                        <SelectItem value="team">Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Show Suggestions</Label>
                  <Switch
                    checked={search.showSuggestions}
                    onCheckedChange={(checked) => 
                      handleUpdateSearch({ showSuggestions: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show History</Label>
                  <Switch
                    checked={search.showHistory}
                    onCheckedChange={(checked) => 
                      handleUpdateSearch({ showHistory: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Saved Searches</Label>
                  <Switch
                    checked={search.showSavedSearches}
                    onCheckedChange={(checked) => 
                      handleUpdateSearch({ showSavedSearches: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Related Searches</Label>
                  <Switch
                    checked={search.showRelatedSearches}
                    onCheckedChange={(checked) => 
                      handleUpdateSearch({ showRelatedSearches: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Show Popular Searches</Label>
                  <Switch
                    checked={search.showPopularSearches}
                    onCheckedChange={(checked) => 
                      handleUpdateSearch({ showPopularSearches: checked })
                    }
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="personalization" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Keyboard Shortcuts</Label>
                <div className="space-y-2">
                  {Object.entries(personalization.shortcuts).map(([action, shortcut]) => (
                    <div key={action} className="flex items-center justify-between">
                      <Label className="capitalize">{action}</Label>
                      <Input
                        value={shortcut}
                        onChange={(e) => 
                          handleUpdatePersonalization({
                            shortcuts: {
                              ...personalization.shortcuts,
                              [action]: e.target.value
                            }
                          })
                        }
                        className="w-[180px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notifications</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Email</Label>
                    <Switch
                      checked={personalization.notifications.email}
                      onCheckedChange={(checked) => 
                        handleUpdatePersonalization({
                          notifications: {
                            ...personalization.notifications,
                            email: checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>In-App</Label>
                    <Switch
                      checked={personalization.notifications.inApp}
                      onCheckedChange={(checked) => 
                        handleUpdatePersonalization({
                          notifications: {
                            ...personalization.notifications,
                            inApp: checked
                          }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Desktop</Label>
                    <Switch
                      checked={personalization.notifications.desktop}
                      onCheckedChange={(checked) => 
                        handleUpdatePersonalization({
                          notifications: {
                            ...personalization.notifications,
                            desktop: checked
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Language</Label>
                <Select
                  value={personalization.language}
                  onValueChange={(value) => 
                    handleUpdatePersonalization({ language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select
                  value={personalization.timezone}
                  onValueChange={(value) => 
                    handleUpdatePersonalization({ timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">New York</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Format</Label>
                <Select
                  value={personalization.dateFormat}
                  onValueChange={(value) => 
                    handleUpdatePersonalization({ dateFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MMM d, yyyy">Jan 1, 2024</SelectItem>
                    <SelectItem value="MM/dd/yyyy">01/01/2024</SelectItem>
                    <SelectItem value="dd/MM/yyyy">01/01/2024</SelectItem>
                    <SelectItem value="yyyy-MM-dd">2024-01-01</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number Format</Label>
                <Select
                  value={personalization.numberFormat}
                  onValueChange={(value) => 
                    handleUpdatePersonalization({ numberFormat: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-US">1,234.56</SelectItem>
                    <SelectItem value="de-DE">1.234,56</SelectItem>
                    <SelectItem value="fr-FR">1 234,56</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleResetSettings}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>
    </div>
  );
} 