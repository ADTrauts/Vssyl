import type { Meta, StoryObj } from '@storybook/react';
import { PieChart } from '../src/components/PieChart';
import React from 'react';

const meta: Meta<typeof PieChart> = {
  title: 'Shared/PieChart',
  component: PieChart,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof PieChart>;

const data = [
  { name: 'A', value: 40 },
  { name: 'B', value: 30 },
  { name: 'C', value: 20 },
  { name: 'D', value: 10 },
];

export const Default: Story = {
  args: {
    data,
    dataKey: 'value',
    nameKey: 'name',
  },
}; 