import type { Meta, StoryObj } from '@storybook/react';
import { BarChart } from '../src/components/BarChart';
import React from 'react';

const meta: Meta<typeof BarChart> = {
  title: 'Shared/BarChart',
  component: BarChart,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof BarChart>;

const data = [
  { name: 'Jan', users: 400 },
  { name: 'Feb', users: 300 },
  { name: 'Mar', users: 500 },
  { name: 'Apr', users: 200 },
];

export const Default: Story = {
  args: {
    data,
    xKey: 'name',
    barKey: 'users',
  },
}; 