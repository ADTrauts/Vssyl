import React from 'react';
import { ThreadTemplate, ThreadType, ThreadConfig } from '@/types/thread';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const THREAD_TYPES: ThreadType[] = ['message', 'topic', 'project', 'decision', 'documentation'];
const NOTIFICATION_PREFERENCES = ['all', 'mentions', 'none'] as const;

interface ThreadTemplateFormProps {
  template?: ThreadTemplate;
  onSubmit: (template: Omit<ThreadTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

export const ThreadTemplateForm: React.FC<ThreadTemplateFormProps> = ({
  template,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = React.useState({
    name: template?.name || '',
    description: template?.description || '',
    type: template?.type || 'message' as ThreadType,
    defaultConfig: {
      autoExpand: template?.defaultConfig?.autoExpand || false,
      previewLines: template?.defaultConfig?.previewLines || 3,
      notificationPreference: template?.defaultConfig?.notificationPreference || 'all' as const,
    } as ThreadConfig,
    defaultMetadata: {
      title: template?.defaultMetadata?.title || '',
      description: template?.defaultMetadata?.description || '',
      tags: template?.defaultMetadata?.tags || [],
      status: template?.defaultMetadata?.status || 'open',
      priority: template?.defaultMetadata?.priority || 'medium',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConfigChange = (name: keyof ThreadConfig, value: any) => {
    setFormData(prev => ({
      ...prev,
      defaultConfig: {
        ...prev.defaultConfig,
        [name]: value,
      },
    }));
  };

  const handleMetadataChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      defaultMetadata: {
        ...prev.defaultMetadata,
        [name]: value,
      },
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Template Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
          />
        </div>

        <div>
          <Label htmlFor="type">Thread Type</Label>
          <Select
            id="type"
            value={formData.type}
            onChange={(value) => setFormData(prev => ({ ...prev, type: value as ThreadType }))}
            options={THREAD_TYPES.map(type => ({
              value: type,
              label: type.charAt(0).toUpperCase() + type.slice(1),
            }))}
          />
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Default Settings</h4>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="autoExpand">Auto-expand threads</Label>
            <Switch
              id="autoExpand"
              checked={formData.defaultConfig.autoExpand}
              onCheckedChange={(checked) => handleConfigChange('autoExpand', checked)}
            />
          </div>

          <div>
            <Label htmlFor="previewLines">Preview Lines</Label>
            <Input
              id="previewLines"
              type="number"
              min={1}
              max={10}
              value={formData.defaultConfig.previewLines}
              onChange={(e) => handleConfigChange('previewLines', parseInt(e.target.value))}
            />
          </div>

          <div>
            <Label htmlFor="notificationPreference">Notification Preference</Label>
            <Select
              id="notificationPreference"
              value={formData.defaultConfig.notificationPreference}
              onChange={(value) => handleConfigChange('notificationPreference', value)}
              options={NOTIFICATION_PREFERENCES.map(pref => ({
                value: pref,
                label: pref.charAt(0).toUpperCase() + pref.slice(1),
              }))}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium">Default Metadata</h4>
          
          <div>
            <Label htmlFor="title">Default Title</Label>
            <Input
              id="title"
              value={formData.defaultMetadata.title}
              onChange={(e) => handleMetadataChange('title', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Default Description</Label>
            <Textarea
              id="description"
              value={formData.defaultMetadata.description}
              onChange={(e) => handleMetadataChange('description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="status">Default Status</Label>
            <Select
              id="status"
              value={formData.defaultMetadata.status}
              onChange={(value) => handleMetadataChange('status', value)}
              options={[
                { value: 'open', label: 'Open' },
                { value: 'closed', label: 'Closed' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>

          <div>
            <Label htmlFor="priority">Default Priority</Label>
            <Select
              id="priority"
              value={formData.defaultMetadata.priority}
              onChange={(value) => handleMetadataChange('priority', value)}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {template ? 'Update Template' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}; 