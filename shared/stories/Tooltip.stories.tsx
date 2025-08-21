import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from '../src/components/Tooltip';
import React from 'react';

const meta: Meta<typeof Tooltip> = {
  title: 'Shared/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="This is a tooltip!">
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Hover me</button>
    </Tooltip>
  ),
}; 