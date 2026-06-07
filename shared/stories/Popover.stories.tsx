import type { Meta, StoryObj } from '@storybook/react';
import { Popover } from '../src/components/Popover';
import { Button } from '../src/components/Button';
import React, { useState } from 'react';

const meta: Meta<typeof Popover> = {
  title: 'Shared/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Low-level floating-content shell (not action menus). Wave 3A-2: portal, outside-click + Escape dismiss, token shell.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof Popover>;

export const Baseline: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <Popover
        content={
          <div className="text-v-text-primary text-v-body space-y-v-2">
            <p>Arbitrary floating content — emoji grids, hints, simple panels.</p>
            <p className="text-v-text-secondary text-v-caption">Use DropdownMenu for action lists.</p>
          </div>
        }
        open={open}
        onOpenChange={setOpen}
        panelLabel="Help panel"
      >
        <Button variant="secondary" size="sm">
          Show panel
        </Button>
      </Popover>
    );
  },
};

export const DismissBehavior: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <div className="p-v-8 space-y-v-4">
        <p className="text-v-text-secondary text-v-caption">
          Open by default — click outside or press Escape to close.
        </p>
        <Popover
          content={<p className="text-v-text-primary">Dismissible floating shell.</p>}
          open={open}
          onOpenChange={setOpen}
        >
          <Button variant="primary" size="sm">
            Toggle
          </Button>
        </Popover>
      </div>
    );
  },
};
