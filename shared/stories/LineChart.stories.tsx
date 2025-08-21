import type { Meta, StoryObj } from '@storybook/react';
import { LineChart } from '../src/components/LineChart';
import React from 'react';

const meta: Meta<typeof LineChart> = {
  title: 'Shared/LineChart',
  component: LineChart,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof LineChart>;

const data = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 200 },
  { name: 'Mar', value: 150 },
  { name: 'Apr', value: 250 },
];

export const Default: Story = {
  args: {
    data,
    xKey: 'name',
    lineKey: 'value',
  },
}; 