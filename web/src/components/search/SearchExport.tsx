import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Download, Share2, FileText, FileSpreadsheet,
  FileCode, FileImage, FilePdf, FileArchive,
  Copy, Check, Link, Mail, MessageSquare,
  Twitter, Facebook, LinkedIn, Clipboard
} from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface SearchExportProps {
  searchId: string;
  query: string;
  filters: any;
  results: any[];
}

interface ExportSettings {
  format: 'json' | 'csv' | 'pdf' | 'html' | 'markdown' | 'zip';
  includeMetadata: boolean;
  includeFilters: boolean;
  includeQuery: boolean;
  includeHighlights: boolean;
  includeComments: boolean;
  includeCollaborators: boolean;
  compressionLevel: number;
}

interface ShareSettings {
  accessLevel: 'view' | 'edit' | 'admin';
  expiration: number | null;
  password: string;
  notifyCollaborators: boolean;
  message: string;
}

export function SearchExport({ 
  searchId,
  query,
  filters,
  results
}: SearchExportProps) {
  const [loading, setLoading] = useState(false);
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'json',
    includeMetadata: true,
    includeFilters: true,
    includeQuery: true,
    includeHighlights: true,
    includeComments: false,
    includeCollaborators: false,
    compressionLevel: 0
  });
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    accessLevel: 'view',
    expiration: null,
    password: '',
    notifyCollaborators: true,
    message: ''
  });
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleExportSettingsChange = (updates: Partial<ExportSettings>) => {
    setExportSettings(prev => ({ ...prev, ...updates }));
  };

  const handleShareSettingsChange = (updates: Partial<ShareSettings>) => {
    setShareSettings(prev => ({ ...prev, ...updates }));
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: exportSettings.format,
          settings: exportSettings
        }),
      });
      if (!response.ok) throw new Error('Failed to export search results');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `search-results.${exportSettings.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Search results exported successfully');
    } catch (error) {
      toast.error('Failed to export search results');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/search/${searchId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessLevel: shareSettings.accessLevel,
          expiration: shareSettings.expiration,
          password: shareSettings.password,
          notifyCollaborators: shareSettings.notifyCollaborators,
          message: shareSettings.message
        }),
      });
      if (!response.ok) throw new Error('Failed to create share link');
      const data = await response.json();
      setShareLink(data.shareLink);
      toast.success('Share link created successfully');
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="export">
        <TabsList>
          <TabsTrigger value="export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </TabsTrigger>
          <TabsTrigger value="share">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </TabsTrigger>
        </TabsList>

        <TabsContent value="export" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Export Format</Label>
                <Select
                  value={exportSettings.format}
                  onValueChange={(value: ExportSettings['format']) => 
                    handleExportSettingsChange({ format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <FileCode className="h-4 w-4 mr-2" />
                      JSON
                    </SelectItem>
                    <SelectItem value="csv">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      CSV
                    </SelectItem>
                    <SelectItem value="pdf">
                      <FilePdf className="h-4 w-4 mr-2" />
                      PDF
                    </SelectItem>
                    <SelectItem value="html">
                      <FileText className="h-4 w-4 mr-2" />
                      HTML
                    </SelectItem>
                    <SelectItem value="markdown">
                      <FileText className="h-4 w-4 mr-2" />
                      Markdown
                    </SelectItem>
                    <SelectItem value="zip">
                      <FileArchive className="h-4 w-4 mr-2" />
                      ZIP
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Export Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Include Metadata</span>
                    <Switch
                      checked={exportSettings.includeMetadata}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeMetadata: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Include Filters</span>
                    <Switch
                      checked={exportSettings.includeFilters}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeFilters: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Include Query</span>
                    <Switch
                      checked={exportSettings.includeQuery}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeQuery: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Include Highlights</span>
                    <Switch
                      checked={exportSettings.includeHighlights}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeHighlights: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Include Comments</span>
                    <Switch
                      checked={exportSettings.includeComments}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeComments: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Include Collaborators</span>
                    <Switch
                      checked={exportSettings.includeCollaborators}
                      onCheckedChange={(checked) => 
                        handleExportSettingsChange({ includeCollaborators: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleExport}
                disabled={loading}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Access Level</Label>
                <Select
                  value={shareSettings.accessLevel}
                  onValueChange={(value: ShareSettings['accessLevel']) => 
                    handleShareSettingsChange({ accessLevel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">View Only</SelectItem>
                    <SelectItem value="edit">Can Edit</SelectItem>
                    <SelectItem value="admin">Full Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiration</Label>
                <Select
                  value={shareSettings.expiration?.toString() || 'never'}
                  onValueChange={(value) => 
                    handleShareSettingsChange({ 
                      expiration: value === 'never' ? null : parseInt(value)
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="never">Never</SelectItem>
                    <SelectItem value="3600">1 Hour</SelectItem>
                    <SelectItem value="86400">24 Hours</SelectItem>
                    <SelectItem value="604800">7 Days</SelectItem>
                    <SelectItem value="2592000">30 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Password Protection</Label>
                <Input
                  type="password"
                  value={shareSettings.password}
                  onChange={(e) => 
                    handleShareSettingsChange({ password: e.target.value })
                  }
                  placeholder="Optional password"
                />
              </div>

              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  value={shareSettings.message}
                  onChange={(e) => 
                    handleShareSettingsChange({ message: e.target.value })
                  }
                  placeholder="Add a message for collaborators"
                />
              </div>

              <div className="flex items-center justify-between">
                <span>Notify Collaborators</span>
                <Switch
                  checked={shareSettings.notifyCollaborators}
                  onCheckedChange={(checked) => 
                    handleShareSettingsChange({ notifyCollaborators: checked })
                  }
                />
              </div>

              <Button
                onClick={handleCreateShareLink}
                disabled={loading}
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Create Share Link
              </Button>

              {shareLink && (
                <div className="space-y-2">
                  <Label>Share Link</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleCopyLink}
                      disabled={copied}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                    <Button variant="outline" size="sm">
                      <Twitter className="h-4 w-4 mr-2" />
                      Twitter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Facebook className="h-4 w-4 mr-2" />
                      Facebook
                    </Button>
                    <Button variant="outline" size="sm">
                      <LinkedIn className="h-4 w-4 mr-2" />
                      LinkedIn
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 