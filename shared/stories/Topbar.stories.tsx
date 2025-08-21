import type { Meta, StoryObj } from '@storybook/react';
import { Topbar } from '../src/components/Topbar';
import React from 'react';

const meta: Meta<typeof Topbar> = {
  title: 'Shared/Topbar',
  component: Topbar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Topbar>;

export const Default: Story = {
  render: () => (
    <Topbar
      left={<span>Logo</span>}
      center={<span>Dashboard</span>}
      right={<span>User</span>}
    />
  ),
}; 