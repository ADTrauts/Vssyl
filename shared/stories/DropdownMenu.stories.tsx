import type { Meta, StoryObj } from '@storybook/react';
import { DropdownMenu } from '../src/components/DropdownMenu';
import { ContextMenuItem } from '../src/components/ContextMenu';
import { Button } from '../src/components/Button';
import React, { useState } from 'react';
import { PencilIcon, TrashIcon, ShareIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof DropdownMenu> = {
  title: 'Shared/DropdownMenu',
  component: DropdownMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Trigger-anchored action menu scaffold (Wave 3A-2). Not for consumer rollout until 3A-4. Requires `tokens.css` in Storybook preview for full token rendering.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof DropdownMenu>;

const actionItems: ContextMenuItem[] = [
  { icon: <ShareIcon className="w-5 h-5" />, label: 'Share', onClick: () => alert('Share') },
  { icon: <PencilIcon className="w-5 h-5" />, label: 'Rename', onClick: () => alert('Rename') },
  { divider: true },
  {
    icon: <TrashIcon className="w-5 h-5" />,
    label: 'Move to trash',
    destructive: true,
    onClick: () => alert('Trash'),
  },
];

export const Scaffold: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <DropdownMenu open={open} onOpenChange={setOpen} items={actionItems} align="start">
        <Button variant="secondary" size="sm" onClick={() => setOpen((v) => !v)}>
          Actions
        </Button>
      </DropdownMenu>
    );
  },
};

export const AlignEnd: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <div className="flex justify-end p-v-8">
        <DropdownMenu open={open} onOpenChange={setOpen} items={actionItems} align="end">
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            More
          </Button>
        </DropdownMenu>
      </div>
    );
  },
};
