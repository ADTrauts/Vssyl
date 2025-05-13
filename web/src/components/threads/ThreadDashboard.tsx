import React, { useState } from 'react';
import { Thread, ThreadTemplate } from '@/types/thread';
import { ThreadFilter } from './ThreadFilter';
import { ThreadSearchBar } from './ThreadSearchBar';
import { ThreadTemplates } from './ThreadTemplates';
import { ThreadTemplateForm } from './ThreadTemplateForm';
import { ThreadList } from './ThreadList';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useThreadFilter } from '@/hooks/useThreadFilter';
import { useThreadOrganization } from '@/contexts/thread-organization-context';

export const ThreadDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('threads');
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ThreadTemplate | null>(null);
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const { filteredThreads, applyFilter } = useThreadFilter();
  const { 
    stats, 
    refreshStats,
    createTemplate,
    updateTemplate,
    threads: contextThreads,
    pinThread,
    unpinThread,
    archiveThread,
    deleteThread,
  } = useThreadOrganization();

  const handleThreadSelect = (threadId: string) => {
    const thread = contextThreads.find((t: Thread) => t.id === threadId);
    if (thread) {
      setSelectedThread(thread);
    }
  };

  const handleTemplateSelect = (template: ThreadTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateFormOpen(true);
  };

  const handleTemplateEdit = (template: ThreadTemplate) => {
    setSelectedTemplate(template);
    setIsTemplateFormOpen(true);
  };

  const handleTemplateSubmit = async (template: Omit<ThreadTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedTemplate) {
      // Update existing template
      await updateTemplate(selectedTemplate.id, template);
    } else {
      // Create new template
      await createTemplate(template);
    }
    setIsTemplateFormOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Thread Management</h2>
        <Button onClick={refreshStats}>Refresh Stats</Button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Total Threads</h3>
            <p className="text-2xl font-bold">{stats.totalThreads}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Active Threads</h3>
            <p className="text-2xl font-bold">{stats.activeThreads}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Archived Threads</h3>
            <p className="text-2xl font-bold">{stats.archivedThreads}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-500">Avg. Resolution Time</h3>
            <p className="text-2xl font-bold">
              {Math.round(stats.averageResolutionTime / 3600)}h
            </p>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="threads">Threads</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="threads" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <ThreadSearchBar onSelect={handleThreadSelect} />
            </div>
            <div className="w-80">
              <ThreadFilter />
            </div>
          </div>

          <ThreadList
            threads={filteredThreads}
            onThreadSelect={handleThreadSelect}
            onPinThread={pinThread}
            onUnpinThread={unpinThread}
            onArchiveThread={archiveThread}
            onDeleteThread={deleteThread}
          />
        </TabsContent>

        <TabsContent value="templates">
          {isTemplateFormOpen ? (
            <Card className="p-6">
              <ThreadTemplateForm
                template={selectedTemplate || undefined}
                onSubmit={handleTemplateSubmit}
                onCancel={() => {
                  setIsTemplateFormOpen(false);
                  setSelectedTemplate(null);
                }}
              />
            </Card>
          ) : (
            <ThreadTemplates
              onSelect={handleTemplateSelect}
              onEdit={handleTemplateEdit}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 