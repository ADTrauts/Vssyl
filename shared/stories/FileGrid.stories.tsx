import type { Meta, StoryObj } from '@storybook/react';
import { FileGrid, FolderCard } from '../src/components';
import React from 'react';

const meta: Meta<typeof FileGrid> = {
  title: 'Shared/FileGrid',
  component: FileGrid,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof FileGrid>;
type FileGridItem = { id: string; name: string; type: 'file' | 'folder' };

const items: FileGridItem[] = [
  { id: '1', name: 'Documents', type: 'folder' },
  { id: '2', name: 'Photo.jpg', type: 'file' },
  { id: '3', name: 'Music', type: 'folder' },
  { id: '4', name: 'Resume.pdf', type: 'file' },
];

export const Default: Story = {
  args: {
    items,
  },
};

export const WithCustomRender: Story = {
  render: (args) => (
    <FileGrid
      {...args}
      renderItem={item =>
        item.type === 'folder' ? (
          <FolderCard name={item.name} />
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-3xl mb-1">📄</span>
            <span className="truncate w-20 text-center text-sm">{item.name}</span>
          </div>
        )
      }
    />
  ),
  args: {
    items,
  },
}; 