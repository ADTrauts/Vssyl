import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from '../src/components/Popover';
import React, { useState } from 'react';

const meta: Meta<typeof Popover> = {
  title: 'Shared/Popover',
  component: Popover,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        content={<div>This is a popover!</div>}
        open={open}
        onOpenChange={setOpen}
      >
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Click me</button>
      </Popover>
    );
  },
}; 