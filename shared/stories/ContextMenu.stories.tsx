import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu, ContextMenuItem } from '../src/components/ContextMenu';
import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof ContextMenu> = {
  title: 'Shared/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ContextMenu>;

const items: ContextMenuItem[] = [
  { icon: <ArrowDownTrayIcon className="w-5 h-5" />, label: 'Download', onClick: () => alert('Download') },
  { icon: <PencilIcon className="w-5 h-5" />, label: 'Rename', onClick: () => alert('Rename') },
  { divider: true },
  { icon: <TrashIcon className="w-5 h-5" />, label: 'Delete', onClick: () => alert('Delete'), shortcut: 'Del' },
];

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <ContextMenu
        open={open}
        onClose={() => setOpen(false)}
        anchorPoint={{ x: 100, y: 100 }}
        items={items}
      />
    );
  },
}; 