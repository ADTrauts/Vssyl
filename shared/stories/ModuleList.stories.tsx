import type { Meta, StoryObj } from '@storybook/react';
import { ModuleList, ModuleInstallButton } from '../src/components';
import React, { useState } from 'react';

const meta: Meta<typeof ModuleList> = {
  title: 'Shared/ModuleList',
  component: ModuleList,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ModuleList>;

type Module = { id: string; name: string; description: string; icon?: React.ReactNode; installed?: boolean };

const initialModules: Module[] = [
  { id: '1', name: 'Drive', description: 'File storage and sharing', icon: '📁', installed: false },
  { id: '2', name: 'Chat', description: 'Real-time messaging', icon: '💬', installed: true },
  { id: '3', name: 'Analytics', description: 'Data visualization', icon: '📊', installed: false },
];

export const Default: Story = {
  render: () => {
    const [modules, setModules] = useState<Module[]>(initialModules);
    const handleInstall = (module: Module) => {
      setModules(modules.map(m => m.id === module.id ? { ...m, installed: true } : m));
    };
    return <ModuleList modules={modules} onSelect={handleInstall} />;
  },
};

export const WithCustomActions: Story = {
  render: () => {
    const [modules, setModules] = useState<Module[]>(initialModules);
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const handleInstall = (module: Module) => {
      setLoadingId(module.id);
      setTimeout(() => {
        setModules(modules.map(m => m.id === module.id ? { ...m, installed: true } : m));
        setLoadingId(null);
      }, 1000);
    };
    return (
      <ModuleList
        modules={modules}
        renderActions={mod => (
          <ModuleInstallButton
            installed={!!mod.installed}
            loading={loadingId === mod.id}
            onInstall={() => handleInstall(mod)}
          />
        )}
      />
    );
  },
}; 