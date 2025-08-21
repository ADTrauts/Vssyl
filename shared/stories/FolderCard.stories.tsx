import type { Meta, StoryObj } from '@storybook/react';
import { FolderCard } from '../src/components/FolderCard';
import React from 'react';

const meta: Meta<typeof FolderCard> = {
  title: 'Shared/FolderCard',
  component: FolderCard,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof FolderCard>;

export const Default: Story = {
  args: {
    name: 'Projects',
  },
};

export const WithChildren: Story = {
  args: {
    name: 'Photos',
    children: <div className="text-sm text-gray-500">Contains 24 items</div>,
  },
}; 