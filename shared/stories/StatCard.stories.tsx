import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from '../src/components/StatCard';
import React from 'react';

const meta: Meta<typeof StatCard> = {
  title: 'Shared/StatCard',
  component: StatCard,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof StatCard>;

export const Default: Story = {
  args: {
    label: 'Active Users',
    value: 1200,
    icon: '👤',
  },
};

export const WithChange: Story = {
  args: {
    label: 'Revenue',
    value: '$5,000',
    icon: '💰',
    change: '+8%',
    description: 'Compared to last week',
  },
}; 