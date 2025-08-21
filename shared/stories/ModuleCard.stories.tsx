import type { Meta, StoryObj } from '@storybook/react';
import { ModuleCard } from '../src/components/ModuleCard';
import React from 'react';

const meta: Meta<typeof ModuleCard> = {
  title: 'Shared/ModuleCard',
  component: ModuleCard,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ModuleCard>;

export const Default: Story = {
  args: {
    title: 'Drive',
    description: 'File storage and sharing module',
    icon: '📁',
    children: <button>Open</button>,
  },
}; 