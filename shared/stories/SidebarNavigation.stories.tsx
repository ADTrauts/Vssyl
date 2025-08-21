import type { Meta, StoryObj } from '@storybook/react';
import { SidebarNavigation } from '../src/components/SidebarNavigation';
import React from 'react';

const meta: Meta<typeof SidebarNavigation> = {
  title: 'Shared/SidebarNavigation',
  component: SidebarNavigation,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof SidebarNavigation>;

const items = [
  { label: 'Dashboard', active: true },
  { label: 'Drive' },
  { label: 'Chat' },
  { label: 'Analytics' },
];

export const Default: Story = {
  args: { items },
}; 