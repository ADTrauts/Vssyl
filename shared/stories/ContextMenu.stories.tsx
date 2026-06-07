import type { Meta, StoryObj } from '@storybook/react';
import { ContextMenu, ContextMenuItem } from '../src/components/ContextMenu';
import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const meta: Meta<typeof ContextMenu> = {
  title: 'Shared/ContextMenu',
  component: ContextMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Canonical right-click / pointer-position menu. Requires `tokens.css` + Tailwind `v.*` namespace for full token rendering in Storybook (import in preview if colors look unstyled).',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof ContextMenu>;

function ContextMenuDemo({
  items,
  anchor = { x: 120, y: 120 },
}: {
  items: ContextMenuItem[];
  anchor?: { x: number; y: number };
}) {
  const [open, setOpen] = useState(true);
  return (
    <ContextMenu
      open={open}
      onClose={() => setOpen(false)}
      anchorPoint={anchor}
      items={items}
    />
  );
}

const basicItems: ContextMenuItem[] = [
  {
    icon: <ArrowDownTrayIcon className="w-5 h-5" />,
    label: 'Download',
    onClick: () => alert('Download'),
  },
  {
    icon: <PencilIcon className="w-5 h-5" />,
    label: 'Rename',
    onClick: () => alert('Rename'),
    shortcut: 'F2',
  },
  { divider: true },
  {
    icon: <StarIcon className="w-5 h-5" />,
    label: 'Add to starred',
    onClick: () => alert('Star'),
  },
];

export const Basic: Story = {
  render: () => <ContextMenuDemo items={basicItems} />,
};

export const DestructiveAction: Story = {
  render: () => (
    <ContextMenuDemo
      items={[
        ...basicItems,
        {
          icon: <TrashIcon className="w-5 h-5" />,
          label: 'Move to trash',
          destructive: true,
          onClick: () => alert('Trash'),
          shortcut: 'Del',
        },
      ]}
    />
  ),
};

export const DisabledItem: Story = {
  render: () => (
    <ContextMenuDemo
      items={[
        {
          label: 'Open',
          onClick: () => alert('Open'),
        },
        {
          label: 'Share',
          disabled: true,
          onClick: () => alert('Share'),
        },
        { divider: true },
        {
          label: 'Download',
          disabled: true,
        },
      ]}
    />
  ),
};

export const SectionHeading: Story = {
  render: () => (
    <ContextMenuDemo
      items={[
        { label: 'File actions', heading: true },
        { label: 'Open', onClick: () => alert('Open') },
        { label: 'Rename', onClick: () => alert('Rename') },
        { divider: true },
        { label: 'Danger zone', heading: true },
        {
          label: 'Move to trash',
          destructive: true,
          onClick: () => alert('Trash'),
        },
      ]}
    />
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-v-background min-h-[280px] p-v-8">
      <p className="text-v-text-secondary text-v-caption mb-v-4">
        Parent wrapper uses <code>dark</code> class — menu inherits dark token aliases.
      </p>
      <ContextMenuDemo items={basicItems} anchor={{ x: 80, y: 80 }} />
    </div>
  ),
};
