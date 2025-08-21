import type { Meta, StoryObj } from '@storybook/react';
import { ProgressBar } from '../src/components/ProgressBar';
import React from 'react';

const meta: Meta<typeof ProgressBar> = {
  title: 'Shared/ProgressBar',
  component: ProgressBar,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
  args: {
    value: 60,
    label: 'Task Completion',
  },
};

export const CustomColor: Story = {
  args: {
    value: 85,
    label: 'Upload Progress',
    color: 'bg-green-500',
  },
}; 