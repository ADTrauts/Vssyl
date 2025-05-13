import React from 'react';
import { ThreadTemplate, ThreadType } from '@/types/thread';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useThreadOrganization } from '@/contexts/thread-organization-context';

const getThreadTypeColor = (type: ThreadType) => {
  switch (type) {
    case 'message':
      return 'bg-blue-100 text-blue-800';
    case 'topic':
      return 'bg-green-100 text-green-800';
    case 'project':
      return 'bg-purple-100 text-purple-800';
    case 'decision':
      return 'bg-yellow-100 text-yellow-800';
    case 'documentation':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

interface ThreadTemplatesProps {
  onSelect: (template: ThreadTemplate) => void;
  onEdit: (template: ThreadTemplate) => void;
}

export const ThreadTemplates: React.FC<ThreadTemplatesProps> = ({
  onSelect,
  onEdit,
}) => {
  const { templates, deleteTemplate } = useThreadOrganization();

  const handleDelete = async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      await deleteTemplate(templateId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Thread Templates</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelect({} as ThreadTemplate)}
        >
          <Plus size={16} className="mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map(template => (
          <Card key={template.id} className="p-4">
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <Badge className={`mt-1 ${getThreadTypeColor(template.type)}`}>
                    {template.type}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(template)}
                  >
                    <Edit2 size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                {template.description}
              </p>

              {template.defaultConfig && (
                <div className="space-y-1">
                  <h5 className="text-sm font-medium">Default Settings</h5>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {template.defaultConfig.autoExpand && (
                      <li>• Auto-expand threads</li>
                    )}
                    {template.defaultConfig.previewLines && (
                      <li>• {template.defaultConfig.previewLines} preview lines</li>
                    )}
                    {template.defaultConfig.notificationPreference && (
                      <li>• {template.defaultConfig.notificationPreference} notifications</li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(template)}
                >
                  Use Template
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}; 